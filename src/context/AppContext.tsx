import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Role,
  LanguageCode,
  Teacher,
  Student,
  Concern,
  FollowUpTask,
  ReminderLog,
  AllocationMatchResult,
  AllocationSummary,
  CompletionReport,
  ConcernStatus,
  PriorityLevel,
  RequirementType
} from '../types';
import {
  INITIAL_TEACHERS,
  INITIAL_STUDENTS,
  INITIAL_CONCERNS,
  INITIAL_FOLLOW_UPS,
  INITIAL_REMINDERS,
} from '../data/initialData';
import { runSmartMentorAllocation } from '../services/mentorMatch';
import { translateText, detectLanguage } from '../services/translator';
import { UI_TRANSLATIONS, UiTranslations, SUPPORTED_LANGUAGES } from '../i18n/languages';

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  currentStudentId: string;
  setCurrentStudentId: (id: string) => void;
  currentMentorId: string;
  setCurrentMentorId: (id: string) => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: UiTranslations;
  isRtl: boolean;

  teachers: Teacher[];
  students: Student[];
  concerns: Concern[];
  followUps: FollowUpTask[];
  reminders: ReminderLog[];
  allocationResults: AllocationMatchResult[] | null;
  allocationSummary: AllocationSummary | null;

  currentStudent: Student | undefined;
  currentMentor: Teacher | undefined;

  // Actions
  addConcern: (
    subject: string,
    category: any,
    message: string,
    priority: PriorityLevel
  ) => Promise<Concern>;
  addConcernMessage: (
    concernId: string,
    text: string,
    isInternalNote: boolean
  ) => Promise<void>;
  updateConcernStatus: (
    concernId: string,
    status: ConcernStatus,
    followUpDate?: string,
    resolutionSummary?: string
  ) => void;

  submitCompletionReport: (
    studentId: string,
    requirementType: RequirementType,
    title: string,
    proofDetails: string,
    attachmentName?: string
  ) => void;
  reviewCompletionReport: (
    studentId: string,
    reportId: string,
    status: 'verified' | 'rejected',
    rejectionReason?: string
  ) => void;

  addFollowUpTask: (
    studentId: string,
    title: string,
    dueDate: string,
    priority: PriorityLevel,
    concernId?: string
  ) => void;
  toggleFollowUpTask: (taskId: string, outcomeNotes?: string) => void;

  recordReminder: (
    studentId: string,
    requirementType: string,
    channel: 'email' | 'sms' | 'portal_alert',
    customMessage: string
  ) => Promise<void>;

  runMentorAllocation: () => void;
  approveAllocations: (approvedResults: AllocationMatchResult[]) => void;
  updateTeacherCapacity: (teacherId: string, newCapacity: number) => void;
  setCustomTeachersAndStudents: (teachers: Teacher[], students: Student[]) => void;
  confirmInformedStatus: (studentId: string) => void;
  resetToInitialData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'mentorsync_app_state_v2';
