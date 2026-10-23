import { supabase, isDatabaseConfigured } from './supabaseClient';
import type { 
  Appointment, 
  Invoice, 
  LabTest, 
  Medicine, 
  Prescription, 
  User, 
  Patient, 
  Doctor, 
  MedicalRecord, 
  WellnessEntry, 
  AssignedPatient, 
  PatientChart, 
  QueueEntry, 
  SilentAlert, 
  HospitalLocation 
} from '../types';
import {
  sanitizeAppointment,
  sanitizePrescription,
  sanitizeMedicine,
  sanitizeInvoice,
  sanitizeLabTest,
  sanitizeUser,
  sanitizeQueueEntry,
  sanitizeSilentAlert,
  sanitizeHospitalLocation,
  safeArray,
  safeString,
  safeNumber
} from './dataSanitizer';
import {
  validateAppointment,
  validatePrescription,
  validateMedicine,
  validateInvoice,
  validateLabTest,
  validateHospitalLocation
} from './validation';

export interface DatabaseCollections {
  users?: User[];
  patients?: Patient[];
  doctors?: Doctor[];
  medicines?: Medicine[];
  appointments?: Appointment[];
  invoices?: Invoice[];
  prescriptions?: Prescription[];
  lab_tests?: LabTest[];
  medical_records?: MedicalRecord[];
  wellness_entries?: WellnessEntry[];
  assigned_patients?: AssignedPatient[];
  patient_charts?: PatientChart[];
  queue_entries?: QueueEntry[];
  silent_alerts?: SilentAlert[];
  hospital_locations?: HospitalLocation[];
}

export interface ClinicalAiSuggestion {
  id: string;
  patientId: string;
  doctorId?: string;
  suggestionType: string;
  content: string;
  disclaimer: string;
  isReviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface DatabaseOperationResult {
  success: boolean;
  error?: string;
}

// Convert database snake_case to frontend camelCase using data sanitizers for guaranteed null-safety
const mapAppointmentFromDb = (row: any): Appointment => sanitizeAppointment(row);
const mapPrescriptionFromDb = (row: any): Prescription => sanitizePrescription(row);
const mapInvoiceFromDb = (row: any): Invoice => sanitizeInvoice(row);
const mapLabTestFromDb = (row: any): LabTest => sanitizeLabTest(row);
const mapQueueEntryFromDb = (row: any): QueueEntry => sanitizeQueueEntry(row);
const mapSilentAlertFromDb = (row: any): SilentAlert => sanitizeSilentAlert(row);
const mapHospitalLocationFromDb = (row: any): HospitalLocation => sanitizeHospitalLocation(row);

/**
 * Check connectivity and latency to Supabase
 */
export const checkDatabaseHealth = async (timeoutMs = 5000): Promise<{ isOnline: boolean; latencyMs?: number; error?: string }> => {
  if (!supabase) return { isOnline: false, error: 'Database not configured' };
  const start = Date.now();
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), timeoutMs)
    );
    const queryPromise = supabase.from('profiles').select('id', { count: 'exact', head: true });
    await Promise.race([queryPromise, timeoutPromise]);
    return { isOnline: true, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { isOnline: false, error: err?.message || 'Database unreachable' };
  }
};

/**
 * Load all centralized collections from Supabase with timeout guard and empty table tolerance
 */
