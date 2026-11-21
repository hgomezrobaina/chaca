export enum DepartmentName {
  Cardiology = "Cardiology",
  Neurology = "Neurology",
  Pediatrics = "Pediatrics",
  Oncology = "Oncology",
  Orthopedics = "Orthopedics",
  EmergencyMedicine = "Emergency Medicine",
  Radiology = "Radiology",
  GeneralSurgery = "General Surgery",
}

export interface HospitalDepartment {
  id: string;
  name: DepartmentName;
  floor: number;
  daily_rate: number;
}

export enum DoctorSpecialty {
  Cardiology = "cardiology",
  Neurology = "neurology",
  Pediatrics = "pediatrics",
  Oncology = "oncology",
  Orthopedics = "orthopedics",
  EmergencyMedicine = "emergency medicine",
  Radiology = "radiology",
  GeneralSurgery = "general surgery",
}

export enum DoctorStatus {
  Active = "active",
  OnLeave = "on-leave",
  Retired = "retired",
}

export interface HospitalDoctor {
  id: string;
  department_id: string;
  license_number: number;
  specialty: DoctorSpecialty;
  years_experience: number;
  status: DoctorStatus;
}

export enum BloodType {
  APositive = "A+",
  ANegative = "A-",
  BPositive = "B+",
  BNegative = "B-",
  ABPositive = "AB+",
  ABNegative = "AB-",
  OPositive = "O+",
  ONegative = "O-",
}

export interface HospitalPatient {
  id: string;
  name: string;
  lastname: string;
  birthdate: Date;
  blood_type: BloodType;
  insurance_provider: string | null;
  email: string;
  phone: string;
}

export interface HospitalRoom {
  id: string;
  department_id: string;
  room_number: number;
  capacity: number;
}

export interface HospitalAdmission {
  id: string;
  admission_date: Date;
  discharge_date: Date | null;
  patient_id: string;
  department_id: string;
  reason: string;
}

export interface HospitalBedAssignment {
  id: string;
  admission_id: string;
  room_id: string;
  assigned_date: Date;
}

export enum AppointmentStatus {
  Scheduled = "scheduled",
  Cancelled = "cancelled",
  Completed = "completed",
  NoShow = "no-show",
}

export interface HospitalAppointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  scheduled_date: Date;
  status: AppointmentStatus;
}

export interface HospitalMedication {
  id: string;
  code: number;
  name: string;
  unit_price: number;
  stock: number;
}

export interface HospitalPrescription {
  id: string;
  appointment_id: string;
  dosage: string;
  quantity: number;
  medication_id: string;
}

export enum InvoiceStatus {
  Pending = "pending",
  Paid = "paid",
  Overdue = "overdue",
}

export interface HospitalInvoice {
  id: string;
  admission_id: string;
  amount: number;
  status: InvoiceStatus;
}

export interface HospitalDataset {
  Department: HospitalDepartment[];
  Doctor: HospitalDoctor[];
  Patient: HospitalPatient[];
  Room: HospitalRoom[];
  Admission: HospitalAdmission[];
  BedAssignment: HospitalBedAssignment[];
  Appointment: HospitalAppointment[];
  Medication: HospitalMedication[];
  Prescription: HospitalPrescription[];
  Invoice: HospitalInvoice[];
}
