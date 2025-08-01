/**
 * Agency-Enterprise Bridge
 * 
 * Handles communication, policy distribution, and relationship management
 * between enterprises and agencies with real-time sync capabilities
 */

const pool = require('../database/connection');
const EventBus = require('./event-bus');

class AgencyEnterpriseBridge {
  constructor() {
    this.activeConnections = new Map();
    this.distributionQueue = [];
    this.syncConfig = {
      realTimeSync: true,
      batchSize: 100,
      retryAttempts: 3,
      syncInterval: 5000 // 5 seconds
    };
    
    this.setupEventListeners();
    this.startSyncProcess();
  }

  /**
   * Distribute policy to all connected agencies
   */
  async distributeToAgencies(policyResult, context) {
    const { enterpriseId } = context;
    
    try {
      console.log(`📤 Distributing policy to agencies for enterprise: ${enterpriseId}`);
      
      // Get all connected agencies
      const agencies = await this.getConnectedAgencies(enterpriseId);
      
      if (agencies.length === 0) {
        console.log('⚠️  No connected agencies found for distribution');
        return { distributed: false, reason: 'No connected agencies' };
      }

      const distributionResults = [];
      
      // Distribute to each agency
      for (const agency of agencies) {
        const result = await this.distributeToAgency(policyResult, agency, context);
        distributionResults.push(result);
      }

      // Log distribution results
      await this.logDistributionResults(distributionResults, context);

      // Emit distribution event
      EventBus.emit('policy-distributed', {
        enterpriseId,
        agencies: agencies.map(a => a.id),
        results: distributionResults,
        timestamp: new Date()
      });

      return {
        distributed: true,
        agenciesCount: agencies.length,
        results: distributionResults
      };

    } catch (error) {
      console.error('❌ Error distributing to agencies:', error);
      throw error;
    }
  }

