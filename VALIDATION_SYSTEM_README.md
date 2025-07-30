# AICOMPLYR.io Enterprise-Grade Input Validation System

## 🎯 Overview

This document describes the comprehensive input validation system implemented for AICOMPLYR.io, an AI governance platform for pharmaceutical companies and their agencies. The system provides enterprise-grade security controls that protect sensitive compliance data while maintaining excellent user experience.

## 🏗️ Architecture

### Core Components

1. **Input Validator** (`api/validation/input-validator.js`)
   - Comprehensive validation for all data types
   - Pharmaceutical industry-specific validation rules
   - XSS and SQL injection prevention
   - Data sanitization and normalization

2. **Validation Middleware** (`api/validation/validation-middleware.js`)
   - Express middleware integration
   - Rate limiting and security controls
   - File upload validation
   - Content type and payload size validation

3. **Validation Schemas** (`api/validation/validation-schemas.js`)
   - Industry-specific validation rules
   - Comprehensive schema definitions
   - Custom validation builders
   - Pharmaceutical compliance schemas

4. **Validated Routes** (`api/routes/validated-routes.js`)
   - All existing endpoints with validation
   - Security-enhanced API endpoints
   - Comprehensive error handling
   - Audit logging for all validations

## 🔒 Security Features

### Data Protection
- **XSS Prevention**: HTML sanitization for all text inputs
- **SQL Injection Prevention**: Pattern detection and blocking
- **File Upload Security**: Type and size validation
- **Input Sanitization**: Automatic cleaning of all user inputs

### Rate Limiting
- **General API**: 100 requests per 15 minutes
- **Sensitive Endpoints**: 20 requests per 15 minutes
- **Login Attempts**: 5 attempts per 15 minutes
- **Configurable Limits**: Easy adjustment per endpoint

### Content Validation
- **Payload Size Limits**: Configurable per endpoint
- **Content Type Validation**: Strict MIME type checking
- **Character Encoding**: UTF-8 enforcement
- **Special Character Handling**: Safe processing of all inputs

## 📋 Validation Rules

### Authentication
```javascript
// Login validation
{
  email: "valid email format, max 255 chars",
  password: "min 8 chars, uppercase, lowercase, number, special char"
}
```

### Enterprise Management
```javascript
// Enterprise creation
{
  name: "2-255 chars, letters/numbers/spaces/punctuation only",
  slug: "2-100 chars, lowercase/numbers/hyphens only",
  type: "pharma|agency|partner|other",
  subscriptionTier: "standard|premium|enterprise"
}
```

### Policy Management
```javascript
// Policy creation
{
  name: "3-255 chars, safe characters only",
  policyType: "compliance|workflow|brand|security|regulatory",
  rules: "JSON object with validated structure",
  enterpriseId: "valid UUID",
  agencySeatId: "valid UUID (optional)"
}
```

### Compliance Submissions
```javascript
// Compliance submission
{
  title: "5-255 chars",
  description: "max 5000 chars",
  content: "max 50000 chars",
  contentType: "policy|report|audit|review|approval|regulatory",
  priority: "low|medium|high|critical",
  metadata: {
    drugName: "valid drug name format",
    regulatoryBody: "FDA|EMA|HealthCanada|PMDA|Other",
    regulatoryCode: "XX-1234 format"
  }
}
```

### Pharmaceutical-Specific Validation
```javascript
// Drug information
{
  drugName: "2-255 chars, letters/numbers/spaces/hyphens/parentheses",
  genericName: "max 255 chars",
  brandName: "max 255 chars",
  therapeuticClass: "max 255 chars",
  regulatoryStatus: "approved|pending|investigational|discontinued"
}

// Regulatory submissions
{
  submissionType: "NDA|ANDA|BLA|PMA|510k|Other",
  regulatoryBody: "FDA|EMA|HealthCanada|PMDA|Other",
  submissionNumber: "XX-1234 format",
  submissionDate: "valid date",
  status: "draft|submitted|under_review|approved|rejected|withdrawn"
}
```

## 🚀 Implementation

### 1. Install Dependencies
```bash
npm install joi express-rate-limit isomorphic-dompurify
```

### 2. Integrate with Existing Routes
```javascript
// Add validation to existing routes
const validationMiddleware = require('./api/validation/validation-middleware');
const validationSchemas = require('./api/validation/validation-schemas');

// Apply validation to route
router.post('/policies',
    hierarchicalAuth.requireAuth(),
    validationMiddleware.sanitizeInput(),
    validationMiddleware.validateContentType(['application/json']),
    (req, res, next) => {
        const result = inputValidator.validate(validationSchemas.getCreatePolicySchema(), req.body);
        if (!result.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: result.errors
            });
        }
        req.body = result.sanitizedData;
        next();
    },
    // Your existing route handler
);
```

