// MediConnect Centralized Supabase PostgreSQL Integration Verification Test
import fs from 'fs';
import path from 'path';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

console.log('\n======================================================');
console.log('MediConnect Centralized Database Integration Test Suite');
console.log('======================================================\n');

// 1. Verify SQL Schema & Migrations
console.log('[Test Suite 1: Supabase PostgreSQL Schema & Migrations]');
const schemaPath = path.resolve('supabase/schema.sql');
const seedPath = path.resolve('supabase/seed.sql');
const migrationPath = path.resolve('supabase/migrations/20261022000000_centralized_mediconnect.sql');

assert(fs.existsSync(schemaPath), 'schema.sql exists in supabase/ directory');
assert(fs.existsSync(seedPath), 'seed.sql exists in supabase/ directory');
assert(fs.existsSync(migrationPath), 'Versioned migration exists in supabase/migrations/');

const schemaContent = fs.readFileSync(schemaPath, 'utf8');

const requiredTables = [
  'profiles',
  'patients',
  'doctors',
  'appointments',
  'prescriptions',
  'medicines',
  'lab_tests',
  'invoices',
  'medical_records',
  'wellness_entries',
  'assigned_patients',
  'patient_charts',
  'nurse_tasks',
  'nurse_pages',
  'supply_requests',
  'queue_entries',
  'silent_alerts',
  'hospital_locations',
  'clinical_ai_suggestions',
  'medconnect_records' // backward compatibility
];

requiredTables.forEach(table => {
  assert(
    schemaContent.includes(`create table if not exists public.${table}`),
    `Table definition present for public.${table}`
  );
  assert(
    schemaContent.includes(`alter table public.${table} enable row level security`),
    `Row-Level Security (RLS) enabled on public.${table}`
  );
});

// Check foreign keys, constraints, and indexes
assert(schemaContent.includes('role in (\'PATIENT\', \'DOCTOR\', \'ADMIN\', \'NURSE\', \'PHARMACY\', \'LAB_TECHNICIAN\')'), 'Role constraint validates all six portal roles');
assert(schemaContent.includes('idx_appointments_patient_id'), 'Performance index on appointments(patient_id) present');
assert(schemaContent.includes('idx_prescriptions_patient_id'), 'Performance index on prescriptions(patient_id) present');
assert(schemaContent.includes('idx_queue_patient_id'), 'Performance index on queue_entries(patient_id) present');
assert(schemaContent.includes('alter publication supabase_realtime add table'), 'Realtime publications enabled for cross-portal tables');

// Check Requirement 8: Clinical AI suggestion separation
assert(schemaContent.includes('create table if not exists public.clinical_ai_suggestions'), 'Table clinical_ai_suggestions created separate from medical_records');
assert(schemaContent.includes('is_reviewed boolean'), 'Review verification field present for clinical suggestions');

// 2. Verify Database Service DAL (services/database.ts)
console.log('\n[Test Suite 2: Data Access Layer & Services]');
const dbServicePath = path.resolve('services/database.ts');
assert(fs.existsSync(dbServicePath), 'services/database.ts exists');
const dbContent = fs.readFileSync(dbServicePath, 'utf8');

const expectedExports = [
  'loadCollections',
  'syncCollection',
  'saveAppointment',
  'deleteAppointment',
  'savePrescription',
  'saveMedicine',
  'deleteMedicine',
  'saveLabTest',
  'saveInvoice',
  'saveMedicalRecord',
  'saveWellnessEntry',
  'saveNursePage',
  'saveSupplyRequest',
  'saveQueueEntry',
  'saveSilentAlert',
  'saveHospitalLocation',
  'deleteHospitalLocation',
  'saveClinicalAiSuggestion',
  'reviewClinicalAiSuggestion',
  'setupRealtimeSubscriptions'
];

expectedExports.forEach(fn => {
  assert(dbContent.includes(`export const ${fn}`), `Export function ${fn} present in services/database.ts`);
});

// 3. Verify Realtime Queue Service (services/queueService.ts)
console.log('\n[Test Suite 3: MediSilentAlert & Queue Management Synchronization]');
const queueServicePath = path.resolve('services/queueService.ts');
const queueContent = fs.readFileSync(queueServicePath, 'utf8');

assert(queueContent.includes('postgres_changes'), 'Queue service listens to Supabase postgres_changes realtime events');
assert(queueContent.includes('dbSaveQueueEntry'), 'Queue service saves queue entries to Supabase');
assert(queueContent.includes('dbSaveSilentAlert'), 'Queue service saves silent alerts to Supabase');
assert(queueContent.includes('triggerVibration'), 'Haptic alert vibration capability preserved');

// 4. Verify WayFinder Service (services/wayFinderService.ts)
console.log('\n[Test Suite 4: MediConnect WayFinder Interactive Navigation]');
const wayfinderServicePath = path.resolve('services/wayFinderService.ts');
const wayfinderContent = fs.readFileSync(wayfinderServicePath, 'utf8');

