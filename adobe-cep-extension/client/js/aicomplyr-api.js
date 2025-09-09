/**
 * AICOMPLYR API Client for CEP Extension
 */

const aicomplyrAPI = {
    baseUrl: '',
    organizationId: '',
    
    // Initialize API client
    init(baseUrl, organizationId) {
        this.baseUrl = baseUrl;
        this.organizationId = organizationId;
    },
    
    // Check API health
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            return await response.json();
        } catch (error) {
            throw new Error('Failed to check API health');
        }
    },
    
    // Check compliance for a file
    async checkCompliance(data) {
        try {
            const response = await fetch(`${this.baseUrl}/compliance/check`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-org-id': this.organizationId
                },
                body: JSON.stringify({
                    ...data,
                    source: 'adobe-cep-extension',
                    check_type: 'real-time'
                })
            });
            
            if (!response.ok) {
                throw new Error('Compliance check failed');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Compliance check error:', error);
            throw error;
        }
    },
    
    // Log AI tool usage
    async logAIToolUsage(tools) {
        try {
            const response = await fetch(`${this.baseUrl}/ai-tools/log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-org-id': this.organizationId
                },
                body: JSON.stringify({
                    tools: tools,
                    source: 'adobe-cep-extension',
                    timestamp: new Date().toISOString()
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to log AI tool usage:', error);
        }
    },
    
    // Get compliance report
    async getComplianceReport(activityId) {
        try {
            const response = await fetch(`${this.baseUrl}/compliance/reports/${activityId}`, {
                headers: {
                    'x-org-id': this.organizationId
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to get compliance report');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Failed to get compliance report:', error);
            throw error;
        }
    },
    
    // Upload file with compliance metadata
    async uploadFileWithMetadata(file, metadata) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('metadata', JSON.stringify(metadata));
            
            const response = await fetch(`${this.baseUrl}/platform-adobe/upload`, {
                method: 'POST',
                headers: {
                    'x-org-id': this.organizationId
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('File upload failed');
            }
            
            return await response.json();
        } catch (error) {
            console.error('File upload error:', error);
            throw error;
        }
    }
};