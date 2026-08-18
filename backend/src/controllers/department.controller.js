// =====================================================================
// Background Verification System - Department Controller
// =====================================================================

const { prisma } = require('../config/db');

exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching departments.' });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Department name is required.' });
    }
    const dept = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name, status: 'active' }
    });
    res.status(201).json({ success: true, data: dept });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating department.' });
  }
};
