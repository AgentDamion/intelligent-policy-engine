/**
 * Google Cloud Configuration
 * Real configuration for Google Document AI
 */

const { DocumentProcessorServiceClient } = require('@google-cloud/documentai');

class GoogleCloudConfig {
  constructor() {
    this.client = null;
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    this.location = process.env.GOOGLE_CLOUD_LOCATION || 'us';
    this.processorId = process.env.DOCUMENT_AI_PROCESSOR_ID;
    this.processorName = null;
    
    this.initializeClient();
  }

  /**
   * Initialize Document AI client
   */
  initializeClient() {
    try {
      if (!this.projectId) {
        throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable not set');
      }

      if (!this.processorId) {
        throw new Error('DOCUMENT_AI_PROCESSOR_ID environment variable not set');
      }

      // Initialize client with credentials
      this.client = new DocumentProcessorServiceClient({
        // Credentials will be loaded from:
        // 1. GOOGLE_APPLICATION_CREDENTIALS environment variable
        // 2. gcloud auth application-default login
        // 3. Service account key file
        projectId: this.projectId
      });

      // Set processor name
      this.processorName = `projects/${this.projectId}/locations/${this.location}/processors/${this.processorId}`;
      
      console.log(`✅ Google Document AI client initialized`);
      console.log(`   Project: ${this.projectId}`);
      console.log(`   Location: ${this.location}`);
      console.log(`   Processor: ${this.processorId}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Google Document AI client:', error.message);
      this.client = null;
    }
  }

  /**
   * Check if client is properly configured
   */
  isConfigured() {
    return this.client !== null && this.projectId && this.processorId;
  }

  /**
   * Get processor name
   */
  getProcessorName() {
    return this.processorName;
  }

  /**
   * Get client instance
   */
  getClient() {
    return this.client;
  }

  /**
   * Test connection to Document AI
   */
  async testConnection() {
    if (!this.isConfigured()) {
      throw new Error('Google Document AI not properly configured');
    }

    try {
      // Test by listing processors (this will validate credentials)
      const [processors] = await this.client.listProcessors({
        parent: `projects/${this.projectId}/locations/${this.location}`
      });

      console.log(`✅ Google Document AI connection test successful`);
      console.log(`   Found ${processors.length} processors`);
      
      return {
        success: true,
        processorCount: processors.length,
        projectId: this.projectId,
        location: this.location
      };

    } catch (error) {
      console.error('❌ Google Document AI connection test failed:', error.message);
      throw error;
    }
  }

  /**
   * Get configuration status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      projectId: this.projectId,
      location: this.location,
      processorId: this.processorId,
      processorName: this.processorName,
      clientInitialized: this.client !== null
    };
  }
}

module.exports = GoogleCloudConfig;