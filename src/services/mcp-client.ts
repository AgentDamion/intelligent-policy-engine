/**
 * MCP Client for AICOMPLYR
 * Secure database access through MCP server
 */

interface MCPResponse {
  data?: any[];
  metadata?: {
    row_count: number;
    execution_time_ms: number;
    timestamp: string;
    user_id: string;
  };
  error?: string;
  message?: string;
  timestamp: string;
}

interface TableSchema {
  table_name: string;
  columns: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>;
  timestamp: string;
}

interface TableStats {
  table_name: string;
  row_count: number;
  timestamp: string;
}

class MCPClient {
  private baseUrl: string;
  private secretKey: string;
  private userId: string;

  constructor(baseUrl: string, secretKey: string, userId: string = 'anonymous') {
    this.baseUrl = baseUrl;
    this.secretKey = secretKey;
    this.userId = userId;
  }

  private async makeRequest(tool: string, params: Record<string, any>): Promise<any> {
    const payload = JSON.stringify(params);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    // Create signature for request verification
    const signature = await this.createSignature(payload, timestamp);
    
    const response = await fetch(`${this.baseUrl}/mcp/${tool}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
        'X-Timestamp': timestamp,
        'X-User-ID': this.userId
      },
      body: payload
    });

    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private async createSignature(payload: string, timestamp: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const data = encoder.encode(payload + timestamp);
    const signature = await crypto.subtle.sign('HMAC', key, data);
    
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Execute a read-only SQL query
   */
  async runSQL(query: string): Promise<MCPResponse> {
    return this.makeRequest('run_sql', { query, user_id: this.userId });
  }

  /**
   * Get schema information for a table
   */
  async getTableSchema(tableName: string): Promise<TableSchema> {
    return this.makeRequest('get_table_schema', { table_name: tableName });
  }

  /**
   * Get basic statistics for a table
   */
  async getTableStats(tableName: string): Promise<TableStats> {
    return this.makeRequest('get_table_stats', { table_name: tableName });
  }

  /**
   * Get all tables in the database
   */
  async getTables(): Promise<string[]> {
    const result = await this.runSQL(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (result.error) {
      throw new Error(result.message || 'Failed to get tables');
    }
    
    return result.data?.map((row: any) => row.table_name) || [];
  }

  /**
   * Get recent activity from audit logs
   */
  async getRecentActivity(limit: number = 10): Promise<any[]> {
    const result = await this.runSQL(`
      SELECT * 
      FROM audit_logs 
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `);
    
    if (result.error) {
      throw new Error(result.message || 'Failed to get recent activity');
    }
    
    return result.data || [];
  }

  /**
   * Get compliance metrics
   */
  async getComplianceMetrics(): Promise<any> {
    const result = await this.runSQL(`
      SELECT 
        COUNT(*) as total_policies,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_policies,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_policies,
        AVG(compliance_score) as avg_compliance_score
      FROM policies
    `);
    
    if (result.error) {
      throw new Error(result.message || 'Failed to get compliance metrics');
    }
    
    return result.data?.[0] || {};
  }

  /**
   * Search policies by keyword
   */
  async searchPolicies(keyword: string): Promise<any[]> {
    const result = await this.runSQL(`
      SELECT * 
      FROM policies 
      WHERE title ILIKE '%${keyword}%' 
         OR description ILIKE '%${keyword}%'
      ORDER BY created_at DESC
    `);
    
    if (result.error) {
      throw new Error(result.message || 'Failed to search policies');
    }
    
    return result.data || [];
  }
}

// Export singleton instance
export const mcpClient = new MCPClient(
  process.env.VITE_MCP_SERVER_URL || 'https://yourname-supa-mcp.fly.dev',
  process.env.VITE_MCP_SECRET_KEY || 'your-secret-key',
  'aicomplyr-user'
);

export default MCPClient;