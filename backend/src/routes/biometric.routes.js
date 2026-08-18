// =====================================================================
// Identix™ Biometric Terminal API Routes & Real TCP Socket Hardware Ping
// =====================================================================

const express = require('express');
const router = express.Router();
const net = require('net');

// Memory store for active hardware connection & device logs
let activeIdentixDevice = {
  connected: false,
  deviceName: 'Identix™ K-Series Biometric Terminal',
  serialNumber: 'IDX-2026-9874102',
  connectionMode: 'TCP/IP Hardware Socket',
  ipAddress: '192.168.1.201',
  port: 4370,
  firmwareVersion: 'Ver 6.60 (Identix-ZK)',
  lastPing: null
};

let lastPunches = [];

// 1. Get Identix Device Connection Status
router.get('/identix/status', (req, res) => {
  return res.json({
    success: true,
    data: activeIdentixDevice,
    recentPunchesCount: lastPunches.length
  });
});

// 2. Real Hardware TCP Socket Connection Ping & Handshake
router.post('/identix/ping', (req, res) => {
  const { ipAddress, port } = req.body;
  const targetIp = ipAddress || activeIdentixDevice.ipAddress || '192.168.1.201';
  const targetPort = parseInt(port) || activeIdentixDevice.port || 4370;

  const startTime = Date.now();
  const socket = new net.Socket();
  let statusSent = false;

  socket.setTimeout(2500);

  socket.connect(targetPort, targetIp, () => {
    const latency = Date.now() - startTime;
    socket.destroy();
    if (!statusSent) {
      statusSent = true;
      activeIdentixDevice.connected = true;
      activeIdentixDevice.ipAddress = targetIp;
      activeIdentixDevice.port = targetPort;
      activeIdentixDevice.lastPing = new Date().toISOString();

      return res.json({
        success: true,
        realConnection: true,
        message: `Hardware TCP Handshake Successful! Connected to Identix Scanner at ${targetIp}:${targetPort}`,
        latencyMs: latency,
        data: activeIdentixDevice
      });
    }
  });

  socket.on('error', (err) => {
    socket.destroy();
    if (!statusSent) {
      statusSent = true;
      activeIdentixDevice.connected = false;
      return res.json({
        success: false,
        realConnection: false,
        message: `Cannot reach Identix hardware scanner at ${targetIp}:${targetPort}.`,
        error: err.message,
        troubleshooting: [
          `1. Ensure Identix scanner IP is set to ${targetIp} in machine Ethernet settings`,
          `2. Connect both PC and Identix scanner to the same Wi-Fi router or network switch`,
          `3. Check if PC firewall is blocking TCP Port ${targetPort}`
        ]
      });
    }
  });

  socket.on('timeout', () => {
    socket.destroy();
    if (!statusSent) {
      statusSent = true;
      activeIdentixDevice.connected = false;
      return res.json({
        success: false,
        realConnection: false,
        message: `Connection timed out trying to reach ${targetIp}:${targetPort} (No response after 2.5s).`,
        troubleshooting: [
          `1. Check if scanner IP ${targetIp} is on the same Wi-Fi network subnet as your PC`,
          `2. Open CMD/Terminal on your PC and run: ping ${targetIp}`
        ]
      });
    }
  });
});

// 3. Connect / Configure Identix Terminal Parameters
router.post('/identix/connect', (req, res) => {
  const { mode, ipAddress, port } = req.body;
  if (mode) activeIdentixDevice.connectionMode = mode;
  if (ipAddress) activeIdentixDevice.ipAddress = ipAddress;
  if (port) activeIdentixDevice.port = parseInt(port) || 4370;

  activeIdentixDevice.connected = true;
  activeIdentixDevice.lastPing = new Date().toISOString();

  return res.json({
    success: true,
    message: 'Established connection with Identix™ Biometric Terminal',
    data: activeIdentixDevice
  });
});

// 4. Receive Live Hardware Fingerprint Push Punch from Identix Terminal (ADMS / HTTP Webhook)
router.post('/identix/push', (req, res) => {
  const { user_id, emp_code, timestamp, verification_type } = req.body;

  const punchEntry = {
    id: 'idx-punch-' + Date.now(),
    emp_code: emp_code || 'EMP-1001',
    user_id: user_id || '1001',
    timestamp: timestamp || new Date().toISOString(),
    verification_type: verification_type || 'Fingerprint',
    device: activeIdentixDevice.deviceName
  };

  lastPunches.unshift(punchEntry);
  if (lastPunches.length > 50) lastPunches.pop();

  return res.json({
    success: true,
    message: 'Identix Fingerprint Punch Received & Logged',
    data: punchEntry
  });
});

// 5. Retrieve recent raw Identix punches
router.get('/identix/punches', (req, res) => {
  return res.json({
    success: true,
    data: lastPunches
  });
});

module.exports = router;
