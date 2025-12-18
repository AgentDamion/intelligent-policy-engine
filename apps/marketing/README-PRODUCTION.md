# Production Deployment Guide

## 🚨 Critical Security Checklist

Before deploying to production, ensure ALL items below are completed:

### ✅ Environment Configuration

1. **Remove Development Flags**
   ```bash
   # These MUST be removed or set to false in production:
   VITE_AUTH_BYPASS=false  # or remove entirely
   # VITE_BYPASS_ROLE=     # remove this line
   ```

2. **Required Environment Variables**
   ```bash
   VITE_SUPABASE_PROJECT_ID="your-project-id"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   ```

3. **HTTPS Enforcement**
   - Ensure all traffic uses HTTPS
   - Configure SSL certificates
   - Set up HSTS headers

### ✅ Security Configuration

1. **Supabase Settings**
   - Configure Site URL in Authentication > URL Configuration
   - Set appropriate redirect URLs
   - Enable Row Level Security (RLS) on all tables
   - Review and test all RLS policies

2. **API Security**
   - Enable rate limiting
   - Configure CORS appropriately
   - Validate all input data
   - Implement proper authentication

### ✅ Monitoring & Error Handling

1. **Error Tracking**
   - Global error boundary is implemented ✅
   - Monitoring service configured (optional)
   - Console error tracking enabled

2. **Performance Monitoring**
   - API response time tracking ✅
   - User action monitoring ✅
   - Performance metrics collection

### ✅ Testing

1. **Security Testing**
   - Test authentication flows
   - Verify RLS policies work correctly
   - Test API endpoints for unauthorized access
   - Validate input sanitization

2. **Functional Testing**
   - Test all user flows
   - Verify error handling works
   - Test responsive design
   - Cross-browser compatibility

## 🔧 Deployment Steps

### 1. Pre-deployment Validation

Run the production readiness check:
```javascript
// This runs automatically in development mode
// Check browser console for production readiness report
```

### 2. Build Configuration

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

### 3. Environment Setup

Create `.env.production` file:
```bash
VITE_SUPABASE_PROJECT_ID="dqemokpnzasbeytdbzei"
VITE_SUPABASE_PUBLISHABLE_KEY="your-key-here"
VITE_SUPABASE_URL="https://dqemokpnzasbeytdbzei.supabase.co"

# Ensure NO development flags are present:
# VITE_AUTH_BYPASS=false  # Should not be set at all
```

### 4. Deployment

1. Deploy to your hosting platform
2. Configure environment variables
3. Test all critical flows
4. Monitor error logs
5. Set up alerting

## 🎯 Production Features Implemented

### ✅ Security
- Global error boundary with secure error reporting
- Environment validation with security checks
- Authentication bypass warnings and monitoring
- Production configuration validation

### ✅ Monitoring
- Centralized logging system
- Error tracking with context
- Performance monitoring
- User action tracking
- API call monitoring

### ✅ Error Handling
- Global error boundary component
- Graceful error recovery
- User-friendly error messages
- Development vs production error details

### ✅ Performance
- Query optimization with React Query
- Lazy loading for routes (ready for implementation)
- Error retry mechanisms
- Request timeout handling

## 🔍 Health Checks

The application includes several health checks:

1. **Environment Validation**: Validates all required environment variables
2. **Security Checks**: Ensures production security settings are correct
3. **API Health**: Monitors backend connectivity and performance
4. **Authentication**: Validates auth configuration

## 📊 Monitoring Dashboard

Access monitoring information through:
- Browser console (development mode shows production readiness report)
- Error boundary displays for critical failures
- Network monitoring for API performance
- User action tracking for analytics

## 🚨 Emergency Procedures

### If Auth Issues Occur:
1. Check Supabase dashboard for auth status
2. Verify Site URL and Redirect URL configuration
3. Check environment variables are correctly set
4. Review RLS policies for conflicts

### If API Issues Occur:
1. Check backend health status
2. Review API logs in Supabase dashboard
3. Verify network connectivity
4. Check rate limiting settings

### If Critical Errors Occur:
1. Global error boundary will catch and display errors
2. Check browser console for detailed error information
3. Review monitoring logs for error context
4. Use error ID for tracking specific issues

## 📝 Post-Deployment Checklist

- [ ] Verify all pages load correctly
- [ ] Test authentication flows
- [ ] Confirm API endpoints respond correctly
- [ ] Check error handling works properly
- [ ] Validate monitoring is collecting data
- [ ] Test user workflows end-to-end
- [ ] Verify security headers are present
- [ ] Confirm HTTPS is enforced
- [ ] Test responsive design on mobile devices
- [ ] Validate performance is acceptable

---

## 🔧 Development vs Production Differences

| Feature | Development | Production |
|---------|-------------|------------|
| Auth Bypass | Allowed | **BLOCKED** |
| Error Details | Full stack traces | User-friendly messages |
| Console Logs | Verbose | Minimal/structured |
| Source Maps | Enabled | Disabled |
| Minification | Disabled | Enabled |
| Monitoring | Console only | Full tracking |

## 📞 Support

For deployment issues:
1. Check this guide first
2. Review browser console errors
3. Check Supabase dashboard logs
4. Verify environment configuration