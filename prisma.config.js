require('dotenv').config();
const { defineConfig } = require('@prisma/config');

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:131006@localhost:5432/bg_verification?schema=public',
  },
});
