import { useState, useCallback } from 'react';
import { mcpClient, MCPResponse } from '../services/mcp-client';

interface UseMCPReturn {
  data: any;
  loading: boolean;
  error: string | null;
  executeQuery: (query: string) => Promise<void>;
  getTableSchema: (tableName: string) => Promise<void>;
  getTableStats: (tableName: string) => Promise<void>;
  getTables: () => Promise<void>;
  getRecentActivity: (limit?: number) => Promise<void>;
  getComplianceMetrics: () => Promise<void>;
  searchPolicies: (keyword: string) => Promise<void>;
  clearError: () => void;
}

export const useMCP = (): UseMCPReturn => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mcpClient.runSQL(query);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const getTableSchema = useCallback(async (tableName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mcpClient.getTableSchema(tableName);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const getTableStats = useCallback(async (tableName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mcpClient.getTableStats(tableName);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const getTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mcpClient.getTables();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const getRecentActivity = useCallback(async (limit: number = 10) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mcpClient.getRecentActivity(limit);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const getComplianceMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mcpClient.getComplianceMetrics();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchPolicies = useCallback(async (keyword: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mcpClient.searchPolicies(keyword);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    executeQuery,
    getTableSchema,
    getTableStats,
    getTables,
    getRecentActivity,
    getComplianceMetrics,
    searchPolicies,
    clearError
  };
};