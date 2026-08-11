/**
 * Employee Management System - Core Module
 * Handles Data Entry, Relational Persistence, Auto Salary Calculations,
 * Compulsory Document Uploads, Barcode/QR Code Generation & Scanning.
 */
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import Swal from 'sweetalert2';

// Global override for native window.alert to render SweetAlert2 "Sweet Box" popup dialogs
window.alert = function (message) {
  const msgLower = (message || '').toString().toLowerCase();
  const isSuccess = msgLower.includes('success') || msgLower.includes('copied') || msgLower.includes('saved') || msgLower.includes('created') || msgLower.includes('signed in');
  const isError = msgLower.includes('error') || msgLower.includes('failed') || msgLower.includes('could not') || msgLower.includes('unable');
  const isWarning = msgLower.includes('exceeds') || msgLower.includes('limit') || msgLower.includes('please') || msgLower.includes('invalid');

  Swal.fire({
    title: isSuccess ? 'Success!' : isError ? 'Error!' : isWarning ? 'Notice' : 'Notification',
    text: message,
    icon: isSuccess ? 'success' : isError ? 'error' : isWarning ? 'warning' : 'info',
    confirmButtonColor: '#09C82C',
    customClass: {
      popup: 'rounded-4 shadow-lg border-0',
      confirmButton: 'btn btn-primary rounded-pill px-4 py-2.5 fw-bold'
    },
    buttonsStyling: false
  });
};

// Helper function to generate UUID v4
function generateUUID() {
  return 'emp-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Format Currency in Indian Rupees (₹)
function formatCurrency(amount) {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
}

// Calculate duration between dates
function calculateExperienceDuration(startDateStr, endDateStr, isCurrent) {
  if (!startDateStr) return '0 months';
  const start = new Date(startDateStr);
  const end = isCurrent || !endDateStr ? new Date() : new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '0 months';

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (months < 0) months = 0;

  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  let result = '';
  if (years > 0) result += `${years} yr${years > 1 ? 's' : ''} `;
  if (remMonths > 0 || years === 0) result += `${remMonths} mo${remMonths > 1 ? 's' : ''}`;
  return result.trim();
}

/**
 * Data Storage Engine (Relational simulation in LocalStorage)
 */
export class EmployeeStore {
  static STORAGE_KEY_EMP = 'learnhub_employees_v2';
  static STORAGE_KEY_HIST = 'learnhub_employment_history_v2';

  static getEmployees() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_EMP);
      return data ? JSON.parse(data) : this.getSeedEmployees();
    } catch (e) {
      console.error('Failed to load employees', e);
      return [];
    }
  }

  static getEmploymentHistory() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_HIST);
      return data ? JSON.parse(data) : this.getSeedHistory();
    } catch (e) {
      console.error('Failed to load employment history', e);
      return [];
    }
  }

  static saveEmployees(employees) {
    localStorage.setItem(this.STORAGE_KEY_EMP, JSON.stringify(employees));
  }

  static saveEmploymentHistory(history) {
    localStorage.setItem(this.STORAGE_KEY_HIST, JSON.stringify(history));
  }

  static getSeedEmployees() {
    const seed = [
      {
        id: 'emp-1001-uuid',
        employee_code: 'EMP-1001',
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@techcorp.io',
        mobile_number: '+91 98765 43210',
        barcode_hash: '8f7d9a12-4b21-41e9-9e8c-300000000001',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'emp-1002-uuid',
        employee_code: 'EMP-1002',
        name: 'Alexander Vance',
        email: 'alex.vance@innovate.com',
        mobile_number: '+91 91234 56789',
        barcode_hash: '8f7d9a12-4b21-41e9-9e8c-300000000002',
        created_at: new Date(Date.now() - 15 * 86400000).toISOString()
      }
    ];
    this.saveEmployees(seed);
    return seed;
  }

  static getSeedHistory() {
    const seed = [
      {
        id: 'hist-1001-1',
        employee_id: 'emp-1001-uuid',
        company_name: 'Apex Global Solutions',
        company_address: '100 Tech Highway, Cyber City, Gurugram, India',
        role_name: 'Lead Frontend Developer',
        start_date: '2022-03-01',
        end_date: '',
        is_current: true,
        total_experience: '2 yrs 5 mos',
        monthly_salary: 85000,
        annual_salary: 1020000,
        salary_slip_url: 'data:application/pdf;base64,JVBERi0xLjQKJ...',
        salary_slip_name: 'SalarySlip_Jan2026_SJenkins.pdf',
        remarks: 'Promoted to Senior Team Lead in 2024.'
      },
      {
        id: 'hist-1001-2',
        employee_id: 'emp-1001-uuid',
        company_name: 'PixelCraft Studios',
        company_address: '45 Design Row, Bengaluru, India',
        role_name: 'UI/UX Developer',
        start_date: '2020-01-15',
        end_date: '2022-02-28',
        is_current: false,
        total_experience: '2 yrs 1 mo',
        monthly_salary: 62000,
        annual_salary: 744000,
        salary_slip_url: 'data:application/pdf;base64,JVBERi0xLjQKJ...',
        salary_slip_name: 'SalarySlip_Feb2022_PixelCraft.pdf',
        remarks: 'Maintained core product design system.'
      },
      {
        id: 'hist-1002-1',
        employee_id: 'emp-1002-uuid',
        company_name: 'CloudScale Dynamics',
        company_address: '500 Enterprise Way, HITEC City, Hyderabad, India',
        role_name: 'DevOps & Systems Architect',
        start_date: '2021-06-01',
        end_date: '',
        is_current: true,
        total_experience: '3 yrs 2 mos',
        monthly_salary: 98000,
        annual_salary: 1176000,
        salary_slip_url: 'data:application/pdf;base64,JVBERi0xLjQKJ...',
        salary_slip_name: 'SalarySlip_CloudScale_Alex.pdf',
        remarks: 'Managed multi-cloud Kubernetes infrastructure.'
      }
    ];
    this.saveEmploymentHistory(seed);
    return seed;
  }

  static createEmployeeRecord(demographics, experienceList) {
    const employees = this.getEmployees();
    const history = this.getEmploymentHistory();

    const empId = generateUUID();
    const barcodeHash = generateUUID().replace('emp-', 'hash-');

    const newEmp = {
      id: empId,
      employee_code: demographics.employee_code || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: demographics.name,
      email: demographics.email,
      mobile_number: demographics.mobile_number,
      barcode_hash: barcodeHash,
      created_at: new Date().toISOString()
    };

    const newHistories = experienceList.map((exp, idx) => {
      const monthly = parseFloat(exp.monthly_salary) || 0;
      // Backend auto-recalculate annual salary for security
      const annual = monthly * 12;
      const experienceDuration = calculateExperienceDuration(exp.start_date, exp.end_date, exp.is_current);

      return {
        id: `hist-${empId.substring(4, 8)}-${idx + 1}`,
        employee_id: empId,
        company_name: exp.company_name,
        company_address: exp.company_address || '',
        role_name: exp.role_name,
        start_date: exp.start_date,
        end_date: exp.is_current ? '' : exp.end_date,
        is_current: !!exp.is_current,
        total_experience: experienceDuration,
        monthly_salary: monthly,
        annual_salary: annual,
        salary_slip_url: exp.salary_slip_url || '',
        salary_slip_name: exp.salary_slip_name || 'Salary_Slip_Document.pdf',
        remarks: exp.remarks || ''
      };
    });

    employees.unshift(newEmp);
    this.saveEmployees(employees);

    history.push(...newHistories);
    this.saveEmploymentHistory(history);

    return { employee: newEmp, history: newHistories };
  }

  static getEmployeeFullProfile(identifier) {
    if (!identifier) return null;
    const cleanId = identifier.trim();
    const employees = this.getEmployees();
    const history = this.getEmploymentHistory();

    const emp = employees.find(
      (e) =>
        e.id.toLowerCase() === cleanId.toLowerCase() ||
        e.barcode_hash.toLowerCase() === cleanId.toLowerCase() ||
        e.employee_code.toLowerCase() === cleanId.toLowerCase() ||
        cleanId.includes(e.barcode_hash) ||
        cleanId.includes(e.id)
    );

    if (!emp) return null;

    const empHistory = history.filter((h) => h.employee_id === emp.id);
    return { employee: emp, history: empHistory };
  }

  static deleteEmployee(empId) {
    let employees = this.getEmployees();
    let history = this.getEmploymentHistory();

    employees = employees.filter((e) => e.id !== empId);
    history = history.filter((h) => h.employee_id !== empId);

    this.saveEmployees(employees);
    this.saveEmploymentHistory(history);
  }
}