  /**
   * Distribute policy to a specific agency
   */
  async distributeToAgency(policyResult, agency, context) {
    try {
      console.log(`📤 Distributing to agency: ${agency.name} (${agency.id})`);

      // Create policy distribution record
      const distributionId = await this.createPolicyDistribution(policyResult, agency, context);

      // Check for conflicts with existing policies
      const conflicts = await this.detectPolicyConflicts(policyResult, agency.id);

      // Update agency compliance
      await this.updateAgencyCompliance(agency.id, policyResult);

      // Send real-time notification to agency
      await this.sendAgencyNotification(agency, policyResult, conflicts);

      // Log the distribution
      await this.logAgencyDistribution(distributionId, agency, policyResult, conflicts);

      return {
        agencyId: agency.id,
        agencyName: agency.name,
        distributionId,
        conflicts: conflicts.length,
        status: 'distributed',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Error distributing to agency ${agency.name}:`, error);
      return {
        agencyId: agency.id,
        agencyName: agency.name,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Create policy distribution record
   */
  async createPolicyDistribution(policyResult, agency, context) {
    try {
      const query = `
        INSERT INTO policy_distributions (
          policy_id, enterprise_org_id, agency_org_id, distribution_status,
          distributed_at, version_number, is_current_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

      const result = await pool.query(query, [
        policyResult.policyId || 'default-policy',
        context.enterpriseId,
        agency.id,
        'active',
        new Date(),
        1,
        true
      ]);

      return result.rows[0].id;

    } catch (error) {
      console.error('Error creating policy distribution:', error);
      throw error;
    }
  }

  /**
   * Detect policy conflicts for an agency
   */
  async detectPolicyConflicts(policyResult, agencyId) {
    try {
      const query = `
        SELECT p1.id as policy_a_id, p2.id as policy_b_id,
               p1.name as policy_a_name, p2.name as policy_b_name
        FROM policies p1
        JOIN policies p2 ON p1.id != p2.id
        WHERE p1.agency_org_id = $1 AND p2.agency_org_id = $1
        AND p1.status = 'active' AND p2.status = 'active'
      `;

      const result = await pool.query(query, [agencyId]);
      
      // Analyze conflicts (simplified for now)
      const conflicts = [];
      for (const row of result.rows) {
        const conflict = await this.analyzePolicyConflict(row.policy_a_id, row.policy_b_id);
        if (conflict.hasConflict) {
          conflicts.push(conflict);
        }
      }

      return conflicts;

    } catch (error) {
      console.error('Error detecting policy conflicts:', error);
      return [];
    }
  }

  /**
   * Analyze conflict between two policies
   */
  async analyzePolicyConflict(policyAId, policyBId) {
    // Simplified conflict analysis
    // In a real implementation, this would use the Conflict Detection Agent
    return {
      policyAId,
      policyBId,
      hasConflict: false,
      conflictType: null,
      severity: 'low',
      description: 'No conflicts detected'
    };
  }

  /**
   * Update agency compliance status
   */
  async updateAgencyCompliance(agencyId, policyResult) {
    try {
      const query = `
        INSERT INTO agency_policy_compliance (
          policy_distribution_id, agency_org_id, compliance_score,
          last_assessment_date, compliance_status
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (agency_org_id) 
        DO UPDATE SET 
          compliance_score = EXCLUDED.compliance_score,
          last_assessment_date = EXCLUDED.last_assessment_date,
          compliance_status = EXCLUDED.compliance_status
      `;

      await pool.query(query, [
        policyResult.distributionId || 'default',
        agencyId,
        policyResult.complianceScore || 85,
        new Date(),
        'compliant'
      ]);

    } catch (error) {
      console.error('Error updating agency compliance:', error);
    }
  }

  /**
   * Send notification to agency
   */
  async sendAgencyNotification(agency, policyResult, conflicts) {
    try {
      const notification = {
        agencyId: agency.id,
        agencyName: agency.name,
        type: 'policy_distribution',
        policyName: policyResult.policyName || 'New Policy',
        conflictsCount: conflicts.length,
        requiresAction: conflicts.length > 0,
        timestamp: new Date().toISOString()
      };

      // Store notification in database
      await this.storeAgencyNotification(notification);

      // Emit notification event
      EventBus.emit('agency-notified', notification);

      console.log(`📧 Notification sent to agency: ${agency.name}`);

    } catch (error) {
      console.error('Error sending agency notification:', error);
    }
  }

  /**
   * Log agency distribution
   */
  async logAgencyDistribution(distributionId, agency, policyResult, conflicts) {
    try {
      const query = `
        INSERT INTO agency_audit_log (
          agency_org_id, action_type, action_details, 
          related_policy_id, conflicts_detected, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      await pool.query(query, [
        agency.id,
        'policy_distribution',
        JSON.stringify({
          distributionId,
          policyName: policyResult.policyName,
          complianceScore: policyResult.complianceScore
        }),
        policyResult.policyId,
        conflicts.length,
        new Date()
      ]);

    } catch (error) {
      console.error('Error logging agency distribution:', error);
    }
  }

  /**
   * Get connected agencies for an enterprise
   */
  async getConnectedAgencies(enterpriseId) {
    try {
      const query = `
        SELECT a.id, a.name, aer.compliance_score, aer.relationship_status,
               aer.last_audit_date, aer.created_at
        FROM organizations a
        JOIN agency_enterprise_relationships aer ON a.id = aer.agency_org_id
        WHERE aer.enterprise_org_id = $1 
        AND aer.relationship_status = 'active'
        ORDER BY aer.compliance_score DESC
      `;

      const result = await pool.query(query, [enterpriseId]);
      return result.rows;

    } catch (error) {
      console.error('Error getting connected agencies:', error);
      return [];
    }
  }

  /**
   * Get enterprise-agency relationship details
   */
  async getRelationshipDetails(enterpriseId, agencyId) {
    try {
      const query = `
        SELECT relationship_status, compliance_score, last_audit_date,
               created_at, trust_level
        FROM agency_enterprise_relationships
        WHERE enterprise_org_id = $1 AND agency_org_id = $2
      `;

      const result = await pool.query(query, [enterpriseId, agencyId]);
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      
      return null;

    } catch (error) {
      console.error('Error getting relationship details:', error);
      return null;
    }
  }

  /**
   * Update enterprise-agency relationship
   */
  async updateRelationship(enterpriseId, agencyId, updates) {
    try {
      const query = `
        UPDATE agency_enterprise_relationships
        SET compliance_score = COALESCE($3, compliance_score),
            relationship_status = COALESCE($4, relationship_status),
            last_audit_date = COALESCE($5, last_audit_date),
            trust_level = COALESCE($6, trust_level),
            updated_at = NOW()
        WHERE enterprise_org_id = $1 AND agency_org_id = $2
      `;

      await pool.query(query, [
        enterpriseId,
        agencyId,
        updates.complianceScore,
        updates.relationshipStatus,
        updates.lastAuditDate,
        updates.trustLevel
      ]);

      console.log(`🔄 Updated relationship: Enterprise ${enterpriseId} ↔ Agency ${agencyId}`);

    } catch (error) {
      console.error('Error updating relationship:', error);
      throw error;
    }
  }

  /**
   * Log distribution results
   */
  async logDistributionResults(results, context) {
    try {
      const query = `
        INSERT INTO distribution_logs (
          enterprise_org_id, distribution_results, context_data, created_at
        ) VALUES ($1, $2, $3, $4)
      `;

      await pool.query(query, [
        context.enterpriseId,
        JSON.stringify(results),
        JSON.stringify(context),
        new Date()
      ]);

    } catch (error) {
      console.error('Error logging distribution results:', error);
    }
  }

  /**
   * Store agency notification
   */
  async storeAgencyNotification(notification) {
    try {
      const query = `
        INSERT INTO agency_notifications (
          agency_org_id, notification_type, notification_data, 
          requires_action, created_at
        ) VALUES ($1, $2, $3, $4, $5)
      `;

      await pool.query(query, [
        notification.agencyId,
        notification.type,
        JSON.stringify(notification),
        notification.requiresAction,
        notification.timestamp
      ]);

    } catch (error) {
      console.error('Error storing agency notification:', error);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    EventBus.on('policy-distributed', this.handlePolicyDistribution.bind(this));
    EventBus.on('agency-notified', this.handleAgencyNotification.bind(this));
    EventBus.on('relationship-updated', this.handleRelationshipUpdate.bind(this));
  }

  /**
   * Handle policy distribution events
   */
  handlePolicyDistribution(event) {
    console.log('📤 Policy distribution event:', event);
    
    // Update distribution tracking
    this.updateDistributionTracking(event);
    
    // Trigger real-time sync if enabled
    if (this.syncConfig.realTimeSync) {
      this.triggerRealTimeSync(event);
    }
  }

  /**
   * Handle agency notification events
   */
  handleAgencyNotification(event) {
    console.log('📧 Agency notification event:', event);
    
    // Update notification tracking
    this.updateNotificationTracking(event);
  }

  /**
   * Handle relationship update events
   */
  handleRelationshipUpdate(event) {
    console.log('🔄 Relationship update event:', event);
    
    // Update relationship cache
    this.updateRelationshipCache(event);
  }

  /**
   * Start sync process
   */
  startSyncProcess() {
    setInterval(() => {
      this.processSyncQueue();
    }, this.syncConfig.syncInterval);
  }

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    if (this.distributionQueue.length === 0) {
      return;
    }

    console.log(`🔄 Processing sync queue: ${this.distributionQueue.length} items`);

    const batch = this.distributionQueue.splice(0, this.syncConfig.batchSize);
    
    for (const item of batch) {
      try {
        await this.syncItem(item);
      } catch (error) {
        console.error('Error syncing item:', error);
        
        // Retry logic
        if (item.retryCount < this.syncConfig.retryAttempts) {
          item.retryCount = (item.retryCount || 0) + 1;
          this.distributionQueue.push(item);
        }
      }
    }
  }

  /**
   * Sync individual item
   */
  async syncItem(item) {
    // Implementation for syncing individual items
    console.log(`🔄 Syncing item: ${item.type}`);
  }

  /**
   * Update distribution tracking
   */
  updateDistributionTracking(event) {
    // Implementation for updating distribution tracking
    console.log('📊 Updating distribution tracking');
  }

  /**
   * Trigger real-time sync
   */
  triggerRealTimeSync(event) {
    // Implementation for triggering real-time sync
    console.log('⚡ Triggering real-time sync');
  }

  /**
   * Update notification tracking
   */
  updateNotificationTracking(event) {
    // Implementation for updating notification tracking
    console.log('📧 Updating notification tracking');
  }

  /**
   * Update relationship cache
   */
  updateRelationshipCache(event) {
    // Implementation for updating relationship cache
    console.log('🔄 Updating relationship cache');
  }

  /**
   * Get distribution statistics
   */
  async getDistributionStats(enterpriseId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_distributions,
          COUNT(CASE WHEN distribution_status = 'active' THEN 1 END) as active_distributions,
          COUNT(CASE WHEN distribution_status = 'acknowledged' THEN 1 END) as acknowledged_distributions,
          AVG(compliance_score) as avg_compliance_score
        FROM policy_distributions pd
        JOIN agency_policy_compliance apc ON pd.id = apc.policy_distribution_id
        WHERE pd.enterprise_org_id = $1
      `;

      const result = await pool.query(query, [enterpriseId]);
      return result.rows[0];

    } catch (error) {
      console.error('Error getting distribution stats:', error);
      return {
        total_distributions: 0,
        active_distributions: 0,
        acknowledged_distributions: 0,
        avg_compliance_score: 0
      };
    }
  }

  /**
   * Get agency compliance report
   */
  async getAgencyComplianceReport(agencyId) {
    try {
      const query = `
        SELECT 
          apc.compliance_score,
          apc.last_assessment_date,
          apc.violations_count,
          apc.compliance_status,
          pd.distributed_at,
          p.name as policy_name
        FROM agency_policy_compliance apc
        JOIN policy_distributions pd ON apc.policy_distribution_id = pd.id
        JOIN policies p ON pd.policy_id = p.id
        WHERE apc.agency_org_id = $1
        ORDER BY apc.last_assessment_date DESC
      `;

      const result = await pool.query(query, [agencyId]);
      return result.rows;

    } catch (error) {
      console.error('Error getting agency compliance report:', error);
      return [];
    }
  }
}

module.exports = AgencyEnterpriseBridge; 