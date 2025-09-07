const axios = require('axios');
const crypto = require('crypto');
const { AgentBase } = require('./agent-base');

class MonitoringAgent extends AgentBase {
  constructor() {
    super('MonitoringAgent', 'Continuously monitors external sources for changes and performs impact analysis');
    this.monitoredSources = new Map();
    this.changeHistory = new Map();
    this.alertSubscribers = new Set();
    this.monitoringInterval = 300000; // 5 minutes
    this.monitoringTimer = null;
    this.isMonitoring = false;
    this.lastCheck = null;
    
    // Monitoring configuration
    this.config = {
      checkInterval: 300000, // 5 minutes
      maxRetries: 3,
      timeout: 30000,
      userAgent: 'AICOMPLYR-Monitoring/1.0',
      changeThreshold: 0.1, // 10% change threshold
      criticalKeywords: [
        'ban', 'restrict', 'prohibit', 'emergency', 'recall', 'warning',
        'critical', 'urgent', 'immediate', 'stop', 'halt', 'suspend'
      ]
    };
  }

  async startMonitoring() {
    if (this.isMonitoring) {
      this.log('Monitoring already active');
      return;
    }

    try {
      this.log('Starting continuous monitoring...');
      this.isMonitoring = true;
      
      // Perform initial check
      await this.performMonitoringCheck();
      
      // Set up periodic monitoring
      this.monitoringTimer = setInterval(async () => {
        await this.performMonitoringCheck();
      }, this.config.checkInterval);
      
      this.log('Continuous monitoring started successfully');
      
    } catch (error) {
      this.log(`Error starting monitoring: ${error.message}`, 'error');
      this.isMonitoring = false;
      throw error;
    }
  }

  async stopMonitoring() {
    if (!this.isMonitoring) {
      this.log('Monitoring not active');
      return;
    }

    try {
      this.log('Stopping continuous monitoring...');
      this.isMonitoring = false;
      
      if (this.monitoringTimer) {
        clearInterval(this.monitoringTimer);
        this.monitoringTimer = null;
      }
      
      this.log('Continuous monitoring stopped');
      
    } catch (error) {
      this.log(`Error stopping monitoring: ${error.message}`, 'error');
    }
  }

  async addMonitoredSource(sourceConfig) {
    try {
      const sourceId = this.generateSourceId(sourceConfig.url);
      
      if (this.monitoredSources.has(sourceId)) {
        this.log(`Source ${sourceConfig.url} already monitored`);
        return sourceId;
      }
      
      // Validate source configuration
      const validatedConfig = this.validateSourceConfig(sourceConfig);
      
      // Perform initial baseline check
      const baseline = await this.getSourceBaseline(validatedConfig);
      
      const source = {
        id: sourceId,
        config: validatedConfig,
        baseline,
        lastCheck: new Date().toISOString(),
        status: 'active',
        checkCount: 0,
        lastChange: null,
        changeCount: 0
      };
      
      this.monitoredSources.set(sourceId, source);
      this.changeHistory.set(sourceId, []);
      
      this.log(`Added monitoring source: ${validatedConfig.name} (${validatedConfig.url})`);
      
      return sourceId;
      
    } catch (error) {
      this.log(`Error adding monitored source: ${error.message}`, 'error');
      throw error;
    }
  }

  async removeMonitoredSource(sourceId) {
    if (!this.monitoredSources.has(sourceId)) {
      this.log(`Source ${sourceId} not found`);
      return false;
    }
    
    this.monitoredSources.delete(sourceId);
    this.changeHistory.delete(sourceId);
    
    this.log(`Removed monitoring source: ${sourceId}`);
    return true;
  }

  async performMonitoringCheck() {
    if (!this.isMonitoring) {
      return;
    }

    try {
      this.log('Performing monitoring check...');
      const startTime = Date.now();
      const checkResults = [];
      
      // Check all monitored sources
      for (const [sourceId, source] of this.monitoredSources) {
        if (source.status !== 'active') continue;
        
        try {
          const result = await this.checkSource(source);
          checkResults.push(result);
          
          // Update source status
          source.lastCheck = new Date().toISOString();
          source.checkCount++;
          
          if (result.hasChanges) {
            source.lastChange = new Date().toISOString();
            source.changeCount++;
          }
          
        } catch (error) {
          this.log(`Error checking source ${sourceId}: ${error.message}`, 'error');
          source.status = 'error';
        }
      }
      
      this.lastCheck = new Date().toISOString();
      const processingTime = Date.now() - startTime;
      
      this.log(`Monitoring check completed in ${processingTime}ms. Checked ${checkResults.length} sources.`);
      
      // Process results and generate alerts
      await this.processMonitoringResults(checkResults);
      
    } catch (error) {
      this.log(`Error during monitoring check: ${error.message}`, 'error');
    }
  }

