# 🚀 Beta Launch Guide - AI Policy Engine

## Overview

Your AI Policy Engine is now ready for beta launch! This guide will help you deploy and test all the components we've implemented to match Lovable's expected architecture.

## ✅ What's Been Implemented

### Backend (server-unified.js)
- ✅ **Authentication Middleware** - Supabase JWT token validation
- ✅ **Agent Activity API** - POST/GET endpoints for activity ingestion and retrieval
- ✅ **Conflict Analysis API** - Policy conflict detection endpoint
- ✅ **System Status API** - Health checks and system monitoring
- ✅ **WebSocket Support** - Real-time updates for agent activities
- ✅ **Error Handling** - Comprehensive error handling and logging
- ✅ **Security** - Rate limiting, CORS, and helmet protection

### Frontend Components
- ✅ **ActivityFeed** - Real-time agent activity monitoring
- ✅ **SystemStatus** - System health and uptime display
- ✅ **ConflictDetection** - Policy conflict analysis interface
- ✅ **AgentStatus** - Agent status monitoring
- ✅ **Responsive Design** - Mobile-friendly dashboard

### Database Integration
- ✅ **Supabase Integration** - Full database connectivity
- ✅ **RLS Policies** - Security fixes for agent_activities and ai_agent_decisions
- ✅ **Edge Functions** - Existing functions for agent ingestion

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in your project root:
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Fix Database Security Issues
Run the SQL script in your Supabase SQL editor:
```bash
# Copy and paste the contents of fix-rls-policies.sql into your Supabase SQL editor
cat fix-rls-policies.sql
```

### 4. Start the Development Server
```bash
# Start both backend and frontend
npm run dev

# Or start them separately
npm run dev:backend  # Backend on port 3001
npm run dev:frontend # Frontend on port 5173
```

### 5. Run Integration Tests
```bash
npm test
```

## 📊 API Endpoints

### Public Endpoints (No Auth Required)
- `GET /health` - Basic health check
- `POST /api/invite` - Create workspace invitation
- `GET /api/invite/:token` - Get invitation details

### Protected Endpoints (Auth Required)
- `GET /api/me` - Get current user profile
- `POST /api/agent/activity` - Ingest agent activity
- `GET /api/agent/activity` - Get agent activity feed
- `POST /api/analyze-conflicts` - Analyze policy conflicts
- `GET /api/status` - Get system status

### WebSocket
- `ws://localhost:3001?token=YOUR_JWT_TOKEN` - Real-time updates

## 🧪 Testing

### Manual Testing
1. **Health Check**: Visit `http://localhost:3001/health`
2. **System Status**: Visit `http://localhost:3001/api/status`
3. **Dashboard**: Visit `http://localhost:5173`
4. **Agent Activity**: Use the dashboard to test activity ingestion
5. **Conflict Analysis**: Click "Analyze Sample Policies" in the dashboard

### Integration Testing
```bash
npm test
```

This will run comprehensive tests for:
- Health checks
- API endpoints
- WebSocket connections
- Error handling
- Authentication

## 🔧 Architecture Overview

### Data Flow (Matches Lovable's Sequence Diagram)

**Primary Path:**
```
Cursor AI Agents → POST /api/agent/activity → Cursor Backend → GET /api/agent/activity → Supabase DB → Dashboards
```

**Alternative Path:**
```
Cursor AI Agents → POST /functions/v1/ingest_agent_activity → Supabase Edge Functions → Supabase DB → Dashboards
```

**Conflict Analysis:**
```
Cursor AI Agents → POST /api/analyze-conflicts → ConflictReport → Dashboards
```

**Real-time Updates:**
```
WebSocket /ws/lighthouse → Real-time activity updates → Dashboard components
```

## 🎯 Beta Launch Checklist

### Pre-Launch
- [ ] Environment variables configured
- [ ] Database RLS policies fixed
- [ ] All integration tests passing
- [ ] Frontend builds successfully
- [ ] Backend starts without errors

### Launch Day
- [ ] Deploy to production environment
- [ ] Configure production environment variables
- [ ] Test with real Supabase authentication
- [ ] Monitor system logs for errors
- [ ] Verify all dashboard components work

### Post-Launch
- [ ] Monitor system performance
- [ ] Collect user feedback
- [ ] Fix any reported issues
- [ ] Plan next iteration features

## 🐛 Troubleshooting

### Common Issues

**1. Authentication Errors**
```
Error: Invalid token
```
- Ensure your Supabase JWT token is valid
- Check that SUPABASE_SERVICE_ROLE_KEY is correct

**2. Database Connection Issues**
```
Error: Failed to save agent activity
```
- Verify SUPABASE_URL is correct
- Check that RLS policies are properly configured
- Ensure agent_activities table exists

**3. WebSocket Connection Issues**
```
WebSocket connection failed
```
- Check that the server is running on the correct port
- Verify JWT token is valid for WebSocket authentication

**4. Frontend Not Loading**
```
Failed to fetch activities
```
- Ensure backend is running on port 3001
- Check CORS configuration
- Verify API endpoints are accessible

### Debug Mode
Set `NODE_ENV=development` to enable detailed error messages and stack traces.

## 📈 Performance Monitoring

### Key Metrics to Monitor
- API response times (should be < 200ms)
- WebSocket connection stability
- Database query performance
- Frontend load times (should be < 2s)
- Error rates and types

### Logs to Watch
- Server startup logs
- Authentication failures
- Database connection errors
- WebSocket disconnections
- API error responses

## 🔮 Next Steps

### Phase 2 Features (Post-Beta)
1. **Real Agent Integration** - Connect with actual AI agents
2. **Advanced Conflict Detection** - Implement sophisticated policy analysis
3. **User Management** - Complete authentication and user roles
4. **Analytics Dashboard** - Add metrics and reporting
5. **Mobile App** - React Native or PWA version

### Production Considerations
1. **Scaling** - Consider load balancing for high traffic
2. **Monitoring** - Implement APM tools (DataDog, New Relic)
3. **Backup** - Set up automated database backups
4. **Security** - Regular security audits and updates
5. **Documentation** - API documentation and user guides

## 🆘 Support

### Getting Help
1. Check the troubleshooting section above
2. Review server logs for error details
3. Run integration tests to identify issues
4. Check Supabase dashboard for database issues

### Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://reactjs.org/docs)
- [WebSocket Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

## 🎉 Congratulations!

Your AI Policy Engine is now ready for beta launch! The system matches Lovable's expected architecture and provides a solid foundation for your pharmaceutical AI governance platform.

**Happy Launching! 🚀**
