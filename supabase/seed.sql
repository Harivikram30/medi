-- MediConnect Seed Data for Centralized Supabase Database
-- Run this script in the Supabase SQL Editor to populate initial hospital records

-- 1. Profiles & Staff Accounts
insert into public.profiles (id, name, email, role, department, avatar_url, password, is_verified) values
('p001', 'John Doe', 'john.doe@email.com', 'PATIENT', null, 'https://ui-avatars.com/api/?name=John+Doe&background=0057A8&color=fff', 'password', true),
('p002', 'Alice Johnson', 'alice.j@email.com', 'PATIENT', null, 'https://ui-avatars.com/api/?name=Alice+Johnson&background=0057A8&color=fff', 'password', true),
('d001', 'Dr. Jane Smith', 'jane.smith@hospital.com', 'DOCTOR', 'Cardiology', 'https://ui-avatars.com/api/?name=Jane+Smith&background=00A859&color=fff', 'janeCardio123', true),
('d002', 'Dr. Michael Brown', 'michael.brown@hospital.com', 'DOCTOR', 'Neurology', 'https://ui-avatars.com/api/?name=Michael+Brown&background=00A859&color=fff', 'mikeNeuro456', true),
('d003', 'Dr. Emily White', 'emily.white@hospital.com', 'DOCTOR', 'Pediatrics', 'https://ui-avatars.com/api/?name=Emily+White&background=00A859&color=fff', 'emilyPeds789', true),
('d004', 'Dr. Robert Green', 'robert.green@hospital.com', 'DOCTOR', 'Orthopedics', 'https://ui-avatars.com/api/?name=Robert+Green&background=00A859&color=fff', 'robertOrtho321', true),
('d005', 'Dr. Ramesh Kumar', 'ramesh.kumar@hospital.com', 'DOCTOR', 'General Physician', 'https://ui-avatars.com/api/?name=Ramesh+Kumar&background=00A859&color=fff', 'rameshGP654', true),
('d006', 'Dr. Meena Raj', 'meena.raj@hospital.com', 'DOCTOR', 'Family Medicine', 'https://ui-avatars.com/api/?name=Meena+Raj&background=00A859&color=fff', 'meenaFM987', true),
('d007', 'Dr. Arjun Das', 'arjun.das@hospital.com', 'DOCTOR', 'Internal Medicine', 'https://ui-avatars.com/api/?name=Arjun+Das&background=00A859&color=fff', 'arjunIM741', true),
('d008', 'Dr. Priya Sharma', 'priya.sharma@hospital.com', 'DOCTOR', 'Dentistry', 'https://ui-avatars.com/api/?name=Priya+Sharma&background=00A859&color=fff', 'priyaDent852', true),
('d009', 'Dr. Karan Patel', 'karan.patel@hospital.com', 'DOCTOR', 'Orthodontics', 'https://ui-avatars.com/api/?name=Karan+Patel&background=00A859&color=fff', 'karanOrtho963', true),
('d010', 'Dr. Sneha Rao', 'sneha.rao@hospital.com', 'DOCTOR', 'Cosmetic Dentistry', 'https://ui-avatars.com/api/?name=Sneha+Rao&background=00A859&color=fff', 'snehaCos123', true),
('n001', 'Nurse Kaviya', 'kaviya@nurse.com', 'NURSE', 'General Ward', 'https://ui-avatars.com/api/?name=Kaviya&background=8B5CF6&color=fff', 'kaviya1234', true),
('n002', 'Nurse Priya', 'priya@nurse.com', 'NURSE', 'ICU', 'https://ui-avatars.com/api/?name=Priya&background=8B5CF6&color=fff', 'priya5678', true),
('n003', 'Nurse Swetha', 'swetha@nurse.com', 'NURSE', 'Emergency', 'https://ui-avatars.com/api/?name=Swetha&background=8B5CF6&color=fff', 'swetha9012', true),
('l001', 'Lab Tech John', 'john@lab.com', 'LAB_TECHNICIAN', 'Pathology', 'https://ui-avatars.com/api/?name=John&background=10B981&color=fff', 'john123', true),
('l002', 'Lab Tech Ramesh', 'ramesh@lab.com', 'LAB_TECHNICIAN', 'Biochemistry', 'https://ui-avatars.com/api/?name=Ramesh&background=10B981&color=fff', 'ramesh123', true),
('ph001', 'Peter Petrelli', 'pharmacy@hms.com', 'PHARMACY', 'Dispensary', 'https://ui-avatars.com/api/?name=Peter+Petrelli&background=F97316&color=fff', 'password', true),
('a001', 'Admin User', 'admin@hms.com', 'ADMIN', 'Administration', 'https://ui-avatars.com/api/?name=Admin+User&background=6c757d&color=fff', 'password', true)
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  role = excluded.role,
  department = excluded.department;

