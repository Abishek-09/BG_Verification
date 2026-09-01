const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const filesToGenerate = [
  {
    html: path.resolve(__dirname, 'public', 'docs.html'),
    pdf: path.resolve(__dirname, 'public', 'Employee_Verification_and_Attendance_System_Complete_Flow_and_Documentation.pdf'),
    title: 'Complete Flow and Documentation'
  },
  {
    html: path.resolve(__dirname, 'public', 'architecture-diagram.html'),
    pdf: path.resolve(__dirname, 'public', 'Employee_Verification_and_Attendance_System_Architecture_Diagram.pdf'),
    title: 'Architecture and Workflow Diagram'
  }
];

console.log('=== Compiling Official System PDFs ===\n');

filesToGenerate.forEach((item, idx) => {
  console.log(`[${idx + 1}/${filesToGenerate.length}] Generating PDF for: ${item.title}`);
  console.log('  Source HTML:', item.html);
  console.log('  Target PDF: ', item.pdf);

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--allow-file-access-from-files',
    '--no-pdf-header-footer',
    `--print-to-pdf="${item.pdf}"`,
    `"file:///${item.html.replace(/\\/g, '/')}"`
  ];

  try {
    execSync(`"${chromePath}" ${args.join(' ')}`, { stdio: 'inherit' });
    if (fs.existsSync(item.pdf)) {
      console.log(`  ✅ SUCCESS (${(fs.statSync(item.pdf).size / 1024).toFixed(1)} KB)\n`);
    } else {
      console.error('  ❌ Target PDF file not found after Chrome compilation.\n');
    }
  } catch (err) {
    console.error(`  ❌ Error generating ${item.title}:`, err.message);
  }
});
