// =====================================================================
// Biometric Hardware ADMS Ingestion Gateway
// Handles: ZKTeco / Identix ADMS protocol push, identity resolution,
//          PostgreSQL persistence, Socket.IO real-time broadcast
// =====================================================================

const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');

// =====================================================================
// ADMS Verification Type Code → Human Label Mapping
// =====================================================================
const VERIFY_TYPE_MAP = {
  '0': 'Password',
  '1': 'Fingerprint',
  '2': 'Card/Badge',
  '4': 'Card/Badge',
  '9': 'Face Recognition',
  '15': 'Face Recognition'
};

function resolveVerifyType(code) {
  return VERIFY_TYPE_MAP[String(code)] || 'Biometric Hardware';
}

// =====================================================================
// Identity Resolution Engine
// Queries PostgreSQL person_details by biometric_pin or employee_code
// to resolve the hardware numeric PIN to a real employee record.
// =====================================================================
async function resolveEmployeeByPin(rawPin) {
  const cleanPin = String(rawPin || '').trim();
  const result = {
    personId: null,
    employeeName: `Employee (PIN: ${cleanPin})`,
    employeeCode: cleanPin,
    department: 'Software Solutions',
    matched: false
  };

  if (!cleanPin) return result;

  try {
    if (!prisma || !prisma.personDetails) return result;

    const unpaddedPin = cleanPin.replace(/^0+/, '');
    const searchConditions = [
      { biometricPin: cleanPin },
      { employeeCode: cleanPin },
      { employeeCode: cleanPin.toUpperCase() }
    ];

    if (unpaddedPin) {
      searchConditions.push({ biometricPin: unpaddedPin });
    }

    if (/^\d+$/.test(cleanPin)) {
      searchConditions.push({ employeeCode: `EMP-${cleanPin}` });
      searchConditions.push({ employeeCode: `EMP-${cleanPin.padStart(3, '0')}` });
      searchConditions.push({ employeeCode: `EMP-${cleanPin.padStart(4, '0')}` });
      searchConditions.push({ biometricPin: cleanPin.padStart(3, '0') });
      searchConditions.push({ biometricPin: cleanPin.padStart(4, '0') });

      try {
        const pId = BigInt(cleanPin);
        searchConditions.push({ personId: pId });
      } catch (e) {}
    }

    const detail = await prisma.personDetails.findFirst({
      where: { OR: searchConditions },
      include: {
        person: true,
        personDepartment: { include: { department: true } }
      }
    });

    if (detail && detail.person) {
      result.personId = detail.personId;
      result.employeeName = detail.person.name;
      result.employeeCode = detail.employeeCode || cleanPin;
      result.matched = true;

      if (detail.personDepartment && detail.personDepartment.department) {
        result.department = detail.personDepartment.department.name;
      } else if (detail.companyName) {
        result.department = detail.companyName;
      }
    }
  } catch (err) {
    console.warn(`[IDENTITY RESOLUTION] DB lookup failed for PIN "${cleanPin}":`, err.message);
  }

  return result;
}

