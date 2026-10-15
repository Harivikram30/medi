import type { HospitalLocation, WayFinderRoute, NavigationStep } from '../types';
import QRCode from 'qrcode';

const WAYFINDER_STORAGE_KEY = 'hms_wayfinder_locations';

export const INITIAL_HOSPITAL_LOCATIONS: HospitalLocation[] = [
  // --- Ground Floor (Floor 0) ---
  {
    id: 'loc_g01',
    name: 'Main Hospital Entrance & Reception',
    roomNumber: 'Reception Desk',
    floor: 0,
    floorName: 'Ground Floor (L0)',
    wing: 'Central Atrium',
    category: 'Amenities',
    description: 'Central help desk, visitor sign-in, inquiry station, and wheelchair assistance dispatch.',
    isWheelchairAccessible: true,
    coordinates: { x: 50, y: 88 },
    openHours: '24/7',
    contactExt: 'x1000'
  },
  {
    id: 'loc_g02',
    name: 'Emergency Department & Trauma Care',
    roomNumber: 'Room ER-101',
    floor: 0,
    floorName: 'Ground Floor (L0)',
    wing: 'West Wing',
    category: 'Emergency',
    department: 'Emergency & Critical Care',
    description: 'Immediate acute care, resuscitation bays, emergency triage, and ambulance bay entrance.',
    isWheelchairAccessible: true,
    coordinates: { x: 18, y: 68 },
    openHours: '24/7',
    contactExt: 'x911'
  },
  {
    id: 'loc_g03',
    name: 'Outpatient Pharmacy (Main Dispensary)',
    roomNumber: 'Room PH-01',
    floor: 0,
    floorName: 'Ground Floor (L0)',
    wing: 'East Wing',
    category: 'Pharmacy & Admin',
    department: 'Pharmacy',
    doctorName: 'Peter Petrelli (Chief Pharmacist)',
    description: 'Prescription dispensing, medication consultation, over-the-counter medical supplies.',
    isWheelchairAccessible: true,
    coordinates: { x: 82, y: 68 },
    openHours: '8:00 AM - 10:00 PM',
    contactExt: 'x1040'
  },
  {
    id: 'loc_g04',
    name: 'OPD Token Registration & Billing Desk',
    roomNumber: 'Room REG-01',
    floor: 0,
    floorName: 'Ground Floor (L0)',
    wing: 'Central Atrium',
    category: 'Pharmacy & Admin',
    description: 'Outpatient check-in, token issuance for MediSilentAlert, insurance desk, cashiers.',
    isWheelchairAccessible: true,
    coordinates: { x: 50, y: 62 },
    openHours: '7:30 AM - 8:00 PM',
    contactExt: 'x1020'
  },
  {
    id: 'loc_g05',
    name: 'Radiology, X-Ray & MRI Imaging',
    roomNumber: 'Room RAD-01',
    floor: 0,
    floorName: 'Ground Floor (L0)',
    wing: 'West Wing',
    category: 'Diagnostics',
    department: 'Radiology',
    description: 'Digital X-Ray, 3T MRI, High-Speed CT Scanner, Ultrasound, and Bone Densitometry.',
    isWheelchairAccessible: true,
    coordinates: { x: 20, y: 32 },
    openHours: '24/7',
    contactExt: 'x1080'
  },
  {
    id: 'loc_g06',
    name: 'Cafeteria & Healing Garden Atrium',
    roomNumber: 'Cafe Lounge',
    floor: 0,
    floorName: 'Ground Floor (L0)',
    wing: 'East Wing',
    category: 'Amenities',
    description: 'Organic cafe, fresh juice bar, healthy patient meals, outdoor seating patio.',
    isWheelchairAccessible: true,
    coordinates: { x: 80, y: 32 },
    openHours: '7:00 AM - 9:00 PM',
    contactExt: 'x1090'
  },
  {
    id: 'loc_g07',
    name: 'Central Elevator Bank A (Ramp Connected)',
    roomNumber: 'Elevator A',
    floor: 0,
    floorName: 'Ground Floor (L0)',
    wing: 'Central Atrium',
    category: 'Amenities',
    description: 'High-speed hospital bed & wheelchair accessible elevators connecting all floors L0 to L3.',
    isWheelchairAccessible: true,
    coordinates: { x: 50, y: 38 },
    openHours: '24/7'
  },

  // --- 1st Floor (Floor 1) ---
  {
    id: 'loc_101',
    name: 'General Physician & Preventative Health',
    roomNumber: 'Room 105',
    floor: 1,
    floorName: '1st Floor (L1)',
    wing: 'West Wing',
    category: 'Clinical',
    department: 'General Physician',
    doctorName: 'Dr. Ramesh Kumar',
    description: 'Primary care, chronic condition check-ups, preventative health screens, and vaccinations.',
    isWheelchairAccessible: true,
    coordinates: { x: 22, y: 60 },
    openHours: '9:00 AM - 5:00 PM',
    contactExt: 'x2105'
  },
  {
    id: 'loc_102',
    name: 'Family Medicine Clinic',
    roomNumber: 'Room 108',
    floor: 1,
    floorName: '1st Floor (L1)',
    wing: 'West Wing',
    category: 'Clinical',
    department: 'Family Medicine',
    doctorName: 'Dr. Meena Raj',
    description: 'Comprehensive health services for all family members, annual wellness checks.',
    isWheelchairAccessible: true,
    coordinates: { x: 22, y: 32 },
    openHours: '10:00 AM - 4:00 PM',
    contactExt: 'x2108'
  },
  {
    id: 'loc_103',
    name: 'Pediatrics & Child Wellness Clinic',
    roomNumber: 'Room 112',
    floor: 1,
    floorName: '1st Floor (L1)',
    wing: 'East Wing',
    category: 'Clinical',
    department: 'Pediatrics',
    doctorName: 'Dr. Emily White',
    description: 'Child-friendly consultation rooms, newborn care, developmental assessments.',
    isWheelchairAccessible: true,
    coordinates: { x: 78, y: 60 },
    openHours: '8:00 AM - 3:00 PM',
    contactExt: 'x2112'
  },
  {
    id: 'loc_104',
    name: 'Pathology & Central Diagnostic Lab',
    roomNumber: 'Room LAB-101',
    floor: 1,
    floorName: '1st Floor (L1)',
    wing: 'East Wing',
    category: 'Diagnostics',
    department: 'Pathology',
    doctorName: 'Lab Tech John / Ramesh',
    description: 'Routine blood tests, biochemistry, rapid turnaround diagnostics, sample collection.',
    isWheelchairAccessible: true,
    coordinates: { x: 78, y: 32 },
    openHours: '24/7',
    contactExt: 'x2150'
  },
  {
    id: 'loc_105',
    name: 'Floor 1 Elevator & Accessible Restrooms',
    roomNumber: 'Elevator Lobby 1',
    floor: 1,
    floorName: '1st Floor (L1)',
    wing: 'Central Atrium',
    category: 'Amenities',
    description: 'Central elevator concourse, ADA compliant barrier-free restrooms, drinking fountains.',
    isWheelchairAccessible: true,
    coordinates: { x: 50, y: 48 },
    openHours: '24/7'
  },

  // --- 2nd Floor (Floor 2) ---
  {
    id: 'loc_201',
    name: 'Cardiology Clinic & Heart Health Center',
    roomNumber: 'Room 204',
    floor: 2,
    floorName: '2nd Floor (L2)',
    wing: 'West Wing',
    category: 'Clinical',
    department: 'Cardiology',
    doctorName: 'Dr. Jane Smith',
    description: 'Advanced cardiac consultation, preventative heart health, pacemaker clinics, hypertension care.',
    isWheelchairAccessible: true,
    coordinates: { x: 22, y: 55 },
    openHours: '9:00 AM - 4:00 PM',
    contactExt: 'x3204'
  },
  {
    id: 'loc_202',
    name: 'Internal Medicine Suite',
    roomNumber: 'Room 208',
    floor: 2,
    floorName: '2nd Floor (L2)',
    wing: 'West Wing',
    category: 'Clinical',
    department: 'Internal Medicine',
    doctorName: 'Dr. Arjun Das',
    description: 'Diagnosis and management of multi-system illnesses, adult specialty medicine.',
    isWheelchairAccessible: true,
    coordinates: { x: 22, y: 30 },
    openHours: '8:00 AM - 3:00 PM',
    contactExt: 'x3208'
  },
  {
    id: 'loc_203',
    name: 'ECG, Holter & Echocardiogram Lab',
    roomNumber: 'Room 205',
    floor: 2,
    floorName: '2nd Floor (L2)',
    wing: 'Central Atrium',
    category: 'Diagnostics',
    department: 'Cardiology',
    description: 'Non-invasive cardiovascular diagnostic testing, stress ECG, 24h Holter monitoring.',
    isWheelchairAccessible: true,
    coordinates: { x: 50, y: 30 },
    openHours: '8:30 AM - 5:00 PM',
    contactExt: 'x3205'
  },
  {
    id: 'loc_204',
    name: 'Intensive Care Unit (ICU Step-Down)',
    roomNumber: 'Room ICU-201',
    floor: 2,
    floorName: '2nd Floor (L2)',
    wing: 'East Wing',
    category: 'Emergency',
    department: 'Critical Care',
    doctorName: 'Nurse Priya / Kaviya',
    description: 'Continuous monitoring unit for recovering critical patients with dedicated nursing stations.',
    isWheelchairAccessible: true,
    coordinates: { x: 78, y: 45 },
    openHours: 'Visiting: 11 AM - 1 PM & 5 PM - 7 PM',
    contactExt: 'x3250'
  },
  {
    id: 'loc_205',
    name: 'Floor 2 Elevator Lobby & Waiting Lounge',
    roomNumber: 'Elevator Lobby 2',
    floor: 2,
    floorName: '2nd Floor (L2)',
    wing: 'Central Atrium',
    category: 'Amenities',
    description: 'Comfortable waiting area with digital queue monitors and MediSilentAlert integration displays.',
    isWheelchairAccessible: true,
    coordinates: { x: 50, y: 62 },
    openHours: '24/7'
  },

  // --- 3rd Floor (Floor 3) ---
  {
    id: 'loc_301',
    name: 'Neurology Department & EEG Suite',
    roomNumber: 'Room 310',
    floor: 3,
    floorName: '3rd Floor (L3)',
    wing: 'West Wing',
    category: 'Clinical',
    department: 'Neurology',
    doctorName: 'Dr. Michael Brown',
    description: 'Neurological evaluations, headache & migraine management, stroke follow-up, nerve studies.',
    isWheelchairAccessible: true,
    coordinates: { x: 22, y: 60 },
    openHours: '10:00 AM - 6:00 PM',
    contactExt: 'x4310'
  },
  {
    id: 'loc_302',
    name: 'Orthopedics & Joint Replacement Center',
    roomNumber: 'Room 305',
    floor: 3,
    floorName: '3rd Floor (L3)',
    wing: 'West Wing',
    category: 'Clinical',
    department: 'Orthopedics',
    doctorName: 'Dr. Robert Green',
    description: 'Orthopedic consultations, sports medicine, joint restoration, fracture recovery care.',
    isWheelchairAccessible: true,
    coordinates: { x: 22, y: 32 },
    openHours: '11:00 AM - 7:00 PM',
    contactExt: 'x4305'
  },
  {
    id: 'loc_303',
    name: 'Dentistry & Cosmetic Dental Studio',
    roomNumber: 'Room 315',
    floor: 3,
    floorName: '3rd Floor (L3)',
    wing: 'East Wing',
    category: 'Clinical',
    department: 'Dentistry',
    doctorName: 'Dr. Priya Sharma & Dr. Sneha Rao',
    description: 'Digital intraoral scanners, painless dental hygiene, cosmetic veneer studio, root canals.',
    isWheelchairAccessible: true,
    coordinates: { x: 78, y: 60 },
    openHours: '9:00 AM - 6:00 PM',
    contactExt: 'x4315'
  },
  {
    id: 'loc_304',
    name: 'Orthodontics & Smile Alignment Center',
    roomNumber: 'Room 318',
    floor: 3,
    floorName: '3rd Floor (L3)',
    wing: 'East Wing',
    category: 'Clinical',
    department: 'Orthodontics',
    doctorName: 'Dr. Karan Patel',
    description: 'Clear aligner mapping, ceramic braces, corrective jaw orthopedics for adults and teens.',
    isWheelchairAccessible: true,
    coordinates: { x: 78, y: 32 },
    openHours: '10:00 AM - 5:00 PM',
    contactExt: 'x4318'
  },
  {
    id: 'loc_305',
    name: 'Physiotherapy & Rehabilitation Gym',
    roomNumber: 'Room REHAB-301',
    floor: 3,
    floorName: '3rd Floor (L3)',
    wing: 'Central Atrium',
    category: 'Clinical',
    department: 'Physiotherapy',
    description: 'Post-operative mobilization gym, gait training, therapeutic ultrasound, electrotherapy.',
    isWheelchairAccessible: true,
    coordinates: { x: 50, y: 32 },
    openHours: '8:00 AM - 6:00 PM',
    contactExt: 'x4300'
  },
  {
    id: 'loc_306',
    name: 'Floor 3 Elevator Concourse',
    roomNumber: 'Elevator Lobby 3',
    floor: 3,
    floorName: '3rd Floor (L3)',
    wing: 'Central Atrium',
    category: 'Amenities',
    description: 'Quiet elevator lobby with patient transport gurneys and ADA barrier-free access.',
    isWheelchairAccessible: true,
    coordinates: { x: 50, y: 62 },
    openHours: '24/7'
  }
];

