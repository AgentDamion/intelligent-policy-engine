// Refresh Materialized Views Script
// File: database/scripts/refresh-materialized-views.js
// Can be run via cron or job queue to refresh dashboard views

const db = require('../connection');

async function refreshAllViews() {
    const startTime = Date.now();
    
    try {
        console.log('Refreshing all materialized views...');
        
        await db.query('SELECT refresh_all_dashboard_views()');
        
        const duration = Date.now() - startTime;
        console.log(`Successfully refreshed all views in ${duration}ms`);
        
        return { success: true, duration };
    } catch (error) {
        console.error('Error refreshing materialized views:', error);
        throw error;
    }
}

async function refreshEnterpriseDashboard(enterpriseId) {
    const startTime = Date.now();
    
    try {
        console.log(`Refreshing enterprise dashboard for ${enterpriseId}...`);
        
        await db.query('SELECT refresh_enterprise_dashboard($1)', [enterpriseId]);
        
        const duration = Date.now() - startTime;
        console.log(`Successfully refreshed enterprise dashboard in ${duration}ms`);
        
        return { success: true, duration };
    } catch (error) {
        console.error('Error refreshing enterprise dashboard:', error);
        throw error;
    }
}

async function refreshPartnerDashboard(partnerId) {
    const startTime = Date.now();
    
    try {
        console.log(`Refreshing partner dashboard for ${partnerId}...`);
        
        await db.query('SELECT refresh_partner_dashboard($1)', [partnerId]);
        
        const duration = Date.now() - startTime;
        console.log(`Successfully refreshed partner dashboard in ${duration}ms`);
        
        return { success: true, duration };
    } catch (error) {
        console.error('Error refreshing partner dashboard:', error);
        throw error;
    }
}

// If run directly, refresh all views
if (require.main === module) {
    refreshAllViews()
        .then(() => {
            console.log('Refresh complete');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Refresh failed:', error);
            process.exit(1);
        });
}

module.exports = {
    refreshAllViews,
    refreshEnterpriseDashboard,
    refreshPartnerDashboard
};

