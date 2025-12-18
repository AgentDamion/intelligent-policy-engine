const express = require('express');
const router = express.Router();
const pool = require('../database/connection');
const { checkJwt, requireOrganizationAccess } = require('./auth/auth0-middleware');

// POST /api/ai-tool-logging/log
// Client-side integration endpoint for logging AI tool usage
router.post('/log', async (req, res) => {
  try {
    const {
      toolId,
      toolName,
      toolUrl,
      vendorName,
      vendorUrl,
      usageType,
      dataProcessed,
      complianceStatus,
      riskLevel,
      metadata,
      clientId,
      sessionId,
      timestamp
    } = req.body;

    // Validate required fields
    if (!toolName || !usageType) {
      return res.status(400).json({
        success: false,
        error: 'Tool name and usage type are required'
      });
    }

    // Generate unique log ID
    const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Use provided timestamp or current time
    const logTimestamp = timestamp || new Date().toISOString();

    // Insert usage log
    const result = await pool.query(`
      INSERT INTO ai_tool_usage_logs (
        log_id,
        tool_id,
        tool_name,
        tool_url,
        vendor_name,
        vendor_url,
        usage_type,
        data_processed,
        compliance_status,
        risk_level,
        metadata,
        client_id,
        session_id,
        timestamp,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      RETURNING *
    `, [
      logId,
      toolId || null,
      toolName,
      toolUrl || null,
      vendorName || null,
      vendorUrl || null,
      usageType,
      dataProcessed || null,
      complianceStatus || 'unknown',
      riskLevel || 'unknown',
      metadata ? JSON.stringify(metadata) : null,
      clientId || null,
      sessionId || null,
      logTimestamp
    ]);

    const logEntry = result.rows[0];

    // Trigger compliance check if this is a new tool
    if (!toolId) {
      await triggerComplianceCheck({
        toolName,
        toolUrl,
        vendorName,
        vendorUrl,
        usageType,
        dataProcessed
      });
    }

    res.json({
      success: true,
      logId: logEntry.log_id,
      message: 'Usage logged successfully',
      timestamp: logEntry.timestamp
    });

  } catch (error) {
    console.error('Error logging AI tool usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log usage'
    });
  }
});