export const loadCollections = async (timeoutMs = 8000): Promise<DatabaseCollections> => {
  if (!supabase) return {};

  const collections: DatabaseCollections = {};

  const loadWithTimeout = async () => {
    // 1. Fetch Users / Profiles
    try {
      const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
      if (!pError && profiles) {
        collections.users = profiles.map(sanitizeUser);
      } else if (pError) {
        console.warn('Profiles load warning:', pError.message);
      }
    } catch (e) {
      console.warn('Error loading profiles:', e);
    }

    // 2. Fetch Medicines
    try {
      const { data: medicines, error: mError } = await supabase.from('medicines').select('*');
      if (!mError && medicines) {
        collections.medicines = medicines.map(sanitizeMedicine);
      } else if (mError) {
        console.warn('Medicines load warning:', mError.message);
      }
    } catch (e) {
      console.warn('Error loading medicines:', e);
    }

    // 3. Fetch Appointments
    try {
      const { data: appointments, error: aError } = await supabase.from('appointments').select('*');
      if (!aError && appointments) {
        collections.appointments = appointments.map(mapAppointmentFromDb);
      } else if (aError) {
        console.warn('Appointments load warning:', aError.message);
      }
    } catch (e) {
      console.warn('Error loading appointments:', e);
    }

    // 4. Fetch Invoices
    try {
      const { data: invoices, error: invError } = await supabase.from('invoices').select('*');
      if (!invError && invoices) {
        collections.invoices = invoices.map(mapInvoiceFromDb);
      } else if (invError) {
        console.warn('Invoices load warning:', invError.message);
      }
    } catch (e) {
      console.warn('Error loading invoices:', e);
    }

    // 5. Fetch Prescriptions
    try {
      const { data: prescriptions, error: prError } = await supabase.from('prescriptions').select('*');
      if (!prError && prescriptions) {
        collections.prescriptions = prescriptions.map(mapPrescriptionFromDb);
      } else if (prError) {
        console.warn('Prescriptions load warning:', prError.message);
      }
    } catch (e) {
      console.warn('Error loading prescriptions:', e);
    }

    // 6. Fetch Lab Tests
    try {
      const { data: labTests, error: lError } = await supabase.from('lab_tests').select('*');
      if (!lError && labTests) {
        collections.lab_tests = labTests.map(mapLabTestFromDb);
      } else if (lError) {
        console.warn('Lab tests load warning:', lError.message);
      }
    } catch (e) {
      console.warn('Error loading lab tests:', e);
    }

    // 7. Fetch Medical Records
    try {
      const { data: records, error: rError } = await supabase.from('medical_records').select('*');
      if (!rError && records) {
        collections.medical_records = records.map(r => ({
          id: safeString(r.id, `rec_${Date.now()}`),
          patientId: safeString(r.patient_id, 'unknown'),
          date: safeString(r.date, new Date().toISOString().split('T')[0]),
          type: (['Lab Result', 'Prescription', "Doctor's Note", 'Radiology Report'].includes(r.type) ? r.type : 'Doctor\'s Note') as any,
          title: safeString(r.title, 'Clinical Record'),
          summary: safeString(r.summary, 'Summary not available'),
          doctorName: safeString(r.doctor_name, 'Physician'),
          fileUrl: safeString(r.file_url, '#')
        }));
      }
    } catch (e) {
      console.warn('Error loading medical records:', e);
    }

    // 8. Fetch Wellness Entries
    try {
      const { data: wellness, error: wError } = await supabase.from('wellness_entries').select('*');
      if (!wError && wellness) {
        collections.wellness_entries = wellness.map(w => ({
          id: safeString(w.id, `w_${Date.now()}`),
          patientId: safeString(w.patient_id, 'unknown'),
          date: safeString(w.date, new Date().toISOString().split('T')[0]),
          bloodPressure: w.blood_pressure || undefined,
          bloodSugar: w.blood_sugar ? safeNumber(w.blood_sugar) : undefined,
          weight: w.weight ? safeNumber(w.weight) : undefined
        }));
      }
    } catch (e) {
      console.warn('Error loading wellness entries:', e);
    }

    // 9. Fetch Assigned Inpatients
    try {
      const { data: assigned, error: asError } = await supabase.from('assigned_patients').select('*');
      if (!asError && assigned) {
        collections.assigned_patients = assigned.map(a => ({
          id: safeString(a.id, `ap_${Date.now()}`),
          name: safeString(a.name, 'Patient'),
          room: safeString(a.room, 'Room N/A'),
          status: safeString(a.status, 'Stable'),
          vitals: a.vitals || { bp: '120/80', temp: '98.6°F', hr: '72bpm' }
        }));
      }
    } catch (e) {
      console.warn('Error loading assigned patients:', e);
    }

    // 10. Fetch Patient Charts
    try {
      const { data: charts, error: chError } = await supabase.from('patient_charts').select('*');
      if (!chError && charts) {
        collections.patient_charts = charts.map(c => ({
          patientId: safeString(c.patient_id, 'unknown'),
          notes: safeArray(c.notes),
          medicationSchedule: safeArray(c.medication_schedule),
          vitalsHistory: safeArray(c.vitals_history)
        }));
      }
    } catch (e) {
      console.warn('Error loading patient charts:', e);
    }

    // 11. Fetch Queue Entries
    try {
      const { data: queue, error: qError } = await supabase.from('queue_entries').select('*');
      if (!qError && queue) {
        collections.queue_entries = queue.map(mapQueueEntryFromDb);
      }
    } catch (e) {
      console.warn('Error loading queue entries:', e);
    }

    // 12. Fetch Silent Alerts
    try {
      const { data: alerts, error: alError } = await supabase.from('silent_alerts').select('*');
      if (!alError && alerts) {
        collections.silent_alerts = alerts.map(mapSilentAlertFromDb);
      }
    } catch (e) {
      console.warn('Error loading silent alerts:', e);
    }

    // 13. Fetch Hospital Locations
    try {
      const { data: locations, error: locError } = await supabase.from('hospital_locations').select('*');
      if (!locError && locations) {
        collections.hospital_locations = locations.map(mapHospitalLocationFromDb);
      }
    } catch (e) {
      console.warn('Error loading hospital locations:', e);
    }

    // Backward-compatibility: Check if medconnect_records has any collection that wasn't found in relational tables
    try {
      const { data: legacyRecords } = await supabase.from('medconnect_records').select('collection, id, data');
      if (legacyRecords && legacyRecords.length > 0) {
        for (const rec of legacyRecords) {
          const col = rec.collection as keyof DatabaseCollections;
          if (!collections[col]) {
            collections[col] = [rec.data];
          } else if (!collections[col]?.some((item: any) => item.id === rec.id)) {
            (collections[col] as any[]).push(rec.data);
          }
        }
      }
    } catch (e) {
      console.warn('Error loading legacy records:', e);
    }

    return collections;
  };

  try {
    const timeoutPromise = new Promise<DatabaseCollections>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase load collections timeout')), timeoutMs)
    );
    return await Promise.race([loadWithTimeout(), timeoutPromise]);
  } catch (error) {
    console.error('Error loading collections from Supabase:', error);
    return collections;
  }
};

