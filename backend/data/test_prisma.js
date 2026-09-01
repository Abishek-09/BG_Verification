// Quick diagnostic to check Prisma queries
require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

BigInt.prototype.toJSON = function () { return Number(this); };

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  try {
    // Test 1: Simple findFirst on personDetails
    console.log('\n--- Test 1: findFirst personDetails ---');
    const detail = await prisma.personDetails.findFirst({
      where: { 
        OR: [
          { biometricPin: '1001' },
          { employeeCode: '1001' },
          { employeeCode: 'EMP-1001' }
        ]
      },
      include: {
        person: true,
        personDepartment: { include: { department: true } }
      }
    });
    console.log('Result:', JSON.stringify(detail, null, 2));
  } catch (err) {
    console.error('Test 1 FULL ERROR:', err.message);
    console.error('Code:', err.code);
  }

  try {
    // Test 2: Create attendance
    console.log('\n--- Test 2: create attendance ---');
    const att = await prisma.attendance.create({
      data: {
        personId: BigInt(1),
        employeeCode: 'EMP-1001',
        employeeName: 'Test User',
        department: 'Test Dept',
        punchTime: new Date(),
        punchDate: new Date(),
        verificationType: 'Fingerprint',
        deviceName: 'Test Device',
        terminalSn: 'TEST-SN',
        status: 'Present',
        workMode: 'Identix Biometric',
        notes: 'Test record'
      }
    });
    console.log('Created:', JSON.stringify(att, null, 2));

    // Clean up test record
    await prisma.attendance.delete({ where: { id: att.id } });
    console.log('Cleaned up test record');
  } catch (err) {
    console.error('Test 2 FULL ERROR:', err.message);
    console.error('Code:', err.code);
  }

  await prisma.$disconnect();
  await pool.end();
}

test();
