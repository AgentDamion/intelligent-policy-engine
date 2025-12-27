// api/middleware/security-headers.js
// Security Headers Middleware for B2B Protection

import helmet from 'helmet';

// Parse security headers configuration from environment
export const getSecurityHeadersConfig = () => {
  const enabled = process.env.SECURITY_HEADERS_ENABLED === 'true';
  const hstsMaxAge = parseInt(process.env.SECURITY_HEADERS_HSTS_MAX_AGE) || 31536000; // 1 year
  const csp = process.env.SECURITY_HEADERS_CONTENT_SECURITY_POLICY || 
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';";
  
  return {
    enabled,
    hstsMaxAge,
    csp
  };
};

// B2B-appropriate security headers configuration
export const securityHeadersMiddleware = (req, res, next) => {
  const config = getSecurityHeadersConfig();
  
  if (!config.enabled) {
    console.log('[SECURITY_HEADERS] Security headers disabled');
    return next();
  }
  
  console.log('[SECURITY_HEADERS] Applying security headers');
  
  // 1. HTTP Strict Transport Security (HSTS)
  // Forces HTTPS connections, prevents protocol downgrade attacks
  res.setHeader('Strict-Transport-Security', `max-age=${config.hstsMaxAge}; includeSubDomains`);
  
  // 2. X-Frame-Options
  // Prevents clickjacking by controlling iframe embedding
  // B2B-appropriate: Allow same-origin for internal dashboards
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // 3. X-Content-Type-Options
  // Prevents MIME type sniffing attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // 4. X-XSS-Protection
  // Enables browser's XSS filtering (legacy but still useful)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // 5. Referrer-Policy
  // Controls what referrer information is sent
  // B2B-appropriate: Strict for security, but allows some referrer info
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 6. Content Security Policy (CSP)
  // Prevents XSS, injection attacks, and controls resource loading
  // B2B-appropriate: Allows inline scripts/styles for business apps
  res.setHeader('Content-Security-Policy', config.csp);
  
  // 7. Permissions-Policy (formerly Feature-Policy)
  // Controls browser features and APIs
  // B2B-appropriate: Restrictive but allows necessary features
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );
  
  // 8. Cache-Control for sensitive endpoints
  // Prevents caching of sensitive data
  if (req.path.includes('/api/auth') || req.path.includes('/api/decisions')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  // 9. X-Permitted-Cross-Domain-Policies
  // Controls cross-domain policy files
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // 10. X-DNS-Prefetch-Control
  // Controls DNS prefetching
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  
  next();
};

// Alternative: Use Helmet for comprehensive security headers
export const helmetMiddleware = helmet({
  // HSTS configuration
  hsts: {
    maxAge: getSecurityHeadersConfig().hstsMaxAge,
    includeSubDomains: true,
    preload: false // Don't preload for B2B (can be too restrictive)
  },
  
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // B2B-appropriate
      styleSrc: ["'self'", "'unsafe-inline'"], // B2B-appropriate
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"], // Allow WebSocket connections
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"] // Allow same-origin frames for B2B dashboards
    }
  },
  
  // X-Frame-Options
  frameguard: {
    action: 'sameorigin' // B2B-appropriate: Allow same-origin frames
  },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // X-XSS-Protection
  xssFilter: true,
  
  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  
  // Permissions Policy
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none'
  },
  
  // Hide Powered-By header
  hidePoweredBy: true,
  
  // Disable IE's XSS filter (we handle it ourselves)
  ieNoOpen: true
});

// Function to explain what each header does
export const explainSecurityHeaders = () => {
  console.log('🔒 Security Headers Explanation:');
  console.log('');
  console.log('1. Strict-Transport-Security (HSTS):');
  console.log('   - Forces HTTPS connections');
  console.log('   - Prevents protocol downgrade attacks');
  console.log('   - B2B Benefit: Ensures secure API communication');
  console.log('');
  console.log('2. X-Frame-Options:');
  console.log('   - Prevents clickjacking attacks');
  console.log('   - B2B Setting: SAMEORIGIN (allows internal dashboards)');
  console.log('');
  console.log('3. X-Content-Type-Options:');
  console.log('   - Prevents MIME type sniffing');
  console.log('   - B2B Benefit: Protects against content injection');
  console.log('');
  console.log('4. X-XSS-Protection:');
  console.log('   - Enables browser XSS filtering');
  console.log('   - B2B Benefit: Additional XSS protection layer');
  console.log('');
  console.log('5. Content-Security-Policy (CSP):');
  console.log('   - Prevents XSS and injection attacks');
  console.log('   - Controls resource loading');
  console.log('   - B2B Setting: Allows inline scripts/styles for business apps');
  console.log('');
  console.log('6. Referrer-Policy:');
  console.log('   - Controls referrer information sent');
  console.log('   - B2B Setting: Strict but allows some referrer info');
  console.log('');
  console.log('7. Permissions-Policy:');
  console.log('   - Controls browser features and APIs');
  console.log('   - B2B Setting: Restrictive but allows necessary features');
  console.log('');
  console.log('8. Cache-Control:');
  console.log('   - Prevents caching of sensitive data');
  console.log('   - B2B Benefit: Protects sensitive API responses');
  console.log('');
  console.log('9. X-Permitted-Cross-Domain-Policies:');
  console.log('   - Controls cross-domain policy files');
  console.log('   - B2B Setting: None (most restrictive)');
  console.log('');
  console.log('10. X-DNS-Prefetch-Control:');
  console.log('    - Controls DNS prefetching');
  console.log('    - B2B Setting: Off (for privacy)');
};