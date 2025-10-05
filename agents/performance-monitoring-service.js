/**
 * Performance Monitoring Service - Comprehensive metrics and alerting
 * 
 * Features:
 * 1. Real-time performance metrics collection
 * 2. Custom metrics and counters
 * 3. Performance alerts and thresholds
 * 4. Historical data storage and analysis
 * 5. Agent health monitoring
 * 6. Resource usage tracking
 * 7. Performance regression detection
 */

class PerformanceMonitoringService {
    constructor(options = {}) {
        this.config = {
            collectionInterval: options.collectionInterval || 10000, // 10 seconds
            retentionPeriod: options.retentionPeriod || 24 * 60 * 60 * 1000, // 24 hours
            alertThresholds: {
                responseTime: options.responseTimeThreshold || 5000, // 5 seconds
                errorRate: options.errorRateThreshold || 0.1, // 10%
                memoryUsage: options.memoryThreshold || 0.8, // 80%
                cpuUsage: options.cpuThreshold || 0.8, // 80%
                ...options.alertThresholds
            },
            enableAlerts: options.enableAlerts !== false,
            enableHistoricalData: options.enableHistoricalData !== false
        };
        
        this.metrics = {
            counters: new Map(),
            gauges: new Map(),
            histograms: new Map(),
            timers: new Map()
        };
        
        this.historicalData = [];
        this.alerts = [];
        this.agentHealth = new Map();
        
        this.startCollection();
    }

    /**
     * Increment a counter metric
     */
    incrementCounter(name, value = 1, labels = {}) {
        const key = this.createMetricKey(name, labels);
        const current = this.metrics.counters.get(key) || 0;
        this.metrics.counters.set(key, current + value);
    }

    /**
     * Set a gauge metric
     */
    setGauge(name, value, labels = {}) {
        const key = this.createMetricKey(name, labels);
        this.metrics.gauges.set(key, {
            value,
            timestamp: Date.now(),
            labels
        });
    }

    /**
     * Record a histogram value
     */
    recordHistogram(name, value, labels = {}) {
        const key = this.createMetricKey(name, labels);
        if (!this.metrics.histograms.has(key)) {
            this.metrics.histograms.set(key, []);
        }
        
        const histogram = this.metrics.histograms.get(key);
        histogram.push({
            value,
            timestamp: Date.now(),
            labels
        });
        
        // Keep only recent data
        const cutoff = Date.now() - this.config.retentionPeriod;
        this.metrics.histograms.set(key, histogram.filter(item => item.timestamp > cutoff));
    }

    /**
     * Start a timer
     */
    startTimer(name, labels = {}) {
        const key = this.createMetricKey(name, labels);
        const timer = {
            startTime: Date.now(),
            labels
        };
        
        if (!this.metrics.timers.has(key)) {
            this.metrics.timers.set(key, []);
        }
        
        this.metrics.timers.get(key).push(timer);
        return key;
    }

    /**
     * End a timer and record duration
     */
    endTimer(timerKey) {
        const timerArray = this.metrics.timers.get(timerKey);
        if (!timerArray || timerArray.length === 0) {
            return;
        }
        
        const timer = timerArray.pop();
        const duration = Date.now() - timer.startTime;
        
        // Record as histogram
        const name = timerKey.split('|')[0];
        this.recordHistogram(name, duration, timer.labels);
        
        return duration;
    }

    /**
     * Record agent performance
     */
    recordAgentPerformance(agentName, operation, duration, success, error = null) {
        const labels = { agent: agentName, operation };
        
        // Record timing
        this.recordHistogram('agent_operation_duration', duration, labels);
        
        // Record success/failure
        this.incrementCounter('agent_operations_total', 1, { ...labels, success: success.toString() });
        
        if (success) {
            this.incrementCounter('agent_operations_success', 1, labels);
        } else {
            this.incrementCounter('agent_operations_failure', 1, labels);
            if (error) {
                this.incrementCounter('agent_errors', 1, { ...labels, error_type: error.type || 'unknown' });
            }
        }
        
        // Update agent health
        this.updateAgentHealth(agentName, success, duration);
    }

