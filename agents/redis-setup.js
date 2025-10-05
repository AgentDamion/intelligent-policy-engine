/**
 * Redis Setup and Configuration Script
 * 
 * This script helps set up Redis for the enhanced caching system
 * and provides fallback configuration for development environments
 */

const fs = require('fs');
const path = require('path');

class RedisSetup {
    constructor() {
        this.redisConfig = {
            development: {
                host: 'localhost',
                port: 6379,
                password: null,
                db: 0,
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3
            },
            production: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT) || 6379,
                password: process.env.REDIS_PASSWORD || null,
                db: parseInt(process.env.REDIS_DB) || 0,
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3
            }
        };
    }

    /**
     * Check if Redis is available
     */
    async checkRedisAvailability() {
        try {
            const redis = require('redis');
            const client = redis.createClient(this.redisConfig.development);
            
            await client.connect();
            await client.ping();
            await client.quit();
            
            console.log('✅ Redis is available and responding');
            return true;
        } catch (error) {
            console.log('⚠️ Redis is not available:', error.message);
            return false;
        }
    }

    /**
     * Install Redis dependencies
     */
    installRedisDependencies() {
        console.log('📦 Installing Redis dependencies...');
        
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        let packageJson;
        
        try {
            packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        } catch (error) {
            console.error('❌ Could not read package.json:', error.message);
            return false;
        }
        
        // Add Redis dependency if not present
        if (!packageJson.dependencies || !packageJson.dependencies.redis) {
            if (!packageJson.dependencies) {
                packageJson.dependencies = {};
            }
            
            packageJson.dependencies.redis = '^4.6.0';
            
            try {
                fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
                console.log('✅ Added Redis dependency to package.json');
                console.log('📝 Run "npm install" to install Redis');
                return true;
            } catch (error) {
                console.error('❌ Could not update package.json:', error.message);
                return false;
            }
        } else {
            console.log('✅ Redis dependency already present in package.json');
            return true;
        }
    }

    /**
     * Create Redis configuration file
     */
    createRedisConfig() {
        const configPath = path.join(process.cwd(), 'agents', 'redis-config.json');
        
        const config = {
            environments: this.redisConfig,
            cacheSettings: {
                defaultTTL: 300000, // 5 minutes
                maxMemorySize: 1000,
                cleanupInterval: 60000, // 1 minute
                enableCompression: true,
                compressionThreshold: 1024 // 1KB
            },
            monitoring: {
                enableMetrics: true,
                slowQueryThreshold: 100, // ms
                alertThresholds: {
                    memoryUsage: 0.8, // 80%
                    responseTime: 1000, // 1 second
                    errorRate: 0.1 // 10%
                }
            }
        };
        
        try {
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log('✅ Created Redis configuration file:', configPath);
            return true;
        } catch (error) {
            console.error('❌ Could not create Redis config:', error.message);
            return false;
        }
    }

    /**
     * Create Docker Compose file for Redis
     */
    createDockerCompose() {
        const dockerComposeContent = `version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: aicomplyr-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  redis_data:
    driver: local
`;

        const dockerComposePath = path.join(process.cwd(), 'docker-compose.redis.yml');
        
        try {
            fs.writeFileSync(dockerComposePath, dockerComposeContent);
            console.log('✅ Created Docker Compose file for Redis:', dockerComposePath);
            console.log('📝 Run "docker-compose -f docker-compose.redis.yml up -d" to start Redis');
            return true;
        } catch (error) {
            console.error('❌ Could not create Docker Compose file:', error.message);
            return false;
        }
    }

    /**
     * Create Redis connection test script
     */
    createConnectionTest() {
        const testScript = `/**
 * Redis Connection Test Script
 */

const AdvancedCacheService = require('./advanced-cache-service');

async function testRedisConnection() {
    console.log('🧪 Testing Redis Connection...');
    
    try {
        const cacheService = new AdvancedCacheService({
            redisHost: 'localhost',
            redisPort: 6379,
            enableMetrics: true
        });
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test basic operations
        console.log('📝 Testing cache operations...');
        
        // Set a test value
        const setResult = await cacheService.set('test-key', { message: 'Hello Redis!' }, 60000);
        console.log('Set result:', setResult);
        
        // Get the test value
        const getResult = await cacheService.get('test-key');
        console.log('Get result:', getResult);
        
        // Test multiple operations
        const msetResult = await cacheService.mset([
            { key: 'key1', value: 'value1' },
            { key: 'key2', value: 'value2' }
        ], 60000);
        console.log('MSet result:', msetResult);
        
        const mgetResult = await cacheService.mget(['key1', 'key2', 'nonexistent']);
        console.log('MGet result:', mgetResult);
        
        // Get statistics
        const stats = cacheService.getStats();
        console.log('Cache statistics:', stats);
        
        console.log('✅ Redis connection test completed successfully!');
        
        await cacheService.close();
        
    } catch (error) {
        console.error('❌ Redis connection test failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    testRedisConnection();
}

module.exports = { testRedisConnection };
`;

        const testPath = path.join(process.cwd(), 'agents', 'redis-connection-test.js');
        
        try {
            fs.writeFileSync(testPath, testScript);
            console.log('✅ Created Redis connection test script:', testPath);
            console.log('📝 Run "node agents/redis-connection-test.js" to test Redis connection');
            return true;
        } catch (error) {
            console.error('❌ Could not create test script:', error.message);
            return false;
        }
    }

    /**
     * Create environment variables template
     */
    createEnvTemplate() {
        const envContent = `# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Cache Configuration
CACHE_DEFAULT_TTL=300000
CACHE_MAX_MEMORY_SIZE=1000
CACHE_CLEANUP_INTERVAL=60000

# Performance Monitoring
ENABLE_CACHE_METRICS=true
CACHE_SLOW_QUERY_THRESHOLD=100
CACHE_ALERT_MEMORY_THRESHOLD=0.8
CACHE_ALERT_RESPONSE_TIME_THRESHOLD=1000
CACHE_ALERT_ERROR_RATE_THRESHOLD=0.1
`;

        const envPath = path.join(process.cwd(), '.env.redis');
        
        try {
            fs.writeFileSync(envPath, envContent);
            console.log('✅ Created Redis environment template:', envPath);
            console.log('📝 Copy to .env and configure your Redis settings');
            return true;
        } catch (error) {
            console.error('❌ Could not create env template:', error.message);
            return false;
        }
    }

    /**
     * Run complete Redis setup
     */
    async setupRedis() {
        console.log('🚀 Redis Setup for Enhanced Caching System');
        console.log('=' .repeat(50));
        
        // Check if Redis is available
        const redisAvailable = await this.checkRedisAvailability();
        
        if (!redisAvailable) {
            console.log('\n📋 Redis Setup Steps:');
            console.log('1. Install Redis dependencies');
            this.installRedisDependencies();
            
            console.log('\n2. Create configuration files');
            this.createRedisConfig();
            this.createDockerCompose();
            this.createConnectionTest();
            this.createEnvTemplate();
            
            console.log('\n3. Start Redis server:');
            console.log('   Option A: Install Redis locally');
            console.log('   Option B: Use Docker: docker-compose -f docker-compose.redis.yml up -d');
            
            console.log('\n4. Test connection:');
            console.log('   node agents/redis-connection-test.js');
            
        } else {
            console.log('\n✅ Redis is already set up and working!');
            console.log('📊 Testing cache service...');
            
            // Test the cache service
            const AdvancedCacheService = require('./advanced-cache-service');
            const cacheService = new AdvancedCacheService();
            
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const stats = cacheService.getStats();
            console.log('Cache service stats:', stats);
            
            await cacheService.close();
        }
        
        console.log('\n🎉 Redis setup complete!');
        console.log('💡 The enhanced caching system will automatically fall back to memory cache if Redis is unavailable.');
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    const setup = new RedisSetup();
    setup.setupRedis().catch(console.error);
}

module.exports = RedisSetup;