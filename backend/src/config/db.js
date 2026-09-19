// =====================================================================
// Background Verification System - Database Config (Prisma + PostgreSQL)
// =====================================================================

require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// Global BigInt serializer for JSON responses
BigInt.prototype.toJSON = function () {
  return Number(this);
};

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:sanjayabi1107@localhost:5432/bg_verification?schema=public';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = {
  prisma,
  pool
};