// =====================================================================
// Attendance Persistence Engine
// Inserts verified attendance record into PostgreSQL with duplicate
// prevention via unique constraint on (person_id, punch_date, punch_time).
// =====================================================================
async function persistAttendanceRecord({
  personId,
  employeeCode,
  employeeName,
  department,
  punchTimestamp,
  verificationType,
  terminalSn
}) {
  let dbRecord = null;

  try {
    if (prisma && prisma.attendance) {
      dbRecord = await prisma.attendance.create({
        data: {
          personId: personId ? BigInt(personId) : null,
          employeeCode: employeeCode || 'EMP-UNKNOWN',
          employeeName: employeeName || 'Employee',
          department: department || 'Engineering',
          punchTime: punchTimestamp,
          punchDate: punchTimestamp,
          verificationType: verificationType || 'Biometric Fingerprint',
          deviceName: 'Identix™ K-Series Biometric Terminal',
          terminalSn: terminalSn || 'LIVE-TERMINAL',
          status: 'Present',
          workMode: 'Identix Biometric',
          notes: `Verified via ADMS live push from terminal ${terminalSn || 'Scanner'}`
        }
      });
    }
  } catch (err) {
    // Unique constraint violation = duplicate punch (already recorded)
    if (err.code === 'P2002' || (err.message && err.message.includes('Unique constraint'))) {
      console.log(`[ADMS] Duplicate punch skipped: ${employeeCode} @ ${punchTimestamp.toISOString()}`);
      return null;
    }
    console.warn('[ADMS] DB insert warning:', err.message);
  }

  return {
    id: dbRecord ? String(dbRecord.id) : `att-${Date.now()}`,
    personId: personId ? String(personId) : null,
    employeeCode: employeeCode || 'EMP-UNKNOWN',
    employeeName: employeeName || 'Employee',
    department: department || 'Engineering',
    punchTime: punchTimestamp.toISOString(),
    punchDate: punchTimestamp.toISOString().split('T')[0],
    verificationType: verificationType || 'Biometric Fingerprint',
    terminalSn: terminalSn || 'LIVE-TERMINAL',
    status: 'Present',
    workMode: 'Identix Biometric',
    isTest: false
  };
}

// =====================================================================
// In-memory punch buffer for live stream (last 50 punches)
// =====================================================================
let lastPunches = [];

function addToLiveBuffer(punchEntry) {
  lastPunches.unshift(punchEntry);
  if (lastPunches.length > 50) lastPunches.pop();
}

// =====================================================================
// ROUTE 1: ADMS GET Handshake — Device Configuration Request
// Device sends GET /iclock/cdata on boot to ask for server configuration.
// Must respond with ADMS config options or device will not push data.
// =====================================================================
router.get(['/cdata', '/iclock/cdata'], (req, res) => {
  return res.send('GET OPTION FROM: 1\nATTLOGstamp=None\nOPERLOGstamp=None\nREALTIME=1');
});

// =====================================================================
// ROUTE 2: ADMS POST — Attendance Log Push (Core Live Ingestion Gateway)
// Physical hardware scanner pushes tab-separated raw text in real time.
//
// Format per line:
//   [PIN]\t[YYYY-MM-DD HH:MM:SS]\t[Status]\t[VerifyType]\t[Workcode]\t[Reserved]
// =====================================================================
router.post(['/cdata', '/iclock/cdata'], async (req, res) => {
  const rawBody = typeof req.body === 'string' ? req.body : (req.body ? req.body.toString() : '');
  const terminalSn = req.query.SN || 'LIVE-TERMINAL-01';
  const table = req.query.table || '';

  // If this is not an ATTLOG push (e.g. heartbeat, OPERLOG, config), acknowledge and exit
  if (table && table.toUpperCase() !== 'ATTLOG') {
    return res.status(200).send('OK\n');
  }

  console.log(`[ADMS LIVE RECEIVED] SN=${terminalSn} table=${table} body="${rawBody.substring(0, 200)}"`);

  if (!rawBody || !rawBody.trim()) {
    return res.status(200).send('OK\n');
  }

  // Parse ALL lines in the payload (handles offline batch sync of 50+ punches)
  const lines = rawBody.trim().split('\n').filter(line => line.trim().length > 0);
  const io = req.app.get('io');

  for (const line of lines) {
    const parts = line.trim().split('\t');

    const rawPin = (parts[0] || '').trim();
    const timestampStr = (parts[1] || '').trim();
    const statusCode = (parts[2] || '0').trim();
    const verifyTypeCode = (parts[3] || '1').trim();

    if (!rawPin) {
      console.warn('[ADMS] Skipping line with empty PIN:', line);
      continue;
    }

    let punchTimestamp = new Date();
    if (timestampStr) {
      const parsed = new Date(timestampStr);
      if (!isNaN(parsed.getTime())) {
        punchTimestamp = parsed;
      }
    }

    const verificationType = resolveVerifyType(verifyTypeCode);

    // Step 1: Identity Resolution — resolve hardware PIN to employee record in Postgres
    const employee = await resolveEmployeeByPin(rawPin);

    // Step 2: Persist to PostgreSQL (with duplicate prevention)
    const savedRecord = await persistAttendanceRecord({
      personId: employee.personId,
      employeeCode: employee.employeeCode,
      employeeName: employee.employeeName,
      department: employee.department,
      punchTimestamp,
      verificationType,
      terminalSn
    });

    // Step 3: Build live stream punch entry
    const punchEntry = {
      id: savedRecord ? savedRecord.id : `idx-punch-${Date.now()}`,
      emp_code: employee.employeeCode,
      employee_name: employee.employeeName,
      department: employee.department,
      timestamp: punchTimestamp.toISOString(),
      verification_type: verificationType,
      device: 'Identix™ K-Series Biometric Terminal',
      is_test: false
    };

    addToLiveBuffer(punchEntry);

    // Step 4: Real-time WebSocket broadcast to all connected dashboards
    if (savedRecord && io) {
      io.emit('biometric:punch', {
        punch: punchEntry,
        dbRecord: savedRecord,
        isTest: false
      });
    }
  }

  // CRITICAL: Respond with exactly OK\n — devices freeze/resend infinitely otherwise
  return res.status(200).send('OK\n');
});

