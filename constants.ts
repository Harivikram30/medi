import type { User, Doctor, Appointment, MedicalRecord, Bill, Service, WellnessEntry, Prescription, MedicationStock, AssignedPatient, PatientChart, LabTest, Patient, Medicine, Invoice, QueueEntry, SilentAlert, AccessibilityRequest, VerifiedAccessibilityFacility } from './types';

export const MOCK_USERS: User[] = [
  // Patients
  { id: 'p001', name: 'John Doe', email: 'john.doe@email.com', role: 'PATIENT', password: 'password', avatarUrl: 'https://ui-avatars.com/api/?name=John+Doe&background=0057A8&color=fff', isVerified: true },
  { id: 'p002', name: 'Alice Johnson', email: 'alice.j@email.com', role: 'PATIENT', password: 'password', avatarUrl: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=0057A8&color=fff', isVerified: true },
  
  // Doctors
  { id: 'd001', name: 'Dr. Jane Smith', department: "Cardiology", email: "jane.smith@hospital.com", password: "janeCardio123", role: 'DOCTOR', avatarUrl: 'https://ui-avatars.com/api/?name=Jane+Smith&background=00A859&color=fff', isVerified: true },
  { id: 'd002', name: "Dr. Michael Brown", department: "Neurology", email: "michael.brown@hospital.com", password: "mikeNeuro456", role: "DOCTOR", avatarUrl: 'https://ui-avatars.com/api/?name=Michael+Brown&background=00A859&color=fff', isVerified: true },
  { id: 'd003', name: "Dr. Emily White", department: "Pediatrics", email: "emily.white@hospital.com", password: "emilyPeds789", role: "DOCTOR", avatarUrl: 'https://ui-avatars.com/api/?name=Emily+White&background=00A859&color=fff', isVerified: true },
  { id: 'd004', name: "Dr. Robert Green", department: "Orthopedics", email: "robert.green@hospital.com", password: "robertOrtho321", role: "DOCTOR", avatarUrl: 'https://ui-avatars.com/api/?name=Robert+Green&background=00A859&color=fff', isVerified: true },
  { id: 'd005', name: "Dr. Ramesh Kumar", department: "General Physician", email: "ramesh.kumar@hospital.com", password: "rameshGP654", role: "DOCTOR", avatarUrl: 'https://ui-avatars.com/api/?name=Ramesh+Kumar&background=00A859&color=fff', isVerified: true },
  { id: 'd006', name: "Dr. Meena Raj", department: "Family Medicine", email: "meena.raj@hospital.com", password: "meenaFM987", role: "DOCTOR", avatarUrl: 'https://ui-avatars.com/api/?name=Meena+Raj&background=00A859&color=fff', isVerified: true },
  { id: 'd007', name: "Dr. Arjun Das", department: "Internal Medicine", email: "arjun.das@hospital.com", password: "arjunIM741", role: "DOCTOR", avatarUrl: 'https://ui-avatars.com/api/?name=Arjun+Das&background=00A859&color=fff', isVerified: true },
  { id: 'd008', name: "Dr. Priya Sharma", department: "Dentistry", email: "priya.sharma@hospital.com", password: "priyaDent852", role: "DOCTOR", avatarUrl: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=00A859&color=fff', isVerified: true },
  { id: 'd009', name: "Dr. Karan Patel", department: "Orthodontics", email: "karan.patel@hospital.com", password: "karanOrtho963", role: "DOCTOR", avatarUrl: 'https://ui-avatars.com/api/?name=Karan+Patel&background=00A859&color=fff', isVerified: true },
  { id: 'd010', name: "Dr. Sneha Rao", department: "Cosmetic Dentistry", email: "sneha.rao@hospital.com", password: "snehaCos123", role: "DOCTOR", avatarUrl: 'https://ui-avatars.com/api/?name=Sneha+Rao&background=00A859&color=fff', isVerified: true },
  
  // Nurses
  { id: 'n001', name: "Nurse Kaviya", department: "General Ward", email: "kaviya@nurse.com", password: "kaviya1234", role: "NURSE", avatarUrl: 'https://ui-avatars.com/api/?name=Kaviya&background=8B5CF6&color=fff', isVerified: true },
  { id: 'n002', name: "Nurse Priya", department: "ICU", email: "priya@nurse.com", password: "priya5678", role: "NURSE", avatarUrl: 'https://ui-avatars.com/api/?name=Priya&background=8B5CF6&color=fff', isVerified: true },
  { id: 'n003', name: "Nurse Swetha", department: "Emergency", email: "swetha@nurse.com", password: "swetha9012", role: "NURSE", avatarUrl: 'https://ui-avatars.com/api/?name=Swetha&background=8B5CF6&color=fff', isVerified: true },
  { id: 'n004', name: "Nurse Anjali", department: "Pediatrics", email: "anjali@nurse.com", password: "anjali3456", role: "NURSE", avatarUrl: 'https://ui-avatars.com/api/?name=Anjali&background=8B5CF6&color=fff', isVerified: true },
  { id: 'n005', name: "Nurse Meena", department: "OPD", email: "meena@nurse.com", password: "meena7890", role: "NURSE", avatarUrl: 'https://ui-avatars.com/api/?name=Meena&background=8B5CF6&color=fff', isVerified: true },

  // Lab Technicians
  { id: 'l001', name: "Lab Tech John", department: "Pathology", email: "john@lab.com", password: "john123", role: "LAB_TECHNICIAN", avatarUrl: 'https://ui-avatars.com/api/?name=John&background=10B981&color=fff', isVerified: true },
  { id: 'l002', name: "Lab Tech Ramesh", department: "Biochemistry", email: "ramesh@lab.com", password: "ramesh123", role: "LAB_TECHNICIAN", avatarUrl: 'https://ui-avatars.com/api/?name=Ramesh&background=10B981&color=fff', isVerified: true },
  { id: 'l003', name: "Lab Tech Sneha", department: "Microbiology", email: "sneha@lab.com", password: "sneha123", role: "LAB_TECHNICIAN", avatarUrl: 'https://ui-avatars.com/api/?name=Sneha&background=10B981&color=fff', isVerified: true },

  // Pharmacy
  { id: 'ph001', name: 'Peter Petrelli', email: 'pharmacy@hms.com', role: 'PHARMACY', password: 'password', avatarUrl: 'https://ui-avatars.com/api/?name=Peter+Petrelli&background=F97316&color=fff', isVerified: true },

  // Admin
  { id: 'a001', name: 'Admin User', email: 'admin@hms.com', role: 'ADMIN', password: 'password', avatarUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=6c757d&color=fff', isVerified: true },
];

export const MOCK_PATIENTS: Patient[] = [
  { id: 'p001', name: 'John Doe', age: 55, currentCondition: 'Hypertension' },
  { id: 'p002', name: 'Alice Johnson', age: 40, currentCondition: 'Migraines' },
  { id: 'p003', name: 'Bob Williams', age: 68, currentCondition: 'Coronary Artery Disease' },
  { id: 'p004', name: 'Charlie Brown', age: 8, currentCondition: 'Asthma Check-up' },
  { id: 'p005', name: 'Diana Prince', age: 35, currentCondition: 'Annual Physical' },
  { id: 'p006', name: 'Bruce Wayne', age: 42, currentCondition: 'Knee Injury' },
  { id: 'p007', name: 'Clark Kent', age: 38, currentCondition: 'Follow-up' },
  { id: 'p008', name: 'Sara Lance', age: 29, currentCondition: 'Sprained Ankle' },
  { id: 'p009', name: 'Peter Parker', age: 17, currentCondition: 'Allergy Testing' },
  { id: 'p010', name: 'Tony Stark', age: 53, currentCondition: 'Chest Pain Evaluation' },
];

export const MOCK_DOCTORS: Doctor[] = [
    { id: 'd001', name: 'Dr. Jane Smith', specialization: 'Cardiology', experience: 15, bio: 'Dr. Smith is a leading expert in cardiac care, with a focus on preventative medicine and advanced treatment options.', imageUrl: 'https://ui-avatars.com/api/?name=Jane+Smith&background=00A859&color=fff', availability: 'Mon, Wed, Fri (9 AM - 4 PM)' },
    { id: 'd002', name: 'Dr. Michael Brown', specialization: 'Neurology', experience: 12, bio: 'Specializing in complex neurological disorders, Dr. Brown is dedicated to providing compassionate and innovative care.', imageUrl: 'https://ui-avatars.com/api/?name=Michael+Brown&background=00A859&color=fff', availability: 'Tue, Thu (10 AM - 6 PM)' },
    { id: 'd003', name: 'Dr. Emily White', specialization: 'Pediatrics', experience: 10, bio: 'Dr. White has a passion for children\'s health and works to create a friendly and comfortable environment for her young patients.', imageUrl: 'https://ui-avatars.com/api/?name=Emily+White&background=00A859&color=fff', availability: 'Mon - Fri (8 AM - 3 PM)' },
    { id: 'd004', name: 'Dr. Robert Green', specialization: 'Orthopedics', experience: 20, bio: 'With two decades of experience, Dr. Green is a renowned orthopedic surgeon, specializing in sports injuries and joint replacement.', imageUrl: 'https://ui-avatars.com/api/?name=Robert+Green&background=00A859&color=fff', availability: 'Mon, Tue, Thu (11 AM - 7 PM)' },
    { id: 'd005', name: 'Dr. Ramesh Kumar', specialization: 'General Physician', experience: 8, bio: 'Dr. Kumar is a dedicated General Physician with a focus on holistic patient care and preventative health.', imageUrl: 'https://ui-avatars.com/api/?name=Ramesh+Kumar&background=00A859&color=fff', availability: 'Mon - Sat (9 AM - 5 PM)' },
    { id: 'd006', name: 'Dr. Meena Raj', specialization: 'Family Medicine', experience: 7, bio: 'Dr. Raj provides comprehensive healthcare for individuals and families across all ages, genders, and diseases.', imageUrl: 'https://ui-avatars.com/api/?name=Meena+Raj&background=00A859&color=fff', availability: 'Mon - Fri (10 AM - 4 PM)' },
    { id: 'd007', name: 'Dr. Arjun Das', specialization: 'Internal Medicine', experience: 11, bio: 'Dr. Das specializes in the diagnosis and treatment of complex illnesses in adults.', imageUrl: 'https://ui-avatars.com/api/?name=Arjun+Das&background=00A859&color=fff', availability: 'Tue - Sun (8 AM - 3 PM)' },
    { id: 'd008', name: 'Dr. Priya Sharma', specialization: 'Dentistry', experience: 9, bio: 'Dr. Sharma offers a full range of dental services with a gentle touch, from routine cleanings to complex procedures.', imageUrl: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=00A859&color=fff', availability: 'Mon - Sat (9 AM - 6 PM)' },
    { id: 'd009', name: 'Dr. Karan Patel', specialization: 'Orthodontics', experience: 13, bio: 'An expert in orthodontics, Dr. Patel helps patients achieve beautiful, healthy smiles with braces and aligners.', imageUrl: 'https://ui-avatars.com/api/?name=Karan+Patel&background=00A859&color=fff', availability: 'Tue - Sun (10 AM - 5 PM)' },
    { id: 'd010', name: 'Dr. Sneha Rao', specialization: 'Cosmetic Dentistry', experience: 10, bio: 'Dr. Rao specializes in cosmetic procedures like teeth whitening, veneers, and smile makeovers.', imageUrl: 'https://ui-avatars.com/api/?name=Sneha+Rao&background=00A859&color=fff', availability: 'Mon - Fri (11 AM - 7 PM)' },
];

// --- Date Generation Helpers ---
const today = new Date();

// Helper to format date as YYYY-MM-DD
const formatDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to format date and time as YYYY-MM-DD HH:MM
const formatDateTime = (d: Date): string => {
    const time = d.toTimeString().slice(0, 5); // HH:MM
    return `${formatDate(d)} ${time}`;
};

// Helper to get a date relative to today
const getDateRelativeToToday = (days: number): Date => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d;
};

// --- Updated Mock Data with Dynamic Dates ---

export const MOCK_APPOINTMENTS: Appointment[] = [
  // Dr. Smith (Cardiology) - d001: Focus on follow-ups for older patients
  { 
    id: 'app001', 
    patientId: 'p001', 
    patientName: 'John Doe', 
    doctorId: 'd001', 
    doctorName: 'Dr. Jane Smith', 
    doctorSpecialization: 'Cardiology', 
    date: formatDate(getDateRelativeToToday(2)), 
    time: '10:00 AM', 
    status: 'Upcoming', 
    type: 'Follow-up',
    accessibilityRequest: {
      wheelchairNeeded: true,
      wheelchairLocation: 'Main Entrance Ramps',
      writtenInstructions: true,
      communicationSupport: 'Hearing Loop Amplification',
      assistanceNotes: 'Patient requires wheelchair pickup at main entrance and high-volume communication.'
    }
  },
  { id: 'app002', patientId: 'p003', patientName: 'Bob Williams', doctorId: 'd001', doctorName: 'Dr. Jane Smith', doctorSpecialization: 'Cardiology', date: formatDate(getDateRelativeToToday(-10)), time: '02:30 PM', status: 'Completed', type: 'New Consultation' },
  { id: 'app003', patientId: 'p001', patientName: 'John Doe', doctorId: 'd001', doctorName: 'Dr. Jane Smith', doctorSpecialization: 'Cardiology', date: formatDate(getDateRelativeToToday(0)), time: '11:00 AM', status: 'Upcoming', type: 'Follow-up' },
  { id: 'app010', patientId: 'p010', patientName: 'Tony Stark', doctorId: 'd001', doctorName: 'Dr. Jane Smith', doctorSpecialization: 'Cardiology', date: formatDate(getDateRelativeToToday(4)), time: '09:00 AM', status: 'Upcoming', type: 'New Consultation' },
  { id: 'app011', patientId: 'p003', patientName: 'Bob Williams', doctorId: 'd001', doctorName: 'Dr. Jane Smith', doctorSpecialization: 'Cardiology', date: formatDate(getDateRelativeToToday(9)), time: '02:00 PM', status: 'Upcoming', type: 'Follow-up' },
  { id: 'app017', patientId: 'p001', patientName: 'John Doe', doctorId: 'd001', doctorName: 'Dr. Jane Smith', doctorSpecialization: 'Cardiology', date: formatDate(getDateRelativeToToday(8)), time: '10:30 AM', status: 'Upcoming', type: 'Follow-up' },
  { id: 'app018', patientId: 'p010', patientName: 'Tony Stark', doctorId: 'd001', doctorName: 'Dr. Jane Smith', doctorSpecialization: 'Cardiology', date: formatDate(getDateRelativeToToday(12)), time: '09:30 AM', status: 'Upcoming', type: 'Follow-up' },

  // Dr. Brown (Neurology) - d002: Mix of consultations
  { 
    id: 'app004', 
    patientId: 'p002', 
    patientName: 'Alice Johnson', 
    doctorId: 'd002', 
    doctorName: 'Dr. Michael Brown', 
    doctorSpecialization: 'Neurology', 
    date: formatDate(getDateRelativeToToday(3)), 
    time: '09:00 AM', 
    status: 'Upcoming', 
    type: 'Follow-up',
    accessibilityRequest: {
      wheelchairNeeded: false,
      writtenInstructions: true,
      communicationSupport: 'Visual Guidance Assistance',
      assistanceNotes: 'Patient requests written clinical summary in clear print.'
    }
  },
  { id: 'app012', patientId: 'p002', patientName: 'Alice Johnson', doctorId: 'd002', doctorName: 'Dr. Michael Brown', doctorSpecialization: 'Neurology', date: formatDate(getDateRelativeToToday(-20)), time: '09:30 AM', status: 'Completed', type: 'New Consultation' },
  { id: 'app013', patientId: 'p007', patientName: 'Clark Kent', doctorId: 'd002', doctorName: 'Dr. Michael Brown', doctorSpecialization: 'Neurology', date: formatDate(getDateRelativeToToday(3)), time: '11:00 AM', status: 'Upcoming', type: 'New Consultation' },
  { id: 'app019', patientId: 'p002', patientName: 'Alice Johnson', doctorId: 'd002', doctorName: 'Dr. Michael Brown', doctorSpecialization: 'Neurology', date: formatDate(getDateRelativeToToday(10)), time: '10:00 AM', status: 'Upcoming', type: 'Follow-up' },
  
  // Dr. White (Pediatrics) - d003: Focus on check-ups for younger patients
  { id: 'app005', patientId: 'p004', patientName: 'Charlie Brown', doctorId: 'd003', doctorName: 'Dr. Emily White', doctorSpecialization: 'Pediatrics', date: formatDate(getDateRelativeToToday(0)), time: '01:00 PM', status: 'Upcoming', type: 'Check-up' },
  { id: 'app014', patientId: 'p009', patientName: 'Peter Parker', doctorId: 'd003', doctorName: 'Dr. Emily White', doctorSpecialization: 'Pediatrics', date: formatDate(getDateRelativeToToday(1)), time: '10:00 AM', status: 'Upcoming', type: 'Check-up' },
  { id: 'app020', patientId: 'p004', patientName: 'Charlie Brown', doctorId: 'd003', doctorName: 'Dr. Emily White', doctorSpecialization: 'Pediatrics', date: formatDate(getDateRelativeToToday(7)), time: '02:00 PM', status: 'Upcoming', type: 'Follow-up' },
  { id: 'app021', patientId: 'p009', patientName: 'Peter Parker', doctorId: 'd003', doctorName: 'Dr. Emily White', doctorSpecialization: 'Pediatrics', date: formatDate(getDateRelativeToToday(15)), time: '11:00 AM', status: 'Upcoming', type: 'Check-up' },
  { id: 'app022', patientId: 'p004', patientName: 'Charlie Brown', doctorId: 'd003', doctorName: 'Dr. Emily White', doctorSpecialization: 'Pediatrics', date: formatDate(getDateRelativeToToday(-14)), time: '01:30 PM', status: 'Completed', type: 'New Consultation' },
  
  // Dr. Green (Orthopedics) - d004
  { id: 'app006', patientId: 'p006', patientName: 'Bruce Wayne', doctorId: 'd004', doctorName: 'Dr. Robert Green', doctorSpecialization: 'Orthopedics', date: formatDate(getDateRelativeToToday(5)), time: '03:00 PM', status: 'Upcoming', type: 'Follow-up' },
  { id: 'app007', patientId: 'p006', patientName: 'Bruce Wayne', doctorId: 'd004', doctorName: 'Dr. Robert Green', doctorSpecialization: 'Orthopedics', date: formatDate(getDateRelativeToToday(-15)), time: '03:30 PM', status: 'Completed', type: 'New Consultation' },
  { id: 'app015', patientId: 'p008', patientName: 'Sara Lance', doctorId: 'd004', doctorName: 'Dr. Robert Green', doctorSpecialization: 'Orthopedics', date: formatDate(getDateRelativeToToday(5)), time: '04:00 PM', status: 'Upcoming', type: 'New Consultation' },
  { id: 'app023', patientId: 'p008', patientName: 'Sara Lance', doctorId: 'd004', doctorName: 'Dr. Robert Green', doctorSpecialization: 'Orthopedics', date: formatDate(getDateRelativeToToday(13)), time: '03:30 PM', status: 'Upcoming', type: 'Follow-up' },

  // Dr. Ramesh Kumar (General Physician) - d005: A bit of everything
  { id: 'app008', patientId: 'p005', patientName: 'Diana Prince', doctorId: 'd005', doctorName: 'Dr. Ramesh Kumar', doctorSpecialization: 'General Physician', date: formatDate(getDateRelativeToToday(1)), time: '10:30 AM', status: 'Upcoming', type: 'Check-up' },
  { id: 'app009', patientId: 'p007', patientName: 'Clark Kent', doctorId: 'd005', doctorName: 'Dr. Ramesh Kumar', doctorSpecialization: 'General Physician', date: formatDate(getDateRelativeToToday(-5)), time: '11:30 AM', status: 'Completed', type: 'Follow-up' },
  { id: 'app016', patientId: 'p001', patientName: 'John Doe', doctorId: 'd005', doctorName: 'Dr. Ramesh Kumar', doctorSpecialization: 'General Physician', date: formatDate(getDateRelativeToToday(6)), time: '09:30 AM', status: 'Upcoming', type: 'Check-up' },
  { id: 'app024', patientId: 'p002', patientName: 'Alice Johnson', doctorId: 'd005', doctorName: 'Dr. Ramesh Kumar', doctorSpecialization: 'General Physician', date: formatDate(getDateRelativeToToday(0)), time: '04:30 PM', status: 'Upcoming', type: 'New Consultation' },
];


export const MOCK_RECORDS: MedicalRecord[] = [
  { id: 'rec001', patientId: 'p001', date: formatDate(getDateRelativeToToday(-9)), type: 'Lab Result', title: 'Annual Blood Panel', summary: 'All markers within normal range. Cholesterol slightly elevated.', doctorName: 'Dr. Jane Smith', fileUrl: '#' },
  { id: 'rec002', patientId: 'p001', date: formatDate(getDateRelativeToToday(-10)), type: 'Doctor\'s Note', title: 'Neurology Consultation Summary', summary: 'Patient reports occasional headaches. No concerning neurological signs.', doctorName: 'Dr. Michael Brown', fileUrl: '#' },
  { id: 'rec003', patientId: 'p001', date: formatDate(getDateRelativeToToday(-30)), type: 'Radiology Report', title: 'X-Ray: Left Knee', summary: 'No fractures or significant abnormalities detected.', doctorName: 'Dr. Robert Green', fileUrl: '#' },
];

export const MOCK_BILLS: Bill[] = [
  { id: 'b001', patientId: 'p001', date: formatDate(getDateRelativeToToday(-9)), service: 'Cardiology Consultation', amount: 250, status: 'Paid' },
  { id: 'b002', patientId: 'p001', date: formatDate(getDateRelativeToToday(-10)), service: 'Neurology Consultation', amount: 300, status: 'Paid' },
  { id: 'b003', patientId: 'p001', date: formatDate(getDateRelativeToToday(-2)), service: 'Annual Lab Work', amount: 150, status: 'Due' },
];

export const MOCK_INVOICES: Invoice[] = [
    {
        id: 'inv001',
        invoiceNumber: 'HMS-2024-001',
        patientId: 'p001',
        patientName: 'John Doe',
        issueDate: formatDate(getDateRelativeToToday(-10)),
        dueDate: formatDate(getDateRelativeToToday(20)),
        items: [
            { id: 'item1', description: 'Cardiology Consultation - Dr. Jane Smith', amount: 250 },
            { id: 'item2', description: 'Standard Blood Panel', amount: 120 },
            { id: 'item3', description: 'Ibuprofen (200mg)', amount: 15.50 },
        ],
        totalAmount: 385.50,
        status: 'Paid',
    },
    {
        id: 'inv002',
        invoiceNumber: 'HMS-2024-002',
        patientId: 'p002',
        patientName: 'Alice Johnson',
        issueDate: formatDate(getDateRelativeToToday(-5)),
        dueDate: formatDate(getDateRelativeToToday(25)),
        items: [
            { id: 'item1', description: 'Neurology Follow-up - Dr. Michael Brown', amount: 180 },
        ],
        totalAmount: 180,
        status: 'Unpaid',
    },
    {
        id: 'inv003',
        invoiceNumber: 'HMS-2024-003',
        patientId: 'p001',
        patientName: 'John Doe',
        issueDate: formatDate(getDateRelativeToToday(-40)),
        dueDate: formatDate(getDateRelativeToToday(-10)),
        items: [
            { id: 'item1', description: 'Orthopedics Check-up - Dr. Robert Green', amount: 200 },
            { id: 'item2', description: 'Knee X-Ray', amount: 150 },
        ],
        totalAmount: 350,
        status: 'Overdue',
    },
];

export const MOCK_WELLNESS_DATA: WellnessEntry[] = [
    { id: 'w001', patientId: 'p001', date: formatDate(getDateRelativeToToday(-15)), bloodPressure: { systolic: 120, diastolic: 80 }, bloodSugar: 95, weight: 85 },
    { id: 'w002', patientId: 'p001', date: formatDate(getDateRelativeToToday(-12)), bloodPressure: { systolic: 122, diastolic: 81 }, weight: 84.5 },
    { id: 'w003', patientId: 'p001', date: formatDate(getDateRelativeToToday(-8)), bloodSugar: 98 },
    { id: 'w004', patientId: 'p001', date: formatDate(getDateRelativeToToday(-5)), bloodPressure: { systolic: 118, diastolic: 78 }, weight: 84 },
    { id: 'w005', patientId: 'p001', date: formatDate(getDateRelativeToToday(-1)), bloodSugar: 92 },
];

export const MOCK_PRESCRIPTIONS: Prescription[] = [
  { id: 'presc001', patientId: 'p001', patientName: 'John Doe', doctorId: 'd001', doctorName: 'Dr. Jane Smith', date: formatDate(getDateRelativeToToday(-10)), medication: 'Lisinopril', dosage: '10mg', frequency: 'Once daily in the morning', duration: '30 days', notes: 'Monitor blood pressure.', status: 'Active' },
  { id: 'presc002', patientId: 'p002', patientName: 'Alice Johnson', doctorId: 'd002', doctorName: 'Dr. Michael Brown', date: formatDate(getDateRelativeToToday(-20)), medication: 'Sumatriptan', dosage: '50mg', frequency: 'As needed for migraines', duration: 'N/A', notes: 'Do not exceed 2 doses per day.', status: 'Active' },
  { id: 'presc003', patientId: 'p001', patientName: 'John Doe', doctorId: 'd001', doctorName: 'Dr. Jane Smith', date: formatDate(getDateRelativeToToday(-45)), medication: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily at bedtime', duration: '90 days', status: 'Completed' },
];

export const MOCK_MEDICINES: Medicine[] = [
  { id: 'med01', name: "Paracetamol", category: "Painkiller", quantity: 85, expiry: "2026-02-10" },
  { id: 'med02', name: "Amoxicillin", category: "Antibiotic", quantity: 40, expiry: "2025-06-12" },
  { id: 'med03', name: "Metformin", category: "Diabetes", quantity: 25, expiry: "2025-12-20" },
  { id: 'med04', name: "Cetirizine", category: "Allergy", quantity: 15, expiry: "2025-09-18" },
  { id: 'med05', name: "Omeprazole", category: "Acidity", quantity: 100, expiry: "2027-01-25" },
  { id: 'med06', name: "Ibuprofen", category: "Painkiller", quantity: 10, expiry: "2025-03-22" },
  { id: 'med07', name: "Azithromycin", category: "Antibiotic", quantity: 55, expiry: formatDate(getDateRelativeToToday(-30)) }, // Expired example
  { id: 'med08', name: "Vitamin C", category: "Supplement", quantity: 120, expiry: "2027-04-12" },
  { id: 'med09', name: "Calcium Tablet", category: "Supplement", quantity: 75, expiry: "2026-10-05" },
  { id: 'med10', name: "Diclofenac", category: "Painkiller", quantity: 8, expiry: "2025-01-30" }
];

export const MOCK_INVENTORY: MedicationStock[] = [
  { id: 'med001', name: 'Lisinopril 10mg', stockLevel: 150, reorderPoint: 50 },
  { id: 'med002', name: 'Metformin 500mg', stockLevel: 45, reorderPoint: 50 },
  { id: 'med003', name: 'Atorvastatin 20mg', stockLevel: 200, reorderPoint: 75 },
  { id: 'med004', name: 'Amoxicillin 250mg', stockLevel: 0, reorderPoint: 100 },
  { id: 'med005', name: 'Ibuprofen 200mg', stockLevel: 500, reorderPoint: 200 },
];

export const MOCK_ASSIGNED_PATIENTS: AssignedPatient[] = [
  { id: 'p002', name: 'Alice Johnson', room: '101A', status: 'Stable', vitals: { bp: '120/80', temp: '98.6°F', hr: '72bpm' } },
  { id: 'p003', name: 'Bob Williams', room: '102B', status: 'Needs Monitoring', vitals: { bp: '130/85', temp: '99.1°F', hr: '80bpm' } },
  { id: 'p004', name: 'Charlie Brown', room: '105A', status: 'Post-Op', vitals: { bp: '110/70', temp: '98.9°F', hr: '68bpm' } },
];

export const MOCK_NURSE_TASKS = [
    'Administer medication to Alice Johnson (Room 101A) at 2 PM',
    'Check vitals for Bob Williams (Room 102B)',
    'Change dressing for Charlie Brown (Room 105A)',
    'Restock Room 101A supply cart',
];

export const MOCK_LAB_TESTS: LabTest[] = [
  { id: 'lab001', patientName: 'John Doe', testType: 'Complete Blood Count (CBC)', status: 'Completed', requestedBy: 'Dr. Jane Smith', date: formatDate(getDateRelativeToToday(-1)), results: 'All values within normal ranges.' },
  { id: 'lab002', patientName: 'Alice Johnson', testType: 'Lipid Panel', status: 'In Progress', requestedBy: 'Dr. Jane Smith', date: formatDate(getDateRelativeToToday(0)) },
  { id: 'lab003', patientName: 'Bob Williams', testType: 'Thyroid Panel (TSH)', status: 'Pending', requestedBy: 'Dr. Michael Brown', date: formatDate(getDateRelativeToToday(0)) },
  { id: 'lab004', patientName: 'Charlie Brown', testType: 'Basic Metabolic Panel (BMP)', status: 'Pending', requestedBy: 'Dr. Robert Green', date: formatDate(getDateRelativeToToday(0)) },
];


const getDateWithTime = (daysAgo: number, hour: number, minute: number): Date => {
    const d = getDateRelativeToToday(-daysAgo);
    d.setHours(hour, minute, 0, 0);
    return d;
};

export const MOCK_CHARTS: PatientChart[] = [
  {
    patientId: 'p002',
    notes: [
      { date: formatDateTime(getDateWithTime(0, 8, 0)), note: 'Patient is comfortable and alert. Vitals are stable.', author: 'C. Espinosa, RN' },
      { date: formatDateTime(getDateWithTime(1, 21, 0)), note: 'Reports mild discomfort at incision site. Administered pain medication as prescribed.', author: 'J. Dorian, MD' },
    ],
    medicationSchedule: [
      { time: '09:00 AM', medication: 'Antibiotic X', dosage: '500mg' },
      { time: '01:00 PM', medication: 'Painkiller Y', dosage: 'As needed' },
      { time: '09:00 PM', medication: 'Antibiotic X', dosage: '500mg' },
    ],
    vitalsHistory: [
        { date: formatDateTime(getDateWithTime(2, 8, 0)), temp: 98.7, bp: { systolic: 122, diastolic: 81 }, hr: 75 },
        { date: formatDateTime(getDateWithTime(2, 14, 0)), temp: 99.0, bp: { systolic: 124, diastolic: 82 }, hr: 78 },
        { date: formatDateTime(getDateWithTime(1, 8, 0)), temp: 98.8, bp: { systolic: 120, diastolic: 80 }, hr: 72 },
        { date: formatDateTime(getDateWithTime(1, 14, 0)), temp: 98.6, bp: { systolic: 118, diastolic: 78 }, hr: 70 },
        { date: formatDateTime(getDateWithTime(0, 8, 0)), temp: 98.6, bp: { systolic: 120, diastolic: 80 }, hr: 72 },
    ],
  },
  {
    patientId: 'p003',
    notes: [
      { date: formatDateTime(getDateWithTime(0, 9, 15)), note: 'Blood pressure slightly elevated. Will continue to monitor every hour.', author: 'C. Espinosa, RN' },
    ],
    medicationSchedule: [
      { time: '10:00 AM', medication: 'Lisinopril', dosage: '10mg' },
    ],
    vitalsHistory: [
        { date: formatDateTime(getDateWithTime(1, 18, 0)), temp: 99.0, bp: { systolic: 135, diastolic: 88 }, hr: 82 },
        { date: formatDateTime(getDateWithTime(0, 2, 0)), temp: 99.2, bp: { systolic: 138, diastolic: 90 }, hr: 85 },
        { date: formatDateTime(getDateWithTime(0, 9, 0)), temp: 99.1, bp: { systolic: 130, diastolic: 85 }, hr: 80 },
    ],
  },
  {
    patientId: 'p004',
    notes: [
      { date: formatDateTime(getDateWithTime(0, 7, 30)), note: 'Patient returning from surgery. Anesthesia wearing off. Groggy but responsive.', author: 'C. Espinosa, RN' },
    ],
    medicationSchedule: [
      { time: '08:00 AM', medication: 'IV Fluids', dosage: '100ml/hr' },
      { time: '12:00 PM', medication: 'Oxycodone', dosage: '5mg' },
    ],
    vitalsHistory: [
        { date: formatDateTime(getDateWithTime(0, 7, 30)), temp: 98.2, bp: { systolic: 105, diastolic: 65 }, hr: 65 },
        { date: formatDateTime(getDateWithTime(0, 8, 30)), temp: 98.9, bp: { systolic: 110, diastolic: 70 }, hr: 68 },
    ],
  },
];


export const SERVICES_LIST: Service[] = [
  { 
    name: 'Cardiology', 
    description: 'Comprehensive heart care, from diagnosis to treatment of cardiovascular diseases.', 
    icon: '❤️',
    detailedDescription: 'Our Cardiology department offers state-of-the-art diagnostic services including ECG, Echocardiography, and Stress Tests. We provide advanced treatment for conditions like coronary artery disease, heart failure, and arrhythmias, with a focus on personalized patient care and preventative strategies.'
  },
  { 
    name: 'Neurology', 
    description: 'Expert care for disorders of the nervous system, including the brain, spinal cord, and nerves.', 
    icon: '🧠',
    detailedDescription: 'We specialize in diagnosing and treating a wide range of neurological conditions. Our services include EEG and EMG testing, stroke care, and management of chronic diseases like epilepsy, Parkinson\'s, and multiple sclerosis. Our team is committed to improving the quality of life for our patients.'
  },
  { 
    name: 'Pediatrics', 
    description: 'Dedicated healthcare for infants, children, and adolescents.', 
    icon: '👶',
    detailedDescription: 'Our pediatrics team provides compassionate and comprehensive care for your children, from routine check-ups and vaccinations to specialized treatment for childhood illnesses. We create a friendly and welcoming environment to ensure your child feels comfortable and safe.'
  },
  { 
    name: 'Orthopedics', 
    description: 'Specialized treatment for injuries and diseases of the musculoskeletal system.', 
    icon: '🦴',
    detailedDescription: 'From sports injuries and fractures to joint replacements and spine surgery, our orthopedic specialists use the latest techniques to help you regain mobility and live pain-free. We offer both surgical and non-surgical treatment options tailored to your needs.'
  },
  { 
    name: 'Emergency Care', 
    description: '24/7 state-of-the-art emergency services for immediate medical needs.', 
    icon: '🚑',
    detailedDescription: 'Our Emergency Department is equipped to handle any medical crisis, 24/7. Staffed by board-certified emergency physicians and nurses, we provide rapid, life-saving care for all urgent medical conditions in a state-of-the-art facility.'
  },
  { 
    name: 'Diagnostics', 
    description: 'Advanced imaging and laboratory services for accurate diagnosis.', 
    icon: '🔬',
    detailedDescription: 'Accurate diagnosis is the first step to effective treatment. Our diagnostics center features advanced imaging technology, including MRI, CT scans, and X-ray, as well as a full-service laboratory for fast and reliable test results.'
  },
  { 
    name: 'Surgery', 
    description: 'A wide range of surgical procedures performed by experienced surgeons.', 
    icon: '⚕️',
    detailedDescription: 'Our surgical department offers a wide range of procedures, from minimally invasive laparoscopic surgeries to complex open-heart operations. Our highly skilled surgical teams are dedicated to patient safety and achieving the best possible outcomes.'
  },
  { 
    name: 'Pharmacy', 
    description: 'On-site pharmacy providing convenient access to medications.', 
    icon: '💊',
    detailedDescription: 'Our on-site pharmacy makes it easy to get your prescriptions filled quickly and conveniently. Our knowledgeable pharmacists are available to answer your questions and provide guidance on your medications, ensuring you understand your treatment plan.'
  },
  { 
    name: 'General Physician', 
    description: 'Primary care for adults, including preventive care and management of chronic illnesses.', 
    icon: '🧑‍⚕️',
    detailedDescription: 'Our General Physicians serve as the first point of contact for patients. They are skilled in diagnosing a wide range of health issues, providing preventive care, managing chronic conditions like diabetes and hypertension, and coordinating with other specialists.'
  },
  { 
    name: 'Family Medicine', 
    description: 'Comprehensive healthcare for the individual and family across all ages, genders, and diseases.', 
    icon: '👨‍👩‍👧‍👦',
    detailedDescription: 'Our Family Medicine practitioners provide continuing and comprehensive health care for individuals and families. This specialty integrates biological, clinical, and behavioral sciences and is not limited by the patient\'s age or sex, organ system, or disease entity.'
  },
  { 
    name: 'Internal Medicine', 
    description: 'Specialized in the diagnosis, treatment, and prevention of disease in adults.', 
    icon: '🩺',
    detailedDescription: 'Internists are equipped to handle a broad and comprehensive spectrum of illnesses that affect adults, and are recognized as experts in diagnosis, in treatment of chronic illness, and in health promotion and disease prevention—they are not limited to one type of medical problem or organ system.'
  },
  { 
    name: 'Dentistry', 
    description: 'Complete care for your oral health, from routine check-ups to dental procedures.', 
    icon: '🦷',
    detailedDescription: 'Our dental department provides a full range of services to keep your smile healthy. This includes routine cleanings, fillings, root canals, extractions, and cosmetic procedures. We use the latest technology to ensure comfortable and effective treatment.'
  },
  { 
    name: 'Orthodontics', 
    description: 'Specialized treatment for correcting teeth and jaw alignment issues.', 
    icon: '😬',
    detailedDescription: 'Achieve a perfectly aligned smile with our orthodontic services. We offer traditional braces, clear aligners, and other advanced treatments to correct misaligned teeth and jaws for both children and adults, improving both aesthetics and function.'
  },
  { 
    name: 'Cosmetic Dentistry', 
    description: 'Enhance the appearance of your smile with our cosmetic dental procedures.', 
    icon: '✨',
    detailedDescription: 'Transform your smile with our cosmetic dentistry services. We offer professional teeth whitening, veneers, dental bonding, and complete smile makeovers to help you achieve the confident, beautiful smile you\'ve always wanted.'
  },
];

export const TESTIMONIALS = [
    { name: 'Sarah L.', text: 'The care I received at MediConnect was exceptional. The doctors and nurses were incredibly attentive and made me feel at ease throughout my stay.', avatar: 'https://ui-avatars.com/api/?name=Sarah+L&background=F0B429&color=fff' },
    { name: 'Mark T.', text: 'Booking appointments through the patient portal is so easy and convenient. It saved me a lot of time and hassle. Highly recommend!', avatar: 'https://ui-avatars.com/api/?name=Mark+T&background=F0B429&color=fff' },
    { name: 'Emily R.', text: 'Dr. White is a wonderful pediatrician. She is so patient and kind with my children. We feel very fortunate to have her as our doctor.', avatar: 'https://ui-avatars.com/api/?name=Emily+R&background=F0B429&color=fff' },
];

export const MOCK_QUEUE_ENTRIES: QueueEntry[] = [
  {
    id: 'q_001',
    tokenNumber: 'TK-104',
    patientId: 'p001',
    patientName: 'John Doe',
    doctorId: 'd001',
    doctorName: 'Dr. Jane Smith',
    department: 'Cardiology',
    roomNumber: 'Room 204 (Cardiology Wing - 2nd Floor)',
    queuePosition: 2,
    estimatedWaitMinutes: 8,
    status: 'Waiting',
    checkInTime: '10:45 AM',
  },
  {
    id: 'q_002',
    tokenNumber: 'TK-105',
    patientId: 'p002',
    patientName: 'Alice Johnson',
    doctorId: 'd002',
    doctorName: 'Dr. Michael Brown',
    department: 'Neurology',
    roomNumber: 'Room 310 (Neurology Wing - 3rd Floor)',
    queuePosition: 3,
    estimatedWaitMinutes: 15,
    status: 'Waiting',
    checkInTime: '10:50 AM',
  },
  {
    id: 'q_003',
    tokenNumber: 'TK-103',
    patientId: 'p003',
    patientName: 'Bob Williams',
    doctorId: 'd001',
    doctorName: 'Dr. Jane Smith',
    department: 'Cardiology',
    roomNumber: 'Room 204 (Cardiology Wing - 2nd Floor)',
    queuePosition: 1,
    estimatedWaitMinutes: 2,
    status: 'Calling',
    checkInTime: '10:35 AM',
    calledAt: new Date(Date.now() - 3 * 60000).toISOString(),
  }
];

export const MOCK_SILENT_ALERTS: SilentAlert[] = [
  {
    id: 'alert_001',
    tokenNumber: 'TK-089',
    patientId: 'p001',
    patientName: 'John Doe',
    doctorId: 'd005',
    doctorName: 'Dr. Ramesh Kumar',
    department: 'General Physician',
    roomNumber: 'Room 105 (OPD Ground Floor)',
    timestamp: new Date(Date.now() - 24 * 3600000).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
    acknowledged: true,
    acknowledgedAt: new Date(Date.now() - 24 * 3600000 + 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'Completed',
  },
  {
    id: 'alert_002',
    tokenNumber: 'TK-042',
    patientId: 'p001',
    patientName: 'John Doe',
    doctorId: 'd001',
    doctorName: 'Dr. Jane Smith',
    department: 'Cardiology',
    roomNumber: 'Room 204 (Cardiology Wing - 2nd Floor)',
    timestamp: new Date(Date.now() - 72 * 3600000).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
    acknowledged: true,
    acknowledgedAt: new Date(Date.now() - 72 * 3600000 + 45000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'Completed',
  }
];

export const VERIFIED_ACCESSIBILITY_FACILITIES: VerifiedAccessibilityFacility[] = [
  {
    id: 'acc-fac-01',
    name: 'Main Atrium ADA Grade-A Dual Ramp',
    type: 'Ramp',
    floor: 0,
    location: 'Main Hospital Entrance, Ground Level',
    description: 'ADA standard 1:12 non-slip grade ramp with continuous safety dual-handrails and tactile ground indicators for smooth wheelchair and gurney transit.',
    verifiedStatus: 'Verified Hospital Standard'
  },
  {
    id: 'acc-fac-02',
    name: 'Emergency & Ambulance Wheelchair Transfer Bay',
    type: 'Wheelchair Station',
    floor: 0,
    location: 'Emergency Wing Entrance, Ground Level',
    description: '24/7 designated wheelchair and transport gurney bay with hospital orderly station and motorized curbside lift.',
    verifiedStatus: 'Verified Hospital Standard'
  },
  {
    id: 'acc-fac-03',
    name: 'Central Atrium Smart Voice & Braille Elevators (Bank A & B)',
    type: 'Elevator',
    floor: 0,
    location: 'Central Concourse Hub, Access to Floors L0 - L3',
    description: 'High-capacity, stretcher-compliant elevators with audible floor announcements, low-height push-buttons with Braille, and extended safety door holding.',
    verifiedStatus: 'Verified Hospital Standard'
  },
  {
    id: 'acc-fac-04',
    name: 'Universal Accessible Restrooms (Motorized Access)',
    type: 'Restroom',
    floor: 0,
    location: 'OPD Concourse West & Floor 1 Pediatric Wing',
    description: 'Unisex wheelchair-accessible restrooms featuring automatic push-to-open switches, grab bars, adult transfer bench, and emergency pull cord directly linked to the nursing station.',
    verifiedStatus: 'Verified Hospital Standard'
  },
  {
    id: 'acc-fac-05',
    name: 'Assisted Hearing Induction Loop System',
    type: 'Tactile Path',
    floor: 2,
    location: 'Cardiology & Outpatient Waiting Room 204',
    description: 'Telecoil-compatible wireless magnetic induction sound loop assisting patients with hearing aids to receive clear queue calls and clinical consultations without background noise.',
    verifiedStatus: 'Verified Hospital Standard'
  },
  {
    id: 'acc-fac-06',
    name: 'Tactile Ground Indicator Paths & Braille Wayfinding',
    type: 'Tactile Path',
    floor: 0,
    location: 'Main Entrance to Reception, Elevator Lobby, and Pharmacy',
    description: 'Raised directional surface paving aiding low-vision and visually impaired patients from the entrance to primary clinical checkpoints.',
    verifiedStatus: 'Verified Hospital Standard'
  }
];


