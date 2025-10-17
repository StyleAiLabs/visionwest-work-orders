/**
 * Database Backup Script
 *
 * Purpose: Create a backup of the PostgreSQL database before running migrations
 * Usage: node scripts/backup-database.js
 *
 * This script is part of the Multi-Client Work Order Management feature
 * and should be run before executing any database migrations to ensure
 * data can be restored if migration fails.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Database configuration from environment variables
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_NAME = process.env.DB_NAME || 'visionwest_db';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || '';

// Backup directory
const BACKUP_DIR = path.join(__dirname, '../backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_FILE = path.join(BACKUP_DIR, `backup-${TIMESTAMP}.sql`);

console.log('=== Database Backup Script ===\n');

// Create backups directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  console.log(`Creating backup directory: ${BACKUP_DIR}`);
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

console.log(`Database: ${DB_NAME}`);
console.log(`Backup file: ${BACKUP_FILE}\n`);

try {
  console.log('Starting backup...');

  // Build pg_dump command
  // Using pg_dump with custom format for better compression and restore options
  const dumpCommand = `PGPASSWORD="${DB_PASSWORD}" pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -F c -f "${BACKUP_FILE}" ${DB_NAME}`;

  // Execute backup
  execSync(dumpCommand, { stdio: 'inherit' });

  // Check if backup file was created
  if (fs.existsSync(BACKUP_FILE)) {
    const stats = fs.statSync(BACKUP_FILE);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('\n✅ Backup completed successfully!');
    console.log(`   File: ${BACKUP_FILE}`);
    console.log(`   Size: ${fileSizeMB} MB`);
    console.log('\nTo restore this backup, run:');
    console.log(`   PGPASSWORD="${DB_PASSWORD}" pg_restore -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "${BACKUP_FILE}"`);

    process.exit(0);
  } else {
    throw new Error('Backup file was not created');
  }
} catch (error) {
  console.error('\n❌ Backup failed:', error.message);
  console.error('\nTroubleshooting:');
  console.error('1. Ensure PostgreSQL client tools (pg_dump) are installed');
  console.error('2. Verify database connection details in environment variables');
  console.error('3. Check database user has sufficient permissions');
  process.exit(1);
}