    /**
     * Record cache performance
     */
    recordCachePerformance(operation, hit, duration, key = null) {
        const labels = { operation, hit: hit.toString() };
        
        this.recordHistogram('cache_operation_duration', duration, labels);
        this.incrementCounter('cache_operations_total', 1, labels);
        
        if (hit) {
            this.incrementCounter('cache_hits', 1, labels);
        } else {
            this.incrementCounter('cache_misses', 1, labels);
        }
        
        if (key) {
            this.incrementCounter('cache_key_access', 1, { ...labels, key: this.hashKey(key) });
        }
    }

    /**
     * Record system resource usage
     */
    recordSystemMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        // Memory metrics
        this.setGauge('memory_heap_used', memUsage.heapUsed);
        this.setGauge('memory_heap_total', memUsage.heapTotal);
        this.setGauge('memory_external', memUsage.external);
        this.setGauge('memory_rss', memUsage.rss);
        
        // CPU metrics
        this.setGauge('cpu_user', cpuUsage.user);
        this.setGauge('cpu_system', cpuUsage.system);
        
        // Process metrics
        this.setGauge('process_uptime', process.uptime());
        this.setGauge('process_pid', process.pid);
    }

    /**
     * Update agent health status
     */
    updateAgentHealth(agentName, success, duration) {
        if (!this.agentHealth.has(agentName)) {
            this.agentHealth.set(agentName, {
                totalOperations: 0,
                successfulOperations: 0,
                failedOperations: 0,
                averageResponseTime: 0,
                lastSeen: Date.now(),
                health: 'unknown'
            });
        }
        
        const health = this.agentHealth.get(agentName);
        health.totalOperations++;
        health.lastSeen = Date.now();
        
        if (success) {
            health.successfulOperations++;
        } else {
            health.failedOperations++;
        }
        
        // Update average response time
        health.averageResponseTime = 
            (health.averageResponseTime * (health.totalOperations - 1) + duration) / health.totalOperations;
        
        // Determine health status
        const successRate = health.successfulOperations / health.totalOperations;
        const timeSinceLastSeen = Date.now() - health.lastSeen;
        
        if (timeSinceLastSeen > 300000) { // 5 minutes
            health.health = 'inactive';
        } else if (successRate < 0.8) {
            health.health = 'degraded';
        } else if (health.averageResponseTime > 10000) { // 10 seconds
            health.health = 'slow';
        } else {
            health.health = 'healthy';
        }
    }

    /**
     * Check for performance alerts
     */
    checkAlerts() {
        const alerts = [];
        
        // Check response time alerts
        const avgResponseTime = this.getAverageResponseTime();
        if (avgResponseTime > this.config.alertThresholds.responseTime) {
            alerts.push({
                type: 'high_response_time',
                severity: 'warning',
                message: `Average response time ${avgResponseTime}ms exceeds threshold ${this.config.alertThresholds.responseTime}ms`,
                value: avgResponseTime,
                threshold: this.config.alertThresholds.responseTime,
                timestamp: Date.now()
            });
        }
        
        // Check error rate alerts
        const errorRate = this.getErrorRate();
        if (errorRate > this.config.alertThresholds.errorRate) {
            alerts.push({
                type: 'high_error_rate',
                severity: 'critical',
                message: `Error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold ${(this.config.alertThresholds.errorRate * 100).toFixed(2)}%`,
                value: errorRate,
                threshold: this.config.alertThresholds.errorRate,
                timestamp: Date.now()
            });
        }
        
        // Check memory usage alerts
        const memUsage = process.memoryUsage();
        const memoryUsageRatio = memUsage.heapUsed / memUsage.heapTotal;
        if (memoryUsageRatio > this.config.alertThresholds.memoryUsage) {
            alerts.push({
                type: 'high_memory_usage',
                severity: 'warning',
                message: `Memory usage ${(memoryUsageRatio * 100).toFixed(2)}% exceeds threshold ${(this.config.alertThresholds.memoryUsage * 100).toFixed(2)}%`,
                value: memoryUsageRatio,
                threshold: this.config.alertThresholds.memoryUsage,
                timestamp: Date.now()
            });
        }
        
        // Check agent health alerts
        for (const [agentName, health] of this.agentHealth.entries()) {
            if (health.health === 'degraded' || health.health === 'inactive') {
                alerts.push({
                    type: 'agent_health_issue',
                    severity: health.health === 'inactive' ? 'critical' : 'warning',
                    message: `Agent ${agentName} is ${health.health}`,
                    agent: agentName,
                    health: health.health,
                    timestamp: Date.now()
                });
            }
        }
        
        // Store alerts
        this.alerts.push(...alerts);
        
        // Keep only recent alerts
        const cutoff = Date.now() - this.config.retentionPeriod;
        this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
        
        return alerts;
    }

    /**
     * Get average response time
     */
    getAverageResponseTime() {
        let totalTime = 0;
        let count = 0;
        
        for (const histogram of this.metrics.histograms.values()) {
            for (const item of histogram) {
                if (item.labels.operation) {
                    totalTime += item.value;
                    count++;
                }
            }
        }
        
        return count > 0 ? totalTime / count : 0;
    }

    /**
     * Get error rate
     */
    getErrorRate() {
        let totalOperations = 0;
        let failedOperations = 0;
        
        for (const [key, value] of this.metrics.counters.entries()) {
            if (key.includes('agent_operations_total')) {
                totalOperations += value;
            }
            if (key.includes('agent_operations_failure')) {
                failedOperations += value;
            }
        }
        
        return totalOperations > 0 ? failedOperations / totalOperations : 0;
    }

    /**
     * Get comprehensive metrics summary
     */
    getMetricsSummary() {
        const summary = {
            timestamp: Date.now(),
            counters: Object.fromEntries(this.metrics.counters),
            gauges: Object.fromEntries(
                Array.from(this.metrics.gauges.entries()).map(([key, value]) => [key, value.value])
            ),
            agentHealth: Object.fromEntries(this.agentHealth),
            performance: {
                averageResponseTime: this.getAverageResponseTime(),
                errorRate: this.getErrorRate(),
                totalOperations: Array.from(this.metrics.counters.values()).reduce((sum, val) => sum + val, 0)
            },
            alerts: this.alerts.slice(-10), // Last 10 alerts
            system: {
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                pid: process.pid
            }
        };
        
        return summary;
    }

    /**
     * Get agent performance report
     */
    getAgentPerformanceReport(agentName) {
        const health = this.agentHealth.get(agentName);
        if (!health) {
            return null;
        }
        
        const successRate = health.totalOperations > 0 
            ? (health.successfulOperations / health.totalOperations * 100).toFixed(2)
            : 0;
        
        return {
            agent: agentName,
            health: health.health,
            totalOperations: health.totalOperations,
            successRate: `${successRate}%`,
            averageResponseTime: `${health.averageResponseTime.toFixed(2)}ms`,
            lastSeen: new Date(health.lastSeen).toISOString(),
            uptime: Date.now() - health.lastSeen
        };
    }

    /**
     * Start metrics collection
     */
    startCollection() {
        setInterval(() => {
            this.recordSystemMetrics();
            
            if (this.config.enableAlerts) {
                const alerts = this.checkAlerts();
                if (alerts.length > 0) {
                    this.handleAlerts(alerts);
                }
            }
            
            if (this.config.enableHistoricalData) {
                this.storeHistoricalData();
            }
        }, this.config.collectionInterval);
    }

    /**
     * Handle performance alerts
     */
    handleAlerts(alerts) {
        for (const alert of alerts) {
            console.log(`🚨 Performance Alert [${alert.severity.toUpperCase()}]: ${alert.message}`);
            
            // In a real implementation, you would:
            // - Send notifications to monitoring systems
            // - Trigger automated responses
            // - Log to external monitoring services
        }
    }

    /**
     * Store historical data
     */
    storeHistoricalData() {
        const dataPoint = {
            timestamp: Date.now(),
            metrics: this.getMetricsSummary()
        };
        
        this.historicalData.push(dataPoint);
        
        // Keep only recent data
        const cutoff = Date.now() - this.config.retentionPeriod;
        this.historicalData = this.historicalData.filter(dp => dp.timestamp > cutoff);
    }

    /**
     * Create metric key with labels
     */
    createMetricKey(name, labels) {
        const labelString = Object.entries(labels)
            .map(([key, value]) => `${key}=${value}`)
            .join(',');
        return labelString ? `${name}|${labelString}` : name;
    }

    /**
     * Hash key for privacy
     */
    hashKey(key) {
        // Simple hash for privacy
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Reset all metrics
     */
    resetMetrics() {
        this.metrics.counters.clear();
        this.metrics.gauges.clear();
        this.metrics.histograms.clear();
        this.metrics.timers.clear();
        this.agentHealth.clear();
        this.alerts = [];
        this.historicalData = [];
        console.log('✅ All metrics reset');
    }
}

module.exports = PerformanceMonitoringService;