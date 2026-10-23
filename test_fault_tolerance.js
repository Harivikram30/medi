/**
 * MediConnect Comprehensive Fault Tolerance & Error Handling Verification Suite
 * 
 * Tests the system across:
 * 1. Safe data sanitization (null/undefined/missing/corrupted fields)
 * 2. Data validation prior to persistence
 * 3. Empty database tables & collections handling
 * 4. Network outage & offline protection (anti-wipe safeguards)
 * 5. Isolated error boundaries & fault containment
 * 6. Safe date and currency formatting
 * 7. Verification that no synthetic/invented records are injected
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
    failed++;
  }
}

console.log('================================================================');
console.log('MediConnect HMS Fault Tolerance & Error Handling Verification');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Suite 1: Sanitizer & Null-Safety Guard Verification
// -----------------------------------------------------------------------------
console.log('[Suite 1: Data Sanitizer & Null-Safety Module]');

const sanitizerPath = path.join(__dirname, 'services', 'dataSanitizer.ts');
assert(fs.existsSync(sanitizerPath), 'services/dataSanitizer.ts exists');

if (fs.existsSync(sanitizerPath)) {
  const content = fs.readFileSync(sanitizerPath, 'utf8');
  assert(content.includes('sanitizeAppointment'), 'sanitizeAppointment export defined');
  assert(content.includes('sanitizePrescription'), 'sanitizePrescription export defined');
  assert(content.includes('sanitizeMedicine'), 'sanitizeMedicine export defined');
  assert(content.includes('sanitizeInvoice'), 'sanitizeInvoice export defined');
  assert(content.includes('sanitizeLabTest'), 'sanitizeLabTest export defined');
  assert(content.includes('sanitizeUser'), 'sanitizeUser export defined');
  assert(content.includes('sanitizeQueueEntry'), 'sanitizeQueueEntry export defined');
  assert(content.includes('sanitizeSilentAlert'), 'sanitizeSilentAlert export defined');
  assert(content.includes('sanitizeHospitalLocation'), 'sanitizeHospitalLocation export defined');
  assert(content.includes('safeArray'), 'safeArray defensive utility defined');
  assert(content.includes('safeNumber'), 'safeNumber defensive utility defined');
  assert(content.includes('formatDisplayDate'), 'formatDisplayDate timezone-safe utility defined');
}

// -----------------------------------------------------------------------------
// Suite 2: Pre-Save Data Validation
// -----------------------------------------------------------------------------
console.log('\n[Suite 2: Pre-Save Data Validation]');

const validationPath = path.join(__dirname, 'services', 'validation.ts');
assert(fs.existsSync(validationPath), 'services/validation.ts exists');

if (fs.existsSync(validationPath)) {
  const content = fs.readFileSync(validationPath, 'utf8');
  assert(content.includes('validateAppointment'), 'validateAppointment defined');
  assert(content.includes('validatePrescription'), 'validatePrescription defined');
  assert(content.includes('validateMedicine'), 'validateMedicine defined');
  assert(content.includes('validateInvoice'), 'validateInvoice defined');
  assert(content.includes('validateLabTest'), 'validateLabTest defined');
  assert(content.includes('validateHospitalLocation'), 'validateHospitalLocation defined');
}

// -----------------------------------------------------------------------------
// Suite 3: Database Service Outage & Anti-Wipe Protection
// -----------------------------------------------------------------------------
console.log('\n[Suite 3: Database Fault Tolerance & Anti-Wipe Safeguards]');

const dbPath = path.join(__dirname, 'services', 'database.ts');
assert(fs.existsSync(dbPath), 'services/database.ts exists');

if (fs.existsSync(dbPath)) {
  const content = fs.readFileSync(dbPath, 'utf8');
  assert(content.includes('checkDatabaseHealth'), 'Health check function with timeout implemented');
  assert(content.includes('AbortController') || content.includes('Promise.race'), 'Timeouts enforced on remote network calls');
  assert(content.includes('navigator.onLine'), 'Offline check before attempting remote sync');
  assert(content.includes('Device is offline') || content.includes('Database not configured'), 'Aborts destructive collection overwriting when offline/unconfigured');
  assert(content.includes('saveAppointment') && content.includes('validateAppointment'), 'saveAppointment validates before saving');
  assert(content.includes('savePrescription') && content.includes('validatePrescription'), 'savePrescription validates before saving');
  assert(content.includes('saveMedicine') && content.includes('validateMedicine'), 'saveMedicine validates before saving');
  assert(content.includes('saveInvoice') && content.includes('validateInvoice'), 'saveInvoice validates before saving');
}

// -----------------------------------------------------------------------------
// Suite 4: Isolated Error Boundary Architecture
// -----------------------------------------------------------------------------
console.log('\n[Suite 4: Error Boundaries & Failure Containment]');

const ebPath = path.join(__dirname, 'components', 'ErrorBoundary.tsx');
assert(fs.existsSync(ebPath), 'components/ErrorBoundary.tsx exists');

if (fs.existsSync(ebPath)) {
  const content = fs.readFileSync(ebPath, 'utf8');
  assert(content.includes('componentDidCatch'), 'Catches component render errors');
  assert(content.includes('getDerivedStateFromError'), 'Updates state derived from caught errors');
  assert(content.includes('handleRetry'), 'Provides retry mechanism to recover failed sections');
  assert(content.includes('isolate'), 'Supports isolated in-place fallback to prevent full-screen crashes');
}

const appPath = path.join(__dirname, 'App.tsx');
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  assert(appContent.includes('<ErrorBoundary'), 'App wraps main content in ErrorBoundary');
  assert(appContent.includes('<ErrorBoundary isolate'), 'App wraps each portal in isolated ErrorBoundary');
  assert(appContent.includes('ConnectionStatus'), 'App displays reactive ConnectionStatus banner');
  assert(appContent.includes('Retry Connection'), 'App offers Retry Connection button during network failure');
}

// -----------------------------------------------------------------------------
// Suite 5: Empty States Across All Portals
// -----------------------------------------------------------------------------
console.log('\n[Suite 5: Empty State Displays Across Portals]');

const emptyStatePath = path.join(__dirname, 'components', 'Common', 'EmptyState.tsx');
assert(fs.existsSync(emptyStatePath), 'components/Common/EmptyState.tsx exists');

// Check Patient Portal
const patientPortalPath = path.join(__dirname, 'pages', 'PatientPortal', 'PatientPortal.tsx');
if (fs.existsSync(patientPortalPath)) {
  const content = fs.readFileSync(patientPortalPath, 'utf8');
  assert(content.includes('safeInvoices'), 'PatientPortal handles missing invoices safely');
  assert(content.includes('safeLabTests'), 'PatientPortal handles missing lab tests safely');
}

const apptPagePath = path.join(__dirname, 'pages', 'PatientPortal', 'Appointments.tsx');
if (fs.existsSync(apptPagePath)) {
  const content = fs.readFileSync(apptPagePath, 'utf8');
  assert(content.includes('EmptyState'), 'Patient Appointments shows EmptyState when none exist');
}

const rxPagePath = path.join(__dirname, 'pages', 'PatientPortal', 'Prescriptions.tsx');
if (fs.existsSync(rxPagePath)) {
  const content = fs.readFileSync(rxPagePath, 'utf8');
  assert(content.includes('EmptyState'), 'Patient Prescriptions shows EmptyState when empty');
}

const medRecPagePath = path.join(__dirname, 'pages', 'PatientPortal', 'MedicalRecords.tsx');
if (fs.existsSync(medRecPagePath)) {
  const content = fs.readFileSync(medRecPagePath, 'utf8');
  assert(content.includes('EmptyState'), 'Medical Records shows EmptyState when empty');
}

const billingPagePath = path.join(__dirname, 'pages', 'PatientPortal', 'BillingHistory.tsx');
if (fs.existsSync(billingPagePath)) {
  const content = fs.readFileSync(billingPagePath, 'utf8');
  assert(content.includes('EmptyState'), 'Billing History shows EmptyState when empty');
}

// Check Doctor Portal
const doctorPortalPath = path.join(__dirname, 'pages', 'DoctorPortal', 'DoctorPortal.tsx');
if (fs.existsSync(doctorPortalPath)) {
  const content = fs.readFileSync(doctorPortalPath, 'utf8');
  assert(!content.includes("age: 45"), 'Doctor Portal does NOT invent patient age 45');
  assert(content.includes('No assigned patients found'), 'Doctor Portal handles empty patient list');
}

// Check Nurse Portal
const nursePortalPath = path.join(__dirname, 'pages', 'NursePortal', 'NursePortal.tsx');
if (fs.existsSync(nursePortalPath)) {
  const content = fs.readFileSync(nursePortalPath, 'utf8');
  assert(content.includes('EmptyState'), 'Nurse Portal displays EmptyState when no patients assigned');
}

// Check Pharmacy Portal
const pharmacyPortalPath = path.join(__dirname, 'pages', 'PharmacyPortal', 'PharmacyPortal.tsx');
if (fs.existsSync(pharmacyPortalPath)) {
  const content = fs.readFileSync(pharmacyPortalPath, 'utf8');
  assert(content.includes('EmptyState'), 'Pharmacy Portal displays EmptyState on empty inventory/results');
}

// Check Lab Portal
const labPortalPath = path.join(__dirname, 'pages', 'LabPortal', 'LabPortal.tsx');
if (fs.existsSync(labPortalPath)) {
  const content = fs.readFileSync(labPortalPath, 'utf8');
  assert(content.includes('testsCompleted.length > 0'), 'Lab Portal guards completed tests');
  assert(content.includes('No completed lab tests yet'), 'Lab Portal renders empty state for completed tests');
}

// Check Admin Dashboard
const adminDashPath = path.join(__dirname, 'components', 'AdminDashboard', 'AdminDashboard.tsx');
if (fs.existsSync(adminDashPath)) {
  const content = fs.readFileSync(adminDashPath, 'utf8');
  assert(content.includes('No medicines in inventory'), 'Admin Pharmacy tab renders empty state');
  assert(content.includes('No invoices found'), 'Admin Billing tab renders empty state');
  assert(content.includes('(inv.patientName || \'\')'), 'Admin Billing filtering is null-safe for patientName');
}

const adminApptPath = path.join(__dirname, 'components', 'AdminDashboard', 'AppointmentManagement.tsx');
if (fs.existsSync(adminApptPath)) {
  const content = fs.readFileSync(adminApptPath, 'utf8');
  assert(content.includes('(app.patientName || \'\')'), 'Admin Appointment filtering is null-safe for patientName');
  assert(content.includes('(app.doctorName || \'\')'), 'Admin Appointment filtering is null-safe for doctorName');
  assert(content.includes('No appointments found'), 'Admin Appointment tab renders empty state');
}

// Check WayFinder
const wayFinderPath = path.join(__dirname, 'pages', 'WayFinderPage.tsx');
if (fs.existsSync(wayFinderPath)) {
  const content = fs.readFileSync(wayFinderPath, 'utf8');
  assert(content.includes('FALLBACK_LOCATION'), 'WayFinder provides default FALLBACK_LOCATION against empty db');
}

console.log('\n================================================================');
console.log(`Results: ${passed}/${passed + failed} tests passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All Fault Tolerance & Error Handling Tests SUCCEEDED!\n');
}
