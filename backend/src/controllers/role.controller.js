// =====================================================================
// Background Verification System - Roles Controller
// =====================================================================

const { prisma } = require('../config/db');

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await prisma.roles.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ success: true, count: roles.length, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching roles.' });
  }
};

exports.createRole = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Role name is required.' });
    }
    const role = await prisma.roles.upsert({
      where: { name },
      update: {},
      create: { name, status: 'active' }
    });
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating role.' });
  }
};