  async checkSource(source) {
    try {
      const currentContent = await this.fetchSourceContent(source.config);
      const contentHash = this.generateContentHash(currentContent);
      
      const result = {
        sourceId: source.id,
        sourceName: source.config.name,
        timestamp: new Date().toISOString(),
        hasChanges: false,
        changeType: null,
        changeScore: 0,
        contentHash,
        previousHash: source.baseline.hash,
        contentLength: currentContent.length,
        previousLength: source.baseline.length,
        criticalChanges: [],
        impact: 'low'
      };
      
      // Check for changes
      if (contentHash !== source.baseline.hash) {
        result.hasChanges = true;
        result.changeScore = this.calculateChangeScore(currentContent, source.baseline.content);
        result.changeType = this.determineChangeType(result.changeScore, currentContent, source.baseline.content);
        result.criticalChanges = this.detectCriticalChanges(currentContent, source.baseline.content);
        result.impact = this.assessImpact(result.criticalChanges, result.changeScore);
        
        // Update baseline if change is significant
        if (result.changeScore > this.config.changeThreshold) {
          source.baseline = {
            content: currentContent,
            hash: contentHash,
            length: currentContent.length,
            timestamp: new Date().toISOString()
          };
        }
        
        // Record change in history
        this.recordChange(source.id, result);
      }
      
      return result;
      
    } catch (error) {
      this.log(`Error checking source ${source.id}: ${error.message}`, 'error');
      throw error;
    }
  }

  async fetchSourceContent(config) {
    let retries = 0;
    
    while (retries < this.config.maxRetries) {
      try {
        const response = await axios.get(config.url, {
          timeout: this.config.timeout,
          headers: {
            'User-Agent': this.config.userAgent
          }
        });
        
        return response.data;
        
      } catch (error) {
        retries++;
        if (retries >= this.config.maxRetries) {
          throw new Error(`Failed to fetch content after ${retries} retries: ${error.message}`);
        }
        
        // Wait before retry
        await this.delay(1000 * retries);
      }
    }
  }

  generateContentHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  calculateChangeScore(currentContent, previousContent) {
    if (!previousContent) return 1.0;
    
    // Simple similarity calculation using character-level comparison
    const current = currentContent.toLowerCase();
    const previous = previousContent.toLowerCase();
    
    const currentWords = current.split(/\s+/);
    const previousWords = previous.split(/\s+/);
    
    const currentSet = new Set(currentWords);
    const previousSet = new Set(previousWords);
    
    const intersection = new Set([...currentSet].filter(x => previousSet.has(x)));
    const union = new Set([...currentSet, ...previousSet]);
    
    const jaccardSimilarity = intersection.size / union.size;
    return 1 - jaccardSimilarity;
  }

  determineChangeType(changeScore, currentContent, previousContent) {
    if (changeScore < 0.05) return 'minor';
    if (changeScore < 0.2) return 'moderate';
    if (changeScore < 0.5) return 'significant';
    return 'major';
  }

  detectCriticalChanges(currentContent, previousContent) {
    const criticalChanges = [];
    const currentLower = currentContent.toLowerCase();
    const previousLower = previousContent.toLowerCase();
    
    for (const keyword of this.config.criticalKeywords) {
      const currentCount = (currentLower.match(new RegExp(keyword, 'g')) || []).length;
      const previousCount = (previousLower.match(new RegExp(keyword, 'g')) || []).length;
      
      if (currentCount > previousCount) {
        criticalChanges.push({
          keyword,
          previousCount,
          currentCount,
          increase: currentCount - previousCount
        });
      }
    }
    
    return criticalChanges;
  }

  assessImpact(criticalChanges, changeScore) {
    if (criticalChanges.length > 0) {
      const highImpactKeywords = criticalChanges.filter(change => 
        ['ban', 'restrict', 'prohibit', 'emergency', 'recall'].includes(change.keyword)
      );
      
      if (highImpactKeywords.length > 0) return 'critical';
      return 'high';
    }
    
    if (changeScore > 0.3) return 'medium';
    return 'low';
  }

  recordChange(sourceId, changeResult) {
    if (!this.changeHistory.has(sourceId)) {
      this.changeHistory.set(sourceId, []);
    }
    
    const history = this.changeHistory.get(sourceId);
    history.push(changeResult);
    
    // Keep only last 100 changes
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }

  async processMonitoringResults(results) {
    const alerts = [];
    
    for (const result of results) {
      if (result.hasChanges && result.impact !== 'low') {
        const alert = this.createAlert(result);
        alerts.push(alert);
      }
    }
    
    if (alerts.length > 0) {
      await this.sendAlerts(alerts);
    }
  }