-- 2. Patients
insert into public.patients (id, user_id, name, age, current_condition) values
('p001', 'p001', 'John Doe', 55, 'Hypertension'),
('p002', 'p002', 'Alice Johnson', 40, 'Migraines'),
('p003', null, 'Bob Williams', 68, 'Coronary Artery Disease'),
('p004', null, 'Charlie Brown', 8, 'Asthma Check-up'),
('p005', null, 'Diana Prince', 35, 'Annual Physical'),
('p006', null, 'Bruce Wayne', 42, 'Knee Injury'),
('p007', null, 'Clark Kent', 38, 'Follow-up')
on conflict (id) do nothing;

-- 3. Doctors
insert into public.doctors (id, user_id, name, specialization, experience, bio, image_url, availability) values
('d001', 'd001', 'Dr. Jane Smith', 'Cardiology', 15, 'Dr. Smith is a leading expert in cardiac care, with a focus on preventative medicine.', 'https://ui-avatars.com/api/?name=Jane+Smith&background=00A859&color=fff', 'Mon, Wed, Fri (9 AM - 4 PM)'),
('d002', 'd002', 'Dr. Michael Brown', 'Neurology', 12, 'Specializing in complex neurological disorders and innovative neurological care.', 'https://ui-avatars.com/api/?name=Michael+Brown&background=00A859&color=fff', 'Tue, Thu (10 AM - 6 PM)'),
('d003', 'd003', 'Dr. Emily White', 'Pediatrics', 10, 'Dedicated pediatrician passionate about children''s wellness.', 'https://ui-avatars.com/api/?name=Emily+White&background=00A859&color=fff', 'Mon - Fri (8 AM - 3 PM)'),
('d004', 'd004', 'Dr. Robert Green', 'Orthopedics', 20, 'Renowned orthopedic surgeon specializing in sports injuries and joint care.', 'https://ui-avatars.com/api/?name=Robert+Green&background=00A859&color=fff', 'Mon, Tue, Thu (11 AM - 7 PM)'),
('d005', 'd005', 'Dr. Ramesh Kumar', 'General Physician', 8, 'Dedicated General Physician focusing on holistic care.', 'https://ui-avatars.com/api/?name=Ramesh+Kumar&background=00A859&color=fff', 'Mon - Sat (9 AM - 5 PM)')
on conflict (id) do nothing;

-- 4. Medicines
insert into public.medicines (id, name, category, quantity, expiry) values
('med01', 'Paracetamol', 'Painkiller', 85, '2026-02-10'),
('med02', 'Amoxicillin', 'Antibiotic', 40, '2025-06-12'),
('med03', 'Metformin', 'Diabetes', 25, '2025-12-20'),
('med04', 'Cetirizine', 'Allergy', 15, '2025-09-18'),
('med05', 'Omeprazole', 'Acidity', 100, '2027-01-25'),
('med06', 'Ibuprofen', 'Painkiller', 10, '2025-03-22'),
('med07', 'Azithromycin', 'Antibiotic', 55, '2026-08-15'),
('med08', 'Vitamin C', 'Supplement', 120, '2027-04-12'),
('med09', 'Calcium Tablet', 'Supplement', 75, '2026-10-05'),
('med10', 'Diclofenac', 'Painkiller', 8, '2025-11-30')
on conflict (id) do nothing;

