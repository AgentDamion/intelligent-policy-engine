/**
 * AICOMPLYR CEP Extension - Main Application Logic
 */

// Global state
const state = {
    connected: false,
    currentDocument: null,
    complianceData: null,
    settings: {
        apiEndpoint: 'https://api.aicomplyr.io',
        organizationId: '',
        autoCheck: false,
        realTimeMonitoring: true
    },
    monitoringInterval: null
};

// Initialize extension
window.onload = function() {
    // Initialize CSInterface
    const csInterface = new CSInterface();
    
    // Initialize theme manager
    themeManager.init();
    
    // Load saved settings
    loadSettings();
    
    // Initialize CEP interface
    cepInterface.init(csInterface);
    
    // Initialize API client
    aicomplyrAPI.init(state.settings.apiEndpoint, state.settings.organizationId);
    
    // Set up event listeners
    setupEventListeners();
    
    // Check connection
    checkConnection();
    
    // Start monitoring if enabled
    if (state.settings.realTimeMonitoring) {
        startMonitoring();
    }
    
    // Listen for document events
    cepInterface.onDocumentChange((doc) => {
        state.currentDocument = doc;
        if (state.settings.autoCheck && doc) {
            checkCompliance();
        }
    });
    
    // Listen for save events
    cepInterface.onDocumentSave(() => {
        if (state.settings.autoCheck) {
            checkCompliance();
        }
    });
};

// Event listeners setup
function setupEventListeners() {
    // Compliance check button
    document.getElementById('checkComplianceBtn').addEventListener('click', checkCompliance);
    
    // Embed metadata button
    document.getElementById('embedMetadataBtn').addEventListener('click', embedMetadata);
    
    // View report button
    document.getElementById('viewReportBtn').addEventListener('click', viewReport);
    
    // Settings toggle
    document.getElementById('settingsToggle').addEventListener('click', toggleSettings);
    
    // Save settings button
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    
    // Settings inputs
    document.getElementById('realTimeMonitoring').addEventListener('change', (e) => {
        if (e.target.checked) {
            startMonitoring();
        } else {
            stopMonitoring();
        }
    });
}

// Check API connection
async function checkConnection() {
    updateConnectionStatus('connecting');
    
    try {
        const health = await aicomplyrAPI.checkHealth();
        if (health.status === 'healthy') {
            state.connected = true;
            updateConnectionStatus('connected');
        } else {
            updateConnectionStatus('error');
        }
    } catch (error) {
        console.error('Connection check failed:', error);
        updateConnectionStatus('error');
    }
}

// Update connection status UI
function updateConnectionStatus(status) {
    const statusEl = document.getElementById('connectionStatus');
    const indicator = statusEl.querySelector('.status-indicator');
    const text = statusEl.querySelector('.status-text');
    
    indicator.className = 'status-indicator';
    
    switch(status) {
        case 'connected':
            indicator.classList.add('connected');
            text.textContent = 'Connected';
            break;
        case 'connecting':
            text.textContent = 'Connecting...';
            break;
        case 'error':
            indicator.classList.add('error');
            text.textContent = 'Disconnected';
            break;
    }
}

