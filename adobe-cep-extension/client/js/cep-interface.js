/**
 * CEP Interface - Handles communication between extension and host application
 */

const cepInterface = {
    csInterface: null,
    hostEnvironment: null,
    documentChangeCallbacks: [],
    saveCallbacks: [],
    
    // Initialize CEP interface
    init(csInterface) {
        this.csInterface = csInterface;
        this.hostEnvironment = csInterface.getHostEnvironment();
        
        // Set up persistent engine
        csInterface.setPersistent(true);
        
        // Listen for host events
        this.setupEventListeners();
        
        console.log('CEP Interface initialized for', this.hostEnvironment.appName);
    },
    
    // Set up event listeners for host application
    setupEventListeners() {
        // Document change events
        this.csInterface.addEventListener('documentAfterActivate', (event) => {
            this.onDocumentActivate(event.data);
        });
        
        // Save events
        this.csInterface.addEventListener('documentAfterSave', (event) => {
            this.onDocumentSave(event.data);
        });
        
        // AI tool events (custom)
        this.csInterface.addEventListener('AIToolUsed', (event) => {
            this.onAIToolUsed(event.data);
        });
    },
    
    // Get current document info
    async getCurrentDocument() {
        return new Promise((resolve) => {
            this.csInterface.evalScript('getDocumentInfo()', (result) => {
                if (result === 'EvalScript error.') {
                    resolve(null);
                } else {
                    try {
                        resolve(JSON.parse(result));
                    } catch (e) {
                        resolve(null);
                    }
                }
            });
        });
    },
    
    // Get document metadata
    async getDocumentMetadata() {
        return new Promise((resolve) => {
            this.csInterface.evalScript('getDocumentMetadata()', (result) => {
                try {
                    resolve(JSON.parse(result));
                } catch (e) {
                    resolve({});
                }
            });
        });
    },
    
    // Get AI tool usage from document
    async getAIToolUsage() {
        return new Promise((resolve) => {
            this.csInterface.evalScript('getAIToolUsage()', (result) => {
                try {
                    resolve(JSON.parse(result));
                } catch (e) {
                    resolve([]);
                }
            });
        });
    },
    
    // Detect real-time AI tool usage
    async detectAIToolUsage() {
        return new Promise((resolve) => {
            this.csInterface.evalScript('detectAIToolUsage()', (result) => {
                try {
                    resolve(JSON.parse(result));
                } catch (e) {
                    resolve([]);
                }
            });
        });
    },
    
    // Embed XMP metadata in document
    async embedXMPMetadata(complianceData) {
        return new Promise((resolve, reject) => {
            const xmpData = this.buildXMPPacket(complianceData);
            this.csInterface.evalScript(`embedXMPMetadata('${xmpData}')`, (result) => {
                if (result === 'true') {
                    resolve();
                } else {
                    reject(new Error('Failed to embed XMP metadata'));
                }
            });
        });
    },
    
    // Build XMP packet from compliance data
    buildXMPPacket(data) {
        const xmp = {
            'aicomplyr:version': '1.0.0',
            'aicomplyr:generatedAt': new Date().toISOString(),
            'aicomplyr:projectId': data.aicomplyr?.project_id || '',
            'aicomplyr:organizationId': data.aicomplyr?.organization_id || '',
            'aicomplyr:activityId': data.aicomplyr?.activity_id || '',
            'aicomplyr:complianceStatus': data.compliance?.status || '',
            'aicomplyr:complianceScore': data.compliance?.score || 0,
            'aicomplyr:riskLevel': data.compliance?.risk_level || '',
            'aicomplyr:lastChecked': data.compliance?.last_checked || '',
            'aicomplyr:aiTools': JSON.stringify(data.ai_tools || []),
            'aicomplyr:violations': JSON.stringify(data.violations || [])
        };
        
        return JSON.stringify(xmp);
    },
    
    // Open URL in browser
    openInBrowser(url) {
        this.csInterface.openURLInDefaultBrowser(url);
    },
    
    // Document change callback
    onDocumentChange(callback) {
        this.documentChangeCallbacks.push(callback);
    },
    
    // Document save callback
    onDocumentSave(callback) {
        this.saveCallbacks.push(callback);
    },
    
    // Handle document activate event
    async onDocumentActivate(data) {
        const doc = await this.getCurrentDocument();
        this.documentChangeCallbacks.forEach(cb => cb(doc));
    },
    
    // Handle document save event
    async onDocumentSave(data) {
        this.saveCallbacks.forEach(cb => cb(data));
    },
    
    // Handle AI tool used event
    onAIToolUsed(data) {
        // This would be triggered by custom ExtendScript monitoring
        console.log('AI Tool Used:', data);
    }
};