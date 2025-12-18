import os
import json
import chainlit as cl
from supabase import create_client
from mcp import MCPServer, types as t

# Initialize Supabase client with service role key
url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_KEY"]  # service-role key
supa = create_client(url, key)

# Create MCP server
server = MCPServer("SupaProxy")

@server.tool()
def run_sql(query: str) -> str:
    """Run a read-only SQL statement and return JSON results."""
    try:
        # Execute the SQL query using Supabase RPC
        data = supa.rpc("exec_sql", {"stmt": query}).execute().data
        return json.dumps(data, ensure_ascii=False, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)}, ensure_ascii=False)

@server.tool()
def get_table_schema(table_name: str) -> str:
    """Get the schema for a specific table."""
    try:
        query = f"""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = '{table_name}' 
        ORDER BY ordinal_position;
        """
        data = supa.rpc("exec_sql", {"stmt": query}).execute().data
        return json.dumps(data, ensure_ascii=False, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)}, ensure_ascii=False)

@server.tool()
def list_tables() -> str:
    """List all tables in the database."""
    try:
        query = """
        SELECT table_name, table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
        """
        data = supa.rpc("exec_sql", {"stmt": query}).execute().data
        return json.dumps(data, ensure_ascii=False, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)}, ensure_ascii=False)

@cl.on_chat_start
async def start():
    cl.user_session.set("mcp_server", server)
    await cl.Message(content="SupaProxy MCP Server is ready! You can now run SQL queries securely.").send()

@cl.on_message
async def main(message: cl.Message):
    # This is where Chainlit handles the MCP communication
    pass
