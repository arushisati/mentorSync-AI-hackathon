import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { SUPPORTED_LANGUAGES } from '../i18n/languages';
import { ConcernCategory, PriorityLevel, RequirementType } from '../types';
import {
  UserCheck,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Mic,
  MicOff,
  FileText,
  CreditCard,
  BookOpen,
  MessageSquare,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const StudentPortal: React.FC = () => {
  const {
    currentStudent,
    currentMentor,
    t,
    language,
    setLanguage,
    isRtl,
    concerns,
    addConcern,
    addConcernMessage,
    submitCompletionReport,
    confirmInformedStatus,
  } = useApp();

  const [activeConcernModal, setActiveConcernModal] = useState(false);
  const [activeReportModal, setActiveReportModal] = useState<{
    open: boolean;
    type: RequirementType;
    title: string;
  }>({
    open: false,
    type: 'exam_form',
    title: '',
  });

  // Concern form state
  const [concernSubject, setConcernSubject] = useState('');
  const [concernCategory, setConcernCategory] = useState<ConcernCategory>('academic');
  const [concernMessage, setConcernMessage] = useState('');
  const [concernPriority, setConcernPriority] = useState<PriorityLevel>('medium');
  const [isSubmittingConcern, setIsSubmittingConcern] = useState(false);
  const [voiceConfirmed, setVoiceConfirmed] = useState(false);

  // Completion report state
  const [reportTitle, setReportTitle] = useState('');
  const [reportProof, setReportProof] = useState('');
  const [reportAttachment, setReportAttachment] = useState('');

  // Active dialogue reply box
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [showOriginals, setShowOriginals] = useState<Record<string, boolean>>({});

  // Voice recording
  const currentLangConfig = SUPPORTED_LANGUAGES.find(l => l.code === language);
  const speechCode = currentLangConfig?.speechCode || 'en-US';
  const {
    isSupported: voiceSupported,
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText(speechCode);

  if (!currentStudent) {
    return (
      <div className="p-8 text-center text-[#80776D]">
        No student profile selected. Please select a student from the role bar above.
      </div>
    );
  }

  // Filter concerns for this student
  const studentConcerns = concerns.filter(c => c.studentId === currentStudent.id);

  const handleVoiceConfirm = () => {
    if (transcript) {
      setConcernMessage(prev => (prev ? prev + ' ' : '') + transcript);
      setVoiceConfirmed(true);
      stopListening();
      resetTranscript();
    }
  };

  const handleOpenReportModal = (type: RequirementType, defaultTitle: string) => {
    setActiveReportModal({
      open: true,
      type,
      title: defaultTitle,
    });
    setReportTitle(defaultTitle);
    setReportProof('');
    setReportAttachment(
      type === 'fee_receipt'
        ? 'Fee_Challan_Receipt.pdf'
        : type === 'exam_form'
        ? 'Exam_Registration_Slip.pdf'
        : 'Sessional_Assignment_Submission.pdf'
    );
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportProof.trim()) return;

    submitCompletionReport(
      currentStudent.id,
      activeReportModal.type,
      reportTitle,
      reportProof,
      reportAttachment
    );

    setActiveReportModal({ open: false, type: 'exam_form', title: '' });
  };

  const handleSubmitConcern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concernSubject.trim() || !concernMessage.trim()) return;

    setIsSubmittingConcern(true);
    try {
      await addConcern(concernSubject, concernCategory, concernMessage, concernPriority);
      setConcernSubject('');
      setConcernMessage('');
      resetTranscript();
      setActiveConcernModal(false);
    } finally {
      setIsSubmittingConcern(false);
    }
  };

  const handleSendReply = async (concernId: string) => {
    const text = replyTexts[concernId];
    if (!text || !text.trim()) return;

    await addConcernMessage(concernId, text, false);
    setReplyTexts(prev => ({ ...prev, [concernId]: '' }));
  };

  const toggleOriginalTranslation = (concernId: string) => {
    setShowOriginals(prev => ({
      ...prev,
      [concernId]: !prev[concernId],
    }));
  };

  // Helper for status badges
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
      case 'completed':
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#344C3D] bg-[#829681]/20 px-2.5 py-1 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t.statusVerified}
          </span>
        );
      case 'submitted':
      case 'in_progress':
      case 'partly_paid':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#80776D] bg-[#F0E8DC] px-2.5 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5" />
            {t.statusSubmitted}
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C9826B] bg-[#C9826B]/15 px-2.5 py-1 rounded-md">
            <AlertCircle className="w-3.5 h-3.5" />
            {t.statusOverdue}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#80776D] bg-[#FAF7F2] border border-[#E4DCD0] px-2.5 py-1 rounded-md">
            <AlertCircle className="w-3.5 h-3.5" />
            {t.statusPending}
          </span>
        );
    }
  };

  return (
    <div className={`space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>
      {/* Header Greeting & Multilingual Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E4DCD0] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-[#829681] uppercase tracking-wider">
                {currentStudent.programme} · Semester {currentStudent.semester} · Section {currentStudent.classSection}
              </span>
              <span className="text-xs text-[#80776D]">·</span>
              <span className="text-xs text-[#80776D]">Roll No: {currentStudent.rollNo}</span>
            </div>
            <h1 className="text-2xl font-bold font-serif text-[#344C3D]">
              {t.welcomeStudent}, {currentStudent.name}
            </h1>
            <p className="text-sm text-[#80776D] mt-1">
              Institutional Student Self-Service Portal · Speak Your Language Active
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveConcernModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#344C3D] text-white text-xs font-medium hover:bg-[#344C3D]/90 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t.raiseConcernBtn}</span>
            </button>
          </div>
        </div>

        {/* Academic Directives Confirmation banner */}
        {!currentStudent.informedStatus && (
          <div className="mt-5 p-4 rounded-xl bg-[#F0E8DC]/80 border border-[#E4DCD0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#829681] shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-[#344C3D]">{t.informedStatusTitle}</p>
                <p className="text-[#80776D]">
                  Institutional policy requires all enrolled students to officially acknowledge examination rules, minimum 75% attendance threshold, and fee schedules.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => confirmInformedStatus(currentStudent.id)}
              className="px-3 py-1.5 rounded-lg bg-[#829681] text-white text-xs font-medium hover:bg-[#829681]/90 transition-colors shrink-0 cursor-pointer"
            >
              Confirm Acknowledged
            </button>
          </div>
        )}
      </div>

      {/* Grid: Assigned Mentor Card & Academic Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mentor Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#E4DCD0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-[#80776D] uppercase tracking-wider">
                {t.assignedMentor}
              </span>
              <span className="w-8 h-8 rounded-full bg-[#829681]/15 flex items-center justify-center text-[#344C3D]">
                <UserCheck className="w-4 h-4" />
              </span>
            </div>

            {currentStudent.mentorName ? (
              <div className="space-y-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#344C3D]">
                    {currentStudent.mentorName}
                  </h3>
                  <p className="text-xs text-[#80776D]">
                    {currentStudent.mentorDepartment || 'Faculty Mentor'}
                  </p>
                </div>
                <div className="text-xs text-[#80776D] space-y-1 pt-2 border-t border-[#F0E8DC]">
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#829681]" />
                    <span>mentor.contact@university.edu</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#829681]" />
                    <span>Office Hours: Tue & Thu, 2:00 PM – 4:00 PM</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#80776D]">
                {t.noMentorAssigned}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-[#F0E8DC]">
            <button
              type="button"
              onClick={() => setActiveConcernModal(true)}
              className="w-full py-2 px-3 rounded-xl border border-[#E4DCD0] text-xs font-medium text-[#344C3D] hover:bg-[#FAF7F2] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#829681]" />
              <span>{t.contactMentor}</span>
            </button>
          </div>
        </div>

        {/* Examination Form Status Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#E4DCD0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#80776D] uppercase tracking-wider">
                {t.examFormTitle}
              </span>
              <span className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#829681]">
                <FileText className="w-4 h-4" />
              </span>
            </div>

            <div className="my-2">
              {renderStatusBadge(currentStudent.examFormStatus)}
            </div>

            <p className="text-xs text-[#80776D] mt-3">
              End-Term University Examination registration for 4th Semester subjects.
            </p>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#C9826B] font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>Deadline: {currentStudent.examFormDeadline}</span>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#F0E8DC]">
            <button
              type="button"
              onClick={() => handleOpenReportModal('exam_form', 'University Exam Form Submission')}
              className="w-full py-2 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F0E8DC] border border-[#E4DCD0] text-xs font-medium text-[#344C3D] transition-colors cursor-pointer"
            >
              {t.reportCompletionBtn}
            </button>
          </div>
        </div>

        {/* Tuition & Fee Status Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#E4DCD0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#80776D] uppercase tracking-wider">
                {t.feeStatusTitle}
              </span>
              <span className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#829681]">
                <CreditCard className="w-4 h-4" />
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <span className="text-lg font-bold text-[#344C3D]">
                ₹{currentStudent.feePaidAmount.toLocaleString()}
              </span>
              <span className="text-xs text-[#80776D]">
                of ₹{currentStudent.feeTotalAmount.toLocaleString()}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[#F0E8DC] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#344C3D] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (currentStudent.feePaidAmount / currentStudent.feeTotalAmount) * 100
                  )}%`,
                }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-[#80776D]">Due: {currentStudent.feeDeadline}</span>
              <span className="font-medium text-[#80776D]">
                {currentStudent.feePaidAmount >= currentStudent.feeTotalAmount
                  ? 'Cleared'
                  : `₹${(currentStudent.feeTotalAmount - currentStudent.feePaidAmount).toLocaleString()} Pending`}
              </span>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#F0E8DC]">
            <button
              type="button"
              onClick={() => handleOpenReportModal('fee_receipt', 'Tuition Fee Challan / Receipt')}
              className="w-full py-2 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F0E8DC] border border-[#E4DCD0] text-xs font-medium text-[#344C3D] transition-colors cursor-pointer"
            >
              Submit Payment Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Sessional Assessments Section & Completion Reports History */}
      <div className="bg-white rounded-2xl p-6 border border-[#E4DCD0] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0E8DC]">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#344C3D]">
              {t.sessionalTitle}
            </h2>
            <p className="text-xs text-[#80776D] mt-0.5">
              Mid-term continuous evaluation, lab rubrics, and make-up assessments
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenReportModal('sessional', 'Sessional Assessment Make-up / Proof')}
            className="px-3 py-1.5 rounded-xl border border-[#E4DCD0] bg-[#FAF7F2] hover:bg-[#F0E8DC] text-xs font-medium text-[#344C3D] transition-colors cursor-pointer"
          >
            Submit Sessional Proof
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#FAF7F2]/60 border border-[#E4DCD0]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-[#344C3D]">CS401 - Design & Analysis of Algorithms</span>
              <span className="text-[#344C3D] font-medium bg-[#829681]/20 px-2 py-0.5 rounded">Evaluated (28/30)</span>
            </div>
            <p className="text-xs text-[#80776D]">First and second internal tests recorded by Dr. Rajesh Sharma.</p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF7F2]/60 border border-[#E4DCD0]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-[#344C3D]">CS403 - Operating Systems Lab</span>
              <span className="text-[#80776D] font-medium bg-[#F0E8DC] px-2 py-0.5 rounded">Lab viva scheduled</span>
            </div>
            <p className="text-xs text-[#80776D]">Submission of concurrency assignment pending mentor review.</p>
          </div>
        </div>

        {/* List of Student Submitted Completion Reports */}
        {currentStudent.completionReports && currentStudent.completionReports.length > 0 && (
          <div className="mt-6 pt-5 border-t border-[#F0E8DC]">
            <h3 className="text-xs font-semibold text-[#80776D] uppercase tracking-wider mb-3">
              Submitted Verification Reports
            </h3>
            <div className="space-y-3">
              {currentStudent.completionReports.map(report => (
                <div
                  key={report.id}
                  className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E4DCD0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#344C3D]">{report.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          report.status === 'verified'
                            ? 'bg-[#829681]/20 text-[#344C3D]'
                            : report.status === 'rejected'
                            ? 'bg-[#C9826B]/20 text-[#C9826B]'
                            : 'bg-[#F0E8DC] text-[#80776D]'
                        }`}
                      >
                        {report.status === 'verified'
                          ? 'Verified by Mentor'
                          : report.status === 'rejected'
                          ? 'Resubmission Requested'
                          : 'Pending Mentor Verification'}
                      </span>
                    </div>
                    <p className="text-[#80776D] mt-1">{report.proofDetails}</p>
                    {report.attachmentName && (
                      <p className="text-[11px] text-[#829681] mt-0.5 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>Attached: {report.attachmentName}</span>
                      </p>
                    )}
                    {report.rejectionReason && (
                      <p className="text-[11px] text-[#C9826B] font-medium mt-1">
                        Mentor note: {report.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div className="text-[11px] text-[#80776D] shrink-0">
                    {new Date(report.submittedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Multilingual Concern Tracker & Mentor Dialogue */}
      <div className="bg-white rounded-2xl p-6 border border-[#E4DCD0] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0E8DC]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl font-bold text-[#344C3D]">
                {t.myConcerns}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#829681]/15 text-[#344C3D] font-medium">
                {studentConcerns.length} Recorded
              </span>
            </div>
            <p className="text-xs text-[#80776D] mt-0.5">
              Multilingual dialogue channels automatically translated for your faculty mentor
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveConcernModal(true)}
            className="px-4 py-2 rounded-xl bg-[#344C3D] text-white text-xs font-medium hover:bg-[#344C3D]/90 transition-all flex items-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t.raiseConcernBtn}</span>
          </button>
        </div>

        {studentConcerns.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare className="w-8 h-8 text-[#80776D]/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-[#344C3D]">{t.noConcernsYet}</p>
            <p className="text-xs text-[#80776D] mt-1 max-w-md mx-auto">
              If you have queries regarding examination forms, fee installments, or academic workload, raise a concern in your native language.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {studentConcerns.map(concern => {
              const showOriginal = showOriginals[concern.id];
              return (
                <div
                  key={concern.id}
                  className="rounded-2xl border border-[#E4DCD0] bg-[#FAF7F2]/40 overflow-hidden"
                >
                  {/* Concern Header */}
                  <div className="p-4 bg-white border-b border-[#E4DCD0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-semibold text-[#80776D]">
                          {concern.id}
                        </span>
                        <span className="text-xs text-[#80776D]">·</span>
                        <span className="text-xs font-medium text-[#829681] uppercase">
                          {concern.category.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-[#80776D]">·</span>
                        <span className="text-xs text-[#80776D]">
                          Priority: {concern.priority.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-[#344C3D]">
                        {concern.subject}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                          concern.status === 'resolved'
                            ? 'bg-[#829681]/20 text-[#344C3D]'
                            : concern.status === 'awaiting_student'
                            ? 'bg-[#C9826B]/20 text-[#C9826B]'
                            : 'bg-[#F0E8DC] text-[#344C3D]'
                        }`}
                      >
                        {concern.status === 'resolved'
                          ? t.statusResolved
                          : concern.status === 'awaiting_student'
                          ? t.statusAwaitingStudent
                          : t.statusInProgress}
                      </span>
                    </div>
                  </div>

                  {/* Messages Thread */}
                  <div className="p-5 space-y-4">
                    {concern.messages
                      .filter(m => !m.isInternalNote) // Strictly protect internal notes from student view
                      .map(msg => {
                        const isStudent = msg.senderRole === 'student';
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              isStudent ? 'items-start' : 'items-end'
                            }`}
                          >
                            <div className="text-[11px] text-[#80776D] mb-1 px-1 flex items-center gap-2">
                              <span className="font-semibold text-[#344C3D]">
                                {msg.senderName} ({msg.senderRole === 'student' ? 'You' : 'Mentor'})
                              </span>
                              <span>·</span>
                              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            <div
                              className={`max-w-2xl p-4 rounded-2xl text-xs leading-relaxed ${
                                isStudent
                                  ? 'bg-white border border-[#E4DCD0] text-[#373833] rounded-tl-sm'
                                  : 'bg-[#344C3D] text-white rounded-tr-sm shadow-xs'
                              }`}
                            >
                              {/* If student view and mentor replied in English, show translated version */}
                              {!isStudent && msg.textTranslated ? (
                                <div>
                                  <p>{showOriginal ? msg.textOriginal : msg.textTranslated}</p>
                                  <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between text-[10px] text-white/80">
                                    <span>
                                      {showOriginal ? 'Showing English original' : 'Translated to your preferred language'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => toggleOriginalTranslation(concern.id)}
                                      className="underline hover:text-white cursor-pointer"
                                    >
                                      {showOriginal ? 'Show Translation' : 'View Original English'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p>{msg.textOriginal}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Student Reply Bar */}
                  {concern.status !== 'resolved' ? (
                    <div className="p-4 bg-white border-t border-[#E4DCD0] flex gap-2">
                      <input
                        type="text"
                        value={replyTexts[concern.id] || ''}
                        onChange={e =>
                          setReplyTexts(prev => ({
                            ...prev,
                            [concern.id]: e.target.value,
                          }))
                        }
                        placeholder="Reply in your preferred language..."
                        className="flex-1 px-3.5 py-2 text-xs bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#829681]"
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSendReply(concern.id);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSendReply(concern.id)}
                        className="px-4 py-2 bg-[#829681] text-white rounded-xl text-xs font-medium hover:bg-[#829681]/90 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#829681]/10 border-t border-[#E4DCD0] text-center text-xs text-[#344C3D] font-medium">
                      ✓ This concern has been documented and resolved. {concern.resolutionSummary && `Resolution: "${concern.resolutionSummary}"`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Raise New Concern */}
      {activeConcernModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E4DCD0] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#E4DCD0] flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#344C3D]">
                  {t.raiseConcernBtn}
                </h3>
                <p className="text-xs text-[#80776D] mt-0.5">
                  Speak Your Language · Write or speak in Hindi, Punjabi, Bengali, Urdu, etc.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveConcernModal(false)}
                className="text-[#80776D] hover:text-[#373833] text-sm p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitConcern} className="p-5 space-y-4">
              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#344C3D] mb-1">
                    {t.category}
                  </label>
                  <select
                    value={concernCategory}
                    onChange={e => setConcernCategory(e.target.value as ConcernCategory)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
                  >
                    <option value="academic">Academic & Subject Difficulties</option>
                    <option value="fee_finance">Fee Clearance & Installments</option>
                    <option value="exam_sessional">Exam Form & Sessional Retests</option>
                    <option value="attendance">Attendance Shortage & Leave</option>
                    <option value="personal_wellbeing">Student Guidance & Wellbeing</option>
                    <option value="hostel_transport">Hostel & Campus Amenities</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344C3D] mb-1">
                    Priority
                  </label>
                  <select
                    value={concernPriority}
                    onChange={e => setConcernPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
                  >
                    <option value="low">Standard Inquiry (Low)</option>
                    <option value="medium">Important (Medium)</option>
                    <option value="high">Urgent Deadline (High)</option>
                    <option value="urgent">Critical Hardship (Urgent)</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-[#344C3D] mb-1">
                  {t.subject}
                </label>
                <input
                  type="text"
                  required
                  value={concernSubject}
                  onChange={e => setConcernSubject(e.target.value)}
                  placeholder="e.g., Request for fee installment or sessional make-up..."
                  className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
                />
              </div>

              {/* Message Description with Voice Option */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#344C3D]">
                    {t.description} ({currentLangConfig?.nativeName || 'Your Language'})
                  </label>

                  {/* Speech-to-Text Button */}
                  {voiceSupported && (
                    <button
                      type="button"
                      onClick={isListening ? stopListening : startListening}
                      className={`text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium transition-all ${
                        isListening
                          ? 'bg-[#C9826B] text-white animate-pulse'
                          : 'bg-[#829681]/15 text-[#344C3D] hover:bg-[#829681]/25'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-3 h-3" />
                          <span>{t.speakStop}</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3 h-3" />
                          <span>{t.speakPrompt}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Voice listening status */}
                {isListening && (
                  <div className="mb-2 p-2 rounded-lg bg-[#C9826B]/10 border border-[#C9826B]/30 text-xs text-[#C9826B] flex items-center justify-between">
                    <span>{t.speakListening}</span>
                    <span className="w-2 h-2 rounded-full bg-[#C9826B] animate-ping" />
                  </div>
                )}

                {/* Voice confirmation preview */}
                {transcript && !voiceConfirmed && (
                  <div className="mb-2 p-3 rounded-xl bg-[#FAF7F2] border border-[#829681] text-xs">
                    <p className="font-semibold text-[#344C3D]">{t.confirmVoiceText}</p>
                    <p className="italic text-[#373833] my-1.5">"{transcript}"</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleVoiceConfirm}
                        className="px-2.5 py-1 bg-[#829681] text-white rounded text-[11px] font-medium"
                      >
                        Confirm Text
                      </button>
                      <button
                        type="button"
                        onClick={resetTranscript}
                        className="px-2.5 py-1 bg-white border border-[#E4DCD0] text-[#80776D] rounded text-[11px]"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                )}

                {speechError && (
                  <p className="text-[11px] text-[#C9826B] mb-2">{speechError}</p>
                )}

                <textarea
                  rows={4}
                  required
                  value={concernMessage}
                  onChange={e => setConcernMessage(e.target.value)}
                  placeholder="Type in your native script (हिन्दी, ਪੰਜਾਬੀ, বাংলা, தமிழ், اردو, English...)"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
                />

                {/* Quick Academic Templates */}
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="text-[#80776D]">Sample templates:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setConcernSubject('सेमेस्टर शुल्क किस्त विस्तार अनुरोध');
                      setConcernCategory('fee_finance');
                      setConcernPriority('high');
                      setConcernMessage(
                        'आदरणीय मेंटर, पारिवारिक वित्तीय कठिनाई के कारण, मैं शेष सेमेस्टर शुल्क का भुगतान दो मासिक किस्तों में करने की अनुमति का अनुरोध करता हूँ ताकि मेरा प्रवेश पत्र न रुके।'
                      );
                    }}
                    className="text-[#829681] hover:underline"
                  >
                    Fee Installment (Hindi)
                  </button>
                  <span className="text-[#80776D]">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setConcernSubject('ਸੈਸ਼ਨਲ ਮੁੜ-ਪ੍ਰੀਖਿਆ ਬੇਨਤੀ');
                      setConcernCategory('exam_sessional');
                      setConcernPriority('medium');
                      setConcernMessage(
                        'ਸਤਿਕਾਰਯੋਗ ਮੈਂਟਰ ਜੀ, ਤੇਜ਼ ਬੁਖਾਰ ਕਾਰਨ ਮੇਰਾ ਦੂਜਾ ਸੈਸ਼ਨਲ ਟੈਸਟ ਰਹਿ ਗਿਆ ਸੀ ਅਤੇ ਮੈਂ ਮੈਡੀਕਲ ਸਰਟੀਫਿਕੇਟ ਨੱਥੀ ਕੀਤਾ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਮੁੜ-ਪ੍ਰੀਖਿਆ ਬਾਰੇ ਮਾਰਗਦਰਸ਼ਨ ਕਰੋ।'
                      );
                    }}
                    className="text-[#829681] hover:underline"
                  >
                    Sessional Retest (Punjabi)
                  </button>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E4DCD0] text-[11px] text-[#80776D] flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#829681] shrink-0 mt-0.5" />
                <span>{t.translationDisclaimer}</span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F0E8DC]">
                <button
                  type="button"
                  onClick={() => setActiveConcernModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#80776D] hover:bg-[#FAF7F2] cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingConcern}
                  className="px-5 py-2 rounded-xl bg-[#344C3D] text-white text-xs font-medium hover:bg-[#344C3D]/90 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingConcern ? 'Translating & Submitting...' : t.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Report Requirement Completion */}
      {activeReportModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E4DCD0] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#E4DCD0] flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#344C3D]">
                  {t.reportCompletionBtn}
                </h3>
                <p className="text-xs text-[#80776D]">
                  Submitted records remain pending until mentor officially verifies
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setActiveReportModal({ open: false, type: 'exam_form', title: '' })
                }
                className="text-[#80776D] hover:text-[#373833] text-sm p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#344C3D] mb-1">
                  Requirement
                </label>
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344C3D] mb-1">
                  {t.proofDetails}
                </label>
                <textarea
                  rows={3}
                  required
                  value={reportProof}
                  onChange={e => setReportProof(e.target.value)}
                  placeholder="e.g. Transaction Ref UTR9082348921 or Exam Registration Portal Ack #EXM-2026-CSE-9901..."
                  className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344C3D] mb-1">
                  {t.uploadProof}
                </label>
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E4DCD0] flex items-center justify-between text-xs text-[#80776D]">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#829681]" />
                    <span>{reportAttachment || 'Selected_File.pdf'}</span>
                  </span>
                  <span className="text-[10px] bg-white border border-[#E4DCD0] px-2 py-0.5 rounded">
                    Ready
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F0E8DC]">
                <button
                  type="button"
                  onClick={() =>
                    setActiveReportModal({ open: false, type: 'exam_form', title: '' })
                  }
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#80776D] hover:bg-[#FAF7F2] cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#344C3D] text-white text-xs font-medium hover:bg-[#344C3D]/90 transition-all cursor-pointer"
                >
                  Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