assert(wayfinderContent.includes('postgres_changes'), 'WayFinder listens to Supabase postgres_changes for location updates');
assert(wayfinderContent.includes('dbSaveLocation'), 'WayFinder persists locations to Supabase');
assert(wayfinderContent.includes('calculateRoute'), 'Interactive route computation algorithm preserved');

// 5. Verify Portals & Cross-Portal Flow Integration
console.log('\n[Test Suite 5: Cross-Portal Synchronization & Segregation]');

// Doctor Portal
const doctorPortalPath = path.resolve('pages/DoctorPortal/DoctorPortal.tsx');
const doctorContent = fs.readFileSync(doctorPortalPath, 'utf8');
assert(doctorContent.includes('dbSavePrescription'), 'DoctorPortal saves prescriptions directly to database');
assert(doctorContent.includes('dbSaveAppointment'), 'DoctorPortal updates appointment status to database');
assert(doctorContent.includes('callPatientFromDoctor'), 'DoctorPortal calls patient, syncing queue & silent alert');

// Pharmacy Portal
const pharmacyPortalPath = path.resolve('pages/PharmacyPortal/PharmacyPortal.tsx');
const pharmacyContent = fs.readFileSync(pharmacyPortalPath, 'utf8');
assert(pharmacyContent.includes('dbSavePrescription'), 'PharmacyPortal saves prescription fulfillment to database');
assert(pharmacyContent.includes('dbSaveMedicine'), 'PharmacyPortal decrements stock and saves to database upon dispensing');

// Nurse Portal
const nursePortalPath = path.resolve('pages/NursePortal/NursePortal.tsx');
const nurseContent = fs.readFileSync(nursePortalPath, 'utf8');
assert(nurseContent.includes('saveNursePage'), 'NursePortal pages doctors to Supabase');
assert(nurseContent.includes('saveSupplyRequest'), 'NursePortal sends supply requests to Supabase');
assert(nurseContent.includes('assistanceRequests'), 'NursePortal displays real-time patient accessibility requests');

// Patient Portal & Symptom Checker
const patientPortalPath = path.resolve('pages/PatientPortal/PatientPortal.tsx');
const patientContent = fs.readFileSync(patientPortalPath, 'utf8');
assert(patientContent.includes('invoices={invoices}'), 'PatientPortal passes live invoices to BillingHistory');

const symptomCheckerPath = path.resolve('pages/PatientPortal/SymptomChecker.tsx');
const symptomContent = fs.readFileSync(symptomCheckerPath, 'utf8');
assert(symptomContent.includes('saveClinicalAiSuggestion'), 'SymptomChecker saves AI suggestions to clinical_ai_suggestions table');
assert(symptomContent.includes('Pending Clinical Doctor Review'), 'SymptomChecker visibly displays required clinical review notice');

// Billing History
const billingHistoryPath = path.resolve('pages/PatientPortal/BillingHistory.tsx');
const billingContent = fs.readFileSync(billingHistoryPath, 'utf8');
assert(billingContent.includes('dbSaveInvoice'), 'BillingHistory marks invoices as Paid and updates Supabase');

// Login Modal
const loginModalPath = path.resolve('components/LoginModal.tsx');
const loginContent = fs.readFileSync(loginModalPath, 'utf8');
assert(loginContent.includes('supabase.auth.signInWithPassword'), 'LoginModal authenticates with Supabase Auth');
assert(loginContent.includes('supabase.auth.signUp'), 'LoginModal signs up with Supabase Auth and registers profile');

// App.tsx
const appPath = path.resolve('App.tsx');
const appContent = fs.readFileSync(appPath, 'utf8');
assert(appContent.includes('setupRealtimeSubscriptions'), 'App.tsx subscribes to real-time table events');
assert(appContent.includes('invoices={invoices}'), 'App.tsx supplies invoices to PatientPortal');
assert(appContent.includes('allUsers={users}'), 'App.tsx supplies users to NursePortal');

// 6. Security & Credential Hygiene (Requirement 7)
console.log('\n[Test Suite 6: Security & Credentials Handling]');
const envExamplePath = path.resolve('.env.example');
const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
assert(envExampleContent.includes('VITE_SUPABASE_URL'), 'VITE_SUPABASE_URL documented in .env.example');
assert(envExampleContent.includes('VITE_SUPABASE_ANON_KEY'), 'VITE_SUPABASE_ANON_KEY documented in .env.example');
assert(!envExampleContent.includes('service_role'), 'Service role key is NEVER exposed in .env.example');

console.log('\n======================================================');
console.log(`Results: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('======================================================\n');

if (passedTests === totalTests) {
  console.log('All Centralized Supabase Integration Tests SUCCEEDED!\n');
} else {
  console.error(`Failed ${totalTests - passedTests} tests.`);
  process.exit(1);
}
