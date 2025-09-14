/**
 * AWS Textract Configuration
 * Real configuration for AWS Textract
 */

const { TextractClient, DetectDocumentTextCommand, AnalyzeDocumentCommand } = require('@aws-sdk/client-textract');

class AWSTextractConfig {
  constructor() {
    this.client = null;
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    
    this.initializeClient();
  }

  /**
   * Initialize Textract client
   */
  initializeClient() {
    try {
      if (!this.accessKeyId || !this.secretAccessKey) {
        throw new Error('AWS credentials not provided. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables');
      }

      // Initialize client with credentials
      this.client = new TextractClient({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey
        }
      });
      
      console.log(`✅ AWS Textract client initialized`);
      console.log(`   Region: ${this.region}`);
      console.log(`   Access Key ID: ${this.accessKeyId.substring(0, 8)}...`);
      
    } catch (error) {
      console.error('❌ Failed to initialize AWS Textract client:', error.message);
      this.client = null;
    }
  }

  /**
   * Check if client is properly configured
   */
  isConfigured() {
    return this.client !== null && this.accessKeyId && this.secretAccessKey;
  }

  /**
   * Get client instance
   */
  getClient() {
    return this.client;
  }

  /**
   * Test connection to Textract
   */
  async testConnection() {
    if (!this.isConfigured()) {
      throw new Error('AWS Textract not properly configured');
    }

    try {
      // Test with a simple document detection command
      // This will validate credentials without processing a document
      const testCommand = new DetectDocumentTextCommand({
        Document: {
          Bytes: Buffer.from('test') // Minimal test document
        }
      });

      // Note: This will fail with the test document, but it will validate credentials
      try {
        await this.client.send(testCommand);
      } catch (error) {
        // If it's a document processing error (not auth error), credentials are valid
        if (error.name === 'InvalidParameterException' || error.name === 'UnsupportedDocumentException') {
          console.log(`✅ AWS Textract connection test successful`);
          return {
            success: true,
            region: this.region,
            credentialsValid: true
          };
        }
        throw error;
      }

    } catch (error) {
      console.error('❌ AWS Textract connection test failed:', error.message);
      throw error;
    }
  }

  /**
   * Get configuration status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      region: this.region,
      accessKeyId: this.accessKeyId ? `${this.accessKeyId.substring(0, 8)}...` : null,
      clientInitialized: this.client !== null
    };
  }
}

module.exports = AWSTextractConfig;