// Check compliance for current document
async function checkCompliance() {
    if (!state.currentDocument) {
        showNotification('No document open', 'error');
        return;
    }
    
    const btn = document.getElementById('checkComplianceBtn');
    btn.classList.add('loading');
    btn.disabled = true;
    
    try {
        // Get document metadata
        const docMetadata = await cepInterface.getDocumentMetadata();
        
        // Get AI tool usage
        const aiToolUsage = await cepInterface.getAIToolUsage();
        
        // Prepare compliance check request
        const checkRequest = {
            file_name: state.currentDocument.name,
            file_type: state.currentDocument.type,
            metadata: docMetadata,
            ai_tools: aiToolUsage,
            project_id: docMetadata.projectId || null
        };
        
        // Call compliance check API
        const result = await aicomplyrAPI.checkCompliance(checkRequest);
        
        // Update state and UI
        state.complianceData = result;
        updateComplianceUI(result);
        
        showNotification('Compliance check completed', 'success');
        
    } catch (error) {
        console.error('Compliance check failed:', error);
        showNotification('Compliance check failed', 'error');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// Update compliance UI with results
function updateComplianceUI(data) {
    // Update score circle
    const score = data.compliance?.score || 0;
    const scoreCircle = document.getElementById('scoreCircle');
    const scoreNumber = document.getElementById('scoreNumber');
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (score / 100 * circumference);
    
    scoreCircle.style.strokeDashoffset = offset;
    scoreNumber.textContent = score;
    
    // Update status
    const statusValue = document.getElementById('statusValue');
    statusValue.textContent = data.compliance?.status || 'Unknown';
    statusValue.className = `value status-${data.compliance?.status}`;
    
    // Update risk level
    const riskValue = document.getElementById('riskValue');
    riskValue.textContent = data.compliance?.risk_level || '--';
    riskValue.setAttribute('data-risk', data.compliance?.risk_level);
    
    // Update last check
    const lastCheckValue = document.getElementById('lastCheckValue');
    lastCheckValue.textContent = formatDate(data.compliance?.last_checked);
    
    // Update AI tools
    updateAIToolsList(data.ai_tools || []);
    
    // Update violations
    updateViolationsList(data.violations || []);
}

// Update AI tools list
function updateAIToolsList(tools) {
    const container = document.getElementById('aiToolsList');
    
    if (tools.length === 0) {
        container.innerHTML = '<div class="empty-state">No AI tools detected</div>';
        return;
    }
    
    container.innerHTML = tools.map(tool => `
        <div class="ai-tool-item">
            <div class="ai-tool-info">
                <div class="ai-tool-name">${tool.tool_name}</div>
                <div class="ai-tool-usage">${tool.usage_type}</div>
            </div>
            <span class="ai-tool-status ${tool.approval_status}">${tool.approval_status}</span>
        </div>
    `).join('');
}

// Update violations list
function updateViolationsList(violations) {
    const container = document.getElementById('violationsList');
    
    if (violations.length === 0) {
        container.innerHTML = '<div class="empty-state">No violations found</div>';
        return;
    }
    
    container.innerHTML = violations.map(violation => `
        <div class="violation-item">
            <span class="violation-severity ${violation.severity}">${violation.severity}</span>
            <div class="violation-description">${violation.description}</div>
            ${violation.corrective_actions && violation.corrective_actions.length > 0 ? 
                `<div class="violation-action">Action: ${violation.corrective_actions[0]}</div>` : ''}
        </div>
    `).join('');
}

// Embed metadata in current document
async function embedMetadata() {
    if (!state.currentDocument || !state.complianceData) {
        showNotification('No compliance data to embed', 'error');
        return;
    }
    
    const btn = document.getElementById('embedMetadataBtn');
    btn.classList.add('loading');
    btn.disabled = true;
    
    try {
        // Embed XMP metadata
        await cepInterface.embedXMPMetadata(state.complianceData);
        
        showNotification('Metadata embedded successfully', 'success');
        
    } catch (error) {
        console.error('Failed to embed metadata:', error);
        showNotification('Failed to embed metadata', 'error');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// View full compliance report
function viewReport() {
    if (!state.complianceData) {
        showNotification('No compliance data available', 'error');
        return;
    }
    
    // Open report in browser
    const reportUrl = state.complianceData.references?.detailed_report_url;
    if (reportUrl) {
        cepInterface.openInBrowser(`${state.settings.apiEndpoint}${reportUrl}`);
    } else {
        showNotification('Report URL not available', 'error');
    }
}

// Toggle settings panel
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel.classList.toggle('open');
    
    if (panel.classList.contains('open')) {
        // Load current settings into form
        document.getElementById('apiEndpoint').value = state.settings.apiEndpoint;
        document.getElementById('organizationId').value = state.settings.organizationId;
        document.getElementById('autoCheck').checked = state.settings.autoCheck;
        document.getElementById('realTimeMonitoring').checked = state.settings.realTimeMonitoring;
    }
}

// Save settings
function saveSettings() {
    state.settings.apiEndpoint = document.getElementById('apiEndpoint').value;
    state.settings.organizationId = document.getElementById('organizationId').value;
    state.settings.autoCheck = document.getElementById('autoCheck').checked;
    state.settings.realTimeMonitoring = document.getElementById('realTimeMonitoring').checked;
    
    // Save to local storage
    localStorage.setItem('aicomplyr-settings', JSON.stringify(state.settings));
    
    // Re-initialize API client
    aicomplyrAPI.init(state.settings.apiEndpoint, state.settings.organizationId);
    
    // Check connection
    checkConnection();
    
    // Close settings panel
    document.getElementById('settingsPanel').classList.remove('open');
    
    showNotification('Settings saved', 'success');
}

// Load settings from storage
function loadSettings() {
    const saved = localStorage.getItem('aicomplyr-settings');
    if (saved) {
        state.settings = { ...state.settings, ...JSON.parse(saved) };
    }
}

// Start real-time monitoring
function startMonitoring() {
    if (state.monitoringInterval) return;
    
    state.monitoringInterval = setInterval(async () => {
        // Monitor for AI tool usage
        const aiTools = await cepInterface.detectAIToolUsage();
        if (aiTools.length > 0) {
            // Log AI tool usage
            await aicomplyrAPI.logAIToolUsage(aiTools);
        }
    }, 5000); // Check every 5 seconds
}

// Stop monitoring
function stopMonitoring() {
    if (state.monitoringInterval) {
        clearInterval(state.monitoringInterval);
        state.monitoringInterval = null;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // In a real implementation, this would show a proper notification
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    
    return date.toLocaleDateString();
}