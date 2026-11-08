export enum UserRole {
  Student = "student",
  Teacher = "teacher",
  Admin = "admin",
}

export interface UniversityUser {
  id: string;
  name: string;
  lastname: string;
  email: string;
  phone: string;
  role: UserRole;
  created_at: Date;
}

export interface UniversitySchool {
  id: string;
  name: string;
}

export interface UniversityDepartment {
  id: string;
  name: string;
  school_id: string;
}

export enum ProgramLevel {
  Undergraduate = "undergraduate",
  Postgraduate = "postgraduate",
}

export interface UniversityProgram {
  id: string;
  name: string;
  level: ProgramLevel;
  department_id: string;
  period_duration: number;
  cost: number;
}

export interface UniversityCourse {
  id: string;
  code: string;
  name: string;
  active: boolean;
  program_id: string;
  teacher_id: string;
  credits: number;
}

export enum TeacherTitle {
  Graduate = "graduate",
  Mastery = "mastery",
  Phd = "phd",
}

export enum TeacherStatus {
  Active = "active",
  Licence = "licence",
  Retired = "retired",
}

export interface UniversityTeacher {
  id: string;
  department_id: string;
  title: TeacherTitle;
  employment_date: Date;
  salary: number;
  status: TeacherStatus;
  school_dean_id: string | null;
}

export enum StudentStatus {
  Active = "active",
  Suspend = "suspend",
  Init = "init",
  Graduated = "graduated",
}

export interface UniversityStudent {
  id: string;
  code: string;
  birthdate: Date;
  country: string;
  program_id: string;
  status: StudentStatus;
  actual_period: number;
}

export enum RegistrationStatus {
  Active = "active",
  Retired = "retired",
  Approved = "approved",
  Failed = "failed",
}

export interface UniversityRegistration {
  id: string;
  period: string;
  course_id: string;
  student_id: string;
  registration_date: Date;
  status: RegistrationStatus;
}

export enum GradeStatus {
  Pending = "pending",
  Published = "published",
  Appealed = "appealed",
}

export interface UniversityGrade {
  id: string;
  registration_id: string;
  final_grade: number;
  created_at: Date;
  status: GradeStatus;
}

export enum PaymentMethod {
  CreditCard = "credit-card",
  Transfer = "transfer",
  Cash = "cash",
}

export enum PaymentStatus {
  Pending = "pending",
  Completed = "completed",
  Failed = "failed",
}

export enum PaymentConcept {
  Registration = "registration",
  ExtraCourse = "extra-course",
  Certificate = "certificate",
  Library = "library",
}

export interface UniversityPayment {
  id: string;
  method: PaymentMethod;
  registration_id: string;
  status: PaymentStatus;
  concept: PaymentConcept;
  amount: number;
  created_at: Date;
}

export interface UniversityBook {
  id: string;
  title: string;
  author: string;
  count: number;
}

export enum BookLoanStatus {
  Loan = "loan",
  Returned = "returned",
  Late = "late",
}

export interface UniversityBookLoan {
  id: string;
  student_id: string;
  book_id: string;
  status: BookLoanStatus;
  date: Date;
  return_date: Date | null;
}

export interface UniversityDataset {
  User: UniversityUser[];
  School: UniversitySchool[];
  Department: UniversityDepartment[];
  Program: UniversityProgram[];
  Course: UniversityCourse[];
  Teacher: UniversityTeacher[];
  Student: UniversityStudent[];
  Registration: UniversityRegistration[];
  Grade: UniversityGrade[];
  Payment: UniversityPayment[];
  Book: UniversityBook[];
  BookLoan: UniversityBookLoan[];
}
