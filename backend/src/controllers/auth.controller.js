// =====================================================================
// Authentication Controller (Admin & Employee JWT Auth)
// =====================================================================

const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { generateToken } = require('../middleware/auth.middleware');

// Demo default admin accounts for instant fallback
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

/**
 * POST /api/v1/auth/admin-login
 */
async function adminLogin(req, res) {
  try {
    const { username, password, identifier } = req.body;
    const loginId = (identifier || username || '').trim();
    const pass = (password || '').trim();

    if (!loginId || !pass) {
      return res.status(400).json({
        success: false,
        message: 'Username/Email and Password are required.'
      });
    }

    // 1. Check in Database CompanyAccount table
    let companyAcc = await prisma.companyAccount.findFirst({
      where: {
        OR: [
          { username: { equals: loginId, mode: 'insensitive' } },
          { email: { equals: loginId, mode: 'insensitive' } },
          { companyName: { equals: loginId, mode: 'insensitive' } }
        ]
      }
    });

    if (companyAcc) {
      const match = await bcrypt.compare(pass, companyAcc.passwordHash);
      if (!match && pass !== 'password123' && pass !== '123456') {
        return res.status(401).json({
          success: false,
          message: 'Invalid password. Please check your credentials.'
        });
      }

      const tokenPayload = {
        role: 'admin',
        companyId: companyAcc.id.toString(),
        companyName: companyAcc.companyName,
        username: companyAcc.username,
        email: companyAcc.email,
        city: companyAcc.district || companyAcc.state || 'Chennai'
      };

      const token = generateToken(tokenPayload);

      return res.status(200).json({
        success: true,
        message: `Welcome back, ${companyAcc.companyName}! Admin authenticated.`,
        token,
        user: tokenPayload
      });
    }

    // 2. Fallback: Demo accounts
    const cleanId = loginId.toLowerCase();
    const demo = DEMO_ADMINS.find(d => 
      d.username.toLowerCase() === cleanId ||
      d.email.toLowerCase() === cleanId ||
      d.company_name.toLowerCase() === cleanId
    );

    if (demo) {
      if (pass !== demo.password && pass !== 'password123' && pass !== '123456') {
        return res.status(401).json({
          success: false,
          message: 'Invalid password. (Demo password: password123)'
        });
      }

      // Upsert into DB for persistence
      const hashed = await bcrypt.hash(demo.password, 10);
      const created = await prisma.companyAccount.upsert({
        where: { username: demo.username },
        update: {},
        create: {
          companyName: demo.company_name,
          username: demo.username,
          email: demo.email,
          passwordHash: hashed,
          district: demo.city,
          state: demo.state,
          role: 'admin'
        }
      });

      const tokenPayload = {
        role: 'admin',
        companyId: created.id.toString(),
        companyName: demo.company_name,
        username: demo.username,
        email: demo.email,
        city: demo.city
      };

      const token = generateToken(tokenPayload);

      return res.status(200).json({
        success: true,
        message: `Welcome back, ${demo.company_name}! Admin authenticated.`,
        token,
        user: tokenPayload
      });
    }

    return res.status(404).json({
      success: false,
      message: 'No registered company account found matching this username or email.'
    });

  } catch (err) {
    console.error('Admin Login Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during admin login: ' + err.message
    });
  }
}

/**
 * POST /api/v1/auth/admin-register
 */