// POST /api/ai-tool-logging/batch
// Batch logging endpoint for multiple usage events
router.post('/batch', async (req, res) => {
  try {
    const { logs, clientId, sessionId } = req.body;

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Logs array is required and must not be empty'
      });
    }

    if (logs.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 100 logs allowed per batch'
      });
    }

    const results = [];
    const newTools = [];

    // Process each log entry
    for (const log of logs) {
      try {
        const {
          toolId,
          toolName,
          toolUrl,
          vendorName,
          vendorUrl,
          usageType,
          dataProcessed,
          complianceStatus,
          riskLevel,
          metadata,
          timestamp
        } = log;

        if (!toolName || !usageType) {
          results.push({
            success: false,
            error: 'Tool name and usage type are required',
            log: log
          });
          continue;
        }

        const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const logTimestamp = timestamp || new Date().toISOString();

        const result = await pool.query(`
          INSERT INTO ai_tool_usage_logs (
            log_id,
            tool_id,
            tool_name,
            tool_url,
            vendor_name,
            vendor_url,
            usage_type,
            data_processed,
            compliance_status,
            risk_level,
            metadata,
            client_id,
            session_id,
            timestamp,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
          RETURNING log_id
        `, [
          logId,
          toolId || null,
          toolName,
          toolUrl || null,
          vendorName || null,
          vendorUrl || null,
          usageType,
          dataProcessed || null,
          complianceStatus || 'unknown',
          riskLevel || 'unknown',
          metadata ? JSON.stringify(metadata) : null,
          clientId || null,
          sessionId || null,
          logTimestamp
        ]);

        results.push({
          success: true,
          logId: result.rows[0].log_id,
          toolName,
          timestamp: logTimestamp
        });

        // Track new tools for compliance check
        if (!toolId) {
          newTools.push({
            toolName,
            toolUrl,
            vendorName,
            vendorUrl,
            usageType,
            dataProcessed
          });
        }

      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          log: log
        });
      }
    }

    // Trigger compliance checks for new tools
    if (newTools.length > 0) {
      for (const tool of newTools) {
        await triggerComplianceCheck(tool);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      message: `Processed ${results.length} logs: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    console.error('Error processing batch logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process batch logs'
    });
  }
});

// GET /api/ai-tool-logging/usage/:toolId
// Get usage statistics for a specific tool
router.get('/usage/:toolId', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const { toolId } = req.params;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    let dateFilter = '';
    const params = [toolId];
    let paramIndex = 2;

    if (startDate) {
      dateFilter += ` AND timestamp >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      dateFilter += ` AND timestamp <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    let groupByClause = '';
    switch (groupBy) {
      case 'hour':
        groupByClause = "DATE_TRUNC('hour', timestamp)";
        break;
      case 'day':
        groupByClause = "DATE_TRUNC('day', timestamp)";
        break;
      case 'week':
        groupByClause = "DATE_TRUNC('week', timestamp)";
        break;
      case 'month':
        groupByClause = "DATE_TRUNC('month', timestamp)";
        break;
      default:
        groupByClause = "DATE_TRUNC('day', timestamp)";
    }

    const query = `
      SELECT 
        ${groupByClause} as period,
        COUNT(*) as usage_count,
        COUNT(DISTINCT client_id) as unique_clients,
        COUNT(DISTINCT session_id) as unique_sessions,
        AVG(CASE WHEN data_processed IS NOT NULL THEN 1 ELSE 0 END) as data_processing_rate
      FROM ai_tool_usage_logs
      WHERE tool_id = $1 ${dateFilter}
      GROUP BY ${groupByClause}
      ORDER BY period DESC
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      toolId,
      usage: result.rows,
      summary: {
        totalUsage: result.rows.reduce((sum, row) => sum + parseInt(row.usage_count), 0),
        uniqueClients: result.rows.reduce((sum, row) => sum + parseInt(row.unique_clients), 0),
        uniqueSessions: result.rows.reduce((sum, row) => sum + parseInt(row.unique_sessions), 0)
      }
    });

  } catch (error) {
    console.error('Error fetching tool usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tool usage'
    });
  }
});

// GET /api/ai-tool-logging/tools
// Get list of all tools with usage statistics
router.get('/tools', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const { limit = 50, offset = 0, sortBy = 'usage_count', sortOrder = 'desc' } = req.query;

    const validSortFields = ['usage_count', 'last_used', 'tool_name', 'compliance_status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'usage_count';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const query = `
      SELECT 
        tool_id,
        tool_name,
        tool_url,
        vendor_name,
        vendor_url,
        COUNT(*) as usage_count,
        MAX(timestamp) as last_used,
        MIN(timestamp) as first_used,
        MODE() WITHIN GROUP (ORDER BY compliance_status) as most_common_compliance_status,
        MODE() WITHIN GROUP (ORDER BY risk_level) as most_common_risk_level,
        COUNT(DISTINCT client_id) as unique_clients,
        COUNT(DISTINCT session_id) as unique_sessions
      FROM ai_tool_usage_logs
      GROUP BY tool_id, tool_name, tool_url, vendor_name, vendor_url
      ORDER BY ${sortField} ${order}
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);

    // Get total count for pagination
    const countResult = await pool.query('SELECT COUNT(DISTINCT tool_id) as total FROM ai_tool_usage_logs');
    const totalTools = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      tools: result.rows,
      pagination: {
        total: totalTools,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + result.rows.length < totalTools
      }
    });

  } catch (error) {
    console.error('Error fetching tools list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tools list'
    });
  }
});

