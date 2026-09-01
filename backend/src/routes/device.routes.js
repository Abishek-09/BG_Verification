// =====================================================================
// Device Service Routes
// Handles: TCP connection verification for physical biometric hardware
// Security: All raw IPs/ports are masked in client responses
// =====================================================================

const express = require('express');
const router = express.Router();
const net = require('net');

// =====================================================================
// POST /api/v1/devices/verify-connection
// Active TCP Socket Handshake — tests real reachability of a physical
// biometric scanner on the local network.
//
// Request body: { ipAddress: "192.168.1.201", port: 4370 }
// Response: { status: "CONNECTED" | "UNREACHABLE", maskedNetwork: "Secured Subnet" }
//
// Security: Raw IP and port are NEVER exposed in the response.
// =====================================================================
router.post('/verify-connection', (req, res) => {
  const { ipAddress, port } = req.body || {};

  if (!ipAddress || !port) {
    return res.status(400).json({
      success: false,
      status: 'INVALID',
      message: 'Both IP address and TCP port are required.',
      maskedNetwork: 'Secured Subnet'
    });
  }

  const targetIp = String(ipAddress).trim();
  const targetPort = parseInt(port) || 4370;
  const startTime = Date.now();
  const socket = new net.Socket();
  let responded = false;

  // 3-second timeout for TCP handshake
  socket.setTimeout(3000);

  socket.connect(targetPort, targetIp, () => {
    const latencyMs = Date.now() - startTime;
    socket.destroy();

    if (!responded) {
      responded = true;
      return res.json({
        success: true,
        status: 'CONNECTED',
        message: 'Hardware TCP handshake successful. Biometric terminal is reachable on the secured network.',
        latencyMs,
        maskedNetwork: 'Secured Subnet',
        deviceInfo: {
          deviceName: 'Identix™ K-Series Biometric Terminal',
          protocol: 'ADMS / TCP Push',
          firmwareVersion: 'Ver 6.60 (Identix-ZK)'
        }
      });
    }
  });

  socket.on('error', (err) => {
    socket.destroy();
    if (!responded) {
      responded = true;
      return res.json({
        success: false,
        status: 'UNREACHABLE',
        message: 'Cannot reach the biometric terminal. The device may be powered off, disconnected, or on a different network subnet.',
        maskedNetwork: 'Secured Subnet',
        troubleshooting: [
          'Ensure the biometric terminal is powered on and the screen is active.',
          'Verify both PC and scanner are connected to the same local network / Wi-Fi router.',
          'Check if your PC firewall is blocking the TCP connection port.',
          'Open Command Prompt and run: ping [device-ip] to test basic network reach.'
        ]
      });
    }
  });

  socket.on('timeout', () => {
    socket.destroy();
    if (!responded) {
      responded = true;
      return res.json({
        success: false,
        status: 'UNREACHABLE',
        message: 'Connection timed out after 3 seconds. The biometric terminal did not respond.',
        maskedNetwork: 'Secured Subnet',
        troubleshooting: [
          'Verify the scanner IP and port match the physical device network settings.',
          'Ensure both devices are on the same network subnet.',
          'Check for router/switch port isolation or VLAN segregation.'
        ]
      });
    }
  });
});

module.exports = router;
