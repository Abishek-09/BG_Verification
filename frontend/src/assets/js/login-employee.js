/**
 * =====================================================================
 * Background Verification System - Dedicated Employee & WFH Portal Logic
 * Location: src/assets/js/login-employee.js
 * =====================================================================
 */

const API_BASE = '/api/v1';

document.addEventListener('DOMContentLoaded', () => {
  initLiveClock();
  attachEmployeeLoginForm();
  attachWfhPunchForm();
  attachQuickLogins();
  attachPinToggle();
  attachNavigationHelpers();
});

/**
 * Initialize Live System Clock & Shift Window Status
 */
function initLiveClock() {
  const clockEl = document.getElementById('wfh-live-clock');
  const shiftPill = document.getElementById('wfh-shift-status-pill');

  const updateClock = () => {
    const now = new Date();
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    }

    if (shiftPill) {
      const hours = now.getHours();
      const mins = now.getMinutes();
      const currentMins = hours * 60 + mins;

      // 09:00 AM is 540 mins, 09:30 AM is 570 mins, 10:00 AM grace is 600 mins
      if (currentMins >= 540 && currentMins <= 570) {
        shiftPill.className = 'badge bg-success-subtle text-success border border-success-subtle rounded-pill text-xxs px-2 py-0.5';
        shiftPill.textContent = 'Shift Window Active (09:00 - 09:30 AM)';
      } else if (currentMins > 570 && currentMins <= 600) {
        shiftPill.className = 'badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill text-xxs px-2 py-0.5';
        shiftPill.textContent = 'Grace Window Active (Late Marking)';
      } else if (currentMins > 600 && currentMins <= 1080) { // 10:00 AM to 6:00 PM
        shiftPill.className = 'badge bg-info-subtle text-info border border-info-subtle rounded-pill text-xxs px-2 py-0.5';
        shiftPill.textContent = 'Standard Workday Active';
      } else {
        shiftPill.className = 'badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill text-xxs px-2 py-0.5';
        shiftPill.textContent = 'After-Hours Window';
      }
    }
  };

  updateClock();
  setInterval(updateClock, 1000);
}

/**
 * Handle Employee Self-Service Sign-In
 */
