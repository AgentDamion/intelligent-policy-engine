require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Use Railway's DATABASE_URL directly - no local setup needed
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found. Make sure you have Railway env vars.');
  process.exit(1);
}

const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false } // Required for Railway
});

// Create migrations table to track which migrations have been run
async function createMigrationsTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT NOW(),
      checksum VARCHAR(255)
    );
  `;
  
  try {
    await pool.query(createTableSQL);
    console.log('✅ Migrations table ready');
  } catch (err) {
    console.error('❌ Failed to create migrations table:', err);
    throw err;
  }
}

// Get list of executed migrations
async function getExecutedMigrations() {
  try {
    const result = await pool.query('SELECT filename FROM migrations ORDER BY id');
    return result.rows.map(row => row.filename);
  } catch (err) {
    console.error('❌ Failed to get executed migrations:', err);
    return [];
  }
}

// Mark migration as executed
async function markMigrationExecuted(filename, checksum) {
  try {
    await pool.query(
      'INSERT INTO migrations (filename, checksum) VALUES ($1, $2)',
      [filename, checksum]
    );
  } catch (err) {
    console.error('❌ Failed to mark migration as executed:', err);
    throw err;
  }
}

// Calculate checksum for migration file
function calculateChecksum(content) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(content).digest('hex');
}

// Get all migration files in numerical order
function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('📁 Creating migrations directory...');
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql') && !file.includes('_down'))
    .sort((a, b) => {
      // Extract numbers from filenames for proper numerical sorting
      const numA = parseInt(a.match(/^(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/^(\d+)/)?.[1] || '0');
      return numA - numB;
    });
  
  return files.map(filename => ({
    filename,
    path: path.join(migrationsDir, filename)
  }));
}

// Main migration function
async function migrate() {
  try {
    console.log('🚀 Starting Railway database migration...');
    
    // Create migrations tracking table
    await createMigrationsTable();
    
    // Get list of already executed migrations
    const executedMigrations = await getExecutedMigrations();
    
    // Get all migration files in numerical order
    const migrationFiles = getMigrationFiles();
    
    console.log(`📋 Found ${migrationFiles.length} migration files`);
    
    if (migrationFiles.length === 0) {
      console.log('⚠️  No migration files found in database/migrations/');
      console.log('💡 Add your .sql files to database/migrations/ with names like:');
      console.log('   001_create_tables.sql');
      console.log('   002_add_columns.sql');
      console.log('   003_add_indexes.sql');
      return;
    }
    
    let executedCount = 0;
    
    for (const migration of migrationFiles) {
      // Skip if already executed
      if (executedMigrations.includes(migration.filename)) {
        console.log(`⏭️  Skipping ${migration.filename} (already executed)`);
        continue;
      }
      
      console.log(`🔄 Executing ${migration.filename}...`);
      
      try {
        // Read and execute migration
        const sql = fs.readFileSync(migration.path, 'utf8');
        const checksum = calculateChecksum(sql);
        
        // Execute the migration
        await pool.query(sql);
        
        // Mark as executed
        await markMigrationExecuted(migration.filename, checksum);
        
        console.log(`✅ Executed ${migration.filename}`);
        executedCount++;
      } catch (err) {
        console.error(`❌ Failed to execute ${migration.filename}:`, err.message);
        throw err;
      }
    }
    
    if (executedCount === 0) {
      console.log('✅ All migrations are up to date!');
    } else {
      console.log(`✅ Successfully executed ${executedCount} migration(s)!`);
    }
    
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Rollback function
async function rollback() {
  try {
    console.log('🔄 Starting migration rollback...');
    
    const executedMigrations = await getExecutedMigrations();
    
    if (executedMigrations.length === 0) {
      console.log('✅ No migrations to rollback');
      return;
    }
    
    // Get the last executed migration
    const lastMigration = executedMigrations[executedMigrations.length - 1];
    const downFile = lastMigration.replace('.sql', '_down.sql');
    const downPath = path.join(__dirname, 'migrations', downFile);
    
    if (!fs.existsSync(downPath)) {
      console.error(`❌ Rollback file not found: ${downFile}`);
      console.log('💡 Create a rollback file with the same name plus "_down" suffix');
      console.log(`   Example: ${lastMigration} → ${downFile}`);
      process.exit(1);
    }
    
    console.log(`🔄 Rolling back ${lastMigration}...`);
    
    try {
      // Execute rollback
      const sql = fs.readFileSync(downPath, 'utf8');
      await pool.query(sql);
      
      // Remove from executed migrations
      await pool.query('DELETE FROM migrations WHERE filename = $1', [lastMigration]);
      
      console.log(`✅ Successfully rolled back ${lastMigration}`);
    } catch (err) {
      console.error(`❌ Failed to rollback ${lastMigration}:`, err.message);
      throw err;
    }
    
  } catch (err) {
    console.error('❌ Rollback failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Status function
async function status() {
  try {
    console.log('📊 Migration Status:');
    console.log('==================');
    
    const executedMigrations = await getExecutedMigrations();
    const migrationFiles = getMigrationFiles();
    
    if (migrationFiles.length === 0) {
      console.log('⚠️  No migration files found');
      return;
    }
    
    for (const migration of migrationFiles) {
      const isExecuted = executedMigrations.includes(migration.filename);
      const status = isExecuted ? '✅ Executed' : '⏳ Pending';
      console.log(`${status} - ${migration.filename}`);
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total files: ${migrationFiles.length}`);
    console.log(`   Executed: ${executedMigrations.length}`);
    console.log(`   Pending: ${migrationFiles.length - executedMigrations.length}`);
    
  } catch (err) {
    console.error('❌ Status check failed:', err);
  } finally {
    await pool.end();
  }
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'rollback':
    rollback();
    break;
  case 'status':
    status();
    break;
  case 'migrate':
  default:
    migrate();
    break;
}