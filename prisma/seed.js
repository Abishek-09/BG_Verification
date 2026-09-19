// =====================================================================
// Background Verification System - Prisma Seed Script
// Populates sample seed records into PostgreSQL database
// =====================================================================

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:131006@localhost:5432/bg_verification?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEMO_ADMINS = [
  {
    company_name: 'NexGen Cloud Systems',
    username: 'admin_nexgen',
    email: 'admin@nexgen.com',
    password: 'password123',
    city: 'Chennai',
    state: 'Tamil Nadu'
  },
  {
    company_name: 'Tata Consultancy Services',
    username: 'admin_tcs',
    email: 'admin@tcs.com',
    password: 'password123',
    city: 'Mumbai',
    state: 'Maharashtra'
  },
  {
    company_name: 'Infosys Technologies',
    username: 'admin_infosys',
    email: 'admin@infosys.com',
    password: 'password123',
    city: 'Bengaluru',
    state: 'Karnataka'
  }
];

async function main() {
  console.log('🌱 Starting database seeding via Prisma...');

  // 1. Seed Demo Company Accounts & Settings
  for (const admin of DEMO_ADMINS) {
    const passwordHash = await bcrypt.hash(admin.password, 10);
    await prisma.companyAccount.upsert({
      where: { username: admin.username },
      update: {
        companyName: admin.company_name,
        email: admin.email,
        passwordHash: passwordHash,
        district: admin.city,
        state: admin.state
      },
      create: {
        companyName: admin.company_name,
        username: admin.username,
        email: admin.email,
        passwordHash: passwordHash,
        district: admin.city,
        state: admin.state,
        role: 'admin'
      }
    });

    await prisma.companySettings.upsert({
      where: { companyName: admin.company_name },
      update: {},
      create: {
        companyName: admin.company_name,
        shiftStartTime: '09:00:00',
        gracePeriodMinutes: 30
      }
    });
  }
  console.log('✅ Seeded demo company accounts (NexGen, TCS, Infosys).');

  // 2. Seed Departments
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

  const hrDept = await prisma.department.upsert({
    where: { name: 'Human Resources' },
    update: {},
    create: { name: 'Human Resources', status: 'active' }
  });

  // 3. Seed Roles
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

  const hrRole = await prisma.roles.upsert({
    where: { name: 'HR Specialist' },
    update: {},
    create: { name: 'HR Specialist', status: 'active' }
  });

  // 4. Helper to upsert PersonDetails safely without unique constraint on employeeCode
  async function upsertPersonDetail(personId, deptId, roleId, detailData) {
    const existing = await prisma.personDetails.findFirst({
      where: {
        OR: [
          { employeeCode: detailData.employeeCode },
          { personId: personId }
        ]
      }
    });

    const fullData = {
      personId: personId,
      personDeptId: deptId,
      personRoleId: roleId,
      ...detailData
    };

    if (existing) {
      return await prisma.personDetails.update({
        where: { id: existing.id },
        data: fullData
      });
    } else {
      return await prisma.personDetails.create({
        data: fullData
      });
    }
  }

  // 5. Seed Person 1 - Sarah Jenkins (EMP-001)
  const person1 = await prisma.person.upsert({
    where: { email: 'sarah.jenkins@techcorp.io' },
    update: {},
    create: {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@techcorp.io',
      status: 'verified'
    }
  });

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

  await upsertPersonDetail(person1.id, pDept1.id, pRole1.id, {
    mobile: '+91 98765 43210',
    companyName: 'NexGen Cloud Systems',
    barcodeData: '8f7d9a12-4b21-41e9-9e8c-300000000001',
    monthlySalary: 85000.00,
    totalExperience: '2 yrs 5 mos',
    startDate: new Date('2022-03-01'),
    endDate: null,
    employeeCode: 'EMP-001',
    biometricPin: '1234',
    accessPin: '1234',
    companyAddress: '100 Tech Highway, Cyber City, Chennai, India',
    personAddress: '742 Evergreen Terrace, Chennai, TN',
    status: 'verified',
    remarks: 'Promoted to Senior Team Lead in 2024.',
    paymentSlip: 'SalarySlip_Jan2026_SJenkins.pdf'
  });

  // 6. Seed Person 2 - Alexander Vance (EMP-009)
  const person2 = await prisma.person.upsert({
    where: { email: 'alex.vance@innovate.com' },
    update: {},
    create: {
      name: 'Alexander Vance',
      email: 'alex.vance@innovate.com',
      status: 'verified'
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

  await upsertPersonDetail(person2.id, pDept2.id, pRole2.id, {
    mobile: '+91 91234 56789',
    companyName: 'Tata Consultancy Services',
    barcodeData: '8f7d9a12-4b21-41e9-9e8c-300000000002',
    monthlySalary: 98000.00,
    totalExperience: '3 yrs 2 mos',
    startDate: new Date('2021-06-01'),
    endDate: null,
    employeeCode: 'EMP-009',
    biometricPin: '1234',
    accessPin: '1234',
    companyAddress: '500 Enterprise Way, HITEC City, Mumbai, India',
    personAddress: '100 Innovation Blvd, Mumbai, MH',
    status: 'verified',
    remarks: 'Maintains core cloud deployment infrastructure.',
    paymentSlip: 'SalarySlip_CloudScale_Alex.pdf'
  });

  // 7. Seed Person 3 - Deepak Raj (EMP-016)
  const person3 = await prisma.person.upsert({
    where: { email: 'deepak.raj@nexgen.com' },
    update: {},
    create: {
      name: 'Deepak Raj',
      email: 'deepak.raj@nexgen.com',
      status: 'verified'
    }
  });

  const pDept3 = await prisma.personDepartment.upsert({
    where: {
      uq_person_department: {
        personId: person3.id,
        departmentId: eng.id
      }
    },
    update: {},
    create: {
      personId: person3.id,
      departmentId: eng.id,
      status: 'active'
    }
  });

  const pRole3 = await prisma.personRoles.upsert({
    where: {
      uq_person_roles: {
        personId: person3.id,
        roleId: uiDev.id
      }
    },
    update: {},
    create: {
      personId: person3.id,
      roleId: uiDev.id,
      status: 'active'
    }
  });

  await upsertPersonDetail(person3.id, pDept3.id, pRole3.id, {
    mobile: '+91 94433 22110',
    companyName: 'NexGen Cloud Systems',
    barcodeData: '8f7d9a12-4b21-41e9-9e8c-300000000016',
    monthlySalary: 72000.00,
    totalExperience: '1 yr 8 mos',
    startDate: new Date('2023-01-15'),
    endDate: null,
    employeeCode: 'EMP-016',
    biometricPin: '1234',
    accessPin: '1234',
    companyAddress: '100 Tech Highway, Cyber City, Chennai, India',
    personAddress: '12 North Street, Chennai, TN',
    status: 'verified',
    remarks: 'Core Frontend & UI Developer.',
    paymentSlip: 'SalarySlip_DeepakRaj.pdf'
  });

  console.log('✅ Database successfully seeded with Company Accounts, Departments, Roles, and Employees!');
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

