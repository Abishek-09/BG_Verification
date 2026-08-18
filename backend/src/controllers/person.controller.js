// =====================================================================
// Background Verification System - Person Controller
// =====================================================================

const { prisma } = require('../config/db');

// Helper to format Prisma Person Record into UI-friendly JSON structure
function formatPersonRecord(person) {
  const latestDetail = person.personDetails && person.personDetails.length > 0
    ? person.personDetails[person.personDetails.length - 1]
    : null;

  const firstDetail = person.personDetails && person.personDetails.length > 0
    ? person.personDetails[0]
    : null;

  const latestDept = person.personDepartments && person.personDepartments.length > 0
    ? person.personDepartments[0].department
    : null;

  const latestRole = person.personRoles && person.personRoles.length > 0
    ? person.personRoles[0].role
    : null;

  const addressVal = (latestDetail && latestDetail.personAddress)
    ? latestDetail.personAddress
    : (firstDetail && firstDetail.personAddress ? firstDetail.personAddress : '');

  const photoUrlVal = (latestDetail && latestDetail.photoUrl)
    ? latestDetail.photoUrl
    : (firstDetail && firstDetail.photoUrl ? firstDetail.photoUrl : '');

  const employmentHistory = (person.personDetails || []).map((detail) => ({
    id: detail.id,
    company_name: detail.companyName || 'Enterprise Corp',
    department: detail.personDepartment ? detail.personDepartment.department.name : '',
    role_name: detail.personRole ? detail.personRole.role.name : 'Software Developer',
    company_address: detail.companyAddress || '',
    person_address: detail.personAddress || '',
    start_date: detail.startDate ? detail.startDate.toISOString().split('T')[0] : '',
    end_date: detail.endDate ? detail.endDate.toISOString().split('T')[0] : '',
    is_current: !detail.endDate,
    monthly_salary: detail.monthlySalary ? parseFloat(detail.monthlySalary) : 0,
    annual_salary: detail.monthlySalary ? parseFloat(detail.monthlySalary) * 12 : 0,
    total_experience: detail.totalExperience || '1 yr',
    salary_slip_name: detail.paymentSlip || '',
    payment_slip: detail.paymentSlip || '',
    photo_url: detail.photoUrl || '',
    remarks: detail.remarks || ''
  }));

  return {
    id: String(person.id),
    name: person.name,
    email: person.email,
    status: person.status,
    employee_code: latestDetail ? latestDetail.employeeCode : `EMP-${person.id}`,
    mobile_number: latestDetail ? latestDetail.mobile : '',
    address: addressVal,
    photo_url: photoUrlVal,
    barcode_hash: latestDetail ? latestDetail.barcodeData : `hash-${person.id}`,
    department: latestDept ? latestDept.name : '',
    role: latestRole ? latestRole.name : '',
    history: employmentHistory,
    created_at: person.createdAt
  };
}