/**
 * Sync whole collection (supports both relational and legacy fallback).
 * Guarded against syncing when offline or unconfigured to prevent silent overwriting/deleting.
 */
export const syncCollection = async (
  collection: 'users' | 'medicines' | 'appointments' | 'invoices' | 'prescriptions' | 'lab_tests',
  items: any[]
): Promise<DatabaseOperationResult> => {
  if (!supabase) return { success: false, error: 'Database not configured' };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, error: 'Device is offline; sync deferred' };
  }
  if (!Array.isArray(items)) {
    return { success: false, error: 'Items must be an array' };
  }

  try {
    // 1. Sync to relational table
    if (collection === 'users') {
      const records = items.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department || null,
        avatar_url: u.avatarUrl || null,
        password: u.password || 'password',
        is_verified: u.isVerified ?? true
      }));
      if (records.length > 0) {
        const { error } = await supabase.from('profiles').upsert(records, { onConflict: 'id' });
        if (error) throw error;
      }
    } else if (collection === 'medicines') {
      const records = items.map(m => ({
        id: m.id,
        name: m.name,
        category: m.category,
        quantity: Math.max(0, safeNumber(m.quantity, 0)),
        expiry: m.expiry
      }));
      if (records.length > 0) {
        const { error } = await supabase.from('medicines').upsert(records, { onConflict: 'id' });
        if (error) throw error;
      }
    } else if (collection === 'appointments') {
      const records = items.map(a => ({
        id: a.id,
        patient_id: a.patientId,
        patient_name: a.patientName,
        doctor_id: a.doctorId,
        doctor_name: a.doctorName,
        doctor_specialization: a.doctorSpecialization,
        date: a.date,
        time: a.time,
        status: a.status,
        type: a.type,
        accessibility_request: a.accessibilityRequest || null
      }));
      if (records.length > 0) {
        const { error } = await supabase.from('appointments').upsert(records, { onConflict: 'id' });
        if (error) throw error;
      }
    } else if (collection === 'invoices') {
      const records = items.map(inv => ({
        id: inv.id,
        invoice_number: inv.invoiceNumber,
        patient_id: inv.patientId,
        patient_name: inv.patientName,
        issue_date: inv.issueDate,
        due_date: inv.dueDate,
        items: inv.items,
        total_amount: Math.max(0, safeNumber(inv.totalAmount, 0)),
        status: inv.status
      }));
      if (records.length > 0) {
        const { error } = await supabase.from('invoices').upsert(records, { onConflict: 'id' });
        if (error) throw error;
      }
    } else if (collection === 'prescriptions') {
      const records = items.map(p => ({
        id: p.id,
        patient_id: p.patientId,
        patient_name: p.patientName,
        doctor_id: p.doctorId,
        doctor_name: p.doctorName,
        date: p.date,
        medication: p.medication,
        dosage: p.dosage,
        frequency: p.frequency,
        duration: p.duration,
        notes: p.notes || null,
        status: p.status
      }));
      if (records.length > 0) {
        const { error } = await supabase.from('prescriptions').upsert(records, { onConflict: 'id' });
        if (error) throw error;
      }
    } else if (collection === 'lab_tests') {
      const records = items.map(l => ({
        id: l.id,
        patient_name: l.patientName,
        test_type: l.testType,
        status: l.status,
        requested_by: l.requestedBy,
        date: l.date,
        results: l.results || null
      }));
      if (records.length > 0) {
        const { error } = await supabase.from('lab_tests').upsert(records, { onConflict: 'id' });
        if (error) throw error;
      }
    }

    // 2. Also keep legacy table updated for backward-compatibility
    const legacyRecords = items.map(item => ({ collection, id: item.id, data: item }));
    if (legacyRecords.length > 0) {
      await supabase.from('medconnect_records').upsert(legacyRecords, { onConflict: 'collection,id' });
    }

    return { success: true };
  } catch (error: any) {
    console.warn(`Sync warning for ${collection}:`, error?.message || error);
    return { success: false, error: error?.message || 'Sync failed' };
  }
};