// =====================================================================
// ROUTE 3: ADMS GET — Device Request Polling
// =====================================================================
router.get(['/getrequest', '/iclock/getrequest'], (req, res) => {
  return res.send('OK');
});

// =====================================================================
// ROUTE 4: Retrieve live punch stream (in-memory buffer)
// =====================================================================
router.get('/identix/punches', (req, res) => {
  return res.json({
    success: true,
    data: lastPunches
  });
});

// =====================================================================
// ROUTE 5: Clear live punch stream / reset
// =====================================================================
router.post('/identix/clear-punches', async (req, res) => {
  lastPunches = [];
  return res.json({
    success: true,
    message: 'Live stream buffer cleared'
  });
});

// =====================================================================
// ROUTE 6: Retrieve persisted attendance records from PostgreSQL
// =====================================================================
router.get('/identix/attendance', async (req, res) => {
  let records = [];

  try {
    if (prisma && prisma.attendance) {
      records = await prisma.attendance.findMany({
        orderBy: { punchTime: 'desc' },
        take: 100
      });
    }
  } catch (err) {
    console.warn('[ATTENDANCE] DB query failed:', err.message);
  }

  if (!records || records.length === 0) {
    return res.json({ success: true, data: [] });
  }

  const formatted = records.map(r => ({
    id: String(r.id),
    employee_id: r.personId ? String(r.personId) : null,
    employee_name: r.employeeName,
    employee_code: r.employeeCode,
    department: r.department || 'Software Solutions',
    date: r.punchDate ? new Date(r.punchDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    check_in: r.punchTime ? new Date(r.punchTime).toTimeString().split(' ')[0].substring(0, 5) : '00:00',
    status: r.status || 'Present',
    work_mode: r.workMode || 'Identix Biometric',
    verification_type: r.verificationType || 'Biometric Hardware',
    terminal_sn: r.terminalSn || 'LIVE-TERMINAL',
    notes: r.notes || ''
  }));

  return res.json({ success: true, data: formatted });
});

// =====================================================================
// ROUTE 7: Device Status (lightweight status check)
// =====================================================================
router.get('/identix/status', (req, res) => {
  return res.json({
    success: true,
    data: {
      deviceName: 'Identix™ K-Series Biometric Terminal',
      connectionMode: 'ADMS / HTTP Webhook Push',
      maskedNetwork: 'Secured Subnet',
      firmwareVersion: 'Ver 6.60 (Identix-ZK)',
      admsEndpoint: '/iclock/cdata',
      lastPunchCount: lastPunches.length
    }
  });
});

module.exports = router;