function attachEmployeeLoginForm() {
  const form = document.getElementById('form-emp-login');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const codeInput = document.getElementById('emp-login-code');
    const pinInput = document.getElementById('emp-login-pin');
    const submitBtn = document.getElementById('btn-submit-emp-login');

    const employee_code = (codeInput?.value || '').trim();
    const pin = (pinInput?.value || '').trim();

    if (!employee_code || !pin) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Information',
        text: 'Please provide both your Employee ID / Code and PIN.',
        confirmButtonColor: '#059669'
      });
      return;
    }

    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Verifying Credentials...';

    try {
      const res = await fetch(`${API_BASE}/auth/employee-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_code, pin })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid Employee Code or PIN.');
      }

      // Store Authentication tokens & user details
      localStorage.setItem('bg_auth_token', data.token || '');
      localStorage.setItem('bg_auth_role', 'employee');
      localStorage.setItem('bg_auth_user', JSON.stringify(data.employee || {}));
      localStorage.setItem('bg_active_employee_code', data.employee?.employeeCode || employee_code);
      localStorage.setItem('bg_employee_target_subview', 'dashboard');

      await Swal.fire({
        icon: 'success',
        title: `Welcome, ${data.employee?.name || employee_code}!`,
        html: `<div class="text-center py-2">
          <div class="badge ${data.employee?.workLocation === 'Remote' ? 'bg-info' : 'bg-secondary'} text-white rounded-pill px-3 py-1 text-xs mb-2">
            ${data.employee?.workLocation === 'Remote' ? '💻 Remote (WFH)' : '🏢 Office On-Site'}
          </div>
          <p class="mb-0 text-muted text-xs">${data.employee?.companyName || ''} • ${data.employee?.roleName || 'Staff'}</p>
        </div>`,
        timer: 1600,
        showConfirmButton: false
      });

      // Redirect to Employee Self-Service Dashboard in index.html
      window.location.href = '/#employee-dashboard';

    } catch (err) {
      console.error('Employee Login Error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Sign In Failed',
        text: err.message || 'Unable to authenticate employee record.',
        confirmButtonColor: '#059669'
      });
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

/**
 * Handle Direct Work-From-Home (WFH) Attendance Punch
 */
function attachWfhPunchForm() {
  const form = document.getElementById('form-wfh-punch');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('wfh-punch-code')?.value?.trim();
    const pin = document.getElementById('wfh-punch-pin')?.value?.trim();
    const notes = document.getElementById('wfh-punch-notes')?.value?.trim() || 'Remote Web WFH';
    const submitBtn = document.getElementById('btn-submit-wfh-punch');

    if (!code || !pin) {
      Swal.fire({
        icon: 'warning',
        title: 'Credentials Required',
        text: 'Please enter your Employee Code and PIN to authorize this punch.',
        confirmButtonColor: '#0891b2'
      });
      return;
    }

    const originalBtn = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Submitting Punch...';

    try {
      // Step 1: Verify employee credentials first
      const authRes = await fetch(`${API_BASE}/auth/employee-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_code: code, pin })
      });

      const authData = await authRes.json();
      if (!authRes.ok || !authData.success) {
        throw new Error(authData.message || 'Employee authentication failed. Check code and PIN.');
      }

      // Step 2: Record the attendance punch
      const punchRes = await fetch(`${API_BASE}/attendance/barcode-punch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_code: code,
          location: `WFH: ${notes}`
        })
      });

      const punchData = await punchRes.json();
      if (!punchRes.ok || !punchData.success) {
        throw new Error(punchData.message || 'Failed to record attendance punch.');
      }

      const punchAction = punchData.action || 'Attendance Recorded';
      const punchTime = punchData.time || new Date().toLocaleTimeString();

      await Swal.fire({
        icon: 'success',
        title: `${punchAction} Successful!`,
        html: `<div class="text-center py-2">
          <div class="fs-1 text-info mb-2"><i class="ti ti-circle-check"></i></div>
          <h6 class="fw-bold text-dark mb-1">${punchData.employee?.name || authData.employee?.name} (${code})</h6>
          <p class="text-muted text-xs mb-2">Recorded at <strong>${punchTime}</strong></p>
          <div class="badge bg-info-subtle text-info border border-info-subtle rounded-pill px-3 py-1 text-xs">
            💻 Mode: Remote WFH Web Punch
          </div>
          ${punchData.duration ? `<div class="mt-2 text-xs text-muted">Session Duration: <strong>${punchData.duration}</strong></div>` : ''}
        </div>`,
        confirmButtonColor: '#0891b2',
        confirmButtonText: 'Open Employee Dashboard'
      }).then((result) => {
        if (result.isConfirmed) {
          // Log user in and open dashboard
          localStorage.setItem('bg_auth_token', authData.token || '');
          localStorage.setItem('bg_auth_role', 'employee');
          localStorage.setItem('bg_auth_user', JSON.stringify(authData.employee || {}));
          localStorage.setItem('bg_active_employee_code', code);
          localStorage.setItem('bg_employee_target_subview', 'wfh');
          window.location.href = '/#employee-dashboard';
        }
      });

      // Clear notes field
      const notesInput = document.getElementById('wfh-punch-notes');
      if (notesInput) notesInput.value = '';

    } catch (err) {
      console.error('WFH Punch Error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Attendance Punch Error',
        text: err.message || 'Failed to verify employee or record punch.',
        confirmButtonColor: '#0891b2'
      });
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtn;
    }
  });
}

/**
 * 1-Click Quick Demo Employee Logins
 */
function attachQuickLogins() {
  const quickBtns = document.querySelectorAll('.quick-emp-btn');
  quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-code');
      const pin = btn.getAttribute('data-pin');
      const codeInput = document.getElementById('emp-login-code');
      const pinInput = document.getElementById('emp-login-pin');
      const wfhCodeInput = document.getElementById('wfh-punch-code');
      const wfhPinInput = document.getElementById('wfh-punch-pin');

      if (codeInput && pinInput) {
        codeInput.value = code;
        pinInput.value = pin;
      }
      if (wfhCodeInput && wfhPinInput) {
        wfhCodeInput.value = code;
        wfhPinInput.value = pin;
      }

      // Automatically trigger login form submit
      const form = document.getElementById('form-emp-login');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });
  });
}

/**
 * PIN Visibility Toggle
 */
function attachPinToggle() {
  const toggleBtn = document.getElementById('btn-toggle-emp-pin');
  const pinInput = document.getElementById('emp-login-pin');
  const icon = document.getElementById('icon-emp-pin');
  if (toggleBtn && pinInput && icon) {
    toggleBtn.addEventListener('click', () => {
      if (pinInput.type === 'password') {
        pinInput.type = 'text';
        icon.classList.replace('ti-eye', 'ti-eye-off');
      } else {
        pinInput.type = 'password';
        icon.classList.replace('ti-eye-off', 'ti-eye');
      }
    });
  }
}

/**
 * Switch to Login helper tab link
 */
function attachNavigationHelpers() {
  const linkSwitch = document.getElementById('link-switch-to-login');
  const tabBtnLogin = document.getElementById('tab-btn-emp-login');
  if (linkSwitch && tabBtnLogin) {
    linkSwitch.addEventListener('click', () => {
      tabBtnLogin.click();
    });
  }
}
