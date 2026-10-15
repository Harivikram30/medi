
export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'NURSE' | 'PHARMACY' | 'LAB_TECHNICIAN';

export type Page = 'Home' | 'About Us' | 'Services' | 'Contact' | 'WayFinder' | 'Patient Portal' | 'Doctor Portal' | 'Admin Dashboard' | 'Nurse Portal' | 'Pharmacy Portal' | 'Lab Portal';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  password: string;
  department?: string;
  isVerified?: boolean;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  currentCondition: string;
}

export interface Doctor {
  id:string;
  name: string;
  specialization: string;
  experience: number;
  bio: string;
  imageUrl: string;
  availability: string;
}

export type DoctorAvailability = Record<string, string[]>;

export type WheelchairLocation = 'Main Entrance Ramps' | 'Emergency Bay' | 'Accessible Car Parking' | 'OPD Reception Atrium' | 'Elevator Lobby';
export type CommunicationSupportType = 'None' | 'Sign Language Interpreter' | 'Visual Guidance Assistance' | 'Hearing Loop Amplification' | 'Large Print & High Contrast Forms';

export interface AccessibilityRequest {
  wheelchairNeeded: boolean;
  wheelchairLocation?: WheelchairLocation;
  writtenInstructions: boolean; // Request printed clinical summary & instructions
  communicationSupport: CommunicationSupportType;
  assistanceNotes?: string;
  createdAt?: string;
}

export interface VerifiedAccessibilityFacility {
  id: string;
  name: string;
  type: 'Ramp' | 'Elevator' | 'Restroom' | 'Wheelchair Station' | 'Tactile Path';
  floor: number;
  location: string;
  description: string;
  verifiedStatus: 'Verified Hospital Standard';
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  date: string;
  time: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  type: 'New Consultation' | 'Follow-up' | 'Check-up';
  accessibilityRequest?: AccessibilityRequest;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  date: string;
  type: 'Lab Result' | 'Prescription' | 'Doctor\'s Note' | 'Radiology Report';
  title: string;
  summary: string;
  doctorName: string;
  fileUrl: string; // In a real app, this would be a secure link
}

export interface Bill {
  id: string;
  patientId: string;
  date: string;
  service: string;
  amount: number;
  status: 'Paid' | 'Due';
}

// New Types for Admin Billing System
export interface BillingRecord {
  id: string;
  description: string;
  amount: number;
}

export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  items: BillingRecord[];
  totalAmount: number;
  status: InvoiceStatus;
}


export interface Service {
  name: string;
  description: string;
  icon: string;
  detailedDescription: string;
}

export interface WellnessEntry {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  bloodSugar?: number; // mg/dL
  weight?: number; // in kg
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string; // YYYY-MM-DD
  medication: string;
  dosage: string; // e.g., '500mg'
  frequency: string; // e.g., 'Twice a day'
  duration: string; // e.g., '10 days'
  notes?: string;
  status: 'Active' | 'Ready for Pickup' | 'Dispensed' | 'Completed' | 'Cancelled';
}

export interface Medicine {
  id: string;
  name: string;
  category: string;
  quantity: number;
  expiry: string; // YYYY-MM-DD
}

export interface MedicationStock {
  id: string;
  name: string;
  stockLevel: number;
  reorderPoint: number;
}

export interface AssignedPatient {
  id: string;
  name: string;
  room: string;
  status: string;
  vitals: { bp: string; temp: string; hr: string };
}

export interface VitalSignEntry {
  date: string; // e.g., '2024-08-10 08:00'
  temp: number; // in °F
  bp: { systolic: number; diastolic: number; };
  hr: number; // heart rate
}

export interface PatientChart {
  patientId: string;
  notes: Array<{ date: string; note: string; author: string; }>;
  medicationSchedule: Array<{ time: string; medication: string; dosage: string; }>;
  vitalsHistory: VitalSignEntry[];
}

export interface LabTest {
  id: string;
  patientName: string;
  testType: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  requestedBy: string; // Doctor's name
  date: string;
  results?: string;
}

// MediSilentAlert & Queue Management Types
export type QueueStatus = 'Waiting' | 'Calling' | 'Your Turn' | 'In Consultation' | 'Completed' | 'Cancelled';

export interface QueueEntry {
  id: string;
  tokenNumber: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  roomNumber: string;
  queuePosition: number;
  estimatedWaitMinutes: number;
  status: QueueStatus;
  checkInTime: string;
  calledAt?: string;
  acknowledgedAt?: string;
}

export interface SilentAlert {
  id: string;
  tokenNumber: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  roomNumber: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  status: QueueStatus;
}

// MediConnect WayFinder Types
export type LocationCategory = 'Clinical' | 'Emergency' | 'Diagnostics' | 'Pharmacy & Admin' | 'Amenities';

export interface HospitalLocation {
  id: string;
  name: string;
  roomNumber: string;
  floor: number; // 0: Ground, 1: 1st Floor, 2: 2nd Floor, 3: 3rd Floor
  floorName: string;
  wing: 'East Wing' | 'West Wing' | 'Central Atrium';
  category: LocationCategory;
  department?: string;
  doctorName?: string;
  description: string;
  isWheelchairAccessible: boolean;
  coordinates: { x: number; y: number }; // percentage position on floor map (0-100)
  openHours: string;
  contactExt?: string;
}

export interface NavigationStep {
  stepNumber: number;
  instruction: string;
  isElevatorOrRamp?: boolean;
  distanceMeters: number;
  icon?: string;
}

export interface WayFinderRoute {
  startLocation: HospitalLocation;
  destinationLocation: HospitalLocation;
  isWheelchairAccessible: boolean;
  totalDistanceMeters: number;
  estimatedMinutes: number;
  steps: NavigationStep[];
}