-- 5. Appointments
insert into public.appointments (id, patient_id, patient_name, doctor_id, doctor_name, doctor_specialization, date, time, status, type, accessibility_request) values
('app001', 'p001', 'John Doe', 'd001', 'Dr. Jane Smith', 'Cardiology', to_char(current_date + interval '2 day', 'YYYY-MM-DD'), '10:00 AM', 'Upcoming', 'Follow-up', '{"wheelchairNeeded": true, "wheelchairLocation": "Main Entrance Ramps", "writtenInstructions": true, "communicationSupport": "Hearing Loop Amplification", "assistanceNotes": "Patient requires wheelchair pickup at main entrance and high-volume communication."}'::jsonb),
('app002', 'p003', 'Bob Williams', 'd001', 'Dr. Jane Smith', 'Cardiology', to_char(current_date - interval '10 day', 'YYYY-MM-DD'), '02:30 PM', 'Completed', 'New Consultation', null),
('app003', 'p001', 'John Doe', 'd001', 'Dr. Jane Smith', 'Cardiology', to_char(current_date, 'YYYY-MM-DD'), '11:00 AM', 'Upcoming', 'Follow-up', null),
('app004', 'p002', 'Alice Johnson', 'd002', 'Dr. Michael Brown', 'Neurology', to_char(current_date + interval '3 day', 'YYYY-MM-DD'), '09:00 AM', 'Upcoming', 'Follow-up', '{"wheelchairNeeded": false, "writtenInstructions": true, "communicationSupport": "Visual Guidance Assistance", "assistanceNotes": "Patient requests written clinical summary in clear print."}'::jsonb)
on conflict (id) do nothing;

-- 6. Prescriptions
insert into public.prescriptions (id, patient_id, patient_name, doctor_id, doctor_name, date, medication, dosage, frequency, duration, notes, status) values
('presc001', 'p001', 'John Doe', 'd001', 'Dr. Jane Smith', to_char(current_date - interval '10 day', 'YYYY-MM-DD'), 'Lisinopril', '10mg', 'Once daily in the morning', '30 days', 'Monitor blood pressure.', 'Active'),
('presc002', 'p002', 'Alice Johnson', 'd002', 'Dr. Michael Brown', to_char(current_date - interval '20 day', 'YYYY-MM-DD'), 'Sumatriptan', '50mg', 'As needed for migraines', 'N/A', 'Do not exceed 2 doses per day.', 'Active'),
('presc003', 'p001', 'John Doe', 'd001', 'Dr. Jane Smith', to_char(current_date - interval '45 day', 'YYYY-MM-DD'), 'Atorvastatin', '20mg', 'Once daily at bedtime', '90 days', null, 'Completed')
on conflict (id) do nothing;

-- 7. Laboratory Tests
insert into public.lab_tests (id, patient_name, patient_id, test_type, status, requested_by, date, results) values
('lab001', 'John Doe', 'p001', 'Complete Blood Count (CBC)', 'Completed', 'Dr. Jane Smith', to_char(current_date - interval '1 day', 'YYYY-MM-DD'), 'All values within normal ranges. Platelets 260k/uL, Hemoglobin 14.8 g/dL.'),
('lab002', 'Alice Johnson', 'p002', 'Lipid Panel', 'In Progress', 'Dr. Jane Smith', to_char(current_date, 'YYYY-MM-DD'), null),
('lab003', 'Bob Williams', 'p003', 'Thyroid Panel (TSH)', 'Pending', 'Dr. Michael Brown', to_char(current_date, 'YYYY-MM-DD'), null),
('lab004', 'Charlie Brown', 'p004', 'Basic Metabolic Panel (BMP)', 'Pending', 'Dr. Robert Green', to_char(current_date, 'YYYY-MM-DD'), null)
on conflict (id) do nothing;

-- 8. Invoices
insert into public.invoices (id, invoice_number, patient_id, patient_name, issue_date, due_date, items, total_amount, status) values
('inv001', 'HMS-2024-001', 'p001', 'John Doe', to_char(current_date - interval '10 day', 'YYYY-MM-DD'), to_char(current_date + interval '20 day', 'YYYY-MM-DD'), '[{"id": "item1", "description": "Cardiology Consultation - Dr. Jane Smith", "amount": 250}, {"id": "item2", "description": "Standard Blood Panel", "amount": 120}, {"id": "item3", "description": "Ibuprofen (200mg)", "amount": 15.5}]'::jsonb, 385.50, 'Paid'),
('inv002', 'HMS-2024-002', 'p002', 'Alice Johnson', to_char(current_date - interval '5 day', 'YYYY-MM-DD'), to_char(current_date + interval '25 day', 'YYYY-MM-DD'), '[{"id": "item1", "description": "Neurology Follow-up - Dr. Michael Brown", "amount": 180}]'::jsonb, 180.00, 'Unpaid'),
('inv003', 'HMS-2024-003', 'p001', 'John Doe', to_char(current_date - interval '40 day', 'YYYY-MM-DD'), to_char(current_date - interval '10 day', 'YYYY-MM-DD'), '[{"id": "item1", "description": "Orthopedics Check-up - Dr. Robert Green", "amount": 200}, {"id": "item2", "description": "Knee X-Ray", "amount": 150}]'::jsonb, 350.00, 'Overdue')
on conflict (id) do nothing;

