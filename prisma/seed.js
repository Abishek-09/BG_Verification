// =====================================================================
// Background Verification System - Prisma Seed Script
// Populates sample seed records into PostgreSQL database
// =====================================================================

require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:sanjayabi1107@localhost:5432/bg_verification?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding via Prisma...');

  // 1. Seed Departments
  const eng = await prisma.department.upsert({
    where: { name: 'Software Engineering' },
    update: {},
    create: { name: 'Software Engineering', status: 'active' }
  });

  const pd = await prisma.department.upsert({
    where: { name: 'Product & Design' },
    update: {},
    create: { name: 'Product & Design', status: 'active' }
  });

  const devopsDept = await prisma.department.upsert({
    where: { name: 'Cloud Infrastructure & DevOps' },
    update: {},
    create: { name: 'Cloud Infrastructure & DevOps', status: 'active' }
  });

  // 2. Seed Roles
  const leadDev = await prisma.roles.upsert({
    where: { name: 'Lead Frontend Developer' },
    update: {},
    create: { name: 'Lead Frontend Developer', status: 'active' }
  });

  const uiDev = await prisma.roles.upsert({
    where: { name: 'UI/UX Developer' },
    update: {},
    create: { name: 'UI/UX Developer', status: 'active' }
  });

  const devopsRole = await prisma.roles.upsert({
    where: { name: 'DevOps & Systems Architect' },
    update: {},
    create: { name: 'DevOps & Systems Architect', status: 'active' }
  });

  // 3. Seed Persons
  const person1 = await prisma.person.upsert({
    where: { email: 'sarah.jenkins@techcorp.io' },
    update: {},
    create: {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@techcorp.io',
      status: 'verified'
    }
  });

  const person2 = await prisma.person.upsert({
    where: { email: 'alex.vance@innovate.com' },
    update: {},
    create: {
      name: 'Alexander Vance',
      email: 'alex.vance@innovate.com',
      status: 'verified'
    }
  });

  // 4. Assign Person to Departments
  const pDept1 = await prisma.personDepartment.upsert({
    where: {
      uq_person_department: {
        personId: person1.id,
        departmentId: eng.id
      }
    },
    update: {},
    create: {
      personId: person1.id,
      departmentId: eng.id,
      status: 'active'
    }
  });

  const pDept2 = await prisma.personDepartment.upsert({
    where: {
      uq_person_department: {
        personId: person2.id,
        departmentId: devopsDept.id
      }
    },
    update: {},
    create: {
      personId: person2.id,
      departmentId: devopsDept.id,
      status: 'active'
    }
  });

  // 5. Assign Person to Roles
  const pRole1 = await prisma.personRoles.upsert({
    where: {
      uq_person_roles: {
        personId: person1.id,
        roleId: leadDev.id
      }
    },
    update: {},
    create: {
      personId: person1.id,
      roleId: leadDev.id,
      status: 'active'
    }
  });

  const pRole2 = await prisma.personRoles.upsert({
    where: {
      uq_person_roles: {
        personId: person2.id,
        roleId: devopsRole.id
      }
    },
    update: {},
    create: {
      personId: person2.id,
      roleId: devopsRole.id,
      status: 'active'
    }
  });

  // 6. Seed Person Details
  await prisma.personDetails.create({
    data: {
      personId: person1.id,
      mobile: '+91 98765 43210',
      companyName: 'Apex Global Solutions',
      barcodeData: '8f7d9a12-4b21-41e9-9e8c-300000000001',
      monthlySalary: 85000.00,
      totalExperience: '2 yrs 5 mos',
      startDate: new Date('2022-03-01'),
      endDate: null,
      personDeptId: pDept1.id,
      personRoleId: pRole1.id,
      employeeCode: 'EMP-1001',
      companyAddress: '100 Tech Highway, Cyber City, Gurugram, India',
      personAddress: '742 Evergreen Terrace, Springfield, OR 97477',
      status: 'verified',
      remarks: 'Promoted to Senior Team Lead in 2024.',
      paymentSlip: 'SalarySlip_Jan2026_SJenkins.pdf'
    }
  });

  await prisma.personDetails.create({
    data: {
      personId: person2.id,
      mobile: '+91 91234 56789',
      companyName: 'CloudScale Dynamics',
      barcodeData: '8f7d9a12-4b21-41e9-9e8c-300000000002',
      monthlySalary: 98000.00,
      totalExperience: '3 yrs 2 mos',
      startDate: new Date('2021-06-01'),
      endDate: null,
      personDeptId: pDept2.id,
      personRoleId: pRole2.id,
      employeeCode: 'EMP-1002',
      companyAddress: '500 Enterprise Way, HITEC City, Hyderabad, India',
      personAddress: '100 Innovation Blvd, Tech City, CA 94016',
      status: 'verified',
      remarks: 'Maintains core cloud deployment infrastructure.',
      paymentSlip: 'SalarySlip_CloudScale_Alex.pdf'
    }
  });

  console.log('✅ Database successfully seeded with PersonDetails records!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
