# Production Deployment Guide

## HTTPS Configuration

The Express server has been updated with production-ready HTTPS configuration:

### 1. HTTPS Redirect Middleware
- Automatically redirects HTTP to HTTPS in production
- Detects secure connections through proxies
- Uses 301 permanent redirect for SEO

### 2. CORS Configuration
**Development (NODE_ENV !== 'production'):**
- Allows localhost origins
- Permissive for development tools
- Allows ngrok for testing

**Production (NODE_ENV === 'production'):**
- Strict origin validation
- Only allows specified domains:
  - `https://aicomplyr.io`
  - `https://www.aicomplyr.io`
  - `https://app.aicomplyr.io`

### 3. Session Security
**Development:**
- `secure: false` - allows HTTP cookies
- `sameSite: 'lax'` - permissive CSRF protection

**Production:**
- `secure: true` - HTTPS-only cookies
- `httpOnly: true` - prevents XSS attacks
- `sameSite: 'strict'` - strict CSRF protection

## Environment Variables for Production

Create a `.env.production` file with:

```bash
# Required
NODE_ENV=production
SESSION_SECRET=your-super-secure-session-secret-here
DATABASE_URL=postgresql://username:password@host:5432/database_name

# Optional
PORT=3000
LOG_LEVEL=info
TRUST_PROXY=true  # If behind nginx/reverse proxy
```

## Deployment Checklist

### ✅ Server Configuration
- [x] HTTPS redirect middleware added
- [x] CORS configured for production domains
- [x] Secure session cookies enabled
- [x] Console logging updated for HTTPS

### 🔧 Required Actions
1. **Set NODE_ENV=production** in your deployment environment
2. **Generate a strong SESSION_SECRET**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
3. **Configure your reverse proxy** (nginx/Apache) to handle SSL termination
4. **Update CORS origins** if you have additional domains
5. **Test HTTPS redirect** in production environment

### 🚨 Security Notes
- Session secret must be at least 32 characters
- Never commit `.env.production` to version control
- Use environment variables for all sensitive configuration
- Consider using a secrets management service in production

### 🔍 Testing HTTPS
1. Deploy with `NODE_ENV=production`
2. Access your site via HTTP - should redirect to HTTPS
3. Verify cookies are secure in browser dev tools
4. Test CORS with your frontend domain

## Reverse Proxy Configuration (nginx example)

```nginx
server {
    listen 80;
    server_name aicomplyr.io www.aicomplyr.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name aicomplyr.io www.aicomplyr.io;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
``` 