// -------------------------------------------------------------
// Individual Entity Persistence Methods (with Automatic Validation)
// -------------------------------------------------------------

export const saveAppointment = async (app: Appointment): Promise<DatabaseOperationResult> => {
  const validation = validateAppointment(app);
  if (!validation.isValid) {
    console.warn('Appointment validation failed:', validation.error);
    return { success: false, error: validation.error };
  }

  if (supabase) {
    try {
      const { error: appErr } = await supabase.from('appointments').upsert({
        id: app.id,
        patient_id: app.patientId,
        patient_name: app.patientName,
        doctor_id: app.doctorId,
        doctor_name: app.doctorName,
        doctor_specialization: app.doctorSpecialization,
        date: app.date,
        time: app.time,
        status: app.status,
        type: app.type,
        accessibility_request: app.accessibilityRequest || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (appErr) throw appErr;

      await supabase.from('medconnect_records').upsert({
        collection: 'appointments',
        id: app.id,
        data: app
      }, { onConflict: 'collection,id' });

      return { success: true };
    } catch (e: any) {
      console.error('Failed to save appointment to Supabase:', e);
      return { success: false, error: e?.message || 'Failed to save appointment' };
    }
  }
  return { success: true };
};

export const deleteAppointment = async (id: string): Promise<DatabaseOperationResult> => {
  if (!id) return { success: false, error: 'Appointment ID required' };
  if (supabase) {
    try {
      await supabase.from('appointments').delete().eq('id', id);
      await supabase.from('medconnect_records').delete().eq('collection', 'appointments').eq('id', id);
      return { success: true };
    } catch (e: any) {
      console.error('Failed to delete appointment from Supabase:', e);
      return { success: false, error: e?.message || 'Failed to delete appointment' };
    }
  }
  return { success: true };
};

export const savePrescription = async (prescription: Prescription): Promise<DatabaseOperationResult> => {
  const validation = validatePrescription(prescription);
  if (!validation.isValid) {
    console.warn('Prescription validation failed:', validation.error);
    return { success: false, error: validation.error };
  }

  if (supabase) {
    try {
      const { error: prErr } = await supabase.from('prescriptions').upsert({
        id: prescription.id,
        patient_id: prescription.patientId,
        patient_name: prescription.patientName,
        doctor_id: prescription.doctorId,
        doctor_name: prescription.doctorName,
        date: prescription.date,
        medication: prescription.medication,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        duration: prescription.duration,
        notes: prescription.notes || null,
        status: prescription.status,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (prErr) throw prErr;

      await supabase.from('medconnect_records').upsert({
        collection: 'prescriptions',
        id: prescription.id,
        data: prescription
      }, { onConflict: 'collection,id' });

      return { success: true };
    } catch (e: any) {
      console.error('Failed to save prescription to Supabase:', e);
      return { success: false, error: e?.message || 'Failed to save prescription' };
    }
  }
  return { success: true };
};

export const saveMedicine = async (medicine: Medicine): Promise<DatabaseOperationResult> => {
  const validation = validateMedicine(medicine);
  if (!validation.isValid) {
    console.warn('Medicine validation failed:', validation.error);
    return { success: false, error: validation.error };
  }

  if (supabase) {
    try {
      const { error: medErr } = await supabase.from('medicines').upsert({
        id: medicine.id,
        name: medicine.name,
        category: medicine.category,
        quantity: Math.max(0, safeNumber(medicine.quantity, 0)),
        expiry: medicine.expiry,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (medErr) throw medErr;

      await supabase.from('medconnect_records').upsert({
        collection: 'medicines',
        id: medicine.id,
        data: medicine
      }, { onConflict: 'collection,id' });

      return { success: true };
    } catch (e: any) {
      console.error('Failed to save medicine to Supabase:', e);
      return { success: false, error: e?.message || 'Failed to save medicine' };
    }
  }
  return { success: true };
};

export const deleteMedicine = async (id: string): Promise<DatabaseOperationResult> => {
  if (!id) return { success: false, error: 'Medicine ID required' };
  if (supabase) {
    try {
      await supabase.from('medicines').delete().eq('id', id);
      await supabase.from('medconnect_records').delete().eq('collection', 'medicines').eq('id', id);
      return { success: true };
    } catch (e: any) {
      console.error('Failed to delete medicine from Supabase:', e);
      return { success: false, error: e?.message || 'Failed to delete medicine' };
    }
  }
  return { success: true };
};

export const saveLabTest = async (test: LabTest): Promise<DatabaseOperationResult> => {
  const validation = validateLabTest(test);
  if (!validation.isValid) {
    console.warn('Lab test validation failed:', validation.error);
    return { success: false, error: validation.error };
  }

  if (supabase) {
    try {
      const { error: ltErr } = await supabase.from('lab_tests').upsert({
        id: test.id,
        patient_name: test.patientName,
        test_type: test.testType,
        status: test.status,
        requested_by: test.requestedBy,
        date: test.date,
        results: test.results || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (ltErr) throw ltErr;

      await supabase.from('medconnect_records').upsert({
        collection: 'lab_tests',
        id: test.id,
        data: test
      }, { onConflict: 'collection,id' });

      return { success: true };
    } catch (e: any) {
      console.error('Failed to save lab test to Supabase:', e);
      return { success: false, error: e?.message || 'Failed to save lab test' };
    }
  }
  return { success: true };
};

export const saveMedicalRecord = async (record: MedicalRecord): Promise<DatabaseOperationResult> => {
  if (supabase) {
    try {
      const { error: recErr } = await supabase.from('medical_records').upsert({
        id: record.id,
        patient_id: record.patientId,
        date: record.date,
        type: record.type,
        title: record.title,
        summary: record.summary,
        doctor_name: record.doctorName,
        file_url: record.fileUrl || '#',
        is_ai_generated: false,
        verified_by: record.doctorName,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (recErr) throw recErr;

      await supabase.from('medconnect_records').upsert({
        collection: 'medical_records' as any,
        id: record.id,
        data: record
      }, { onConflict: 'collection,id' });

      return { success: true };
    } catch (e: any) {
      console.error('Failed to save medical record to Supabase:', e);
      return { success: false, error: e?.message || 'Failed to save medical record' };
    }
  }
  return { success: true };
};

export const saveInvoice = async (invoice: Invoice): Promise<DatabaseOperationResult> => {
  const validation = validateInvoice(invoice);
  if (!validation.isValid) {
    console.warn('Invoice validation failed:', validation.error);
    return { success: false, error: validation.error };
  }

  if (supabase) {
    try {
      const { error: invErr } = await supabase.from('invoices').upsert({
        id: invoice.id,
        invoice_number: invoice.invoiceNumber,
        patient_id: invoice.patientId,
        patient_name: invoice.patientName,
        issue_date: invoice.issueDate,
        due_date: invoice.dueDate,
        items: invoice.items,
        total_amount: Math.max(0, safeNumber(invoice.totalAmount, 0)),
        status: invoice.status,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (invErr) throw invErr;

      await supabase.from('medconnect_records').upsert({
        collection: 'invoices',
        id: invoice.id,
        data: invoice
      }, { onConflict: 'collection,id' });

      return { success: true };
    } catch (e: any) {
      console.error('Failed to save invoice to Supabase:', e);
      return { success: false, error: e?.message || 'Failed to save invoice' };
    }
  }
  return { success: true };
};

export const saveWellnessEntry = async (entry: WellnessEntry): Promise<DatabaseOperationResult> => {
  if (supabase) {
    try {
      const { error } = await supabase.from('wellness_entries').upsert({
        id: entry.id,
        patient_id: entry.patientId,
        date: entry.date,
        blood_pressure: entry.bloodPressure || null,
        blood_sugar: entry.bloodSugar || null,
        weight: entry.weight || null
      }, { onConflict: 'id' });

      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('Failed to save wellness entry to Supabase:', e);
      return { success: false, error: e?.message || 'Failed to save wellness entry' };
    }
  }
  return { success: true };
};

export const saveNursePage = async (page: { doctor_id: string; doctor_name?: string; message: string; sender_name: string }): Promise<DatabaseOperationResult> => {
  if (supabase) {
    try {
      const { error } = await supabase.from('nurse_pages').insert({
        id: `page_${Date.now()}`,
        doctor_id: page.doctor_id,
        doctor_name: page.doctor_name || null,
        message: page.message,
        sender_name: page.sender_name,
        status: 'sent'
      });
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('Failed to save nurse page to Supabase:', e);
      return { success: false, error: e?.message || 'Failed to save nurse page' };
    }
  }
  return { success: true };
};

export const saveSupplyRequest = async (request: { item: string; quantity: number; requested_by: string }): Promise<DatabaseOperationResult> => {
  if (supabase) {
    try {
      const { error } = await supabase.from('supply_requests').insert({
        id: `supply_${Date.now()}`,
        item: request.item,
        quantity: Math.max(1, safeNumber(request.quantity, 1)),
        requested_by: request.requested_by,
        status: 'pending'
      });
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('Failed to save supply request to Supabase:', e);
      return { success: false, error: e?.message || 'Failed to save supply request' };
    }
  }
  return { success: true };
};

export const saveQueueEntry = async (entry: QueueEntry): Promise<DatabaseOperationResult> => {
  if (supabase) {
    try {
      const { error } = await supabase.from('queue_entries').upsert({
        id: entry.id,
        token_number: entry.tokenNumber,
        patient_id: entry.patientId,
        patient_name: entry.patientName,
        doctor_id: entry.doctorId,
        doctor_name: entry.doctorName,
        department: entry.department,
        room_number: entry.roomNumber,
        queue_position: entry.queuePosition,
        estimated_wait_minutes: entry.estimatedWaitMinutes,
        status: entry.status,
        check_in_time: entry.checkInTime,
        called_at: entry.calledAt || null,
        acknowledged_at: entry.acknowledgedAt || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('Failed to save queue entry to Supabase:', e);
      return { success: false, error: e?.message || 'Failed to save queue entry' };
    }
  }
  return { success: true };
};

export const saveSilentAlert = async (alert: SilentAlert): Promise<DatabaseOperationResult> => {
  if (supabase) {
    try {
      const { error } = await supabase.from('silent_alerts').upsert({
        id: alert.id,
        token_number: alert.tokenNumber,
        patient_id: alert.patientId,
        patient_name: alert.patientName,
        doctor_id: alert.doctorId,
        doctor_name: alert.doctorName,
        department: alert.department,
        room_number: alert.roomNumber,
        timestamp: alert.timestamp,
        acknowledged: alert.acknowledged,
        acknowledged_at: alert.acknowledgedAt || null,
        status: alert.status
      }, { onConflict: 'id' });
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('Failed to save silent alert to Supabase:', e);
      return { success: false, error: e?.message || 'Failed to save silent alert' };
    }
  }
  return { success: true };
};

export const saveHospitalLocation = async (location: HospitalLocation): Promise<DatabaseOperationResult> => {
  const validation = validateHospitalLocation(location);
  if (!validation.isValid) {
    console.warn('Location validation failed:', validation.error);
    return { success: false, error: validation.error };
  }

  if (supabase) {
    try {
      const { error } = await supabase.from('hospital_locations').upsert({
        id: location.id,
        name: location.name,
        room_number: location.roomNumber,
        floor: location.floor,
        floor_name: location.floorName,
        wing: location.wing,
        category: location.category,
        department: location.department || null,
        doctor_name: location.doctorName || null,
        description: location.description,
        is_wheelchair_accessible: location.isWheelchairAccessible,
        coordinates: location.coordinates,
        open_hours: location.openHours,
        contact_ext: location.contactExt || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('Failed to save hospital location to Supabase:', e);
      return { success: false, error: e?.message || 'Failed to save hospital location' };
    }
  }
  return { success: true };
};

export const deleteHospitalLocation = async (id: string): Promise<DatabaseOperationResult> => {
  if (!id) return { success: false, error: 'Location ID required' };
  if (supabase) {
    try {
      await supabase.from('hospital_locations').delete().eq('id', id);
      return { success: true };
    } catch (e: any) {
      console.error('Failed to delete hospital location from Supabase:', e);
      return { success: false, error: e?.message || 'Failed to delete hospital location' };
    }
  }
  return { success: true };
};

// Requirement 8: Keep AI-generated clinical suggestions separate from verified clinical records
export const saveClinicalAiSuggestion = async (suggestion: {
  patientId: string;
  doctorId?: string;
  suggestionType: string;
  content: string;
}): Promise<ClinicalAiSuggestion | null> => {
  const newSuggestion: ClinicalAiSuggestion = {
    id: `ai_sug_${Date.now()}`,
    patientId: suggestion.patientId,
    doctorId: suggestion.doctorId,
    suggestionType: suggestion.suggestionType,
    content: suggestion.content,
    disclaimer: 'AI clinical assistance suggestion only. Not a substitute for professional clinical judgment. Requires certified clinical review before entering official medical record.',
    isReviewed: false,
    createdAt: new Date().toISOString()
  };

  if (supabase) {
    try {
      await supabase.from('clinical_ai_suggestions').insert({
        id: newSuggestion.id,
        patient_id: newSuggestion.patientId,
        doctor_id: newSuggestion.doctorId || null,
        suggestion_type: newSuggestion.suggestionType,
        content: newSuggestion.content,
        disclaimer: newSuggestion.disclaimer,
        is_reviewed: false
      });
    } catch (e) {
      console.warn('Could not insert AI suggestion to Supabase, stored in memory:', e);
    }
  }

  return newSuggestion;
};

// Review & verify an AI clinical suggestion by a clinician
export const reviewClinicalAiSuggestion = async (
  suggestionId: string,
  reviewerName: string
): Promise<DatabaseOperationResult> => {
  if (supabase) {
    try {
      const { error } = await supabase.from('clinical_ai_suggestions').update({
        is_reviewed: true,
        reviewed_by: reviewerName,
        reviewed_at: new Date().toISOString()
      }).eq('id', suggestionId);
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('Failed to update clinical review status:', e);
      return { success: false, error: e?.message || 'Failed to update clinical review' };
    }
  }
  return { success: true };
};

// -------------------------------------------------------------
// Real-time Database Subscriptions
// -------------------------------------------------------------
export const setupRealtimeSubscriptions = (
  onEvent: (payload: { table: string; eventType: string; newRecord: any; oldRecord: any }) => void
) => {
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('medconnect_realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, payload => {
        try {
          onEvent({
            table: payload.table,
            eventType: payload.eventType,
            newRecord: payload.new,
            oldRecord: payload.old
          });
        } catch (subErr) {
          console.warn('Error handling realtime postgres_changes event:', subErr);
        }
      })
      .subscribe((status, err) => {
        if (err) {
          console.warn('Realtime subscription notice:', err.message);
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (remErr) {
        console.warn('Error removing realtime channel:', remErr);
      }
    };
  } catch (err) {
    console.warn('Failed to setup realtime subscriptions:', err);
    return () => {};
  }
};