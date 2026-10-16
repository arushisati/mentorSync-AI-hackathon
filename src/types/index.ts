export type Role = 'admin' | 'mentor' | 'student';

export type LanguageCode =
  | 'en'
  | 'hi'
  | 'pa'
  | 'bn'
  | 'ta'
  | 'te'
  | 'mr'
  | 'gu'
  | 'ur';

export interface LanguageInfo {
  code: LanguageCode;
  label: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  speechCode: string;
}

export interface SubjectAllocation {
  id: string;
  subjectCode: string;
  subjectName: string;
  programme: string;
  semester: number;
  classSection: string; // e.g. "CSE-A", "CSE-B"
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  phone?: string;
  teachingAllocations: SubjectAllocation[];
  existingMentoringLoad: number; // e.g. from previous batches
  mentoringCapacity: number;     // max students they can mentor
  activeMenteeCount: number;     // assigned currently
}

export type RequirementType = 'exam_form' | 'sessional' | 'fee_receipt' | 'informed_status';

export interface CompletionReport {
  id: string;
  studentId: string;
  studentName: string;
  requirementType: RequirementType;
  title: string;
  submittedAt: string;
  proofDetails: string;
  attachmentName?: string;
  status: 'pending_review' | 'verified' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type FeeStatus = 'paid' | 'partly_paid' | 'pending';
export type ExamFormStatus = 'submitted' | 'pending' | 'verified' | 'overdue';
export type SessionalStatus = 'completed' | 'in_progress' | 'pending';

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  programme: string;
  semester: number;
  classSection: string;
  mentorId?: string;
  mentorName?: string;
  mentorDepartment?: string;
  preferredLanguage: LanguageCode;
  examFormStatus: ExamFormStatus;
  examFormDeadline: string;
  informedStatus: boolean; // has student officially confirmed receipt of requirements
  sessionalStatus: SessionalStatus;
  sessionalDeadline: string;
  feeStatus: FeeStatus;
  feeTotalAmount: number;
  feePaidAmount: number;
  feeDeadline: string;
  completionReports: CompletionReport[];
}

export type ConcernCategory =
  | 'academic'
  | 'fee_finance'
  | 'exam_sessional'
  | 'attendance'
  | 'personal_wellbeing'
  | 'hostel_transport';

export type ConcernStatus = 'open' | 'in_progress' | 'awaiting_student' | 'resolved';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface ConcernMessage {
  id: string;
  senderRole: 'student' | 'mentor' | 'admin';
  senderName: string;
  textOriginal: string;
  textTranslated?: string;
  originalLanguage: LanguageCode;
  targetLanguage?: LanguageCode;
  timestamp: string;
  isInternalNote: boolean;
}

export interface Concern {
  id: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  studentClassSection: string;
  studentLanguage: LanguageCode;
  mentorId: string;
  mentorName: string;
  category: ConcernCategory;
  subject: string;
  originalMessage: string;
  originalLanguage: LanguageCode;
  translatedMessage?: string;
  status: ConcernStatus;
  priority: PriorityLevel;
  createdAt: string;
  updatedAt: string;
  messages: ConcernMessage[];
  followUpDate?: string;
  resolutionSummary?: string;
  resolvedAt?: string;
}

export interface FollowUpTask {
  id: string;
  concernId?: string;
  studentId: string;
  studentName: string;
  mentorId: string;
  mentorName: string;
  title: string;
  priority: PriorityLevel;
  dueDate: string;
  completed: boolean;
  outcomeNotes?: string;
  createdAt: string;
}

export interface ReminderLog {
  id: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  requirementType: string;
  channel: 'email' | 'sms' | 'portal_alert';
  messageContent: string;
  sentAt: string;
  senderName: string;
  simulatedDelivery: boolean;
  status: 'delivered' | 'queued' | 'simulated';
}

export interface AllocationMatchResult {
  studentId: string;
  studentName: string;
  studentClassSection: string;
  assignedTeacherId?: string;
  assignedTeacherName?: string;
  reason: string;
  isEligible: boolean;
  confidence: 'high' | 'medium' | 'fallback' | 'conflict';
  conflictReason?: string;
}

export interface AllocationSummary {
  totalStudents: number;
  allocatedCount: number;
  unallocatedCount: number;
  conflictsCount: number;
  teacherLoadDistribution: {
    teacherId: string;
    teacherName: string;
    currentTotal: number;
    capacity: number;
    allocatedThisRound: number;
  }[];
  timestamp: string;
}

export interface InstitutionAlert {
  id: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  programme: string;
  semester: number;
  classSection: string;
  mentorName: string;
  type: 'exam_form' | 'fee_pending' | 'sessional' | 'uninformed' | 'urgent_concern';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  deadline: string;
  responsiblePerson: string;
  recommendedAction: string;
}