-- 9. Medical Records
insert into public.medical_records (id, patient_id, date, type, title, summary, doctor_name, file_url, is_ai_generated, verified_by) values
('rec001', 'p001', to_char(current_date - interval '9 day', 'YYYY-MM-DD'), 'Lab Result', 'Annual Blood Panel', 'All markers within normal range. Cholesterol slightly elevated.', 'Dr. Jane Smith', '#', false, 'Dr. Jane Smith'),
('rec002', 'p001', to_char(current_date - interval '10 day', 'YYYY-MM-DD'), 'Doctor''s Note', 'Neurology Consultation Summary', 'Patient reports occasional headaches. No concerning neurological signs.', 'Dr. Michael Brown', '#', false, 'Dr. Michael Brown'),
('rec003', 'p001', to_char(current_date - interval '30 day', 'YYYY-MM-DD'), 'Radiology Report', 'X-Ray: Left Knee', 'No fractures or significant abnormalities detected.', 'Dr. Robert Green', '#', false, 'Dr. Robert Green')
on conflict (id) do nothing;

-- 10. Inpatient Nursing
insert into public.assigned_patients (id, name, room, status, vitals) values
('p002', 'Alice Johnson', '101A', 'Stable', '{"bp": "120/80", "temp": "98.6°F", "hr": "72bpm"}'::jsonb),
('p003', 'Bob Williams', '102B', 'Needs Monitoring', '{"bp": "130/85", "temp": "99.1°F", "hr": "80bpm"}'::jsonb),
('p004', 'Charlie Brown', '105A', 'Post-Op', '{"bp": "110/70", "temp": "98.9°F", "hr": "68bpm"}'::jsonb)
on conflict (id) do nothing;

-- 11. Patient Charts
insert into public.patient_charts (id, patient_id, notes, medication_schedule, vitals_history) values
('chart_p002', 'p002', 
  '[{"date": "2026-10-22 08:00", "note": "Patient is comfortable and alert. Vitals are stable.", "author": "C. Espinosa, RN"}, {"date": "2026-10-21 21:00", "note": "Reports mild discomfort at incision site. Administered pain medication as prescribed.", "author": "J. Dorian, MD"}]'::jsonb,
  '[{"time": "09:00 AM", "medication": "Antibiotic X", "dosage": "500mg"}, {"time": "01:00 PM", "medication": "Painkiller Y", "dosage": "As needed"}, {"time": "09:00 PM", "medication": "Antibiotic X", "dosage": "500mg"}]'::jsonb,
  '[{"date": "2026-10-20 08:00", "temp": 98.7, "bp": {"systolic": 122, "diastolic": 81}, "hr": 75}, {"date": "2026-10-21 08:00", "temp": 98.8, "bp": {"systolic": 120, "diastolic": 80}, "hr": 72}, {"date": "2026-10-22 08:00", "temp": 98.6, "bp": {"systolic": 120, "diastolic": 80}, "hr": 72}]'::jsonb
),
('chart_p003', 'p003',
  '[{"date": "2026-10-22 09:15", "note": "Blood pressure slightly elevated. Will continue to monitor every hour.", "author": "C. Espinosa, RN"}]'::jsonb,
  '[{"time": "10:00 AM", "medication": "Lisinopril", "dosage": "10mg"}]'::jsonb,
  '[{"date": "2026-10-21 18:00", "temp": 99.0, "bp": {"systolic": 135, "diastolic": 88}, "hr": 82}, {"date": "2026-10-22 09:00", "temp": 99.1, "bp": {"systolic": 130, "diastolic": 85}, "hr": 80}]'::jsonb
)
on conflict (id) do nothing;

-- 12. Nurse Tasks
insert into public.nurse_tasks (id, task, completed, nurse_id) values
('nt01', 'Administer medication to Alice Johnson (Room 101A) at 2 PM', false, 'n001'),
('nt02', 'Check vitals for Bob Williams (Room 102B)', false, 'n001'),
('nt03', 'Change dressing for Charlie Brown (Room 105A)', false, 'n001'),
('nt04', 'Restock Room 101A supply cart', false, 'n001')
on conflict (id) do nothing;