// Load locations from localStorage or initialize with verified defaults
export const getHospitalLocations = (): HospitalLocation[] => {
  try {
    const raw = localStorage.getItem(WAYFINDER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading wayfinder locations:', e);
  }
  return INITIAL_HOSPITAL_LOCATIONS;
};

export const saveHospitalLocations = (locations: HospitalLocation[]) => {
  try {
    localStorage.setItem(WAYFINDER_STORAGE_KEY, JSON.stringify(locations));
    window.dispatchEvent(new CustomEvent('mediconnect_wayfinder_updated', { detail: { locations } }));
  } catch (e) {
    console.error('Error saving wayfinder locations:', e);
  }
};

export const addHospitalLocation = (locationData: Omit<HospitalLocation, 'id'>): HospitalLocation => {
  const current = getHospitalLocations();
  const newLocation: HospitalLocation = {
    id: `loc_${Date.now()}`,
    ...locationData
  };
  const updated = [...current, newLocation];
  saveHospitalLocations(updated);
  return newLocation;
};

export const updateHospitalLocation = (location: HospitalLocation): void => {
  const current = getHospitalLocations();
  const index = current.findIndex(l => l.id === location.id);
  if (index !== -1) {
    current[index] = location;
    saveHospitalLocations(current);
  }
};

export const deleteHospitalLocation = (id: string): void => {
  const current = getHospitalLocations();
  const updated = current.filter(l => l.id !== id);
  saveHospitalLocations(updated);
};

export const resetDefaultLocations = (): HospitalLocation[] => {
  saveHospitalLocations(INITIAL_HOSPITAL_LOCATIONS);
  return INITIAL_HOSPITAL_LOCATIONS;
};

// --- ROUTE COMPUTATION ENGINE ---

export const calculateRoute = (
  start: HospitalLocation,
  destination: HospitalLocation,
  isWheelchairAccessible: boolean
): WayFinderRoute => {
  // If start and destination are the exact same place
  if (start.id === destination.id) {
    return {
      startLocation: start,
      destinationLocation: destination,
      isWheelchairAccessible,
      totalDistanceMeters: 0,
      estimatedMinutes: 0,
      steps: [
        {
          stepNumber: 1,
          instruction: `You are already at ${start.name} (${start.roomNumber}) on ${start.floorName}, ${start.wing}.`,
          distanceMeters: 0,
          icon: '📍'
        }
      ]
    };
  }

  const isDifferentFloor = start.floor !== destination.floor;
  const floorDelta = Math.abs(start.floor - destination.floor);
  const startIsElevator = start.roomNumber.toLowerCase().includes('elevator') || start.name.toLowerCase().includes('elevator');
  const destIsElevator = destination.roomNumber.toLowerCase().includes('elevator') || destination.name.toLowerCase().includes('elevator');
  
  // Calculate approximate walking distance along connected corridors
  const baseDistance = Math.hypot(
    (destination.coordinates.x - start.coordinates.x) * 1.8,
    (destination.coordinates.y - start.coordinates.y) * 1.5
  );
  const floorPenalty = floorDelta * 35; // meters per floor for transit
  const totalDistanceMeters = Math.max(10, Math.round(baseDistance + floorPenalty));
  const estimatedMinutes = Math.max(1, Math.round(totalDistanceMeters / 45)); // ~45 meters/minute walking speed

  const steps: NavigationStep[] = [];
  let stepNum = 1;

  // Step 1: Starting Point
  steps.push({
    stepNumber: stepNum++,
    instruction: `Start at ${start.name} (${start.roomNumber}) on ${start.floorName}, ${start.wing}.`,
    distanceMeters: 0,
    icon: '🚩'
  });

  if (isDifferentFloor) {
    // Step 2: Handle Vertical Transit between floors
    if (startIsElevator) {
      // User is already at the elevator
      steps.push({
        stepNumber: stepNum++,
        instruction: isWheelchairAccessible
          ? `Board Central Elevator A (equipped with ADA controls, braille buttons, and audible arrival chimes).`
          : `Board Central Elevator A or take the adjacent central stairway.`,
        isElevatorOrRamp: true,
        distanceMeters: 5,
        icon: '🛗'
      });
      steps.push({
        stepNumber: stepNum++,
        instruction: `Travel from ${start.floorName} to ${destination.floorName}.`,
        isElevatorOrRamp: true,
        distanceMeters: floorDelta * 10,
        icon: '🛗'
      });
    } else {
      // User starts in a room/facility and needs to reach the elevator
      steps.push({
        stepNumber: stepNum++,
        instruction: isWheelchairAccessible
          ? `Exit ${start.roomNumber} and proceed down the wide ADA corridor toward Central Elevator Bank A.`
          : `Exit ${start.roomNumber} and proceed down the hallway toward the Central Elevator Lobby / Stairway.`,
        isElevatorOrRamp: isWheelchairAccessible,
        distanceMeters: Math.round(baseDistance * 0.4),
        icon: isWheelchairAccessible ? '♿' : '🚶'
      });
      steps.push({
        stepNumber: stepNum++,
        instruction: isWheelchairAccessible
          ? `Take Central Elevator A from ${start.floorName} up to ${destination.floorName}.`
          : `Take Elevator A or Stairs from ${start.floorName} to ${destination.floorName}.`,
        isElevatorOrRamp: true,
        distanceMeters: floorDelta * 10,
        icon: '🛗'
      });
    }

    // Step 3: Exit on destination floor
    if (!destIsElevator) {
      steps.push({
        stepNumber: stepNum++,
        instruction: `Exit elevator on ${destination.floorName} and follow the signs toward the ${destination.wing}.`,
        distanceMeters: 15,
        icon: '🧭'
      });
    }
  } else {
    // Same floor journey
    if (start.wing === destination.wing) {
      // Intra-wing movement
      steps.push({
        stepNumber: stepNum++,
        instruction: isWheelchairAccessible
          ? `Follow the level, barrier-free corridor in the ${start.wing} directly toward ${destination.name}.`
          : `Walk along the ${start.wing} corridor directly toward ${destination.name}.`,
        distanceMeters: Math.round(baseDistance * 0.7),
        icon: isWheelchairAccessible ? '♿' : '🚶'
      });
    } else if (start.wing === 'Central Atrium' || destination.wing === 'Central Atrium') {
      // Central to wing or wing to central
      steps.push({
        stepNumber: stepNum++,
        instruction: `Follow the main concourse connecting the Central Atrium and the ${destination.wing}.`,
        distanceMeters: Math.round(baseDistance * 0.65),
        icon: '🚶'
      });
    } else {
      // Across wings (West <-> East)
      steps.push({
        stepNumber: stepNum++,
        instruction: `Walk along the ${start.wing} corridor toward the Central Atrium crossing point.`,
        distanceMeters: Math.round(baseDistance * 0.35),
        icon: '🚶'
      });
      steps.push({
        stepNumber: stepNum++,
        instruction: `Cross the open Central Atrium concourse and continue straight into the ${destination.wing}.`,
        distanceMeters: Math.round(baseDistance * 0.35),
        icon: '🧭'
      });
    }
  }

  // Final Destination Arrival Step
  if (!destIsElevator) {
    const doctorText = destination.doctorName ? ` (${destination.doctorName})` : '';
    steps.push({
      stepNumber: stepNum++,
      instruction: `Arrive at ${destination.name} - ${destination.roomNumber}${doctorText}. Room entrance is clearly marked.`,
      distanceMeters: Math.round(baseDistance * 0.2) + 5,
      icon: '📍'
    });
  } else {
    steps.push({
      stepNumber: stepNum++,
      instruction: `Arrive at ${destination.name} (${destination.roomNumber}) on ${destination.floorName}.`,
      distanceMeters: 5,
      icon: '📍'
    });
  }

  return {
    startLocation: start,
    destinationLocation: destination,
    isWheelchairAccessible,
    totalDistanceMeters,
    estimatedMinutes,
    steps
  };
};


// Builds standard mobile navigation URL for a hospital destination
export const buildWayFinderNavigationURL = (
  location: HospitalLocation,
  isWheelchair: boolean = true,
  customOrigin?: string
): string => {
  const origin = customOrigin || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  
  const params = new URLSearchParams({
    page: 'WayFinder',
    dest: location.id,
    room: location.roomNumber,
    floor: String(location.floor),
    wheelchair: isWheelchair ? '1' : '0'
  });
  
  return `${origin}${pathname}?${params.toString()}`;
};

// Generates an authentic ISO-standard QR code as a high-res PNG Data URL
export const generateRealQRCodeDataUrl = async (
  payloadUrl: string,
  options?: { width?: number; margin?: number; darkColor?: string }
): Promise<string> => {
  try {
    return await QRCode.toDataURL(payloadUrl, {
      width: options?.width || 280,
      margin: options?.margin ?? 2,
      color: {
        dark: options?.darkColor || '#003e7e',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.error('Error generating ISO QR code:', err);
    return '';
  }
};

// Generates an authentic ISO-standard QR code as SVG string
export const generateRealQRCodeSVG = async (
  payloadUrl: string,
  options?: { width?: number; margin?: number; darkColor?: string }
): Promise<string> => {
  try {
    return await QRCode.toString(payloadUrl, {
      type: 'svg',
      width: options?.width || 280,
      margin: options?.margin ?? 2,
      color: {
        dark: options?.darkColor || '#003e7e',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.error('Error generating SVG QR code:', err);
    return '';
  }
};

// Backward-compatible fallback helper
export const generateLocationQRDataUrl = (locationId: string, roomNumber: string): string => {
  const target = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?page=WayFinder&dest=${encodeURIComponent(locationId)}`
    : `http://localhost:3000/?page=WayFinder&dest=${encodeURIComponent(locationId)}`;
  return target;
};
