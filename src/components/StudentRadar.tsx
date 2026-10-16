import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Student, PriorityLevel, InstitutionAlert } from '../types';
import {
  Radar,
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle,
  Filter,
  Send,
  Calendar,
  UserCheck,
  ChevronRight,
  Search,
  Check
} from 'lucide-react';

export const StudentRadar: React.FC = () => {
  const { students, teachers, concerns, recordReminder, addFollowUpTask, t } = useApp();

  const [selectedProgramme, setSelectedProgramme] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedMentor, setSelectedMentor] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reminder dispatch modal state
  const [reminderModal, setReminderModal] = useState<{
    open: boolean;
    student: Student | null;
    alert: InstitutionAlert | null;
    channel: 'email' | 'sms' | 'portal_alert';
    message: string;
  }>({
    open: false,
    student: null,
    alert: null,
    channel: 'email',
    message: '',
  });

  const [reminderSuccess, setReminderSuccess] = useState(false);

  // Generate transparent alert matrix based on actual student state
  const alerts: InstitutionAlert[] = useMemo(() => {
    const list: InstitutionAlert[] = [];

    students.forEach(student => {
      // 1. Examination form alert
      if (student.examFormStatus === 'overdue') {
        list.push({
          id: `alt-exam-od-${student.id}`,
          studentId: student.id,
          studentName: student.name,
          studentRollNo: student.rollNo,
          programme: student.programme,
          semester: student.semester,
          classSection: student.classSection,
          mentorName: student.mentorName || 'Unassigned',
          type: 'exam_form',
          priority: 'critical',
          reason: `Examination form submission deadline has elapsed (${student.examFormDeadline}). Risk of registration debarment.`,
          deadline: student.examFormDeadline,
          responsiblePerson: student.mentorName || 'Faculty Mentor',
          recommendedAction: 'Direct personal outreach and assist with university examination portal clearance.',
        });
      } else if (student.examFormStatus === 'pending') {
        list.push({
          id: `alt-exam-pend-${student.id}`,
          studentId: student.id,
          studentName: student.name,
          studentRollNo: student.rollNo,
          programme: student.programme,
          semester: student.semester,
          classSection: student.classSection,
          mentorName: student.mentorName || 'Unassigned',
          type: 'exam_form',
          priority: 'medium',
          reason: `Exam form registration pending. Due on ${student.examFormDeadline}.`,
          deadline: student.examFormDeadline,
          responsiblePerson: student.mentorName || 'Faculty Mentor',
          recommendedAction: 'Send automated compliance reminder with step-by-step registration instructions.',
        });
      }

      // 2. Fee status alert
      if (student.feeStatus === 'pending') {
        list.push({
          id: `alt-fee-pend-${student.id}`,
          studentId: student.id,
          studentName: student.name,
          studentRollNo: student.rollNo,
          programme: student.programme,
          semester: student.semester,
          classSection: student.classSection,
          mentorName: student.mentorName || 'Unassigned',
          type: 'fee_pending',
          priority: 'high',
          reason: `Tuition dues total ₹${student.feeTotalAmount.toLocaleString()} unpaid. Due on ${student.feeDeadline}.`,
          deadline: student.feeDeadline,
          responsiblePerson: 'Accounts Office & Mentor',
          recommendedAction: 'Check if student requires installment schedule or scholarship hardship documentation.',
        });
      } else if (student.feeStatus === 'partly_paid') {
        const remaining = student.feeTotalAmount - student.feePaidAmount;
        list.push({
          id: `alt-fee-part-${student.id}`,
          studentId: student.id,
          studentName: student.name,
          studentRollNo: student.rollNo,
          programme: student.programme,
          semester: student.semester,
          classSection: student.classSection,
          mentorName: student.mentorName || 'Unassigned',
          type: 'fee_pending',
          priority: 'medium',
          reason: `Partial payment received (₹${student.feePaidAmount.toLocaleString()}). Remaining balance ₹${remaining.toLocaleString()} due on ${student.feeDeadline}.`,
          deadline: student.feeDeadline,
          responsiblePerson: 'Accounts Office',
          recommendedAction: 'Monitor agreed installment timeline and record payment receipt once submitted.',
        });
      }

      // 3. Sessional status alert
      if (student.sessionalStatus === 'pending') {
        list.push({
          id: `alt-sess-${student.id}`,
          studentId: student.id,
          studentName: student.name,
          studentRollNo: student.rollNo,
          programme: student.programme,
          semester: student.semester,
          classSection: student.classSection,
          mentorName: student.mentorName || 'Unassigned',
          type: 'sessional',
          priority: 'medium',
          reason: `Continuous assessment rubrics or mid-term test missing. Due by ${student.sessionalDeadline}.`,
          deadline: student.sessionalDeadline,
          responsiblePerson: student.mentorName || 'Course Instructor',
          recommendedAction: 'Review attendance records and verify if make-up assessment is required.',
        });
      }

      // 4. Uninformed Directives alert
      if (!student.informedStatus) {
        list.push({
          id: `alt-info-${student.id}`,
          studentId: student.id,
          studentName: student.name,
          studentRollNo: student.rollNo,
          programme: student.programme,
          semester: student.semester,
          classSection: student.classSection,
          mentorName: student.mentorName || 'Unassigned',
          type: 'uninformed',
          priority: 'low',
          reason: 'Student has not yet acknowledged official academic directives and examination regulations.',
          deadline: 'Immediate',
          responsiblePerson: student.mentorName || 'Administration',
          recommendedAction: 'Prompt student via student portal alert to confirm guideline acknowledgement.',
        });
      }

      // 5. Open urgent concerns
      const openUrgentConcerns = concerns.filter(
        c => c.studentId === student.id && c.status !== 'resolved' && (c.priority === 'urgent' || c.priority === 'high')
      );
      if (openUrgentConcerns.length > 0) {
        list.push({
          id: `alt-cnc-${student.id}`,
          studentId: student.id,
          studentName: student.name,
          studentRollNo: student.rollNo,
          programme: student.programme,
          semester: student.semester,
          classSection: student.classSection,
          mentorName: student.mentorName || 'Unassigned',
          type: 'urgent_concern',
          priority: 'critical',
          reason: `Unresolved high-priority student concern: "${openUrgentConcerns[0].subject}"`,
          deadline: 'Within 24 Hours',
          responsiblePerson: student.mentorName || 'Faculty Mentor',
          recommendedAction: 'Review translated concern thread and respond with administrative resolution.',
        });
      }
    });

    return list;
  }, [students, concerns]);

  // Unique options for filters
  const programmes = Array.from(new Set(students.map(s => s.programme)));
  const semesters = Array.from(new Set(students.map(s => s.semester.toString())));
  const sections = Array.from(new Set(students.map(s => s.classSection)));
  const mentorNames = Array.from(new Set(teachers.map(t => t.name)));

  // Filtered alerts
  const filteredAlerts = alerts.filter(a => {
    if (selectedProgramme !== 'all' && a.programme !== selectedProgramme) return false;
    if (selectedSemester !== 'all' && a.semester.toString() !== selectedSemester) return false;
    if (selectedSection !== 'all' && a.classSection !== selectedSection) return false;
    if (selectedMentor !== 'all' && a.mentorName !== selectedMentor) return false;
    if (selectedPriority !== 'all' && a.priority !== selectedPriority) return false;
    if (
      searchQuery &&
      !a.studentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !a.studentRollNo.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !a.reason.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleOpenReminder = (alert: InstitutionAlert) => {
    const student = students.find(s => s.id === alert.studentId) || null;
    const defaultMsg = `Dear ${alert.studentName} (${alert.studentRollNo}), MentorSync Alert: ${alert.reason} Please take the necessary action: ${alert.recommendedAction}`;
    setReminderModal({
      open: true,
      student,
      alert,
      channel: 'email',
      message: defaultMsg,
    });
  };

  const handleSendReminder = async () => {
    if (!reminderModal.student || !reminderModal.alert) return;

    await recordReminder(
      reminderModal.student.id,
      reminderModal.alert.type,
      reminderModal.channel,
      reminderModal.message
    );

    setReminderSuccess(true);
    setTimeout(() => {
      setReminderSuccess(false);
      setReminderModal({
        open: false,
        student: null,
        alert: null,
        channel: 'email',
        message: '',
      });
    }, 1200);
  };

  const handleCreateFollowup = (alert: InstitutionAlert) => {
    addFollowUpTask(
      alert.studentId,
      `Follow-up regarding: ${alert.reason}`,
      alert.deadline !== 'Immediate' && alert.deadline !== 'Within 24 Hours' ? alert.deadline : '2026-10-25',
      alert.priority === 'critical' ? 'urgent' : alert.priority === 'high' ? 'high' : 'medium'
    );
    window.alert(`Follow-up task created in Action Center for ${alert.studentName}.`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Overview */}
      <div className="bg-white rounded-2xl p-6 border border-[#E4DCD0] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-[#829681] uppercase tracking-wider">
                Early Intervention System
              </span>
              <span className="text-xs text-[#80776D]">·</span>
              <span className="text-xs text-[#80776D]">Objective Academic Metrics</span>
            </div>
            <h1 className="text-2xl font-bold font-serif text-[#344C3D]">
              {t.radarTitle}
            </h1>
            <p className="text-sm text-[#80776D] mt-1 max-w-2xl">
              {t.radarSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E4DCD0] text-[#344C3D] font-medium">
              Active Alerts: <strong>{filteredAlerts.length}</strong>
            </span>
          </div>
        </div>

        {/* Priority Counts Grid */}
        <div className="mt-6 pt-5 border-t border-[#F0E8DC] grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-[#C9826B]/10 border border-[#C9826B]/30">
            <span className="text-[11px] font-semibold text-[#C9826B] uppercase">Critical Alerts</span>
            <p className="text-xl font-bold font-serif text-[#C9826B] mt-0.5">
              {alerts.filter(a => a.priority === 'critical').length}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E4DCD0]">
            <span className="text-[11px] font-semibold text-[#80776D] uppercase">High Priority</span>
            <p className="text-xl font-bold font-serif text-[#344C3D] mt-0.5">
              {alerts.filter(a => a.priority === 'high').length}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E4DCD0]">
            <span className="text-[11px] font-semibold text-[#80776D] uppercase">Medium Priority</span>
            <p className="text-xl font-bold font-serif text-[#344C3D] mt-0.5">
              {alerts.filter(a => a.priority === 'medium').length}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E4DCD0]">
            <span className="text-[11px] font-semibold text-[#829681] uppercase">Low Priority</span>
            <p className="text-xl font-bold font-serif text-[#344C3D] mt-0.5">
              {alerts.filter(a => a.priority === 'low').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Matrix & Search */}
      <div className="bg-white rounded-2xl p-5 border border-[#E4DCD0] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Programme */}
          <select
            value={selectedProgramme}
            onChange={e => setSelectedProgramme(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
          >
            <option value="all">All Programmes</option>
            {programmes.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Semester */}
          <select
            value={selectedSemester}
            onChange={e => setSelectedSemester(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
          >
            <option value="all">All Semesters</option>
            {semesters.map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>

          {/* Section */}
          <select
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
          >
            <option value="all">All Sections</option>
            {sections.map(sec => (
              <option key={sec} value={sec}>Section {sec}</option>
            ))}
          </select>

          {/* Mentor */}
          <select
            value={selectedMentor}
            onChange={e => setSelectedMentor(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
          >
            <option value="all">All Faculty Mentors</option>
            {mentorNames.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search student name, roll number, or reason..."
              className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
            />
          </div>

          {(selectedProgramme !== 'all' || selectedSemester !== 'all' || selectedSection !== 'all' || selectedMentor !== 'all' || selectedPriority !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedProgramme('all');
                setSelectedSemester('all');
                setSelectedSection('all');
                setSelectedMentor('all');
                setSelectedPriority('all');
                setSearchQuery('');
              }}
              className="text-xs text-[#C9826B] hover:underline px-2 py-1"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Alerts Matrix Table */}
      <div className="bg-white rounded-2xl border border-[#E4DCD0] shadow-xs overflow-hidden">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-[#80776D] text-xs">
            No student alerts matching current filters. All requirements in order!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#80776D] uppercase text-[10px] tracking-wider border-b border-[#E4DCD0]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Priority & Student</th>
                  <th className="py-3 px-3 font-semibold">Class Section</th>
                  <th className="py-3 px-4 font-semibold">Reason for Alert</th>
                  <th className="py-3 px-3 font-semibold">Deadline</th>
                  <th className="py-3 px-4 font-semibold">Responsible & Recommended Action</th>
                  <th className="py-3 px-4 font-semibold text-right">Intervention Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E8DC]">
                {filteredAlerts.map(alert => {
                  const isCritical = alert.priority === 'critical';
                  const isHigh = alert.priority === 'high';

                  return (
                    <tr
                      key={alert.id}
                      className={`hover:bg-[#FAF7F2]/80 transition-colors ${
                        isCritical ? 'bg-[#C9826B]/5' : ''
                      }`}
                    >
                      {/* Priority & Student */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isCritical
                                ? 'bg-[#C9826B]/20 text-[#C9826B]'
                                : isHigh
                                ? 'bg-[#F0E8DC] text-[#344C3D]'
                                : 'bg-[#FAF7F2] text-[#80776D] border border-[#E4DCD0]'
                            }`}
                          >
                            {alert.priority}
                          </span>
                        </div>
                        <div className="font-bold text-[#344C3D]">{alert.studentName}</div>
                        <div className="text-[10px] text-[#80776D] font-mono">{alert.studentRollNo}</div>
                      </td>

                      {/* Class Section */}
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-[#F0E8DC] text-[#344C3D] font-semibold text-[11px]">
                          {alert.classSection}
                        </span>
                        <div className="text-[10px] text-[#80776D] mt-0.5">Sem {alert.semester}</div>
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-[11px] font-medium text-[#344C3D] leading-snug">
                          {alert.reason}
                        </p>
                      </td>

                      {/* Deadline */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono text-[11px] text-[#C9826B] font-semibold">
                          {alert.deadline}
                        </span>
                      </td>

                      {/* Responsible & Recommended Action */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="text-[11px] font-semibold text-[#829681]">
                          Owner: {alert.responsiblePerson}
                        </div>
                        <p className="text-[11px] text-[#80776D] mt-0.5 leading-snug">
                          {alert.recommendedAction}
                        </p>
                      </td>

                      {/* Intervention Quick Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenReminder(alert)}
                            className="px-2.5 py-1.5 rounded-lg border border-[#E4DCD0] bg-white hover:bg-[#FAF7F2] text-xs font-medium text-[#344C3D] transition-colors flex items-center gap-1 cursor-pointer"
                            title="Dispatch simulated reminder email/SMS"
                          >
                            <Send className="w-3 h-3 text-[#829681]" />
                            <span>Remind</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCreateFollowup(alert)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#344C3D] text-white hover:bg-[#344C3D]/90 text-xs font-medium transition-colors cursor-pointer"
                            title="Create Follow-up task in Action Center"
                          >
                            <span>Follow-up</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Record Simulated Reminder */}
      {reminderModal.open && reminderModal.student && reminderModal.alert && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E4DCD0] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#E4DCD0] flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#344C3D]">
                  {t.actionSendReminder}
                </h3>
                <p className="text-xs text-[#80776D]">
                  To: {reminderModal.student.name} ({reminderModal.student.rollNo})
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setReminderModal({
                    open: false,
                    student: null,
                    alert: null,
                    channel: 'email',
                    message: '',
                  })
                }
                className="text-[#80776D] hover:text-[#373833] text-sm p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Channel Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#344C3D] mb-1">
                  Dispatch Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setReminderModal(prev => ({ ...prev, channel: 'email' }))
                    }
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium border text-center ${
                      reminderModal.channel === 'email'
                        ? 'bg-[#344C3D] text-white border-[#344C3D]'
                        : 'bg-[#FAF7F2] border-[#E4DCD0] text-[#80776D]'
                    }`}
                  >
                    Email Notice
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReminderModal(prev => ({ ...prev, channel: 'sms' }))
                    }
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium border text-center ${
                      reminderModal.channel === 'sms'
                        ? 'bg-[#344C3D] text-white border-[#344C3D]'
                        : 'bg-[#FAF7F2] border-[#E4DCD0] text-[#80776D]'
                    }`}
                  >
                    SMS Alert
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReminderModal(prev => ({ ...prev, channel: 'portal_alert' }))
                    }
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium border text-center ${
                      reminderModal.channel === 'portal_alert'
                        ? 'bg-[#344C3D] text-white border-[#344C3D]'
                        : 'bg-[#FAF7F2] border-[#E4DCD0] text-[#80776D]'
                    }`}
                  >
                    Portal Banner
                  </button>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-xs font-semibold text-[#344C3D] mb-1">
                  Reminder Message Template
                </label>
                <textarea
                  rows={4}
                  value={reminderModal.message}
                  onChange={e =>
                    setReminderModal(prev => ({ ...prev, message: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
                />
              </div>

              {/* Simulated Delivery Disclaimer */}
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E4DCD0] text-[11px] text-[#80776D]">
                <p className="font-semibold text-[#344C3D] mb-0.5">Audit Log Entry</p>
                {t.simulatedNotificationNote}
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F0E8DC]">
                <button
                  type="button"
                  onClick={() =>
                    setReminderModal({
                      open: false,
                      student: null,
                      alert: null,
                      channel: 'email',
                      message: '',
                    })
                  }
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#80776D] hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendReminder}
                  className="px-5 py-2 rounded-xl bg-[#344C3D] text-white text-xs font-medium hover:bg-[#344C3D]/90 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {reminderSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Logged to Audit Trail</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Record & Dispatch</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
