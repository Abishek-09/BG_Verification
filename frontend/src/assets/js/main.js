

// Import Bootstrap JS
import * as bootstrap from 'bootstrap';
import './custom.js';
import { EmployeeApp } from './employee-system.js';

// Import SCSS
import '../scss/style.scss';

// Expose bootstrap to window for modals
window.bootstrap = bootstrap;

// Initialize Employee Management App
document.addEventListener('DOMContentLoaded', () => {
  window.employeeApp = new EmployeeApp();
  window.employeeApp.init();
});