import type {
  Appointment,
  Prescription,
  Medicine,
  Invoice,
  LabTest,
  User,
  HospitalLocation
} from '../types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates an Appointment before saving.
 */
export const validateAppointment = (app: Partial<Appointment>): ValidationResult => {
  if (!app) return { isValid: false, error: 'Appointment data is missing' };
  if (!app.patientId && !app.patientName) return { isValid: false, error: 'Patient identifier or name is required' };
  if (!app.date || app.date.trim() === '') return { isValid: false, error: 'Appointment date is required' };
  if (!app.time || app.time.trim() === '') return { isValid: false, error: 'Appointment time is required' };
  if (!app.doctorId && !app.doctorName) return { isValid: false, error: 'Doctor information is required' };
  return { isValid: true };
};

/**
 * Validates a Prescription before saving.
 */
export const validatePrescription = (p: Partial<Prescription>): ValidationResult => {
  if (!p) return { isValid: false, error: 'Prescription data is missing' };
  if (!p.medication || p.medication.trim() === '') return { isValid: false, error: 'Medication name is required' };
  if (!p.dosage || p.dosage.trim() === '') return { isValid: false, error: 'Dosage is required' };
  if (!p.frequency || p.frequency.trim() === '') return { isValid: false, error: 'Frequency is required' };
  if (!p.duration || p.duration.trim() === '') return { isValid: false, error: 'Duration is required' };
  return { isValid: true };
};

/**
 * Validates a Medicine record before saving to inventory.
 */
export const validateMedicine = (m: Partial<Medicine>): ValidationResult => {
  if (!m) return { isValid: false, error: 'Medicine data is missing' };
  if (!m.name || m.name.trim() === '') return { isValid: false, error: 'Medicine name is required' };
  if (!m.category || m.category.trim() === '') return { isValid: false, error: 'Medicine category is required' };
  if (m.quantity === undefined || m.quantity === null || isNaN(m.quantity) || m.quantity < 0) {
    return { isValid: false, error: 'Medicine quantity must be a non-negative number' };
  }
  if (!m.expiry || m.expiry.trim() === '') return { isValid: false, error: 'Expiry date is required' };
  return { isValid: true };
};

/**
 * Validates an Invoice before saving.
 */
export const validateInvoice = (inv: Partial<Invoice>): ValidationResult => {
  if (!inv) return { isValid: false, error: 'Invoice data is missing' };
  if (!inv.patientId && !inv.patientName) return { isValid: false, error: 'Patient is required' };
  if (!inv.dueDate || inv.dueDate.trim() === '') return { isValid: false, error: 'Due date is required' };
  if (!Array.isArray(inv.items) || inv.items.length === 0) {
    return { isValid: false, error: 'Invoice must contain at least one billable item' };
  }
  const hasInvalidItem = inv.items.some(
    item => !item || !item.description || item.description.trim() === '' || isNaN(item.amount) || item.amount <= 0
  );
  if (hasInvalidItem) {
    return { isValid: false, error: 'All billable items must have a description and an amount greater than 0' };
  }
  return { isValid: true };
};

/**
 * Validates a Lab Test record before saving.
 */
export const validateLabTest = (test: Partial<LabTest>): ValidationResult => {
  if (!test) return { isValid: false, error: 'Lab test data is missing' };
  if (!test.patientName || test.patientName.trim() === '') return { isValid: false, error: 'Patient name is required' };
  if (!test.testType || test.testType.trim() === '') return { isValid: false, error: 'Test type is required' };
  return { isValid: true };
};

/**
 * Validates a Hospital Location before saving.
 */
export const validateHospitalLocation = (loc: Partial<HospitalLocation>): ValidationResult => {
  if (!loc) return { isValid: false, error: 'Location data is missing' };
  if (!loc.name || loc.name.trim() === '') return { isValid: false, error: 'Location name is required' };
  if (!loc.roomNumber || loc.roomNumber.trim() === '') return { isValid: false, error: 'Room number is required' };
  if (loc.floor === undefined || loc.floor === null || isNaN(loc.floor)) {
    return { isValid: false, error: 'Valid floor number is required' };
  }
  return { isValid: true };
};