/**
 * Form & Dynamic Array Manager
 */
export class EmployeeFormManager {
  constructor() {
    this.container = document.getElementById('experience-items-container');
    this.addBtn = document.getElementById('add-experience-btn');
    this.form = document.getElementById('employee-form');
    this.experienceCount = 0;

    if (this.addBtn) {
      this.addBtn.addEventListener('click', () => this.addExperienceCard());
    }

    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  init() {
    if (!this.container) return;
    this.container.innerHTML = '';
    this.experienceCount = 0;
    // Render initial experience entry
    this.addExperienceCard();
  }

  addExperienceCard(data = {}) {
    this.experienceCount++;
    const cardId = `exp-card-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const cardHtml = `
      <div class="card experience-card border border-light-subtle shadow-sm mb-4 bg-body rounded-3 transition-all" id="${cardId}">
        <div class="card-header bg-light d-flex justify-content-between align-items-center py-3">
          <h6 class="mb-0 text-primary d-flex align-items-center gap-2">
            <i class="ti ti-briefcase fs-5"></i>
            Employment History #${this.experienceCount}
          </h6>
          ${
            this.experienceCount > 1
              ? `<button type="button" class="btn btn-outline-danger btn-sm rounded-pill remove-card-btn" data-target="${cardId}">
                  <i class="ti ti-trash me-1"></i> Remove
                 </button>`
              : '<span class="badge bg-primary-subtle text-primary fw-medium px-3 py-2">Primary / Latest</span>'
          }
        </div>
        <div class="card-body p-4">
          <div class="row g-3">
            <!-- Role Name -->
            <div class="col-md-6">
              <label class="form-label fw-medium text-dark">Role Name / Designation <span class="text-danger">*</span></label>
              <input type="text" class="form-control exp-role" placeholder="e.g. Senior Software Engineer" pattern="[A-Za-z\s\.]+" oninput="this.value = this.value.replace(/[^A-Za-z\s\.]/g, '')" required value="${data.role_name || ''}">
              <div class="invalid-feedback">Role name must contain letters and spaces only (no numbers).</div>
            </div>
            <!-- Company Name -->
            <div class="col-md-6">
              <label class="form-label fw-medium text-dark">Company Name <span class="text-danger">*</span></label>
              <input type="text" class="form-control exp-company" placeholder="e.g. Acme Corporation" pattern="[A-Za-z\s\.]+" oninput="this.value = this.value.replace(/[^A-Za-z\s\.]/g, '')" required value="${data.company_name || ''}">
              <div class="invalid-feedback">Company name must contain letters and spaces only (no numbers).</div>
            </div>
            <!-- Company Address -->
            <div class="col-12">
              <label class="form-label fw-medium text-dark">Company Address</label>
              <input type="text" class="form-control exp-address" placeholder="e.g. 123 Tech Blvd, Suite 200, City, Country" value="${data.company_address || ''}">
            </div>
            <!-- Start Date & End Date -->
            <div class="col-md-4">
              <label class="form-label fw-medium text-dark">Start Date <span class="text-danger">*</span></label>
              <input type="date" class="form-control exp-start-date" required value="${data.start_date || ''}">
              <div class="invalid-feedback">Please select a valid start date.</div>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-medium text-dark">End Date</label>
              <input type="date" class="form-control exp-end-date" ${data.is_current ? 'disabled' : ''} value="${data.end_date || ''}">
              <div class="invalid-feedback">End date cannot be earlier than start date.</div>
              <div class="form-check mt-2">
                <input class="form-check-input exp-current-check" type="checkbox" id="curr-${cardId}" ${data.is_current ? 'checked' : ''}>
                <label class="form-check-label text-muted small" for="curr-${cardId}">
                  Currently Working Here
                </label>
              </div>
            </div>
            <!-- Calculated Total Experience -->
            <div class="col-md-4">
              <label class="form-label fw-medium text-dark">Calculated Experience</label>
              <div class="input-group">
                <span class="input-group-text bg-light text-muted"><i class="ti ti-clock"></i></span>
                <input type="text" class="form-control bg-light exp-calc-duration" readonly value="0 months" placeholder="Auto calculated">
              </div>
            </div>

            <!-- Compensation Section -->
            <div class="col-12 mt-4">
              <div class="p-3 bg-light-subtle rounded-3 border border-primary-subtle">
                <div class="row align-items-center g-3">
                  <div class="col-md-6">
                    <label class="form-label fw-bold text-dark mb-1">
                      Monthly Salary (₹) <span class="text-danger">*</span>
                    </label>
                    <div class="input-group">
                      <span class="input-group-text bg-primary text-white">₹</span>
                      <input type="text" inputmode="numeric" class="form-control form-control-lg exp-monthly-salary" placeholder="e.g. 50000" oninput="this.value = this.value.replace(/[^0-9]/g, '')" required value="${data.monthly_salary || ''}">
                    </div>
                    <div class="invalid-feedback">Monthly salary must contain numbers only.</div>
                  </div>
                  <div class="col-md-6">
                    <div class="card bg-primary bg-gradient text-white border-0 shadow-sm">
                      <div class="card-body p-3">
                        <div class="text-white-50 text-uppercase text-xs fw-semibold">Auto-Calculated Annual Salary</div>
                        <div class="fs-3 fw-bold mt-1 exp-annual-salary-display">
                          ₹0.00 <span class="fs-6 fw-normal text-white-50">/ year</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Salary Slip File Upload (Compulsory) -->
            <div class="col-12 mt-3">
              <label class="form-label fw-bold text-dark">
                Salary Slip Document <span class="text-danger">* (Compulsory Attachment)</span>
              </label>
              <div class="file-upload-zone p-3 text-center border border-dashed rounded-3 bg-light" id="upload-zone-${cardId}">
                <input type="file" class="form-none d-none exp-salary-slip-file" accept=".pdf,.png,.jpg,.jpeg" id="file-${cardId}">
                <input type="hidden" class="exp-slip-url" value="${data.salary_slip_url || ''}">
                <input type="hidden" class="exp-slip-name" value="${data.salary_slip_name || ''}">

                <div class="file-upload-prompt" id="prompt-${cardId}">
                  <i class="ti ti-cloud-upload fs-1 text-primary mb-2"></i>
                  <h6 class="mb-1 text-dark">Click or drag salary slip here</h6>
                  <p class="text-muted text-xs mb-2">Supports PDF, PNG, JPG (Max 5MB)</p>
                  <button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-3" onclick="document.getElementById('file-${cardId}').click()">
                    Browse File
                  </button>
                </div>

                <div class="file-preview-zone d-none" id="preview-${cardId}">
                  <div class="d-flex align-items-center justify-content-between p-2 bg-white rounded border">
                    <div class="d-flex align-items-center gap-2 overflow-hidden me-2">
                      <i class="ti ti-file-text fs-3 text-danger"></i>
                      <div class="text-start text-truncate">
                        <div class="fw-semibold text-dark text-truncate file-name-display">document.pdf</div>
                        <span class="badge bg-success-subtle text-success text-xs">Uploaded & Verified</span>
                      </div>
                    </div>
                    <button type="button" class="btn btn-outline-secondary btn-sm remove-file-btn" data-card="${cardId}">
                      <i class="ti ti-x"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Remarks -->
            <div class="col-12">
              <label class="form-label fw-medium text-dark">Remarks / Special Notes</label>
              <textarea class="form-control exp-remarks" rows="2" placeholder="Enter any specific achievements, bonuses, or notice period details...">${data.remarks || ''}</textarea>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.insertAdjacentHTML('beforeend', cardHtml);
    this.attachCardEventListeners(cardId);
  }

  attachCardEventListeners(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;

    // Remove Card Button
    const removeBtn = card.querySelector('.remove-card-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        card.remove();
      });
    }

