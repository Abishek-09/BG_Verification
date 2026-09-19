/**
 * =====================================================================
 * Background Verification System - Dedicated Company / HR Portal Logic
 * Location: src/assets/js/login-company.js
 * =====================================================================
 */

const API_BASE = '/api/v1';

document.addEventListener('DOMContentLoaded', () => {
  initSavedUsername();
  attachLoginForm();
  attachRegisterForm();
  attachQuickLogins();
  attachPasswordToggle();
  attachForgotPassword();
});

/**
 * Populate remembered username if previously saved
 */
function initSavedUsername() {
  const savedUser = localStorage.getItem('learnhub_saved_comp_username');
  const userInput = document.getElementById('comp-login-user');
  const rememberCheckbox = document.getElementById('comp-remember-me');
  if (savedUser && userInput) {
    userInput.value = savedUser;
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }
}

/**
 * Handle Company / HR Admin Login
 */
function attachLoginForm() {
  const form = document.getElementById('form-company-login');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userInput = document.getElementById('comp-login-user');
    const passInput = document.getElementById('comp-login-pass');
    const rememberCheckbox = document.getElementById('comp-remember-me');
    const submitBtn = document.getElementById('btn-submit-comp-login');

    const username = (userInput?.value || '').trim();
    const password = (passInput?.value || '').trim();

    if (!username || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Fields Missing',
        text: 'Please enter both your Admin Username/Email and Password.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    // Set loading state
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Authenticating...';

    try {
      const res = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid administrator credentials.');
      }

      // Store Authentication tokens & user details
      localStorage.setItem('bg_auth_token', data.token || '');
      localStorage.setItem('bg_auth_role', 'admin');
      localStorage.setItem('bg_auth_user', JSON.stringify(data.user || {}));
      
      const activeComp = {
        company_name: data.user?.companyName || 'Verified Organization',
        username: data.user?.username || username,
        email: data.user?.email || '',
        city: data.user?.city || ''
      };
      localStorage.setItem('learnhub_active_company', JSON.stringify(activeComp));
      localStorage.setItem('learnhub_active_company_v2', JSON.stringify(activeComp));

      // Handle remember me
      if (rememberCheckbox && rememberCheckbox.checked) {
        localStorage.setItem('learnhub_saved_comp_username', username);
      } else {
        localStorage.removeItem('learnhub_saved_comp_username');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Authentication Successful',
        html: `<div class="text-center py-2">
          <p class="mb-1 fw-bold text-dark">${data.message || 'Welcome back!'}</p>
          <div class="badge bg-primary text-white rounded-pill px-3 py-1 text-xs">🏢 ${activeComp.company_name}</div>
        </div>`,
        timer: 1600,
        showConfirmButton: false
      });

      // Redirect directly to company workspace
      window.location.href = '/#company-workspace';

    } catch (err) {
      console.error('Company Login Error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: err.message || 'Could not connect to the authentication server.',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}

/**
 * Handle New Organization Registration
 */
function attachRegisterForm() {
  const form = document.getElementById('form-company-register');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const company_name = document.getElementById('comp-reg-name')?.value?.trim();
    const country = document.getElementById('comp-reg-country')?.value?.trim();
    const state = document.getElementById('comp-reg-state')?.value?.trim();
    const email = document.getElementById('comp-reg-email')?.value?.trim();
    const username = document.getElementById('comp-reg-username')?.value?.trim();
    const password = document.getElementById('comp-reg-password')?.value?.trim();
    const submitBtn = document.getElementById('btn-submit-comp-reg');

    if (!company_name || !username || !email || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Details',
        text: 'Please fill in all required registration fields.',
        confirmButtonColor: '#16a34a'
      });
      return;
    }

    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Initializing Workspace...';

    try {
      const res = await fetch(`${API_BASE}/auth/admin-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name,
          country,
          state,
          email,
          username,
          password
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed.');
      }

      // Auto login on registration
      if (data.token) {
        localStorage.setItem('bg_auth_token', data.token);
        localStorage.setItem('bg_auth_role', 'admin');
        localStorage.setItem('bg_auth_user', JSON.stringify(data.user || {}));
        const registeredComp = {
          company_name: data.user?.companyName || company_name,
          username: data.user?.username || username,
          email: data.user?.email || email,
          city: state
        };
        localStorage.setItem('learnhub_active_company', JSON.stringify(registeredComp));
        localStorage.setItem('learnhub_active_company_v2', JSON.stringify(registeredComp));
      }

      await Swal.fire({
        icon: 'success',
        title: 'Organization Registered!',
        text: `Workspace for ${company_name} is ready. Redirecting...`,
        timer: 1800,
        showConfirmButton: false
      });

      window.location.href = '/#company-workspace';

    } catch (err) {
      console.error('Registration Error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Registration Error',
        text: err.message || 'Failed to initialize company account.',
        confirmButtonColor: '#16a34a'
      });
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

/**
 * 1-Click Quick Demo Admin Logins
 */
function attachQuickLogins() {
  const quickBtns = document.querySelectorAll('.quick-comp-btn');
  quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const user = btn.getAttribute('data-user');
      const pass = btn.getAttribute('data-pass');
      const userInput = document.getElementById('comp-login-user');
      const passInput = document.getElementById('comp-login-pass');
      if (userInput && passInput) {
        userInput.value = user;
        passInput.value = pass;
        // Trigger auto submit
        const form = document.getElementById('form-company-login');
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      }
    });
  });
}

/**
 * Password Visibility Toggle
 */
function attachPasswordToggle() {
  const toggleBtn = document.getElementById('btn-toggle-comp-pass');
  const passInput = document.getElementById('comp-login-pass');
  const icon = document.getElementById('icon-comp-pass');
  if (toggleBtn && passInput && icon) {
    toggleBtn.addEventListener('click', () => {
      if (passInput.type === 'password') {
        passInput.type = 'text';
        icon.classList.replace('ti-eye', 'ti-eye-off');
      } else {
        passInput.type = 'password';
        icon.classList.replace('ti-eye-off', 'ti-eye');
      }
    });
  }
}

/**
 * Forgot Password Prompt
 */
function attachForgotPassword() {
  const link = document.getElementById('link-forgot-pass');
  if (!link) return;
  link.addEventListener('click', () => {
    Swal.fire({
      icon: 'info',
      title: 'Password Recovery',
      html: `<div class="text-start text-xs text-muted">
        <p>To reset your company administrator credentials in development:</p>
        <ul>
          <li>Use one of the pre-seeded demo accounts (e.g. <code>admin_nexgen</code> / <code>password123</code>).</li>
          <li>Or contact your PostgreSQL Database Administrator to issue a password reset.</li>
        </ul>
      </div>`,
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'Understood'
    });
  });
}
