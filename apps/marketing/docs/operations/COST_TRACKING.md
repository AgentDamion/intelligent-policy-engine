# Cost Tracking & Budget Management

**Project**: aicomply.io  
**Last Updated**: 2025-01-15

---

## Monthly Monitoring Costs

| Service | Plan | Monthly Cost | Annual Cost | Notes |
|---------|------|--------------|-------------|-------|
| Sentry | Team | $26 | $312 | 50K errors/month, session replay |
| Logtail | Pro | $16 | $192 | 5GB logs/month, 30-day retention |
| UptimeRobot | Pro | $20 | $240 | 50 monitors, 1-min intervals |
| **Total** | | **$62/month** | **$744/year** | |

---

## Infrastructure Costs

| Service | Plan | Monthly Cost | Annual Cost | Notes |
|---------|------|--------------|-------------|-------|
| Supabase | Pro | $25 | $300 | 8GB database, 100GB bandwidth |
| OpenAI API | Pay-as-you-go | ~$150 | ~$1,800 | Varies by usage |
| Cloudflare | Free | $0 | $0 | CDN + DDoS protection |
| **Total** | | **~$175/month** | **~$2,100/year** | |

---

## Total Monthly Budget

**Grand Total**: ~$237/month (~$2,844/year)

---

## Cost Optimization Opportunities

1. **Sentry**: Downgrade to Developer plan ($0) if <5K errors/month
2. **Logtail**: Use free tier ($0) if <1GB logs/month
3. **UptimeRobot**: Use free tier ($0) for 5-min check intervals
4. **OpenAI**: Switch to GPT-3.5 for non-critical operations (~40% savings)

**Potential Savings**: Up to $42/month ($504/year)

---

## Changelog

- **2025-01-15**: Initial cost tracking document created
- **Phase 1**: Monitoring tools configured (Sentry, Logtail, UptimeRobot)
- **Phase 2**: Security hardening completed (MFA, RLS tests, rate limiting)

---

## Related Documentation

- [Production Monitoring Guide](./PRODUCTION_MONITORING.md)
- [Security Hardening Guide](./SECURITY_HARDENING.md)