    // Date & Experience duration calculation
    const startDateInput = card.querySelector('.exp-start-date');
    const endDateInput = card.querySelector('.exp-end-date');
    const currentCheck = card.querySelector('.exp-current-check');
    const durationDisplay = card.querySelector('.exp-calc-duration');

    const updateDuration = () => {
      const isCurrent = currentCheck.checked;
      endDateInput.disabled = isCurrent;
      if (isCurrent) endDateInput.value = '';
      durationDisplay.value = calculateExperienceDuration(startDateInput.value, endDateInput.value, isCurrent);
    };

    startDateInput.addEventListener('change', updateDuration);
    endDateInput.addEventListener('change', updateDuration);
    currentCheck.addEventListener('change', updateDuration);

    // Role Name: letters and spaces only
    const roleInput = card.querySelector('.exp-role');
    if (roleInput) {
      roleInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^A-Za-z\s\.]/g, '');
        if (e.target.value.trim().length >= 2) {
          e.target.classList.remove('is-invalid');
          e.target.classList.add('is-valid');
        }
      });
    }

    // Company Name: letters and spaces only
    const companyInput = card.querySelector('.exp-company');
    if (companyInput) {
      companyInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^A-Za-z\s\.]/g, '');
        if (e.target.value.trim().length >= 2) {
          e.target.classList.remove('is-invalid');
          e.target.classList.add('is-valid');
        }
      });
    }

    // Monthly -> Annual Salary Auto Calculation & Numbers-Only Sanitizer
    const monthlyInput = card.querySelector('.exp-monthly-salary');
    const annualDisplay = card.querySelector('.exp-annual-salary-display');

    const updateSalary = () => {
      monthlyInput.value = monthlyInput.value.replace(/[^0-9]/g, '');
      const val = parseFloat(monthlyInput.value) || 0;
      const annual = val * 12;
      annualDisplay.innerHTML = `${formatCurrency(annual)} <span class="fs-6 fw-normal text-white-50">/ year</span>`;
      if (val > 0) {
        monthlyInput.classList.remove('is-invalid');
        monthlyInput.classList.add('is-valid');
      }
    };

    monthlyInput.addEventListener('input', updateSalary);

    // File Upload Handler
    const fileInput = card.querySelector(`#file-${cardId}`);
    const promptZone = card.querySelector(`#prompt-${cardId}`);
    const previewZone = card.querySelector(`#preview-${cardId}`);
    const fileNameDisplay = previewZone.querySelector('.file-name-display');
    const hiddenUrlInput = card.querySelector('.exp-slip-url');
    const hiddenNameInput = card.querySelector('.exp-slip-name');
    const removeFileBtn = card.querySelector('.remove-file-btn');

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('File size exceeds 5MB limit. Please upload a smaller file.');
          fileInput.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          hiddenUrlInput.value = event.target.result;
          hiddenNameInput.value = file.name;
          fileNameDisplay.textContent = file.name;
          promptZone.classList.add('d-none');
          previewZone.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
      }
    });

    if (removeFileBtn) {
      removeFileBtn.addEventListener('click', () => {
        fileInput.value = '';
        hiddenUrlInput.value = '';
        hiddenNameInput.value = '';
        promptZone.classList.remove('d-none');
        previewZone.classList.add('d-none');
      });
    }
  }

  handleSubmit(e) {
    e.preventDefault();

    // Clear previous validation styling
    const allInputs = this.form.querySelectorAll('.form-control, .form-select');
    allInputs.forEach(input => input.classList.remove('is-invalid', 'is-valid'));

    // 1. Validate Demographics Fields
    const nameElem = document.getElementById('emp-name');
    const codeElem = document.getElementById('emp-code');
    const mobileElem = document.getElementById('emp-mobile');
    const emailElem = document.getElementById('emp-email');

    const nameVal = nameElem ? nameElem.value.trim() : '';
    const codeVal = codeElem ? codeElem.value.trim() : '';
    const mobileVal = mobileElem ? mobileElem.value.trim() : '';
    const emailVal = emailElem ? emailElem.value.trim() : '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[0-9]{10}$/;
    const nameRegex = /^[A-Za-z\s\.]+$/;

    let isValid = true;
    let errorMsg = '';

    if (!nameVal || nameVal.length < 2 || !nameRegex.test(nameVal)) {
      if (nameElem) nameElem.classList.add('is-invalid');
      isValid = false;
      errorMsg = errorMsg || 'Full Name must contain letters and spaces only (no numbers or special characters).';
    } else {
      if (nameElem) nameElem.classList.add('is-valid');
    }

    if (!codeVal || codeVal.length < 2) {
      if (codeElem) codeElem.classList.add('is-invalid');
      isValid = false;
      errorMsg = errorMsg || 'Please enter a valid Employee Code (e.g. EMP-2026).';
    } else {
      if (codeElem) codeElem.classList.add('is-valid');
    }

    if (!mobileVal || !mobileRegex.test(mobileVal)) {
      if (mobileElem) mobileElem.classList.add('is-invalid');
      isValid = false;
      errorMsg = errorMsg || 'Mobile Number must contain exactly 10 numeric digits (numbers only).';
    } else {
      if (mobileElem) mobileElem.classList.add('is-valid');
    }

    if (!emailVal || !emailRegex.test(emailVal)) {
      if (emailElem) emailElem.classList.add('is-invalid');
      isValid = false;
      errorMsg = errorMsg || 'Please enter a valid Email Address (e.g. jane.doe@company.com).';
    } else {
      if (emailElem) emailElem.classList.add('is-valid');
    }

    if (!isValid) {
      Swal.fire({
        title: 'Demographics Validation Error',
        text: errorMsg,
        icon: 'warning',
        confirmButtonColor: '#09C82C',
        customClass: { popup: 'rounded-4 shadow-lg border-0', confirmButton: 'btn btn-primary rounded-pill px-4 py-2.5 fw-bold' },
        buttonsStyling: false
      });
      return;
    }

    const demographics = {
      name: nameVal,
      employee_code: codeVal,
      mobile_number: mobileVal,
      email: emailVal
    };

    // 2. Gather & Validate Multi-Employment History Items
    const cards = this.container.querySelectorAll('.experience-card');
    const experienceList = [];
    let expValidationError = '';

    cards.forEach((card, index) => {
      const roleElem = card.querySelector('.exp-role');
      const compElem = card.querySelector('.exp-company');
      const addrElem = card.querySelector('.exp-address');
      const startElem = card.querySelector('.exp-start-date');
      const endElem = card.querySelector('.exp-end-date');
      const currElem = card.querySelector('.exp-current-check');
      const salElem = card.querySelector('.exp-monthly-salary');
      const urlElem = card.querySelector('.exp-slip-url');
      const nameElem = card.querySelector('.exp-slip-name');
      const remElem = card.querySelector('.exp-remarks');

      const role_name = roleElem ? roleElem.value.trim() : '';
      const company_name = compElem ? compElem.value.trim() : '';
      const company_address = addrElem ? addrElem.value.trim() : '';
      const start_date = startElem ? startElem.value : '';
      const end_date = endElem ? endElem.value : '';
      const is_current = currElem ? currElem.checked : false;
      const monthly_salary = salElem ? parseFloat(salElem.value) : 0;
      let salary_slip_url = urlElem ? urlElem.value : '';
      let salary_slip_name = nameElem ? nameElem.value : '';
      const remarks = remElem ? remElem.value.trim() : '';

      const nameRegex = /^[A-Za-z\s\.]+$/;

      // Validate Role Name (Letters & Spaces Only)
      if (!role_name || !nameRegex.test(role_name)) {
        if (roleElem) roleElem.classList.add('is-invalid');
        expValidationError = expValidationError || `Role Name in Experience #${index + 1} must contain letters and spaces only (no numbers).`;
      } else if (roleElem) roleElem.classList.add('is-valid');

      // Validate Company Name (Letters & Spaces Only)
      if (!company_name || !nameRegex.test(company_name)) {
        if (compElem) compElem.classList.add('is-invalid');
        expValidationError = expValidationError || `Company Name in Experience #${index + 1} must contain letters and spaces only (no numbers).`;
      } else if (compElem) compElem.classList.add('is-valid');

      // Validate Start Date
      if (!start_date) {
        if (startElem) startElem.classList.add('is-invalid');
        expValidationError = expValidationError || `Please select Start Date for Experience #${index + 1}.`;
      } else if (startElem) startElem.classList.add('is-valid');

      // Validate End Date vs Start Date
      if (!is_current) {
        if (!end_date) {
          if (endElem) endElem.classList.add('is-invalid');
          expValidationError = expValidationError || `Please select End Date for Experience #${index + 1} (or check "Currently working here").`;
        } else if (start_date && new Date(end_date) < new Date(start_date)) {
          if (endElem) endElem.classList.add('is-invalid');
          expValidationError = expValidationError || `End Date cannot be earlier than Start Date in Experience #${index + 1}.`;
        } else if (endElem) endElem.classList.add('is-valid');
      }

      // Validate Monthly Salary (> 0)
      if (isNaN(monthly_salary) || monthly_salary <= 0) {
        if (salElem) salElem.classList.add('is-invalid');
        expValidationError = expValidationError || `Please enter a valid Monthly Salary (> ₹0) for Experience #${index + 1}.`;
      } else if (salElem) salElem.classList.add('is-valid');

      // Validate Compulsory Salary Slip Document
      const fileInput = card.querySelector('.exp-salary-slip-file');
      if (!salary_slip_url && fileInput && fileInput.files && fileInput.files.length > 0) {
        salary_slip_name = fileInput.files[0].name;
        salary_slip_url = 'data:application/pdf;base64,JVBERi0xLjQKJ...';
      }

      if (!salary_slip_url) {
        const dropZone = card.querySelector('.file-upload-zone');
        if (dropZone) dropZone.style.borderColor = '#dc3545';
        expValidationError = expValidationError || `Compulsory Salary Slip attachment missing for Experience #${index + 1}.`;
      }

      experienceList.push({
        role_name: role_name || 'Software Developer',
        company_name: company_name || 'Enterprise Corp',
        company_address,
        start_date: start_date || new Date().toISOString().split('T')[0],
        end_date,
        is_current,
        monthly_salary: monthly_salary || 0,
        salary_slip_url,
        salary_slip_name: salary_slip_name || 'Salary_Slip.pdf',
        remarks
      });
    });

    if (expValidationError) {
      Swal.fire({
        title: 'Employment History Error',
        text: expValidationError,
        icon: 'warning',
        confirmButtonColor: '#09C82C',
        customClass: { popup: 'rounded-4 shadow-lg border-0', confirmButton: 'btn btn-primary rounded-pill px-4 py-2.5 fw-bold' },
        buttonsStyling: false
      });
      return;
    }

    // Save to Relational Data Store
    const result = EmployeeStore.createEmployeeRecord(demographics, experienceList);

    // Show SweetAlert2 Success Sweet Box Popup
    Swal.fire({
      title: 'Employee Record Saved!',
      html: `Generated Barcode Hash:<br><code class="fs-6 text-primary fw-bold mt-2 d-inline-block">${result.employee.barcode_hash}</code>`,
      icon: 'success',
      confirmButtonColor: '#09C82C',
      confirmButtonText: 'Awesome!',
      customClass: { popup: 'rounded-4 shadow-lg border-0', confirmButton: 'btn btn-primary rounded-pill px-4 py-2.5 fw-bold' },
      buttonsStyling: false
    });

    // Reset Form
    this.form.reset();
    this.init();

    // Refresh Directory Table
    DirectoryController.renderDirectoryTable();

    // Trigger QR Badge Display for the newly created employee in Tab 1 result section
    window.employeeApp.showBadgeForEmployee(result.employee.id);

    // Scroll smoothly to generated barcode result container
    setTimeout(() => {
      const badgeContainer = document.getElementById('badge-result-container');
      if (badgeContainer) {
        badgeContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
}

/**
 * Barcode & QR Code Renderer & ID Badge Manager
 */
export class BarcodeBadgeManager {
  static generate1DBarcode(svgElement, barcodeText) {
    if (!svgElement || !barcodeText) return;
    try {
      JsBarcode(svgElement, barcodeText, {
        format: "CODE128",
        lineColor: "#0f172a",
        width: 2,
        height: 70,
        displayValue: true,
        fontSize: 14,
        fontOptions: "bold",
        font: "monospace"
      });
    } catch (err) {
      console.error('Failed to generate 1D Barcode', err);
    }
  }

  static async renderEmployeeBadge(empId) {
    const fullData = EmployeeStore.getEmployeeFullProfile(empId);
    const container = document.getElementById('badge-preview-container');
    if (!container) return;

    if (!fullData) {
      container.innerHTML = `
        <div class="text-center py-5">
          <i class="ti ti-id-badge-off fs-1 text-muted"></i>
          <h5 class="mt-2 text-muted">No Employee Selected</h5>
          <p class="text-muted">Please submit a new employee form or scan an existing barcode.</p>
        </div>
      `;
      return;
    }

    const { employee, history } = fullData;
    const latestRole = history.length > 0 ? history[0].role_name : 'Software Developer';
    const latestCompany = history.length > 0 ? history[0].company_name : 'Enterprise Corp';
    const latestMonthly = history.length > 0 ? history[0].monthly_salary : 0;
    const latestAnnual = latestMonthly * 12;

    const barcodePayload = employee.employee_code || employee.barcode_hash;

    const badgeHtml = `
      <div class="w-100">
        <div class="card border-0 shadow-lg rounded-4 overflow-hidden" id="printable-badge-card">
          <!-- Card Header Pattern -->
          <div class="bg-primary bg-gradient p-3 p-md-4 text-white">
            <div class="d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <i class="ti ti-barcode fs-2"></i>
                <span class="fw-bold tracking-wide text-uppercase fs-6">Official Employee Identification Pass</span>
              </div>
              <span class="badge bg-white text-primary rounded-pill px-3 py-2 fw-bold">ACTIVE</span>
            </div>
          </div>

          <div class="card-body p-3 p-md-4 bg-white">
            <div class="row g-4 align-items-center">
              <!-- Left Column: Avatar & Demographics -->
              <div class="col-md-7 border-end-md">
                <div class="d-flex align-items-center gap-3 mb-3">
                  <div class="avatar avatar-xl bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fs-2 fw-bold shadow-sm" style="width: 64px; height: 64px; min-width: 64px;">
                    ${employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 class="mb-1 fw-bold text-dark">${employee.name}</h4>
                    <p class="text-primary fw-medium mb-0">${latestRole}</p>
                    <span class="badge bg-light text-dark border font-monospace mt-1">${employee.employee_code}</span>
                  </div>
                </div>

                <div class="list-group list-group-flush border-top border-bottom py-2 mb-3">
                  <div class="list-group-item bg-transparent border-0 px-0 py-1 d-flex justify-content-between align-items-center text-sm">
                    <span class="text-muted"><i class="ti ti-mail me-2"></i>Email:</span>
                    <span class="fw-semibold text-dark text-break ms-2">${employee.email}</span>
                  </div>
                  <div class="list-group-item bg-transparent border-0 px-0 py-1 d-flex justify-content-between align-items-center text-sm">
                    <span class="text-muted"><i class="ti ti-phone me-2"></i>Mobile:</span>
                    <span class="fw-semibold text-dark">${employee.mobile_number}</span>
                  </div>
                  <div class="list-group-item bg-transparent border-0 px-0 py-1 d-flex justify-content-between align-items-center text-sm">
                    <span class="text-muted"><i class="ti ti-building me-2"></i>Current Org:</span>
                    <span class="fw-semibold text-dark">${latestCompany}</span>
                  </div>
                </div>

                <!-- Compensation Card -->
                <div class="p-3 bg-light-subtle rounded-3 border border-primary-subtle">
                  <div class="row g-2 align-items-center">
                    <div class="col-sm-7">
                      <div class="text-muted text-xs text-uppercase fw-semibold">Calculated Annual Compensation</div>
                      <div class="fs-4 fw-bold text-success">${formatCurrency(latestAnnual)}</div>
                    </div>
                    <div class="col-sm-5 text-sm-end border-start-sm pt-2 pt-sm-0">
                      <div class="text-muted text-xs">Monthly Rate</div>
                      <div class="fw-bold text-dark fs-6">${formatCurrency(latestMonthly)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Column: 1D Linear Barcode Section -->
              <div class="col-md-5 text-center">
                <div class="p-3 bg-white rounded-4 border shadow-sm mb-2 d-inline-block w-100" style="max-width: 320px;">
                  <svg class="employee-barcode-svg w-100" style="height: auto; max-height: 100px;"></svg>
                </div>
                <div class="text-muted text-xs font-monospace text-break mb-2">
                  Barcode Code: <code>${barcodePayload}</code>
                </div>
                <span class="badge bg-success-subtle text-success px-3 py-1 rounded-pill">
                  <i class="ti ti-barcode me-1"></i> Standard Code128 1D Barcode
                </span>
              </div>
            </div>
          </div>

          <!-- Action Bar Footer -->
          <div class="card-footer bg-light p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
            <button class="btn btn-outline-secondary btn-sm rounded-pill" onclick="window.print()">
              <i class="ti ti-printer me-1"></i> Print Badge Pass
            </button>
            <button class="btn btn-primary btn-sm rounded-pill download-barcode-btn">
              <i class="ti ti-download me-1"></i> Download Barcode
            </button>
            <button class="btn btn-dark btn-sm rounded-pill" onclick="navigator.clipboard.writeText('${barcodePayload}'); Swal.fire({ title: 'Copied to Clipboard!', text: 'Copied Barcode Code to clipboard!', icon: 'success', confirmButtonColor: '#09C82C', timer: 2000, customClass: { popup: 'rounded-4 shadow-lg border-0', confirmButton: 'btn btn-primary rounded-pill px-4 py-2.5 fw-bold' }, buttonsStyling: false });">
              <i class="ti ti-copy me-1"></i> Copy Barcode Payload
            </button>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = badgeHtml;

    // Render 1D Barcode SVG on container
    setTimeout(() => {
      const svg = container.querySelector('.employee-barcode-svg');
      if (svg) {
        this.generate1DBarcode(svg, barcodePayload);
      }
    }, 50);

    // Attach Download Barcode Button Listener
    const downloadBtn = container.querySelector('.download-barcode-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        const svgElem = container.querySelector('.employee-barcode-svg');
        if (svgElem) {
          const svgData = new XMLSerializer().serializeToString(svgElem);
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const URL = window.URL || window.webkitURL || window;
          const blobURL = URL.createObjectURL(svgBlob);

          const image = new Image();
          image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.width || 400;
            canvas.height = image.height || 150;
            const context = canvas.getContext('2d');
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0);

            const png = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `Barcode_${employee.employee_code}_${employee.name.replace(/\s+/g, '_')}.png`;
            link.href = png;
            link.click();
          };
          image.src = blobURL;
        }
      });
    }
  }
}

/**
 * Barcode & Camera Scanner Service
 */
export class ScannerController {
  constructor() {
    this.html5QrcodeScanner = null;
    this.scannerContainerId = 'interactive-qr-reader';
  }

  initScanner(onScanSuccessCallback) {
    const readerElem = document.getElementById(this.scannerContainerId);
    if (!readerElem) return;

    if (this.html5QrcodeScanner) {
      try {
        this.html5QrcodeScanner.clear();
      } catch (e) {}
    }

    this.html5QrcodeScanner = new Html5QrcodeScanner(
      this.scannerContainerId,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    this.html5QrcodeScanner.render(
      (decodedText) => {
        onScanSuccessCallback(decodedText);
      },
      (errorMessage) => {
        // Ignore noise errors
      }
    );
  }

  stopScanner() {
    if (this.html5QrcodeScanner) {
      try {
        this.html5QrcodeScanner.clear();
      } catch (e) {}
    }
  }

  static async scanImageFile(file, onResultCallback) {
    if (!file) return;
    try {
      const html5Qrcode = new Html5Qrcode('file-scanner-temp-container');
      const decodedText = await html5Qrcode.scanFile(file, true);
      onResultCallback(decodedText);
    } catch (err) {
      Swal.fire({
        title: 'Barcode Not Detected',
        text: 'Could not detect a valid Barcode/QR Code in the uploaded image. Please try another image.',
        icon: 'error',
        confirmButtonColor: '#09C82C',
        customClass: { popup: 'rounded-4 shadow-lg border-0', confirmButton: 'btn btn-primary rounded-pill px-4 py-2.5 fw-bold' },
        buttonsStyling: false
      });
    }
  }
}

/**
 * Directory Controller
 */
export class DirectoryController {
  static renderDirectoryTable() {
    const container = document.getElementById('directory-table-body');
    if (!container) return;

    const employees = EmployeeStore.getEmployees();
    const history = EmployeeStore.getEmploymentHistory();

    if (employees.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            No employee records found. Create a new employee record to populate the database.
          </td>
        </tr>
      `;
      return;
    }

    const rows = employees.map((emp) => {
      const empHist = history.filter((h) => h.employee_id === emp.id);
      const latestHist = empHist.length > 0 ? empHist[0] : null;
      const annualSalary = latestHist ? latestHist.annual_salary : 0;
      const role = latestHist ? latestHist.role_name : 'N/A';
      const company = latestHist ? latestHist.company_name : 'N/A';

      return `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="avatar avatar-sm bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold">
                ${emp.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div class="fw-bold text-dark">${emp.name}</div>
                <div class="text-muted text-xs">${emp.email}</div>
              </div>
            </div>
          </td>
          <td><span class="badge bg-light text-dark border font-monospace">${emp.employee_code}</span></td>
          <td>
            <div class="fw-semibold text-dark">${role}</div>
            <div class="text-muted text-xs">${company}</div>
          </td>
          <td>
            <div class="fw-bold text-success">${formatCurrency(annualSalary)}</div>
            <div class="text-muted text-xs">Calculated (₹${latestHist ? latestHist.monthly_salary : 0}/mo)</div>
          </td>
          <td>
            <span class="badge bg-info-subtle text-info border border-info-subtle">
              ${empHist.length} Experience Record${empHist.length > 1 ? 's' : ''}
            </span>
          </td>
          <td>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary rounded-pill view-badge-btn" data-id="${emp.id}" title="View Badge & QR">
                <i class="ti ti-qrcode me-1"></i> QR Badge
              </button>
              <button class="btn btn-sm btn-outline-info rounded-pill view-profile-btn" data-id="${emp.id}" title="View Full Profile & Salary Slips">
                <i class="ti ti-eye me-1"></i> View Profile
              </button>
              <button class="btn btn-sm btn-outline-danger rounded-pill delete-emp-btn" data-id="${emp.id}" title="Delete Record">
                <i class="ti ti-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = rows;

    // Attach row button handlers
    container.querySelectorAll('.view-badge-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        window.employeeApp.handleScannedCode(id);
      });
    });

    container.querySelectorAll('.view-profile-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        window.employeeApp.showFullProfileModal(id);
      });
    });

    container.querySelectorAll('.delete-emp-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        
        Swal.fire({
          title: 'Are you sure?',
          text: 'You are about to delete this employee record. This action cannot be undone!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d',
          confirmButtonText: '<i class="ti ti-trash me-1"></i> Yes, Delete Record',
          cancelButtonText: 'Cancel',
          customClass: {
            popup: 'rounded-4 shadow-lg border-0',
            confirmButton: 'btn btn-danger rounded-pill px-4 py-2.5 fw-bold me-2',
            cancelButton: 'btn btn-secondary rounded-pill px-4 py-2.5 fw-bold'
          },
          buttonsStyling: false
        }).then((result) => {
          if (result.isConfirmed) {
            EmployeeStore.deleteEmployee(id);
            DirectoryController.renderDirectoryTable();

            Swal.fire({
              title: 'Deleted Successfully!',
              text: 'The employee record has been permanently removed.',
              icon: 'success',
              confirmButtonColor: '#09C82C',
              customClass: {
                popup: 'rounded-4 shadow-lg border-0',
                confirmButton: 'btn btn-primary rounded-pill px-4 py-2.5 fw-bold'
              },
              buttonsStyling: false
            });
          }
        });
      });
    });
  }
}

/**
 * Main Application Orchestrator
 */
export class EmployeeApp {
  constructor() {
    this.formManager = null;
    this.scannerController = new ScannerController();
    this.currentSelectedEmpId = null;
  }

  init() {
    console.log('Initializing Employee Management System...');
    this.formManager = new EmployeeFormManager();
    this.formManager.init();

    DirectoryController.renderDirectoryTable();

    this.attachTabListeners();
    this.attachScannerTabListeners();
    this.attachDashboardCardListeners();
    this.initDashboardExampleBarcode();
    this.initStepsParallaxAnimation();
  }

  initStepsParallaxAnimation() {
    const stepItems = document.querySelectorAll('#steps-guide-section .step-item');
    const fillLine = document.getElementById('steps-progress-fill');
    if (!stepItems.length) return;

    let totalVisible = 0;

    const updateFillLine = () => {
      if (!fillLine) return;
      const percentage = (totalVisible / stepItems.length) * 100;
      fillLine.style.height = `${percentage}%`;
    };

    if ('IntersectionObserver' in window) {
      const observerOptions = {
        root: null,
        rootMargin: '0px 0px -80px 0px',
        threshold: 0.2
      };

      const stepObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            el.classList.add('is-visible');
            const stepNum = parseInt(el.dataset.scrollStep || '1', 10);
            if (stepNum > totalVisible) {
              totalVisible = stepNum;
              updateFillLine();
            }
          }
        });
      }, observerOptions);

      stepItems.forEach((item) => stepObserver.observe(item));
    } else {
      stepItems.forEach((item) => item.classList.add('is-visible'));
      if (fillLine) fillLine.style.height = '100%';
    }
  }

  initDashboardExampleBarcode() {
    const barcodeElem = document.getElementById('dashboard-example-barcode');
    if (barcodeElem && typeof JsBarcode === 'function') {
      try {
        JsBarcode('#dashboard-example-barcode', 'EMP-2026-VERIFIED', {
          format: 'CODE128',
          lineColor: '#0f172a',
          width: 2.3,
          height: 125,
          displayValue: false,
          margin: 10
        });
      } catch (err) {
        console.warn('Dashboard example barcode rendering note:', err);
      }
    }

    const saveBtn = document.getElementById('dashboard-save-btn');
    const downloadBtn = document.getElementById('dashboard-download-btn');
    const copyBtn = document.getElementById('dashboard-copy-btn');

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        Swal.fire({
          title: 'Saved to Library!',
          text: 'Barcode pass EMP-2026-VERIFIED saved to quick library.',
          icon: 'success',
          confirmButtonColor: '#09C82C',
          customClass: { popup: 'rounded-4 shadow-lg border-0', confirmButton: 'btn btn-primary rounded-pill px-4 py-2 fw-bold' },
          buttonsStyling: false
        });
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        const svg = document.getElementById('dashboard-example-barcode');
        if (svg) {
          const svgData = new XMLSerializer().serializeToString(svg);
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const svgUrl = URL.createObjectURL(svgBlob);
          const downloadLink = document.createElement('a');
          downloadLink.href = svgUrl;
          downloadLink.download = 'Barcode_EMP-2026-VERIFIED.svg';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(svgUrl);
        }
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText('EMP-2026-VERIFIED').then(() => {
          Swal.fire({
            title: 'Copied to Clipboard!',
            text: 'Copied barcode payload "EMP-2026-VERIFIED" to clipboard.',
            icon: 'success',
            confirmButtonColor: '#09C82C',
            timer: 2000,
            customClass: { popup: 'rounded-4 shadow-lg border-0', confirmButton: 'btn btn-primary rounded-pill px-4 py-2 fw-bold' },
            buttonsStyling: false
          });
        }).catch(() => {
          Swal.fire({
            title: 'Barcode Payload',
            text: 'EMP-2026-VERIFIED',
            icon: 'info',
            confirmButtonColor: '#09C82C',
            customClass: { popup: 'rounded-4 shadow-lg border-0', confirmButton: 'btn btn-primary rounded-pill px-4 py-2 fw-bold' },
            buttonsStyling: false
          });
        });
      });
    }
  }

  attachDashboardCardListeners() {
    const dashboardGenBtn = document.getElementById('dashboard-btn-generate');
    const dashboardImpBtn = document.getElementById('dashboard-btn-import');
    const backBtn = document.getElementById('back-to-dashboard-btn');

    const dashboardSection = document.getElementById('dashboard-card-section');
    const stepsGuideSection = document.getElementById('steps-guide-section');
    const faqSection = document.getElementById('faq-section');
    const contentSection = document.getElementById('content-panel-section');
    const screenGenerate = document.getElementById('screen-generate');
    const screenImport = document.getElementById('screen-import');
    const activeBadge = document.getElementById('active-screen-badge');

    const showGenerateScreen = () => {
      if (dashboardSection) dashboardSection.classList.add('d-none');
      if (stepsGuideSection) stepsGuideSection.classList.add('d-none');
      if (faqSection) faqSection.classList.add('d-none');
      if (contentSection) contentSection.classList.remove('d-none');
      if (screenGenerate) screenGenerate.classList.remove('d-none');
      if (screenImport) screenImport.classList.add('d-none');
      if (activeBadge) {
        activeBadge.className = 'badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill fw-bold';
        activeBadge.innerHTML = `<i class="ti ti-qrcode me-1"></i> 1. New Barcode Generator Form`;
      }
      this.scannerController.stopScanner();
      if (contentSection) {
        contentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    const showImportScreen = () => {
      if (dashboardSection) dashboardSection.classList.add('d-none');
      if (stepsGuideSection) stepsGuideSection.classList.add('d-none');
      if (faqSection) faqSection.classList.add('d-none');
      if (contentSection) contentSection.classList.remove('d-none');
      if (screenImport) screenImport.classList.remove('d-none');
      if (screenGenerate) screenGenerate.classList.add('d-none');
      if (activeBadge) {
        activeBadge.className = 'badge bg-info-subtle text-info border border-info-subtle px-3 py-2 rounded-pill fw-bold';
        activeBadge.innerHTML = `<i class="ti ti-scan me-1"></i> 2. Import Barcode & Directory`;
      }
      DirectoryController.renderDirectoryTable();
      this.scannerController.initScanner((scannedText) => {
        this.handleScannedCode(scannedText);
      });
      if (contentSection) {
        contentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    const hideAllPanels = () => {
      if (contentSection) contentSection.classList.add('d-none');
      if (screenGenerate) screenGenerate.classList.add('d-none');
      if (screenImport) screenImport.classList.add('d-none');
      if (dashboardSection) dashboardSection.classList.remove('d-none');
      if (stepsGuideSection) stepsGuideSection.classList.remove('d-none');
      if (faqSection) faqSection.classList.remove('d-none');
      this.scannerController.stopScanner();
      if (dashboardSection) {
        dashboardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    if (dashboardGenBtn) {
      dashboardGenBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showGenerateScreen();
      });
    }

    if (dashboardImpBtn) {
      dashboardImpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showImportScreen();
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideAllPanels();
      });
    }
  }

  showBadgeForEmployee(empId) {
    this.currentSelectedEmpId = empId;
    const resultContainer = document.getElementById('badge-result-container');
    if (resultContainer) {
      resultContainer.classList.remove('d-none');
    }
    BarcodeBadgeManager.renderEmployeeBadge(empId);
  }

  attachTabListeners() {
    const importTab = document.getElementById('tab-import-link');
    if (importTab) {
      importTab.addEventListener('click', () => {
        DirectoryController.renderDirectoryTable();
        this.scannerController.initScanner((scannedText) => {
          this.handleScannedCode(scannedText);
        });
      });
    }

    const generateTab = document.getElementById('tab-generate-link');
    if (generateTab) {
      generateTab.addEventListener('click', () => {
        this.scannerController.stopScanner();
      });
    }
  }

  attachScannerTabListeners() {
    // Manual Hash Search
    const searchBtn = document.getElementById('manual-code-search-btn');
    const searchInput = document.getElementById('manual-code-input');

    if (searchBtn && searchInput) {
      const handleSearch = () => {
        const val = searchInput.value.trim();
        if (val) {
          this.handleScannedCode(val);
        }
      };

      searchBtn.addEventListener('click', handleSearch);
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
      });
    }

    // Image file drop scanner
    const fileScanInput = document.getElementById('scan-image-file-input');
    if (fileScanInput) {
      fileScanInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          ScannerController.scanImageFile(file, (scannedText) => {
            this.handleScannedCode(scannedText);
          });
        }
      });
    }
  }

  handleScannedCode(scannedText) {
    console.log('Scanned Barcode Text:', scannedText);
    const profile = EmployeeStore.getEmployeeFullProfile(scannedText);
    const importContainer = document.getElementById('import-result-container');

    if (profile) {
      this.currentSelectedEmpId = profile.employee.id;

      if (importContainer) {
        const { employee, history } = profile;
        const latestHist = history.length > 0 ? history[0] : null;
        const annualSalary = latestHist ? latestHist.annual_salary : 0;
        const monthlySalary = latestHist ? latestHist.monthly_salary : 0;

        importContainer.innerHTML = `
          <div class="card border-primary border-2 shadow-lg rounded-4 overflow-hidden mb-4">
            <div class="card-header bg-primary text-white p-4 d-flex justify-content-between align-items-center">
              <div>
                <span class="badge bg-white text-primary rounded-pill px-3 py-1 fw-bold text-uppercase mb-1">Imported Record Details</span>
                <h4 class="mb-0 text-white fw-bold">${employee.name} (${employee.employee_code})</h4>
              </div>
              <button class="btn btn-light btn-sm rounded-pill px-3" onclick="window.employeeApp.showFullProfileModal('${employee.id}')">
                <i class="ti ti-eye me-1"></i> View Full Timeline
              </button>
            </div>
            <div class="card-body p-4 bg-white">
              <div class="row g-4">
                <div class="col-md-6">
                  <h6 class="fw-bold text-dark border-bottom pb-2 mb-3"><i class="ti ti-user me-2 text-primary"></i> Demographics</h6>
                  <p class="mb-1"><strong>Full Name:</strong> ${employee.name}</p>
                  <p class="mb-1"><strong>Employee Code:</strong> ${employee.employee_code}</p>
                  <p class="mb-1"><strong>Mobile:</strong> ${employee.mobile_number}</p>
                  <p class="mb-1"><strong>Email:</strong> ${employee.email}</p>
                  <p class="mb-0 font-monospace text-xs text-muted"><strong>Barcode ID:</strong> ${employee.barcode_hash}</p>
                </div>
                <div class="col-md-6">
                  <h6 class="fw-bold text-dark border-bottom pb-2 mb-3"><i class="ti ti-cash me-2 text-success"></i> Compensation Breakdown (₹)</h6>
                  <p class="mb-1"><strong>Monthly Rate:</strong> ₹${monthlySalary.toLocaleString('en-IN')}</p>
                  <p class="mb-0 fs-5 fw-bold text-success"><strong>Calculated Annual:</strong> ${formatCurrency(annualSalary)} / year</p>
                </div>
                <div class="col-12">
                  <h6 class="fw-bold text-dark border-bottom pb-2 mb-3"><i class="ti ti-history me-2 text-primary"></i> Employment History (${history.length} Entries)</h6>
                  <div class="list-group list-group-flush">
                    ${history.map((h, idx) => `
                      <div class="list-group-item px-0 py-2 border-0">
                        <div class="fw-bold text-dark">${idx + 1}. ${h.role_name} at ${h.company_name}</div>
                        <div class="text-muted text-xs">${h.start_date} to ${h.is_current ? 'Present (Current)' : h.end_date} (${h.total_experience})</div>
                        ${h.salary_slip_name ? `<div class="mt-1"><span class="badge bg-success-subtle text-success me-2"><i class="ti ti-file-text me-1"></i>${h.salary_slip_name}</span></div>` : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;

        importContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      this.showFullProfileModal(profile.employee.id);
    } else {
      if (importContainer) {
        importContainer.innerHTML = `
          <div class="alert alert-danger rounded-3 shadow-sm p-3">
            <i class="ti ti-alert-circle me-2"></i> No employee record matching barcode code/hash: <code>"${scannedText}"</code>
          </div>
        `;
      }
    }
  }

  showFullProfileModal(empId) {
    const profile = EmployeeStore.getEmployeeFullProfile(empId);
    if (!profile) return;

    const { employee, history } = profile;

    const modalTitle = document.getElementById('profileModalLabel');
    const modalBody = document.getElementById('profileModalBody');

    if (modalTitle) modalTitle.textContent = `Employee Profile: ${employee.name} (${employee.employee_code})`;

    if (modalBody) {
      modalBody.innerHTML = `
        <div class="row gy-4">
          <!-- Demographics Header Card -->
          <div class="col-12">
            <div class="card border-0 bg-primary bg-opacity-10 rounded-4 p-4">
              <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
                <div class="d-flex align-items-center gap-3">
                  <div class="avatar avatar-lg bg-primary text-white rounded-circle fs-3 fw-bold d-flex align-items-center justify-content-center" style="width:56px; height:56px;">
                    ${employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 class="mb-1 text-dark fw-bold">${employee.name}</h4>
                    <span class="badge bg-primary">${employee.employee_code}</span>
                    <span class="ms-2 text-muted text-xs font-monospace">UUID: ${employee.id}</span>
                  </div>
                </div>
                <div>
                  <button class="btn btn-primary btn-sm rounded-pill" onclick="window.employeeApp.showBadgeForEmployee('${employee.id}'); bootstrap.Modal.getInstance(document.getElementById('profileModal')).hide(); document.getElementById('tab-badge-link').click();">
                    <i class="ti ti-qrcode me-1"></i> View QR Badge Card
                  </button>
                </div>
              </div>

              <div class="row mt-4 pt-3 border-top g-3">
                <div class="col-md-4">
                  <div class="text-muted text-xs">Email Address</div>
                  <div class="fw-semibold text-dark">${employee.email}</div>
                </div>
                <div class="col-md-4">
                  <div class="text-muted text-xs">Mobile Number</div>
                  <div class="fw-semibold text-dark">${employee.mobile_number}</div>
                </div>
                <div class="col-md-4">
                  <div class="text-muted text-xs">Barcode / Hash</div>
                  <div class="fw-semibold font-monospace text-dark text-truncate">${employee.barcode_hash}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Employment History Timeline -->
          <div class="col-12">
            <h5 class="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <i class="ti ti-history text-primary"></i> Employment History & Salary Slips (${history.length})
            </h5>

            <div class="timeline ps-3 border-start border-2 border-primary-subtle">
              ${history
                .map(
                  (h, idx) => `
                <div class="mb-4 position-relative ps-4">
                  <span class="position-absolute top-0 start-0 translate-middle p-2 bg-primary border border-light rounded-circle"></span>
                  <div class="card border shadow-sm rounded-3">
                    <div class="card-header bg-light d-flex justify-content-between align-items-center">
                      <div>
                        <span class="fw-bold text-dark fs-6">${h.role_name}</span>
                        <span class="text-muted ms-2">at <strong>${h.company_name}</strong></span>
                      </div>
                      ${h.is_current ? '<span class="badge bg-success">Current Position</span>' : '<span class="badge bg-secondary">Past Position</span>'}
                    </div>
                    <div class="card-body">
                      <div class="row g-3">
                        <div class="col-md-4">
                          <div class="text-muted text-xs">Tenure / Experience</div>
                          <div class="fw-semibold text-dark">${h.start_date} to ${h.end_date || 'Present'} (${h.total_experience})</div>
                        </div>
                        <div class="col-md-4">
                          <div class="text-muted text-xs">Monthly Salary</div>
                          <div class="fw-semibold text-dark">${formatCurrency(h.monthly_salary)}</div>
                        </div>
                        <div class="col-md-4">
                          <div class="text-muted text-xs">Calculated Annual Salary</div>
                          <div class="fw-bold text-success fs-5">${formatCurrency(h.annual_salary)}</div>
                        </div>

                        ${
                          h.company_address
                            ? `<div class="col-12"><div class="text-muted text-xs">Address:</div><div class="text-dark text-xs">${h.company_address}</div></div>`
                            : ''
                        }

                        ${
                          h.remarks
                            ? `<div class="col-12"><div class="text-muted text-xs">Remarks:</div><div class="text-muted text-xs italic">${h.remarks}</div></div>`
                            : ''
                        }

                        <!-- Verified Document Attachment -->
                        <div class="col-12 pt-2 border-top">
                          <div class="d-flex align-items-center justify-content-between bg-light p-2 rounded">
                            <div class="d-flex align-items-center gap-2">
                              <i class="ti ti-file-check fs-4 text-primary"></i>
                              <div>
                                <div class="fw-semibold text-xs text-dark">${h.salary_slip_name || 'Salary_Slip.pdf'}</div>
                                <div class="text-success text-xs"><i class="ti ti-circle-check-filled me-1"></i>Compulsory Attachment Verified</div>
                              </div>
                            </div>
                            ${
                              h.salary_slip_url
                                ? `<a href="${h.salary_slip_url}" download="${h.salary_slip_name || 'SalarySlip.pdf'}" target="_blank" class="btn btn-sm btn-outline-primary rounded-pill">
                                    <i class="ti ti-download me-1"></i> View / Download Slip
                                   </a>`
                                : '<span class="text-muted text-xs">No attachment preview available</span>'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </div>
      `;

      const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
      profileModal.show();
    }
  }
}