// 1. Get All Persons
exports.getAllPersons = async (req, res) => {
  try {
    const persons = await prisma.person.findMany({
      include: {
        personDepartments: {
          include: { department: true }
        },
        personRoles: {
          include: { role: true }
        },
        personDetails: {
          include: {
            personDepartment: { include: { department: true } },
            personRole: { include: { role: true } }
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    const formatted = persons.map(formatPersonRecord);
    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error('Error fetching persons:', error);
    res.status(500).json({ success: false, message: 'Server error fetching person records.', error: error.message });
  }
};

// 2. Get Single Person by ID
exports.getPersonById = async (req, res) => {
  try {
    const { id } = req.params;
    const person = await prisma.person.findUnique({
      where: { id: BigInt(id) },
      include: {
        personDepartments: { include: { department: true } },
        personRoles: { include: { role: true } },
        personDetails: {
          include: {
            personDepartment: { include: { department: true } },
            personRole: { include: { role: true } }
          }
        }
      }
    });

    if (!person) {
      return res.status(404).json({ success: false, message: 'Person record not found.' });
    }

    res.status(200).json({ success: true, data: formatPersonRecord(person) });
  } catch (error) {
    console.error('Error fetching person by ID:', error);
    res.status(500).json({ success: false, message: 'Server error fetching person details.' });
  }
};

// 3. Verify Person by Barcode Hash or Employee Code
exports.verifyPerson = async (req, res) => {
  try {
    const { query } = req.params;

    const detail = await prisma.personDetails.findFirst({
      where: {
        OR: [
          { barcodeData: query },
          { employeeCode: query }
        ]
      },
      include: {
        person: {
          include: {
            personDepartments: { include: { department: true } },
            personRoles: { include: { role: true } },
            personDetails: {
              include: {
                personDepartment: { include: { department: true } },
                personRole: { include: { role: true } }
              }
            }
          }
        }
      }
    });

    if (detail && detail.person) {
      return res.status(200).json({ success: true, data: formatPersonRecord(detail.person) });
    }

    if (!isNaN(query)) {
      const personById = await prisma.person.findUnique({
        where: { id: BigInt(query) },
        include: {
          personDepartments: { include: { department: true } },
          personRoles: { include: { role: true } },
          personDetails: {
            include: {
              personDepartment: { include: { department: true } },
              personRole: { include: { role: true } }
            }
          }
        }
      });
      if (personById) {
        return res.status(200).json({ success: true, data: formatPersonRecord(personById) });
      }
    }

    res.status(404).json({ success: false, message: 'No matching background verification record found for this code.' });
  } catch (error) {
    console.error('Error verifying record:', error);
    res.status(500).json({ success: false, message: 'Server error during verification scan.' });
  }
};

// 4. Create / Upsert New Person Record with History & Details
exports.createPerson = async (req, res) => {
  try {
    const { name, email, mobile_number, employee_code, address, photo_url, history } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Full Name and Email Address are required.' });
    }

    const historyItems = Array.isArray(history) && history.length > 0 ? history : [{}];
    const firstExp = historyItems[0] || {};

    const deptName = firstExp.department || 'Software Engineering';
    const roleName = firstExp.role_name || 'Software Developer';

    const targetDept = await prisma.department.upsert({
      where: { name: deptName },
      update: {},
      create: { name: deptName, status: 'active' }
    });

    const targetRole = await prisma.roles.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, status: 'active' }
    });

    const barcodeHash = 'hash-' + Math.random().toString(36).substring(2, 12);

    // Upsert Person by email to prevent duplicate constraint crashes
    const newPerson = await prisma.person.upsert({
      where: { email },
      update: {
        name,
        status: 'verified'
      },
      create: {
        name,
        email,
        status: 'verified',
        personDepartments: {
          create: {
            departmentId: targetDept.id,
            status: 'active'
          }
        },
        personRoles: {
          create: {
            roleId: targetRole.id,
            status: 'active'
          }
        }
      }
    });

    // Ensure Person Department & Role references for Details
    let personDept = await prisma.personDepartment.findFirst({ where: { personId: newPerson.id, departmentId: targetDept.id } });
    if (!personDept) {
      personDept = await prisma.personDepartment.create({
        data: { personId: newPerson.id, departmentId: targetDept.id, status: 'active' }
      });
    }

    let personRole = await prisma.personRoles.findFirst({ where: { personId: newPerson.id, roleId: targetRole.id } });
    if (!personRole) {
      personRole = await prisma.personRoles.create({
        data: { personId: newPerson.id, roleId: targetRole.id, status: 'active' }
      });
    }

    for (const exp of historyItems) {
      const parsedStartDate = (exp.start_date && !isNaN(new Date(exp.start_date)))
        ? new Date(exp.start_date)
        : new Date();

      const parsedEndDate = (!exp.is_current && exp.end_date && !isNaN(new Date(exp.end_date)))
        ? new Date(exp.end_date)
        : null;

      const paymentSlipVal = exp.salary_slip_name || exp.salary_slip_url || exp.payment_slip || '';
      const remarksVal = exp.remarks || '';
      const photoVal = photo_url || exp.photo_url || '';

      await prisma.personDetails.create({
        data: {
          personId: newPerson.id,
          mobile: mobile_number || '',
          companyName: exp.company_name || 'Enterprise Corp',
          barcodeData: barcodeHash,
          monthlySalary: exp.monthly_salary ? parseFloat(exp.monthly_salary) : 50000,
          totalExperience: exp.total_experience || '1 yr',
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          personDeptId: personDept ? personDept.id : null,
          personRoleId: personRole ? personRole.id : null,
          employeeCode: employee_code || `EMP-${newPerson.id}`,
          companyAddress: exp.company_address || '',
          personAddress: address || '',
          photoUrl: photoVal,
          status: 'verified',
          remarks: remarksVal,
          paymentSlip: paymentSlipVal
        }
      });
    }

    // Refetch complete record
    const createdPerson = await prisma.person.findUnique({
      where: { id: newPerson.id },
      include: {
        personDepartments: { include: { department: true } },
        personRoles: { include: { role: true } },
        personDetails: {
          include: {
            personDepartment: { include: { department: true } },
            personRole: { include: { role: true } }
          }
        }
      }
    });

    console.log(`✅ Person created/updated in PostgreSQL DB: ID ${createdPerson.id}, Name: ${createdPerson.name}`);

    res.status(201).json({
      success: true,
      message: 'Employee verification record successfully created in PostgreSQL!',
      data: formatPersonRecord(createdPerson)
    });
  } catch (error) {
    console.error('Error creating person record:', error);
    res.status(500).json({ success: false, message: 'Server error creating employee record.', error: error.message });
  }
};

// 5. Delete Person Record
exports.deletePerson = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.person.delete({
      where: { id: BigInt(id) }
    });
    res.status(200).json({ success: true, message: 'Employee record successfully deleted.' });
  } catch (error) {
    console.error('Error deleting person:', error);
    res.status(500).json({ success: false, message: 'Server error deleting person record.' });
  }
};