-- 13. Queue & Alerts
insert into public.queue_entries (id, token_number, patient_id, patient_name, doctor_id, doctor_name, department, room_number, queue_position, estimated_wait_minutes, status, check_in_time) values
('q_001', 'TK-104', 'p001', 'John Doe', 'd001', 'Dr. Jane Smith', 'Cardiology', 'Room 204 (Cardiology Wing - 2nd Floor)', 2, 8, 'Waiting', '10:45 AM'),
('q_002', 'TK-105', 'p002', 'Alice Johnson', 'd002', 'Dr. Michael Brown', 'Neurology', 'Room 310 (Neurology Wing - 3rd Floor)', 3, 15, 'Waiting', '10:50 AM'),
('q_003', 'TK-103', 'p003', 'Bob Williams', 'd001', 'Dr. Jane Smith', 'Cardiology', 'Room 204 (Cardiology Wing - 2nd Floor)', 1, 2, 'Calling', '10:35 AM')
on conflict (id) do nothing;

insert into public.silent_alerts (id, token_number, patient_id, patient_name, doctor_id, doctor_name, department, room_number, timestamp, acknowledged, acknowledged_at, status) values
('alert_001', 'TK-089', 'p001', 'John Doe', 'd005', 'Dr. Ramesh Kumar', 'General Physician', 'Room 105 (OPD Ground Floor)', to_char(current_timestamp - interval '24 hour', 'MM/DD/YYYY, HH12:MI AM'), true, '11:15 AM', 'Completed'),
('alert_002', 'TK-042', 'p001', 'John Doe', 'd001', 'Dr. Jane Smith', 'Cardiology', 'Room 204 (Cardiology Wing - 2nd Floor)', to_char(current_timestamp - interval '72 hour', 'MM/DD/YYYY, HH12:MI AM'), true, '02:45 PM', 'Completed')
on conflict (id) do nothing;

-- 14. Hospital WayFinder Locations
insert into public.hospital_locations (id, name, room_number, floor, floor_name, wing, category, department, doctor_name, description, is_wheelchair_accessible, coordinates, open_hours, contact_ext) values
('loc_g01', 'Main Hospital Entrance & Reception', 'Reception Desk', 0, 'Ground Floor (L0)', 'Central Atrium', 'Amenities', null, null, 'Central help desk, visitor sign-in, inquiry station, and wheelchair assistance dispatch.', true, '{"x": 50, "y": 88}'::jsonb, '24/7', 'x1000'),
('loc_g02', 'Emergency Department & Trauma Care', 'Room ER-101', 0, 'Ground Floor (L0)', 'West Wing', 'Emergency', 'Emergency & Critical Care', null, 'Immediate acute care, resuscitation bays, emergency triage, and ambulance bay entrance.', true, '{"x": 18, "y": 68}'::jsonb, '24/7', 'x911'),
('loc_g03', 'Outpatient Pharmacy (Main Dispensary)', 'Room PH-01', 0, 'Ground Floor (L0)', 'East Wing', 'Pharmacy & Admin', 'Pharmacy', 'Peter Petrelli (Chief Pharmacist)', 'Prescription dispensing, medication consultation, over-the-counter medical supplies.', true, '{"x": 82, "y": 68}'::jsonb, '8:00 AM - 10:00 PM', 'x1040'),
('loc_g04', 'OPD Token Registration & Billing Desk', 'Room REG-01', 0, 'Ground Floor (L0)', 'Central Atrium', 'Pharmacy & Admin', 'Administration', null, 'Patient check-in, token issuance, insurance approval desk, and fee settlement.', true, '{"x": 50, "y": 72}'::jsonb, '7:30 AM - 8:00 PM', 'x1010'),
('loc_f2_01', 'Cardiology Outpatient Clinic & Diagnostics', 'Room 204', 2, '2nd Floor (L2)', 'West Wing', 'Clinical', 'Cardiology', 'Dr. Jane Smith (Cardiologist)', 'Cardiac examinations, ECG, Echo testing, and specialized hypertension consultations.', true, '{"x": 22, "y": 35}'::jsonb, 'Mon, Wed, Fri (9 AM - 4 PM)', 'x2204'),
('loc_f3_01', 'Neurology & Neuro-Rehabilitation Clinic', 'Room 310', 3, '3rd Floor (L3)', 'East Wing', 'Clinical', 'Neurology', 'Dr. Michael Brown (Neurologist)', 'EEG scans, headache & seizure evaluations, and stroke recovery consultations.', true, '{"x": 78, "y": 42}'::jsonb, 'Tue, Thu (10 AM - 6 PM)', 'x3310')
on conflict (id) do nothing;
