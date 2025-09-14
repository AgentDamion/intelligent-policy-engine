/**
 * Schema Validation Middleware
 * Enforces deterministic input/output validation using our contracts
 * Based on the "schema-first" approach from hackathon lessons
 */

const { 
  PolicyDocIn, 
  ToolSubmissionIn, 
  ComplianceRequestIn,
  validateInput,
  validateOutput 
} = require('../../services/io/contracts');

class SchemaValidationMiddleware {
  constructor() {
    this.validationStats = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      validationErrors: []
    };
  }

  /**
   * Validate policy document input
   */
  validatePolicyDocumentInput() {
    return (req, res, next) => {
      try {
        console.log('🔍 Validating policy document input');
        
        // Validate request body against schema
        const validatedInput = validateInput(PolicyDocIn, req.body);
        req.validatedInput = validatedInput;
        
        // Update stats
        this.updateValidationStats(true);
        
        console.log('✅ Policy document input validation passed');
        next();
        
      } catch (error) {
        console.error('❌ Policy document input validation failed:', error.message);
        
        // Update stats
        this.updateValidationStats(false, error.message);
        
        res.status(400).json({
          error: 'Schema validation failed',
          message: error.message,
          code: 'SCHEMA_VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  /**
   * Validate tool submission input
   */
  validateToolSubmissionInput() {
    return (req, res, next) => {
      try {
        console.log('🔍 Validating tool submission input');
        
        // Validate request body against schema
        const validatedInput = validateInput(ToolSubmissionIn, req.body);
        req.validatedInput = validatedInput;
        
        // Update stats
        this.updateValidationStats(true);
        
        console.log('✅ Tool submission input validation passed');
        next();
        
      } catch (error) {
        console.error('❌ Tool submission input validation failed:', error.message);
        
        // Update stats
        this.updateValidationStats(false, error.message);
        
        res.status(400).json({
          error: 'Schema validation failed',
          message: error.message,
          code: 'SCHEMA_VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  /**
   * Validate compliance request input
   */
  validateComplianceRequestInput() {
    return (req, res, next) => {
      try {
        console.log('🔍 Validating compliance request input');
        
        // Validate request body against schema
        const validatedInput = validateInput(ComplianceRequestIn, req.body);
        req.validatedInput = validatedInput;
        
        // Update stats
        this.updateValidationStats(true);
        
        console.log('✅ Compliance request input validation passed');
        next();
        
      } catch (error) {
        console.error('❌ Compliance request input validation failed:', error.message);
        
        // Update stats
        this.updateValidationStats(false, error.message);
        
        res.status(400).json({
          error: 'Schema validation failed',
          message: error.message,
          code: 'SCHEMA_VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  /**
   * Validate output before sending response
   */
  validateOutput(schema) {
    return (req, res, next) => {
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to validate output
      res.json = function(data) {
        try {
          console.log('🔍 Validating response output');
          
          // Validate output against schema
          const validatedOutput = validateOutput(schema, data);
          
          console.log('✅ Response output validation passed');
          return originalJson.call(this, validatedOutput);
          
        } catch (error) {
          console.error('❌ Response output validation failed:', error.message);
          
          // Return validation error response
          return originalJson.call(this, {
            error: 'Output validation failed',
            message: error.message,
            code: 'OUTPUT_VALIDATION_ERROR',
            timestamp: new Date().toISOString()
          });
        }
      };
      
      next();
    };
  }

  /**
   * Generic schema validation middleware
   */
  validateSchema(inputSchema, outputSchema = null) {
    return (req, res, next) => {
      try {
        // Validate input
        console.log('🔍 Validating input against schema');
        const validatedInput = validateInput(inputSchema, req.body);
        req.validatedInput = validatedInput;
        
        // Update stats
        this.updateValidationStats(true);
        
        console.log('✅ Input validation passed');
        
        // Set up output validation if schema provided
        if (outputSchema) {
          const originalJson = res.json;
          
          res.json = function(data) {
            try {
              console.log('🔍 Validating output against schema');
              const validatedOutput = validateOutput(outputSchema, data);
              console.log('✅ Output validation passed');
              return originalJson.call(this, validatedOutput);
            } catch (error) {
              console.error('❌ Output validation failed:', error.message);
              return originalJson.call(this, {
                error: 'Output validation failed',
                message: error.message,
                code: 'OUTPUT_VALIDATION_ERROR',
                timestamp: new Date().toISOString()
              });
            }
          };
        }
        
        next();
        
      } catch (error) {
        console.error('❌ Input validation failed:', error.message);
        
        // Update stats
        this.updateValidationStats(false, error.message);
        
        res.status(400).json({
          error: 'Schema validation failed',
          message: error.message,
          code: 'SCHEMA_VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  /**
   * Update validation statistics
   */
  updateValidationStats(success, errorMessage = null) {
    this.validationStats.totalValidations++;
    
    if (success) {
      this.validationStats.successfulValidations++;
    } else {
      this.validationStats.failedValidations++;
      if (errorMessage) {
        this.validationStats.validationErrors.push({
          message: errorMessage,
          timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 errors
        if (this.validationStats.validationErrors.length > 100) {
          this.validationStats.validationErrors = this.validationStats.validationErrors.slice(-100);
        }
      }
    }
  }

  /**
   * Get validation statistics
   */
  getValidationStats() {
    const successRate = this.validationStats.totalValidations > 0 
      ? this.validationStats.successfulValidations / this.validationStats.totalValidations 
      : 0;
    
    return {
      ...this.validationStats,
      successRate,
      recentErrors: this.validationStats.validationErrors.slice(-10)
    };
  }

  /**
   * Reset validation statistics
   */
  resetStats() {
    this.validationStats = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      validationErrors: []
    };
  }

  /**
   * Health check for validation middleware
   */
  healthCheck() {
    const stats = this.getValidationStats();
    const healthy = stats.successRate >= 0.95; // 95% success rate threshold
    
    return {
      healthy,
      stats,
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const schemaValidationMiddleware = new SchemaValidationMiddleware();

module.exports = schemaValidationMiddleware;