  createAlert(changeResult) {
    return {
      id: this.generateAlertId(changeResult),
      type: 'source_change',
      severity: changeResult.impact,
      source: changeResult.sourceName,
      sourceId: changeResult.sourceId,
      message: `Change detected in ${changeResult.sourceName}`,
      details: {
        changeType: changeResult.changeType,
        changeScore: changeResult.changeScore,
        criticalChanges: changeResult.criticalChanges,
        timestamp: changeResult.timestamp
      },
      timestamp: new Date().toISOString()
    };
  }

  async sendAlerts(alerts) {
    try {
      this.log(`Sending ${alerts.length} alerts...`);
      
      // Send to all subscribers
      for (const subscriber of this.alertSubscribers) {
        try {
          await subscriber.onAlert(alerts);
        } catch (error) {
          this.log(`Error sending alert to subscriber: ${error.message}`, 'error');
        }
      }
      
      // Store alerts in database (if available)
      await this.storeAlerts(alerts);
      
      this.log(`Alerts sent successfully`);
      
    } catch (error) {
      this.log(`Error sending alerts: ${error.message}`, 'error');
    }
  }

  async storeAlerts(alerts) {
    // This would typically store alerts in a database
    // For now, we'll just log them
    for (const alert of alerts) {
      this.log(`Alert: ${alert.message} (${alert.severity})`);
    }
  }

  subscribeToAlerts(subscriber) {
    this.alertSubscribers.add(subscriber);
    this.log(`Alert subscriber added: ${subscriber.constructor.name}`);
  }

  unsubscribeFromAlerts(subscriber) {
    this.alertSubscribers.delete(subscriber);
    this.log(`Alert subscriber removed: ${subscriber.constructor.name}`);
  }

  async getSourceBaseline(config) {
    try {
      const content = await this.fetchSourceContent(config);
      return {
        content,
        hash: this.generateContentHash(content),
        length: content.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.log(`Error getting baseline for ${config.url}: ${error.message}`, 'error');
      throw error;
    }
  }

  validateSourceConfig(config) {
    const required = ['name', 'url', 'type'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    // Validate URL format
    try {
      new URL(config.url);
    } catch (error) {
      throw new Error(`Invalid URL: ${config.url}`);
    }
    
    return {
      ...config,
      checkInterval: config.checkInterval || this.config.checkInterval,
      timeout: config.timeout || this.config.timeout
    };
  }

  generateSourceId(url) {
    return `src-${Buffer.from(url).toString('base64').substring(0, 8)}`;
  }

  generateAlertId(changeResult) {
    return `alert-${Buffer.from(`${changeResult.sourceId}-${changeResult.timestamp}`).toString('base64').substring(0, 8)}`;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getMonitoringStatus() {
    return {
      isMonitoring: this.isMonitoring,
      lastCheck: this.lastCheck,
      monitoredSources: this.monitoredSources.size,
      totalChanges: Array.from(this.changeHistory.values()).reduce((sum, history) => sum + history.length, 0),
      activeSources: Array.from(this.monitoredSources.values()).filter(s => s.status === 'active').length,
      errorSources: Array.from(this.monitoredSources.values()).filter(s => s.status === 'error').length
    };
  }

  getSourceHistory(sourceId, limit = 50) {
    const history = this.changeHistory.get(sourceId) || [];
    return history.slice(-limit);
  }

  async updateSourceConfig(sourceId, newConfig) {
    if (!this.monitoredSources.has(sourceId)) {
      throw new Error(`Source ${sourceId} not found`);
    }
    
    const source = this.monitoredSources.get(sourceId);
    const validatedConfig = this.validateSourceConfig(newConfig);
    
    source.config = validatedConfig;
    
    // Update baseline with new configuration
    source.baseline = await this.getSourceBaseline(validatedConfig);
    
    this.log(`Updated configuration for source: ${sourceId}`);
    return true;
  }

  async pauseSource(sourceId) {
    if (!this.monitoredSources.has(sourceId)) {
      throw new Error(`Source ${sourceId} not found`);
    }
    
    const source = this.monitoredSources.get(sourceId);
    source.status = 'paused';
    
    this.log(`Paused monitoring for source: ${sourceId}`);
    return true;
  }

  async resumeSource(sourceId) {
    if (!this.monitoredSources.has(sourceId)) {
      throw new Error(`Source ${sourceId} not found`);
    }
    
    const source = this.monitoredSources.get(sourceId);
    source.status = 'active';
    
    this.log(`Resumed monitoring for source: ${sourceId}`);
    return true;
  }
}

module.exports = MonitoringAgent;
