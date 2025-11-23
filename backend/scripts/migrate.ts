// scripts/migrate.ts
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env' });

const connectionString = process.env.DATABASE_CONNECTION_STRING;

if (!connectionString) {
  console.error('❌ DATABASE_CONNECTION_STRING environment variable not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined
});

async function migrate() {
  console.log('🚀 Starting database migration...\n');

  const client = await pool.connect();

  try {
    // Ensure schema_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get current version
    const result = await client.query(`
      SELECT COALESCE(MAX(version), 0) as version 
      FROM schema_migrations
    `);
    const currentVersion = result.rows[0].version;

    console.log(`📊 Current schema version: ${currentVersion}\n`);

    // Get migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('⚠️  No migration files found');
      return;
    }

    let appliedCount = 0;

    // Run pending migrations
    for (const file of files) {
      const versionMatch = file.match(/^(\d+)_/);
      if (!versionMatch) {
        console.log(`⚠️  Skipping invalid filename: ${file}`);
        continue;
      }

      const version = parseInt(versionMatch[1]);
      const name = file.replace(/^\d+_/, '').replace('.sql', '');

      if (version > currentVersion) {
        console.log(`📝 Applying migration ${version}: ${name}`);

        const sql = fs.readFileSync(
          path.join(migrationsDir, file),
          'utf8'
        );

        // Extract only UP migration (before DOWN comment)
        const upMigration = sql.split('-- DOWN MIGRATION')[0];

        try {
          await client.query('BEGIN');
          await client.query(upMigration);
          await client.query('COMMIT');

          console.log(`✅ Migration ${version} applied successfully\n`);
          appliedCount++;

        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`❌ Migration ${version} failed:`, error);
          throw error;
        }
      }
    }

    if (appliedCount === 0) {
      console.log('✨ Database is up to date');
    } else {
      console.log(`✨ Applied ${appliedCount} migration(s) successfully`);
    }

    // Show final version
    const finalResult = await client.query(`
      SELECT version, name, applied_at 
      FROM schema_migrations 
      ORDER BY version
    `);

    console.log('\n📋 Migration history:');
    finalResult.rows.forEach(row => {
      const date = new Date(row.applied_at).toISOString().split('T')[0];
      console.log(`   ${row.version}. ${row.name} (${date})`);
    });

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);

  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
