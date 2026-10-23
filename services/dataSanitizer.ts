import type {
  Appointment,
  Invoice,
  LabTest,
  Medicine,
  Prescription,
  User,
  QueueEntry,
  SilentAlert,
  HospitalLocation,
  BillingRecord
} from '../types';

/**
 * Ensures a value is safely treated as an array.
 */
export const safeArray = <T>(val: any): T[] => {
  return Array.isArray(val) ? val : [];
};

/**
 * Safely converts any value to a trimmed string with a fallback.
 */
export const safeString = (val: any, fallback = ''): string => {
  if (val === null || val === undefined) return fallback;
  return String(val).trim();
};

/**
 * Safely converts any value to a finite number with a fallback.
 */
export const safeNumber = (val: any, fallback = 0): number => {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
};

/**
 * Safely formats a date string without throwing or returning 'Invalid Date'.
 */
export const formatDisplayDate = (dateVal: any, options?: Intl.DateTimeFormatOptions): string => {
  if (!dateVal) return 'Date not specified';
  try {
    const d = new Date(typeof dateVal === 'string' && !dateVal.includes('T') ? dateVal + 'T00:00:00' : dateVal);
    if (isNaN(d.getTime())) {
      return safeString(dateVal, 'Date not specified');
    }
    return d.toLocaleDateString('en-US', options || { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return safeString(dateVal, 'Date not specified');
  }
};

/**
 * Safely format ISO date string for input values (YYYY-MM-DD).
 */
export const safeIsoDate = (dateVal: any): string => {
  if (!dateVal) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Sanitize an Appointment object to ensure no null/undefined properties cause crashes.
 */
export const sanitizeAppointment = (row: any): Appointment => {
  if (!row || typeof row !== 'object') {
    return {
      id: `app_${Date.now()}`,
      patientId: 'unknown',
      patientName: 'Unknown Patient',
      doctorId: 'unknown',
      doctorName: 'Attending Physician',
      doctorSpecialization: 'General Healthcare',
      date: safeIsoDate(null),
      time: '09:00 AM',
      status: 'Upcoming',
      type: 'New Consultation'
    };
  }

  return {
    id: safeString(row.id || row.id, `app_${Date.now()}`),
    patientId: safeString(row.patientId ?? row.patient_id, 'unknown'),
    patientName: safeString(row.patientName ?? row.patient_name, 'Patient'),
    doctorId: safeString(row.doctorId ?? row.doctor_id, 'unknown'),
    doctorName: safeString(row.doctorName ?? row.doctor_name, 'Attending Physician'),
    doctorSpecialization: safeString(row.doctorSpecialization ?? row.doctor_specialization, 'General Medicine'),
    date: safeString(row.date, safeIsoDate(null)),
    time: safeString(row.time, '09:00 AM'),
    status: (['Upcoming', 'Completed', 'Cancelled'].includes(row.status) ? row.status : 'Upcoming') as any,
    type: (['New Consultation', 'Follow-up', 'Check-up'].includes(row.type) ? row.type : 'New Consultation') as Appointment['type'],
    accessibilityRequest: row.accessibilityRequest || row.accessibility_request || undefined
  };
};

/**
 * Sanitize a Prescription object.
 */
export const sanitizePrescription = (row: any): Prescription => {
  if (!row || typeof row !== 'object') {
    return {
      id: `presc_${Date.now()}`,
      patientId: 'unknown',
      patientName: 'Unknown Patient',
      doctorId: 'unknown',
      doctorName: 'Attending Physician',
      date: safeIsoDate(null),
      medication: 'Prescription Item',
      dosage: 'Standard Dosage',
      frequency: 'As directed',
      duration: 'Course duration',
      status: 'Active'
    };
  }

  return {
    id: safeString(row.id, `presc_${Date.now()}`),
    patientId: safeString(row.patientId ?? row.patient_id, 'unknown'),
    patientName: safeString(row.patientName ?? row.patient_name, 'Patient'),
    doctorId: safeString(row.doctorId ?? row.doctor_id, 'unknown'),
    doctorName: safeString(row.doctorName ?? row.doctor_name, 'Attending Physician'),
    date: safeString(row.date, safeIsoDate(null)),
    medication: safeString(row.medication, 'Unspecified Medication'),
    dosage: safeString(row.dosage, 'As directed'),
    frequency: safeString(row.frequency, 'Daily'),
    duration: safeString(row.duration, '7 days'),
    notes: safeString(row.notes) || undefined,
    status: (['Active', 'Ready for Pickup', 'Dispensed', 'Completed', 'Cancelled'].includes(row.status)
      ? row.status
      : 'Active') as any
  };
};

/**
 * Sanitize a Medicine object.
 */
export const sanitizeMedicine = (row: any): Medicine => {
  if (!row || typeof row !== 'object') {
    return {
      id: `med_${Date.now()}`,
      name: 'Unknown Medicine',
      category: 'General',
      quantity: 0,
      expiry: safeIsoDate(null)
    };
  }

  return {
    id: safeString(row.id, `med_${Date.now()}`),
    name: safeString(row.name, 'Unnamed Medicine'),
    category: safeString(row.category, 'General'),
    quantity: Math.max(0, safeNumber(row.quantity, 0)),
    expiry: safeString(row.expiry, safeIsoDate(null))
  };
};

/**
 * Sanitize an Invoice object.
 */
export const sanitizeInvoice = (row: any): Invoice => {
  if (!row || typeof row !== 'object') {
    return {
      id: `inv_${Date.now()}`,
      invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
      patientId: 'unknown',
      patientName: 'Patient',
      issueDate: safeIsoDate(null),
      dueDate: safeIsoDate(null),
      items: [],
      totalAmount: 0,
      status: 'Unpaid'
    };
  }

  const rawItems = safeArray(row.items);
  const items: BillingRecord[] = rawItems.map((item: any, idx: number) => ({
    id: safeString(item?.id, `item_${idx}`),
    description: safeString(item?.description, 'Healthcare Service'),
    amount: Math.max(0, safeNumber(item?.amount, 0))
  }));

  const totalAmount = safeNumber(row.totalAmount ?? row.total_amount, items.reduce((sum, i) => sum + i.amount, 0));

  return {
    id: safeString(row.id, `inv_${Date.now()}`),
    invoiceNumber: safeString(row.invoiceNumber ?? row.invoice_number, `INV-${Date.now().toString().slice(-4)}`),
    patientId: safeString(row.patientId ?? row.patient_id, 'unknown'),
    patientName: safeString(row.patientName ?? row.patient_name, 'Patient'),
    issueDate: safeString(row.issueDate ?? row.issue_date, safeIsoDate(null)),
    dueDate: safeString(row.dueDate ?? row.due_date, safeIsoDate(null)),
    items,
    totalAmount: Math.max(0, totalAmount),
    status: (['Paid', 'Unpaid', 'Overdue'].includes(row.status) ? row.status : 'Unpaid') as any
  };
};

/**
 * Sanitize a LabTest object.
 */
export const sanitizeLabTest = (row: any): LabTest => {
  if (!row || typeof row !== 'object') {
    return {
      id: `lab_${Date.now()}`,
      patientName: 'Patient',
      testType: 'Diagnostic Test',
      status: 'Pending',
      requestedBy: 'Physician',
      date: safeIsoDate(null)
    };
  }

  return {
    id: safeString(row.id, `lab_${Date.now()}`),
    patientName: safeString(row.patientName ?? row.patient_name, 'Patient'),
    testType: safeString(row.testType ?? row.test_type, 'Diagnostic Panel'),
    status: (['Pending', 'In Progress', 'Completed'].includes(row.status) ? row.status : 'Pending') as any,
    requestedBy: safeString(row.requestedBy ?? row.requested_by, 'Attending Physician'),
    date: safeString(row.date, safeIsoDate(null)),
    results: safeString(row.results) || undefined
  };
};

/**
 * Sanitize a User profile object.
 */
export const sanitizeUser = (row: any): User => {
  if (!row || typeof row !== 'object') {
    return {
      id: `u_${Date.now()}`,
      name: 'User',
      email: 'user@mediconnect.hms',
      password: '',
      role: 'PATIENT',
      isVerified: true
    };
  }

  return {
    id: safeString(row.id, `u_${Date.now()}`),
    name: safeString(row.name, 'User'),
    email: safeString(row.email, 'user@mediconnect.hms'),
    role: (['PATIENT', 'DOCTOR', 'ADMIN', 'NURSE', 'PHARMACY', 'LAB_TECHNICIAN'].includes(row.role)
      ? row.role
      : 'PATIENT') as any,
    department: safeString(row.department) || undefined,
    avatarUrl: safeString(row.avatarUrl ?? row.avatar_url) || undefined,
    password: safeString(row.password, 'password'),
    isVerified: Boolean(row.isVerified ?? row.is_verified ?? true)
  };
};

/**
 * Sanitize a QueueEntry object.
 */
export const sanitizeQueueEntry = (row: any): QueueEntry => {
  if (!row || typeof row !== 'object') {
    return {
      id: `q_${Date.now()}`,
      tokenNumber: 'TK-000',
      patientId: 'unknown',
      patientName: 'Patient',
      doctorId: 'unknown',
      doctorName: 'Doctor',
      department: 'Outpatient Clinic',
      roomNumber: 'Room 101',
      queuePosition: 1,
      estimatedWaitMinutes: 10,
      status: 'Waiting',
      checkInTime: '09:00 AM'
    };
  }

  return {
    id: safeString(row.id, `q_${Date.now()}`),
    tokenNumber: safeString(row.tokenNumber ?? row.token_number, 'TK-000'),
    patientId: safeString(row.patientId ?? row.patient_id, 'unknown'),
    patientName: safeString(row.patientName ?? row.patient_name, 'Patient'),
    doctorId: safeString(row.doctorId ?? row.doctor_id, 'unknown'),
    doctorName: safeString(row.doctorName ?? row.doctor_name, 'Doctor'),
    department: safeString(row.department, 'Outpatient Clinic'),
    roomNumber: safeString(row.roomNumber ?? row.room_number, 'Room 101'),
    queuePosition: Math.max(1, safeNumber(row.queuePosition ?? row.queue_position, 1)),
    estimatedWaitMinutes: Math.max(0, safeNumber(row.estimatedWaitMinutes ?? row.estimated_wait_minutes, 0)),
    status: (['Waiting', 'In Consultation', 'Your Turn', 'Completed', 'Cancelled'].includes(row.status)
      ? row.status
      : 'Waiting') as any,
    checkInTime: safeString(row.checkInTime ?? row.check_in_time, '09:00 AM'),
    calledAt: safeString(row.calledAt ?? row.called_at) || undefined,
    acknowledgedAt: safeString(row.acknowledgedAt ?? row.acknowledged_at) || undefined
  };
};

/**
 * Sanitize a SilentAlert object.
 */
export const sanitizeSilentAlert = (row: any): SilentAlert => {
  return {
    id: safeString(row?.id, `alert_${Date.now()}`),
    tokenNumber: safeString(row?.tokenNumber ?? row?.token_number, 'TK-000'),
    patientId: safeString(row?.patientId ?? row?.patient_id, 'unknown'),
    patientName: safeString(row?.patientName ?? row?.patient_name, 'Patient'),
    doctorId: safeString(row?.doctorId ?? row?.doctor_id, 'unknown'),
    doctorName: safeString(row?.doctorName ?? row?.doctor_name, 'Doctor'),
    department: safeString(row?.department, 'Outpatient Clinic'),
    roomNumber: safeString(row?.roomNumber ?? row?.room_number, 'Room 101'),
    timestamp: safeString(row?.timestamp, new Date().toLocaleTimeString()),
    acknowledged: Boolean(row?.acknowledged),
    acknowledgedAt: safeString(row?.acknowledgedAt ?? row?.acknowledged_at) || undefined,
    status: (['Alert Triggered', 'Acknowledged', 'Dismissed'].includes(row?.status)
      ? row.status
      : 'Alert Triggered') as any
  };
};

/**
 * Sanitize a HospitalLocation object.
 */
export const sanitizeHospitalLocation = (row: any): HospitalLocation => {
  const coords = row?.coordinates && typeof row.coordinates === 'object'
    ? { x: safeNumber(row.coordinates.x, 50), y: safeNumber(row.coordinates.y, 50) }
    : { x: 50, y: 50 };

  return {
    id: safeString(row?.id, `loc_${Date.now()}`),
    name: safeString(row?.name, 'Hospital Facility'),
    roomNumber: safeString(row?.roomNumber ?? row?.room_number, 'Main Building'),
    floor: safeNumber(row?.floor, 0),
    floorName: safeString(row?.floorName ?? row?.floor_name, 'Ground Floor (L0)'),
    wing: (['East Wing', 'West Wing', 'Central Atrium'].includes(row?.wing) ? row.wing : 'Central Atrium') as HospitalLocation['wing'],
    category: (row?.category || 'Amenities') as any,
    department: safeString(row?.department) || undefined,
    doctorName: safeString(row?.doctorName ?? row?.doctor_name) || undefined,
    description: safeString(row?.description, 'Hospital Department'),
    isWheelchairAccessible: Boolean(row?.isWheelchairAccessible ?? row?.is_wheelchair_accessible ?? true),
    coordinates: coords,
    openHours: safeString(row?.openHours ?? row?.open_hours, '24/7'),
    contactExt: safeString(row?.contactExt ?? row?.contact_ext) || undefined
  };
};