### 3. Update Server Configuration
```javascript
// Add to server.js
const validatedRoutes = require('./api/routes/validated-routes');
app.use('/api', validatedRoutes);
```

## 🧪 Testing

### Validation Testing
```javascript
// Test validation rules
const inputValidator = require('./api/validation/input-validator');
const validationSchemas = require('./api/validation/validation-schemas');

// Test policy creation
const testData = {
    name: "Test Policy",
    policyType: "compliance",
    rules: { riskThreshold: 0.7 },
    enterpriseId: "uuid-here"
};

const result = inputValidator.validate(validationSchemas.getCreatePolicySchema(), testData);
console.log(result.isValid ? 'Valid' : 'Invalid:', result.errors);
```

### Security Testing
```javascript
// Test XSS prevention
const maliciousInput = "<script>alert('xss')</script>Policy Name";
const result = inputValidator.sanitizeData({ name: maliciousInput });
console.log(result.name); // Should be sanitized

// Test SQL injection prevention
const sqlInjection = "'; DROP TABLE users; --";
const result = inputValidator.validateSqlSafe(sqlInjection, "name");
console.log(result.isValid); // Should be false
```

## 📊 Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "code": "string.email"
    },
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      "code": "string.pattern.base"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Rate Limit Response
```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": "15 minutes"
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Validation settings
VALIDATION_MAX_PAYLOAD_SIZE=10mb
VALIDATION_RATE_LIMIT_GENERAL=100
VALIDATION_RATE_LIMIT_STRICT=20
VALIDATION_RATE_LIMIT_LOGIN=5
VALIDATION_WINDOW_MS=900000
```

### Custom Validation Rules
```javascript
// Add custom validation for specific business rules
const customSchema = validationSchemas.buildCustomSchema(
    validationSchemas.getCreatePolicySchema(),
    {
        customField: Joi.string().required(),
        businessRule: Joi.boolean().default(true)
    }
);
```

## 📈 Monitoring

### Validation Metrics
- **Validation Success Rate**: Track successful vs failed validations
- **Error Distribution**: Monitor most common validation errors
- **Rate Limit Hits**: Track when rate limits are triggered
- **Security Events**: Monitor XSS and SQL injection attempts

### Audit Logging
```javascript
// All validation attempts are logged
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "endpoint": "/api/policies",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "validationResult": "success|failure",
  "errors": ["error1", "error2"],
  "sanitizedData": true
}
```

## 🎯 Business Value

### For Pharmaceutical Companies
- **Regulatory Compliance**: Ensures data meets FDA/EMA requirements
- **Data Integrity**: Prevents corruption of sensitive compliance data
- **Audit Trail**: Complete logging of all data modifications
- **Security Assurance**: Enterprise-grade protection for sensitive information

### For Agencies
- **Error Prevention**: Clear feedback helps users submit correct data
- **Time Savings**: Immediate validation prevents submission delays
- **Compliance Confidence**: Ensures submissions meet client requirements
- **Professional Experience**: Enterprise-grade validation builds trust

### For Platform
- **Security Protection**: Prevents malicious attacks and data breaches
- **Performance**: Efficient validation prevents resource waste
- **Scalability**: Rate limiting protects system resources
- **Compliance**: Meets enterprise security standards

## 🔄 Migration Guide

### Existing Endpoints
1. **Identify endpoints** that need validation
2. **Add validation middleware** to each route
3. **Test thoroughly** with existing data
4. **Monitor performance** and adjust as needed

### New Endpoints
1. **Use validated routes** as templates
2. **Define schemas** for new data types
3. **Apply security middleware** consistently
4. **Test with edge cases** and malicious inputs

## 🚀 Future Enhancements

### Planned Features
1. **AI-Powered Validation**: Machine learning for pattern detection
2. **Real-Time Validation**: Client-side validation with server sync
3. **Custom Rule Builder**: Visual interface for business rules
4. **Validation Analytics**: Advanced reporting and insights
5. **Multi-Language Support**: International validation rules

### Performance Optimizations
1. **Validation Caching**: Cache common validation results
2. **Parallel Processing**: Validate multiple fields simultaneously
3. **Lazy Validation**: Validate only when needed
4. **Compression**: Optimize validation payload sizes

---

**AICOMPLYR.io Validation System** - Enterprise-grade input validation for pharmaceutical compliance platforms. 