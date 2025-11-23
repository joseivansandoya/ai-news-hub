import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...')
    
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log('📅 Server time:', result.rows[0].now);
    
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
