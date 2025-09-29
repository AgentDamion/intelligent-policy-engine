import os
import json
import hashlib
import hmac
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import chainlit as cl
from supabase import create_client
from mcp import MCPServer, types as t

# Configuration
url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_KEY"]  # service-role key
secret_key = os.environ.get("MCP_SECRET_KEY", "default-secret-change-in-production")
max_query_length = int(os.environ.get("MAX_QUERY_LENGTH", "1000"))
allowed_operations = os.environ.get("ALLOWED_OPERATIONS", "SELECT").split(",")

# Initialize Supabase client
supa = create_client(url, key)

# Initialize MCP server
server = MCPServer("SupaProxy")

def verify_request_signature(payload: str, signature: str, timestamp: str) -> bool:
    """Verify request signature to prevent unauthorized access"""
    try:
        # Check timestamp to prevent replay attacks (5 minute window)
        request_time = int(timestamp)
        current_time = int(time.time())
        if abs(current_time - request_time) > 300:  # 5 minutes
            return False
        
        # Verify signature
        expected_signature = hmac.new(
            secret_key.encode(),
            f"{payload}{timestamp}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)
    except:
        return False

def validate_query(query: str) -> tuple[bool, str]:
    """Validate SQL query for security"""
    query_upper = query.upper().strip()
    
    # Check query length
    if len(query) > max_query_length:
        return False, f"Query too long (max {max_query_length} characters)"
    
    # Check for allowed operations only
    for operation in allowed_operations:
        if query_upper.startswith(operation):
            break
    else:
        return False, f"Only {', '.join(allowed_operations)} operations allowed"
    
    # Block dangerous operations
    dangerous_keywords = [
        'DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE',
        'EXEC', 'EXECUTE', 'UNION', '--', '/*', '*/', ';', 'xp_', 'sp_'
    ]
    
    for keyword in dangerous_keywords:
        if keyword in query_upper:
            return False, f"Dangerous keyword '{keyword}' not allowed"
    
    return True, ""

def log_query(query: str, user_id: str = "unknown", success: bool = True):
    """Log database queries for audit trail"""
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": user_id,
        "query": query[:100] + "..." if len(query) > 100 else query,
        "success": success,
        "ip": "unknown"  # Could be extracted from request headers
    }
    print(f"QUERY_LOG: {json.dumps(log_entry)}")

@server.tool()
def run_sql(query: str, user_id: str = "anonymous") -> str:
    """Run a read-only SQL statement and return JSON.
    
    Args:
        query: SQL SELECT statement to execute
        user_id: Identifier for the user making the request
    
    Returns:
        JSON string containing query results
    """
    try:
        # Validate query
        is_valid, error_msg = validate_query(query)
        if not is_valid:
            log_query(query, user_id, False)
            return json.dumps({
                "error": "Query validation failed",
                "message": error_msg,
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # Execute query
        start_time = time.time()
        data = supa.rpc("exec_sql", {"stmt": query}).execute().data
        execution_time = time.time() - start_time
        
        # Log successful query
        log_query(query, user_id, True)
        
        # Return results with metadata
        result = {
            "data": data,
            "metadata": {
                "row_count": len(data) if isinstance(data, list) else 0,
                "execution_time_ms": round(execution_time * 1000, 2),
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id
            }
        }
        
        return json.dumps(result, ensure_ascii=False)
        
    except Exception as e:
        log_query(query, user_id, False)
        return json.dumps({
            "error": "Query execution failed",
            "message": str(e),
            "timestamp": datetime.utcnow().isoformat()
        })

@server.tool()
def get_table_schema(table_name: str) -> str:
    """Get schema information for a specific table.
    
    Args:
        table_name: Name of the table to get schema for
    
    Returns:
        JSON string containing table schema information
    """
    try:
        # Validate table name (basic SQL injection prevention)
        if not table_name.replace("_", "").isalnum():
            return json.dumps({
                "error": "Invalid table name",
                "message": "Table name must contain only alphanumeric characters and underscores"
            })
        
        # Get table schema
        query = f"""
        SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
        FROM information_schema.columns 
        WHERE table_name = '{table_name}'
        ORDER BY ordinal_position
        """
        
        data = supa.rpc("exec_sql", {"stmt": query}).execute().data
        
        return json.dumps({
            "table_name": table_name,
            "columns": data,
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return json.dumps({
            "error": "Schema retrieval failed",
            "message": str(e),
            "timestamp": datetime.utcnow().isoformat()
        })

@server.tool()
def get_table_stats(table_name: str) -> str:
    """Get basic statistics for a table.
    
    Args:
        table_name: Name of the table to get stats for
    
    Returns:
        JSON string containing table statistics
    """
    try:
        # Validate table name
        if not table_name.replace("_", "").isalnum():
            return json.dumps({
                "error": "Invalid table name",
                "message": "Table name must contain only alphanumeric characters and underscores"
            })
        
        # Get table stats
        query = f"SELECT COUNT(*) as row_count FROM {table_name}"
        data = supa.rpc("exec_sql", {"stmt": query}).execute().data
        
        return json.dumps({
            "table_name": table_name,
            "row_count": data[0]["row_count"] if data else 0,
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return json.dumps({
            "error": "Stats retrieval failed",
            "message": str(e),
            "timestamp": datetime.utcnow().isoformat()
        })

@cl.on_chat_start
async def start():
    """Initialize the MCP server when chat starts"""
    cl.user_session.set("mcp_server", server)
    print("🚀 SupaProxy MCP Server initialized")

# Health check endpoint
@cl.on_message
async def health_check(message: cl.Message):
    """Handle health check messages"""
    if message.content.lower() in ["health", "ping", "status"]:
        await cl.Message(
            content=json.dumps({
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "available_tools": ["run_sql", "get_table_schema", "get_table_stats"]
            })
        ).send()