const LANG_STORAGE_KEY = 'mentorsync_student_lang_pref';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('student');
  const [currentStudentId, setCurrentStudentId] = useState<string>('STU-2024-001');
  const [currentMentorId, setCurrentMentorId] = useState<string>('FAC-101');

  // Language management with persistence
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY) as LanguageCode;
      if (saved && UI_TRANSLATIONS[saved]) return saved;
    } catch {
      // ignore
    }
    return 'hi'; // default friendly student language
  });

  const setLanguage = useCallback((newLang: LanguageCode) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
  }, []);

  // Primary state collections
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [concerns, setConcerns] = useState<Concern[]>(INITIAL_CONCERNS);
  const [followUps, setFollowUps] = useState<FollowUpTask[]>(INITIAL_FOLLOW_UPS);
  const [reminders, setReminders] = useState<ReminderLog[]>(INITIAL_REMINDERS);

  const [allocationResults, setAllocationResults] = useState<AllocationMatchResult[] | null>(null);
  const [allocationSummary, setAllocationSummary] = useState<AllocationSummary | null>(null);

  // Sync state from localStorage or backend on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.teachers) setTeachers(parsed.teachers);
        if (parsed.students) setStudents(parsed.students);
        if (parsed.concerns) setConcerns(parsed.concerns);
        if (parsed.followUps) setFollowUps(parsed.followUps);
        if (parsed.reminders) setReminders(parsed.reminders);
        if (parsed.allocationResults) setAllocationResults(parsed.allocationResults);
        if (parsed.allocationSummary) setAllocationSummary(parsed.allocationSummary);
      }
    } catch (e) {
      console.warn('Could not read state from localStorage:', e);
    }

    // Attempt to pull from backend /api/state
    fetch('/api/state')
      .then(res => res.json())
      .then(result => {
        if (result && result.success && result.data) {
          const d = result.data;
          if (d.teachers) setTeachers(d.teachers);
          if (d.students) setStudents(d.students);
          if (d.concerns) setConcerns(d.concerns);
          if (d.followUps) setFollowUps(d.followUps);
          if (d.reminders) setReminders(d.reminders);
          if (d.allocationResults) setAllocationResults(d.allocationResults);
          if (d.allocationSummary) setAllocationSummary(d.allocationSummary);
        }
      })
      .catch(() => {
        // Backend offline or running pure client, ignore
      });
  }, []);

  // Save changes to localStorage & backend
  const persistState = useCallback(
    (
      newTeachers: Teacher[],
      newStudents: Student[],
      newConcerns: Concern[],
      newFollowUps: FollowUpTask[],
      newReminders: ReminderLog[],
      newAllocResults: AllocationMatchResult[] | null,
      newAllocSummary: AllocationSummary | null
    ) => {
      const payload = {
        teachers: newTeachers,
        students: newStudents,
        concerns: newConcerns,
        followUps: newFollowUps,
        reminders: newReminders,
        allocationResults: newAllocResults,
        allocationSummary: newAllocSummary,
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }

      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Silent fail if backend not active
      });
    },
    []
  );

  const currentStudent = students.find(s => s.id === currentStudentId) || students[0];
  const currentMentor = teachers.find(t => t.id === currentMentorId) || teachers[0];

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
  const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === language);
  const isRtl = langConfig?.dir === 'rtl';

  // Apply HTML dir attribute when language changes
  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [isRtl, language]);

  // Sync student's preferred language with their record
  useEffect(() => {
    if (currentStudent && currentStudent.preferredLanguage !== language) {
      setStudents(prev => {
        const next = prev.map(s =>
          s.id === currentStudent.id ? { ...s, preferredLanguage: language } : s
        );
        persistState(teachers, next, concerns, followUps, reminders, allocationResults, allocationSummary);
        return next;
      });
    }
  }, [language, currentStudentId]);

  // Raise new concern with dynamic translation
  const addConcern = async (
    subject: string,
    category: any,
    message: string,
    priority: PriorityLevel
  ): Promise<Concern> => {
    const student = currentStudent || students[0];
    const detectedLang = detectLanguage(message);
    const originalLang = detectedLang !== 'en' ? detectedLang : language;

    // Translate to English for faculty mentor
    const translationResult = await translateText(message, originalLang, 'en');

    const newConcern: Concern = {
      id: `CNC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      studentId: student.id,
      studentName: student.name,
      studentRollNo: student.rollNo,
      studentClassSection: student.classSection,
      studentLanguage: originalLang,
      mentorId: student.mentorId || currentMentorId,
      mentorName: student.mentorName || currentMentor?.name || 'Assigned Mentor',
      category,
      subject,
      originalMessage: message,
      originalLanguage: originalLang,
      translatedMessage: translationResult.translatedText,
      status: 'open',
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderRole: 'student',
          senderName: student.name,
          textOriginal: message,
          textTranslated: translationResult.translatedText,
          originalLanguage: originalLang,
          targetLanguage: 'en',
          timestamp: new Date().toISOString(),
          isInternalNote: false,
        },
      ],
    };

    setConcerns(prev => {
      const next = [newConcern, ...prev];
      persistState(teachers, students, next, followUps, reminders, allocationResults, allocationSummary);
      return next;
    });

    return newConcern;
  };

  // Add dialogue message to concern thread
  const addConcernMessage = async (
    concernId: string,
    text: string,
    isInternalNote: boolean
  ) => {
    const concern = concerns.find(c => c.id === concernId);
    if (!concern) return;

    let targetLang: LanguageCode = 'en';
    let sourceLang: LanguageCode = 'en';
    let translated = '';

    if (role === 'mentor' || role === 'admin') {
      sourceLang = 'en';
      targetLang = concern.studentLanguage || 'hi';
      if (!isInternalNote) {
        const transRes = await translateText(text, sourceLang, targetLang);
        translated = transRes.translatedText;
      }
    } else {
      sourceLang = concern.studentLanguage || language;
      targetLang = 'en';
      const transRes = await translateText(text, sourceLang, targetLang);
      translated = transRes.translatedText;
    }

    const newMessage = {
      id: `msg-${Date.now()}`,
      senderRole: role as 'student' | 'mentor' | 'admin',
      senderName:
        role === 'student'
          ? currentStudent?.name || 'Student'
          : currentMentor?.name || 'Faculty Mentor',
      textOriginal: text,
      textTranslated: isInternalNote ? undefined : translated,
      originalLanguage: sourceLang,
      targetLanguage: isInternalNote ? undefined : targetLang,
      timestamp: new Date().toISOString(),
      isInternalNote,
    };

    // Update concern status automatically if mentor replied
    let nextStatus = concern.status;
    if (role === 'mentor' && !isInternalNote) {
      nextStatus = 'awaiting_student';
    } else if (role === 'student' && concern.status === 'awaiting_student') {
      nextStatus = 'in_progress';
    }

    setConcerns(prev => {
      const next = prev.map(c => {
        if (c.id === concernId) {
          return {
            ...c,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
            messages: [...c.messages, newMessage],
          };
        }
        return c;
      });
      persistState(teachers, students, next, followUps, reminders, allocationResults, allocationSummary);
      return next;
    });
  };

  const updateConcernStatus = (
    concernId: string,
    status: ConcernStatus,
    followUpDate?: string,
    resolutionSummary?: string
  ) => {
    setConcerns(prev => {
      const next = prev.map(c => {
        if (c.id === concernId) {
          return {
            ...c,
            status,
            followUpDate: followUpDate || c.followUpDate,
            resolutionSummary: resolutionSummary !== undefined ? resolutionSummary : c.resolutionSummary,
            resolvedAt: status === 'resolved' ? new Date().toISOString() : c.resolvedAt,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      });
      persistState(teachers, students, next, followUps, reminders, allocationResults, allocationSummary);
      return next;
    });
  };

  // Submit student completion report
  const submitCompletionReport = (
    studentId: string,
    requirementType: RequirementType,
    title: string,
    proofDetails: string,
    attachmentName?: string
  ) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const report: CompletionReport = {
      id: `cr-${Date.now()}`,
      studentId,
      studentName: student.name,
      requirementType,
      title,
      submittedAt: new Date().toISOString(),
      proofDetails,
      attachmentName: attachmentName || 'Verification_Submission.pdf',
      status: 'pending_review',
    };

    // Also update student's requirement state to submitted (pending verification)
    setStudents(prev => {
      const next = prev.map(s => {
        if (s.id === studentId) {
          const updatedReports = [report, ...(s.completionReports || [])];
          let updatedExam = s.examFormStatus;
          if (requirementType === 'exam_form') {
            updatedExam = 'submitted';
          }
          return {
            ...s,
            examFormStatus: updatedExam,
            completionReports: updatedReports,
          };
        }
        return s;
      });
      persistState(teachers, next, concerns, followUps, reminders, allocationResults, allocationSummary);
      return next;
    });
  };

  // Mentor reviews completion report
  const reviewCompletionReport = (
    studentId: string,
    reportId: string,
    status: 'verified' | 'rejected',
    rejectionReason?: string
  ) => {
    setStudents(prev => {
      const next = prev.map(s => {
        if (s.id === studentId) {
          const updatedReports = (s.completionReports || []).map(r => {
            if (r.id === reportId) {
              return {
                ...r,
                status,
                rejectionReason: status === 'rejected' ? rejectionReason : undefined,
                reviewedBy: currentMentor?.name || 'Mentor',
                reviewedAt: new Date().toISOString(),
              };
            }
            return r;
          });

          // If verified, update the actual requirement status
          const targetReport = s.completionReports.find(r => r.id === reportId);
          let newExam = s.examFormStatus;
          let newFee = s.feeStatus;
          let newSessional = s.sessionalStatus;

          if (targetReport && status === 'verified') {
            if (targetReport.requirementType === 'exam_form') newExam = 'verified';
            if (targetReport.requirementType === 'fee_receipt') {
              newFee = 'paid';
            }
            if (targetReport.requirementType === 'sessional') newSessional = 'completed';
          } else if (targetReport && status === 'rejected') {
            if (targetReport.requirementType === 'exam_form') newExam = 'pending';
          }

          return {
            ...s,
            examFormStatus: newExam,
            feeStatus: newFee,
            sessionalStatus: newSessional,
            completionReports: updatedReports,
          };
        }
        return s;
      });
      persistState(teachers, next, concerns, followUps, reminders, allocationResults, allocationSummary);
      return next;
    });
  };

  // Student acknowledges academic directives
  const confirmInformedStatus = (studentId: string) => {
    setStudents(prev => {
      const next = prev.map(s => (s.id === studentId ? { ...s, informedStatus: true } : s));
      persistState(teachers, next, concerns, followUps, reminders, allocationResults, allocationSummary);
      return next;
    });
  };

  // Action Center: Follow ups
  const addFollowUpTask = (
    studentId: string,
    title: string,
    dueDate: string,
    priority: PriorityLevel,
    concernId?: string
  ) => {
    const student = students.find(s => s.id === studentId);
    const newTask: FollowUpTask = {
      id: `fut-${Date.now()}`,
      concernId,
      studentId,
      studentName: student?.name || 'Student',
      mentorId: currentMentorId,
      mentorName: currentMentor?.name || 'Mentor',
      title,
      priority,
      dueDate,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setFollowUps(prev => {
      const next = [newTask, ...prev];
      persistState(teachers, students, concerns, next, reminders, allocationResults, allocationSummary);
      return next;
    });
  };

  const toggleFollowUpTask = (taskId: string, outcomeNotes?: string) => {
    setFollowUps(prev => {
      const next = prev.map(f => {
        if (f.id === taskId) {
          return {
            ...f,
            completed: !f.completed,
            outcomeNotes: outcomeNotes || f.outcomeNotes,
          };
        }
        return f;
      });
      persistState(teachers, students, concerns, next, reminders, allocationResults, allocationSummary);
      return next;
    });
  };

  // Record reminder with simulated audit log
  const recordReminder = async (
    studentId: string,
    requirementType: string,
    channel: 'email' | 'sms' | 'portal_alert',
    customMessage: string
  ) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const newReminder: ReminderLog = {
      id: `REM-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      studentRollNo: student.rollNo,
      requirementType,
      channel,
      messageContent: customMessage,
      sentAt: new Date().toISOString(),
      senderName: `${currentMentor?.name || 'Administration'} (${role.toUpperCase()})`,
      simulatedDelivery: true,
      status: 'delivered',
    };

    setReminders(prev => {
      const next = [newReminder, ...prev];
      persistState(teachers, students, concerns, followUps, next, allocationResults, allocationSummary);
      return next;
    });

    // Also call backend logging endpoint
    fetch('/api/reminders/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: student.name,
        studentRollNo: student.rollNo,
        channel,
        requirementType,
        customMessage,
      }),
    }).catch(() => {});
  };

  // Run MentorMatch AI
  const runMentorAllocation = () => {
    const { results, summary } = runSmartMentorAllocation(teachers, students);
    setAllocationResults(results);
    setAllocationSummary(summary);
    persistState(teachers, students, concerns, followUps, reminders, results, summary);
  };

  // Admin approves allocation results
  const approveAllocations = (approvedResults: AllocationMatchResult[]) => {
    const studentToMentorMap = new Map<string, { mentorId: string; mentorName: string }>();
    const teacherTally = new Map<string, number>();

    approvedResults.forEach(r => {
      if (r.assignedTeacherId && r.assignedTeacherName) {
        studentToMentorMap.set(r.studentId, {
          mentorId: r.assignedTeacherId,
          mentorName: r.assignedTeacherName,
        });
        teacherTally.set(
          r.assignedTeacherId,
          (teacherTally.get(r.assignedTeacherId) || 0) + 1
        );
      }
    });

    // Update students
    const updatedStudents = students.map(s => {
      const match = studentToMentorMap.get(s.id);
      if (match) {
        const teacher = teachers.find(t => t.id === match.mentorId);
        return {
          ...s,
          mentorId: match.mentorId,
          mentorName: match.mentorName,
          mentorDepartment: teacher?.department,
        };
      }
      return s;
    });

    // Update teachers active mentee count
    const updatedTeachers = teachers.map(t => {
      const count = teacherTally.get(t.id) || 0;
      return {
        ...t,
        activeMenteeCount: count,
      };
    });

    setStudents(updatedStudents);
    setTeachers(updatedTeachers);
    persistState(
      updatedTeachers,
      updatedStudents,
      concerns,
      followUps,
      reminders,
      approvedResults,
      allocationSummary
    );
  };

  const updateTeacherCapacity = (teacherId: string, newCapacity: number) => {
    setTeachers(prev => {
      const next = prev.map(t =>
        t.id === teacherId ? { ...t, mentoringCapacity: newCapacity } : t
      );
      persistState(next, students, concerns, followUps, reminders, allocationResults, allocationSummary);
      return next;
    });
  };

  const setCustomTeachersAndStudents = (newTeachers: Teacher[], newStudents: Student[]) => {
    setTeachers(newTeachers);
    setStudents(newStudents);
    setAllocationResults(null);
    setAllocationSummary(null);
    persistState(newTeachers, newStudents, concerns, followUps, reminders, null, null);
  };

  const resetToInitialData = () => {
    setTeachers(INITIAL_TEACHERS);
    setStudents(INITIAL_STUDENTS);
    setConcerns(INITIAL_CONCERNS);
    setFollowUps(INITIAL_FOLLOW_UPS);
    setReminders(INITIAL_REMINDERS);
    setAllocationResults(null);
    setAllocationSummary(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    persistState(
      INITIAL_TEACHERS,
      INITIAL_STUDENTS,
      INITIAL_CONCERNS,
      INITIAL_FOLLOW_UPS,
      INITIAL_REMINDERS,
      null,
      null
    );
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currentStudentId,
        setCurrentStudentId,
        currentMentorId,
        setCurrentMentorId,
        language,
        setLanguage,
        t,
        isRtl,
        teachers,
        students,
        concerns,
        followUps,
        reminders,
        allocationResults,
        allocationSummary,
        currentStudent,
        currentMentor,
        addConcern,
        addConcernMessage,
        updateConcernStatus,
        submitCompletionReport,
        reviewCompletionReport,
        addFollowUpTask,
        toggleFollowUpTask,
        recordReminder,
        runMentorAllocation,
        approveAllocations,
        updateTeacherCapacity,
        setCustomTeachersAndStudents,
        confirmInformedStatus,
        resetToInitialData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
