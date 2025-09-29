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
    """Validate SQL query for security with AICOMPLYR-specific rules"""
    query_upper = query.upper().strip()
    
    # Check query length
    if len(query) > max_query_length:
        return False, f"Query too long (max {max_query_length} characters)"
    
    # Check for allowed operations
    allowed_ops = [op.strip() for op in allowed_operations]
    operation_found = False
    
    for operation in allowed_ops:
        if query_upper.startswith(operation):
            operation_found = True
            break
    
    if not operation_found:
        return False, f"Only {', '.join(allowed_ops)} operations allowed"
    
    # AICOMPLYR-specific security rules
    dangerous_keywords = [
        'DROP', 'ALTER', 'CREATE', 'TRUNCATE', 'COPY', 'GRANT', 'REVOKE',
        'EXEC', 'EXECUTE', 'xp_', 'sp_', '--', '/*', '*/'
    ]
    
    for keyword in dangerous_keywords:
        if keyword in query_upper:
            return False, f"Dangerous keyword '{keyword}' not allowed"
    
    # Block DDL operations (even if they start with allowed keywords)
    ddl_keywords = ['CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'CREATE INDEX', 'DROP INDEX']
    for ddl in ddl_keywords:
        if ddl in query_upper:
            return False, f"DDL operation '{ddl}' not allowed"
    
    # Block COPY FROM PROGRAM (command injection)
    if 'COPY' in query_upper and 'FROM PROGRAM' in query_upper:
        return False, "COPY FROM PROGRAM not allowed"
    
    # Enforce LIMIT for SELECT queries to prevent large result sets
    if query_upper.startswith('SELECT') and 'LIMIT' not in query_upper:
        return False, "SELECT queries must include LIMIT clause (max 500 rows)"
    
    # Check LIMIT value
    if 'LIMIT' in query_upper:
        import re
        limit_match = re.search(r'LIMIT\s+(\d+)', query_upper)
        if limit_match:
            limit_value = int(limit_match.group(1))
            if limit_value > 500:
                return False, "LIMIT cannot exceed 500 rows"
    
    return True, ""

def log_query(query: str, user_id: str = "unknown", success: bool = True, rows_returned: int = 0, ip: str = "unknown"):
    """Log database queries to Supabase audit table"""
    try:
        # Insert into Supabase audit table
        audit_data = {
            "user_id": user_id,
            "query": query[:1000] + "..." if len(query) > 1000 else query,  # Truncate for storage
            "rows_returned": rows_returned,
            "ip": ip,
            "success": success,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Insert into mcp_audit table
        supa.table("mcp_audit").insert(audit_data).execute()
        
        # Also log to console for debugging
        print(f"QUERY_LOG: {json.dumps(audit_data)}")
        
    except Exception as e:
        # Fallback to console logging if Supabase fails
        print(f"AUDIT_ERROR: {str(e)}")
        print(f"QUERY_LOG: {json.dumps({
            'timestamp': datetime.utcnow().isoformat(),
            'user_id': user_id,
            'query': query[:100] + "..." if len(query) > 100 else query,
            'success': success,
            'rows_returned': rows_returned,
            'ip': ip
        })}")

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
        
        # Count rows returned
        rows_returned = len(data) if isinstance(data, list) else 0
        
        # Log successful query
        log_query(query, user_id, True, rows_returned)
        
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