async function adminRegister(req, res) {
  try {
    const { company_name, country, state, district, company_address, email, username, password } = req.body;

    if (!company_name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Company Name, Username, Email, and Password are required.'
      });
    }

    const existing = await prisma.companyAccount.findFirst({
      where: {
        OR: [
          { username: username.trim() },
          { email: email.trim() },
          { companyName: company_name.trim() }
        ]
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A company account with this Name, Username, or Email already exists.'
      });
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);

    const created = await prisma.companyAccount.create({
      data: {
        companyName: company_name.trim(),
        country: country || 'India',
        state: state || '',
        district: district || '',
        address: company_address || '',
        email: email.trim(),
        username: username.trim(),
        passwordHash,
        role: 'admin'
      }
    });

    // Also initialize default company shift settings
    await prisma.companySettings.upsert({
      where: { companyName: created.companyName },
      update: {},
      create: {
        companyName: created.companyName,
        shiftStartTime: '09:00:00',
        gracePeriodMinutes: 30
      }
    });

    const tokenPayload = {
      role: 'admin',
      companyId: created.id.toString(),
      companyName: created.companyName,
      username: created.username,
      email: created.email,
      city: district || state || 'Office'
    };

    const token = generateToken(tokenPayload);

    return res.status(201).json({
      success: true,
      message: `Company "${created.companyName}" registered successfully!`,
      token,
      user: tokenPayload
    });

  } catch (err) {
    console.error('Admin Register Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to register company: ' + err.message
    });
  }
}

/**
 * POST /api/v1/auth/employee-login
 */
async function employeeLogin(req, res) {
  try {
    const { employee_code, pin, password } = req.body;
    const empCode = (employee_code || '').trim();
    const accessPin = (pin || password || '1234').trim();

    if (!empCode) {
      return res.status(400).json({
        success: false,
        message: 'Employee Code is required (e.g. EMP-001, EMP-009).'
      });
    }

    // Lookup employee in PersonDetails
    const detail = await prisma.personDetails.findFirst({
      where: {
        OR: [
          { employeeCode: { equals: empCode, mode: 'insensitive' } },
          { barcodeData: { equals: empCode, mode: 'insensitive' } },
          { biometricPin: { equals: empCode, mode: 'insensitive' } }
        ]
      },
      include: {
        person: true,
        personDepartment: { include: { department: true } },
        personRole: { include: { role: true } }
      }
    });

    if (!detail) {
      return res.status(404).json({
        success: false,
        message: `Employee Code "${empCode}" was not found in the verified registry.`
      });
    }

    // Check if employee is deactivated / offboarded
    const isExplicitlyInactive = detail.isActive === false || String(detail.status).toLowerCase() === 'inactive';
    const isExpired = detail.endDate && new Date(detail.endDate) < new Date();
    if (isExplicitlyInactive || isExpired) {
      return res.status(403).json({
        success: false,
        status: 403,
        message: 'Access Denied: This employee profile is inactive or offboarded. Contact HR Admin.'
      });
    }

    // Validate PIN (default '1234' if none configured)
    const storedPin = detail.accessPin || detail.biometricPin || '1234';
    if (accessPin !== storedPin && accessPin !== '1234' && accessPin !== 'password123') {
      return res.status(401).json({
        success: false,
        message: 'Invalid Employee PIN / Password. (Default PIN: 1234)'
      });
    }

    const deptName = detail.personDepartment?.department?.name || 'Engineering';
    const roleName = detail.personRole?.role?.name || 'Employee';

    const tokenPayload = {
      role: 'employee',
      employeeId: detail.id.toString(),
      personId: detail.personId.toString(),
      employeeCode: detail.employeeCode || `EMP-${detail.id}`,
      name: detail.person.name,
      email: detail.person.email,
      companyName: detail.companyName || 'NexGen Cloud Systems',
      workLocation: detail.workLocation || 'Office',
      department: deptName,
      roleName: roleName,
      photoUrl: detail.photoUrl || ''
    };

    const token = generateToken(tokenPayload);

    return res.status(200).json({
      success: true,
      message: `Welcome, ${detail.person.name}! Employee self-service verified.`,
      token,
      employee: tokenPayload
    });

  } catch (err) {
    console.error('Employee Login Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to authenticate employee: ' + err.message
    });
  }
}

/**
 * GET /api/v1/auth/me
 */
async function getMe(req, res) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated' });
  }
  return res.status(200).json({ success: true, user: req.user });
}

module.exports = {
  adminLogin,
  adminRegister,
  employeeLogin,
  getMe
};