// GET /api/ai-tool-logging/compliance/:toolId
// Get compliance status and recommendations for a tool
router.get('/compliance/:toolId', checkJwt, requireOrganizationAccess, async (req, res) => {
  try {
    const { toolId } = req.params;

    // Get tool usage history
    const usageQuery = `
      SELECT 
        compliance_status,
        risk_level,
        data_processed,
        usage_type,
        timestamp
      FROM ai_tool_usage_logs
      WHERE tool_id = $1
      ORDER BY timestamp DESC
      LIMIT 100
    `;

    const usageResult = await pool.query(usageQuery, [toolId]);

    if (usageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tool not found'
      });
    }

    // Analyze compliance trends
    const complianceAnalysis = analyzeComplianceTrends(usageResult.rows);

    // Get tool details
    const toolQuery = `
      SELECT DISTINCT
        tool_name,
        tool_url,
        vendor_name,
        vendor_url
      FROM ai_tool_usage_logs
      WHERE tool_id = $1
      LIMIT 1
    `;

    const toolResult = await pool.query(toolQuery, [toolId]);
    const toolInfo = toolResult.rows[0];

    res.json({
      success: true,
      toolId,
      toolInfo,
      complianceAnalysis,
      recommendations: generateComplianceRecommendations(complianceAnalysis)
    });

  } catch (error) {
    console.error('Error fetching tool compliance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tool compliance'
    });
  }
});

// Helper function to trigger compliance check
async function triggerComplianceCheck(toolInfo) {
  try {
    // This would typically trigger the compliance scoring agent
    // For now, we'll just log the event
    console.log('Triggering compliance check for new tool:', toolInfo.toolName);
    
    // In a real implementation, you would:
    // 1. Add the tool to the discovery queue
    // 2. Trigger the compliance scoring agent
    // 3. Schedule vendor outreach if needed
    
  } catch (error) {
    console.error('Error triggering compliance check:', error);
  }
}

// Helper function to analyze compliance trends
function analyzeComplianceTrends(usageData) {
  const analysis = {
    totalUsage: usageData.length,
    complianceBreakdown: {},
    riskBreakdown: {},
    dataProcessingTrends: {},
    recentComplianceStatus: null,
    recentRiskLevel: null
  };

  // Analyze compliance status distribution
  usageData.forEach(usage => {
    analysis.complianceBreakdown[usage.compliance_status] = 
      (analysis.complianceBreakdown[usage.compliance_status] || 0) + 1;
    
    analysis.riskBreakdown[usage.risk_level] = 
      (analysis.riskBreakdown[usage.risk_level] || 0) + 1;
  });

  // Get most recent status
  if (usageData.length > 0) {
    analysis.recentComplianceStatus = usageData[0].compliance_status;
    analysis.recentRiskLevel = usageData[0].risk_level;
  }

  return analysis;
}

// Helper function to generate compliance recommendations
function generateComplianceRecommendations(analysis) {
  const recommendations = [];

  if (analysis.recentComplianceStatus === 'non_compliant') {
    recommendations.push({
      priority: 'high',
      type: 'compliance',
      message: 'Tool is currently non-compliant. Immediate review required.',
      action: 'Review compliance status and implement necessary changes'
    });
  }

  if (analysis.recentRiskLevel === 'high' || analysis.recentRiskLevel === 'critical') {
    recommendations.push({
      priority: 'high',
      type: 'risk',
      message: 'Tool has high risk level. Risk assessment required.',
      action: 'Conduct detailed risk assessment and implement mitigation measures'
    });
  }

  if (analysis.totalUsage > 100) {
    recommendations.push({
      priority: 'medium',
      type: 'monitoring',
      message: 'High usage tool detected. Consider enhanced monitoring.',
      action: 'Implement enhanced compliance monitoring and regular assessments'
    });
  }

  return recommendations;
}

module.exports = router;
