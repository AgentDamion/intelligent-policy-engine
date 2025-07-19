const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const pool = require('./database/db-connection');

class AuditPremium {
  constructor() {
    this.sessions = new Map();
    this.entries = new Map();
    this.chains = new Map();
  }

  // Generate unique IDs
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateEntryId() {
    return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateHash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  // Start a new audit session
  async startAuditSession(description, userId) {
    const sessionId = this.generateSessionId();
    const sessionUuid = uuidv4();
    const startTime = new Date();

    const session = {
      sessionId,
      userId,
      description,
      startTime,
      entries: [],
      status: 'active'
    };

    // Save to memory
    this.sessions.set(sessionId, session);

    // Save to database
    try {
      await pool.query(
        `INSERT INTO premium_audit_sessions 
         (id, session_id, user_id, description, start_time, status, avg_confidence, risk_level) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [sessionUuid, sessionId, userId, description, startTime, 'active', 0, 'unknown']
      );
      console.log('✅ Session saved to database');
    } catch (error) {
      console.error('⚠️ Database save failed, using memory only:', error.message);
    }

    return sessionId;
  }

  // Log context decision
  async logContextDecision(contextOutput, confidence, reasoning) {
    const entryId = this.generateEntryId();
    const entryUuid = uuidv4();
    const timestamp = new Date();
    const hash = this.generateHash({ contextOutput, confidence, reasoning, timestamp });

    const entry = {
      entryId,
      type: 'context',
      data: contextOutput,
      confidence,
      reasoning,
      timestamp,
      hash
    };

    // Save to memory
    this.entries.set(entryId, entry);

    // Save to database
    try {
      await pool.query(
        `INSERT INTO premium_audit_entries
         (id, entry_id, session_id, entry_type, confidence_score, confidence_reasoning, 
          data, entry_hash, timestamp) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          entryUuid,
          entryId,
          this.getCurrentSessionId(),
          'context',
          confidence,
          reasoning,
          JSON.stringify(contextOutput),
          hash,
          timestamp
        ]
      );
      console.log('✅ Context entry saved to database');
    } catch (error) {
      console.error('⚠️ Database save failed, using memory only:', error.message);
    }

    return entryId;
  }

  // Log policy decision with parent link
  async logPolicyDecision(policyOutput, contextData, confidence, reasoning, policies, contextOutput, policyData, parentEntryId) {
    const entryId = this.generateEntryId();
    const entryUuid = uuidv4();
    const timestamp = new Date();
    const hash = this.generateHash({ policyOutput, confidence, reasoning, timestamp, parentEntryId });

    const entry = {
      entryId,
      type: 'policy',
      data: policyOutput,
      confidence,
      reasoning,
      timestamp,
      hash,
      parentEntryId
    };

    // Save to memory
    this.entries.set(entryId, entry);

    // Save to database
    try {
      // Get parent entry UUID for foreign key
      const parentResult = await pool.query(
        'SELECT entry_id FROM premium_audit_entries WHERE entry_id = $1',
        [parentEntryId]
      );
      const parentUuid = parentResult.rows[0]?.entry_id;

      await pool.query(
        `INSERT INTO premium_audit_entries 
         (id, entry_id, session_id, entry_type, confidence_score, confidence_reasoning, 
          data, entry_hash, timestamp, parent_entry_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          entryUuid,
          entryId,
          this.getCurrentSessionId(),
          'policy',
          confidence,
          reasoning,
          JSON.stringify(policyOutput),
          hash,
          timestamp,
          parentUuid
        ]
      );

      // Save policy references if provided
      if (policies && policies.length > 0) {
        for (const policy of policies) {
          await pool.query(
            `INSERT INTO audit_policy_references 
             (entry_id, policy_id, policy_name, policy_status) 
             VALUES ($1, $2, $3, $4)`,
            [entryUuid, policy.id || 'unknown', policy.name || 'Unknown Policy', 'evaluated']
          );
        }
      }

      console.log('✅ Policy entry saved to database');
    } catch (error) {
      console.error('⚠️ Database save failed, using memory only:', error.message);
    }

    return entryId;
  }

  // Complete audit session
  async completeAuditSession(finalDecision, totalTime) {
    const sessionId = this.getCurrentSessionId();
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error('No active session found');
    }

    const endTime = new Date();
    const avgConfidence = this.calculateAverageConfidence(session);
    
    session.endTime = endTime;
    session.finalDecision = finalDecision;
    session.totalTime = totalTime;
    session.status = 'completed';
    session.avgConfidence = avgConfidence;

    // Update database
    try {
      await pool.query(
        `UPDATE premium_audit_sessions 
         SET end_time = $1, final_decision = $2, status = $3, avg_confidence = $4, 
             risk_level = $5
         WHERE session_id = $6`,
        [
          endTime,
          JSON.stringify(finalDecision),
          'completed',
          avgConfidence,
          finalDecision.risk || 'low',
          sessionId
        ]
      );
      console.log('✅ Session completed in database');
    } catch (error) {
      console.error('⚠️ Database update failed:', error.message);
    }

    return session;
  }

  // Get audit chain
  getAuditChain(entryId) {
    const chain = [];
    const visited = new Set();
    
    const buildChain = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const entry = this.entries.get(id);
      if (entry) {
        chain.push(entry);
        if (entry.parentEntryId) {
          buildChain(entry.parentEntryId);
        }
      }
    };
    
    buildChain(entryId);
    return chain.reverse();
  }

  // Generate compliance report
  generateComplianceReport(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const entries = Array.from(this.entries.values())
      .filter(entry => entry.timestamp >= session.startTime);

    return {
      sessionId,
      totalEntries: entries.length,
      averageConfidence: this.calculateAverageConfidence(session),
      complianceScore: 0.88, // Calculate based on your logic
      riskLevel: 'low',
      status: session.status
    };
  }

  // Helper methods
  getCurrentSessionId() {
    // Get the most recent active session
    const sessions = Array.from(this.sessions.values());
    const activeSession = sessions.find(s => s.status === 'active');
    return activeSession ? activeSession.sessionId : null;
  }

  calculateAverageConfidence(session) {
    const entries = Array.from(this.entries.values())
      .filter(entry => entry.timestamp >= session.startTime);
    
    if (entries.length === 0) return 0;
    
    const sum = entries.reduce((acc, entry) => acc + entry.confidence, 0);
    return sum / entries.length;
  }
}

module.exports = AuditPremium;