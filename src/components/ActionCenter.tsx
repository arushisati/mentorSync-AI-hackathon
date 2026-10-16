import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PriorityLevel, RequirementType, Student, CompletionReport } from '../types';
import {
  CheckSquare,
  FileCheck,
  Send,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Plus,
  Mail,
  MessageSquare,
  Filter,
  Check,
  History
} from 'lucide-react';

export const ActionCenter: React.FC = () => {
  const {
    students,
    followUps,
    reminders,
    reviewCompletionReport,
    addFollowUpTask,
    toggleFollowUpTask,
    recordReminder,
    currentMentor,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'verification' | 'tasks' | 'reminders'>('verification');

  // Rejection modal state
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    studentId: string;
    reportId: string;
    studentName: string;
    reason: string;
  }>({
    open: false,
    studentId: '',
    reportId: '',
    studentName: '',
    reason: '',
  });

  // Create Task modal state
  const [createTaskModal, setCreateTaskModal] = useState(false);
  const [taskStudentId, setTaskStudentId] = useState(students[0]?.id || '');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('2026-10-25');
  const [taskPriority, setTaskPriority] = useState<PriorityLevel>('medium');

  // Outcome note modal
  const [outcomeModal, setOutcomeModal] = useState<{
    open: boolean;
    taskId: string;
    taskTitle: string;
    note: string;
  }>({
    open: false,
    taskId: '',
    taskTitle: '',
    note: '',
  });

  // Collect all student completion reports
  const allReports: { student: Student; report: CompletionReport }[] = [];
  students.forEach(s => {
    (s.completionReports || []).forEach(r => {
      allReports.push({ student: s, report: r });
    });
  });

  const pendingReports = allReports.filter(item => item.report.status === 'pending_review');
  const reviewedReports = allReports.filter(item => item.report.status !== 'pending_review');

  const handleVerify = (studentId: string, reportId: string) => {
    reviewCompletionReport(studentId, reportId, 'verified');
  };

  const handleConfirmReject = () => {
    if (!rejectModal.reason.trim()) return;
    reviewCompletionReport(
      rejectModal.studentId,
      rejectModal.reportId,
      'rejected',
      rejectModal.reason
    );
    setRejectModal({ open: false, studentId: '', reportId: '', studentName: '', reason: '' });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskStudentId) return;

    addFollowUpTask(taskStudentId, taskTitle, taskDueDate, taskPriority);
    setTaskTitle('');
    setCreateTaskModal(false);
  };

  const handleSaveOutcome = () => {
    if (!outcomeModal.taskId) return;
    toggleFollowUpTask(outcomeModal.taskId, outcomeModal.note);
    setOutcomeModal({ open: false, taskId: '', taskTitle: '', note: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#E4DCD0] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-[#829681] uppercase tracking-wider">
                Accountability & Verification
              </span>
              <span className="text-xs text-[#80776D]">·</span>
              <span className="text-xs text-[#80776D]">Centralized Operational Hub</span>
            </div>
            <h1 className="text-2xl font-bold font-serif text-[#344C3D]">
              Smart Follow-up Action Center
            </h1>
            <p className="text-sm text-[#80776D] mt-1 max-w-2xl">
              Verify student completion submissions, manage assigned institutional follow-ups, and review simulated reminder delivery records.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setCreateTaskModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#344C3D] text-white text-xs font-semibold hover:bg-[#344C3D]/90 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Follow-up Task</span>
            </button>
          </div>
        </div>

        {/* Action Center Tabs */}
        <div className="mt-6 pt-5 border-t border-[#F0E8DC] flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('verification')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'verification'
                ? 'bg-[#344C3D] text-white shadow-xs'
                : 'text-[#80776D] hover:text-[#373833] hover:bg-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Verification Queue ({pendingReports.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'tasks'
                ? 'bg-[#344C3D] text-white shadow-xs'
                : 'text-[#80776D] hover:text-[#373833] hover:bg-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Follow-up Tasks ({followUps.filter(f => !f.completed).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reminders')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'reminders'
                ? 'bg-[#344C3D] text-white shadow-xs'
                : 'text-[#80776D] hover:text-[#373833] hover:bg-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Reminder Audit Log ({reminders.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: VERIFICATION QUEUE */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          {pendingReports.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-xs text-[#80776D] border border-[#E4DCD0]">
              <FileCheck className="w-8 h-8 text-[#829681] mx-auto mb-2 opacity-60" />
              <p className="font-bold text-[#344C3D]">All Student Reports Verified</p>
              <p className="mt-1">No pending examination, sessional, or fee receipts awaiting faculty review.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E4DCD0] shadow-xs overflow-hidden">
              <div className="p-4 bg-[#FAF7F2]/60 border-b border-[#E4DCD0] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#344C3D]">
                  Pending Reports Awaiting Verification ({pendingReports.length})
                </span>
                <span className="text-[11px] text-[#80776D]">
                  Approving updates the student's official institutional requirement status.
                </span>
              </div>

              <div className="divide-y divide-[#F0E8DC]">
                {pendingReports.map(({ student, report }) => (
                  <div
                    key={report.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF7F2]/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1 text-xs">
                        <span className="font-bold text-[#344C3D]">{student.name}</span>
                        <span className="text-[#80776D]">({student.rollNo} - {student.classSection})</span>
                        <span className="text-[#80776D]">·</span>
                        <span className="text-[10px] uppercase font-bold text-[#829681] px-2 py-0.5 rounded bg-[#829681]/15">
                          {report.requirementType.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#344C3D]">
                        {report.title}
                      </h4>
                      <p className="text-xs text-[#80776D] mt-1">
                        Proof: {report.proofDetails}
                      </p>
                      {report.attachmentName && (
                        <p className="text-[11px] text-[#829681] mt-1 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Attached Document: {report.attachmentName}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setRejectModal({
                            open: true,
                            studentId: student.id,
                            reportId: report.id,
                            studentName: student.name,
                            reason: '',
                          })
                        }
                        className="px-3.5 py-2 rounded-xl border border-[#C9826B]/30 bg-white hover:bg-[#C9826B]/10 text-xs font-medium text-[#C9826B] transition-colors cursor-pointer"
                      >
                        {t.actionReject}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVerify(student.id, report.id)}
                        className="px-4 py-2 rounded-xl bg-[#344C3D] hover:bg-[#344C3D]/90 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.actionVerify}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical Reviewed Reports */}
          {reviewedReports.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E4DCD0] shadow-xs p-5">
              <h3 className="text-xs font-semibold text-[#80776D] uppercase tracking-wider mb-3">
                Recently Processed Reports ({reviewedReports.length})
              </h3>
              <div className="space-y-2">
                {reviewedReports.map(({ student, report }) => (
                  <div
                    key={report.id}
                    className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E4DCD0] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#344C3D]">{student.name}</span>
                      <span className="text-[#80776D] ml-2">({report.title})</span>
                      {report.rejectionReason && (
                        <p className="text-[11px] text-[#C9826B] mt-0.5">Reason: {report.rejectionReason}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        report.status === 'verified'
                          ? 'bg-[#829681]/20 text-[#344C3D]'
                          : 'bg-[#C9826B]/20 text-[#C9826B]'
                      }`}
                    >
                      {report.status === 'verified' ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FOLLOW-UP TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E4DCD0] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#FAF7F2]/60 border-b border-[#E4DCD0] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#344C3D]">
                Assigned Follow-up Task Queue
              </span>
              <button
                type="button"
                onClick={() => setCreateTaskModal(true)}
                className="text-xs font-semibold text-[#829681] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            <div className="divide-y divide-[#F0E8DC]">
              {followUps.map(task => {
                const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;

                return (
                  <div
                    key={task.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      task.completed ? 'bg-[#FAF7F2]/50 opacity-70' : 'hover:bg-[#FAF7F2]/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => {
                          if (!task.completed) {
                            setOutcomeModal({
                              open: true,
                              taskId: task.id,
                              taskTitle: task.title,
                              note: '',
                            });
                          } else {
                            toggleFollowUpTask(task.id);
                          }
                        }}
                        className="mt-1 rounded border-[#E4DCD0] text-[#344C3D] focus:ring-[#829681] cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5 text-xs">
                          <span className="font-semibold text-[#344C3D]">{task.studentName}</span>
                          <span className="text-[#80776D]">·</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                              task.priority === 'urgent'
                                ? 'bg-[#C9826B]/20 text-[#C9826B]'
                                : 'bg-[#F0E8DC] text-[#344C3D]'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span className="text-[#80776D]">·</span>
                          <span className={`text-[11px] ${isOverdue ? 'text-[#C9826B] font-bold' : 'text-[#80776D]'}`}>
                            Due: {task.dueDate} {isOverdue && '(OVERDUE)'}
                          </span>
                        </div>
                        <p className={`text-xs ${task.completed ? 'line-through text-[#80776D]' : 'text-[#373833]'}`}>
                          {task.title}
                        </p>
                        {task.outcomeNotes && (
                          <p className="text-[11px] text-[#829681] mt-1 font-medium">
                            Outcome Log: "{task.outcomeNotes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-[#80776D] shrink-0">
                      Assigned: {task.mentorName}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REMINDER AUDIT LOG */}
      {activeTab === 'reminders' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E4DCD0] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#FAF7F2]/60 border-b border-[#E4DCD0] flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#344C3D]">
                  Institutional Audit Trail: Simulated Reminder Dispatches
                </span>
                <p className="text-[11px] text-[#80776D] mt-0.5">
                  Complies with system integrity standards: Dispatches are recorded locally in the audit log.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#80776D] uppercase text-[10px] tracking-wider border-b border-[#E4DCD0]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Recipient Student</th>
                    <th className="py-3 px-3 font-semibold">Channel</th>
                    <th className="py-3 px-4 font-semibold">Message Content</th>
                    <th className="py-3 px-3 font-semibold">Dispatch Timestamp</th>
                    <th className="py-3 px-3 font-semibold">Audit Delivery Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E8DC]">
                  {reminders.map(rem => (
                    <tr key={rem.id} className="hover:bg-[#FAF7F2]/80">
                      <td className="py-3 px-4 font-semibold text-[#344C3D]">
                        <div>{rem.studentName}</div>
                        <span className="text-[10px] text-[#80776D] font-mono">{rem.studentRollNo}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-[#F0E8DC] text-[#344C3D] font-mono font-bold text-[10px] uppercase">
                          {rem.channel}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-sm text-[#80776D] text-[11px] leading-snug">
                        {rem.messageContent}
                      </td>
                      <td className="py-3 px-3 text-[#80776D] font-mono text-[11px]">
                        {new Date(rem.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#829681] bg-[#829681]/15 px-2 py-0.5 rounded">
                          <Check className="w-3 h-3" />
                          <span>Simulated Delivered</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reject Completion Report */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E4DCD0] shadow-xl p-5 space-y-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#C9826B]">
                Request Resubmission
              </h3>
              <p className="text-xs text-[#80776D]">
                Student: {rejectModal.studentName}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344C3D] mb-1">
                Reason for Rejection / Instructions
              </label>
              <textarea
                rows={3}
                required
                value={rejectModal.reason}
                onChange={e =>
                  setRejectModal(prev => ({ ...prev, reason: e.target.value }))
                }
                placeholder="e.g. Transaction ID was illegible, please upload the stamped bank receipt..."
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#F0E8DC]">
              <button
                type="button"
                onClick={() =>
                  setRejectModal({
                    open: false,
                    studentId: '',
                    reportId: '',
                    studentName: '',
                    reason: '',
                  })
                }
                className="px-4 py-2 rounded-xl text-xs text-[#80776D] hover:bg-[#FAF7F2]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl bg-[#C9826B] text-white text-xs font-semibold hover:bg-[#C9826B]/90"
              >
                Send Rejection Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create Follow-up Task */}
      {createTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E4DCD0] shadow-xl p-5 space-y-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#344C3D]">
                Schedule Follow-up Task
              </h3>
              <p className="text-xs text-[#80776D]">
                Assigned to: {currentMentor?.name || 'Mentor'}
              </p>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#344C3D] mb-1">
                  Target Student
                </label>
                <select
                  value={taskStudentId}
                  onChange={e => setTaskStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.rollNo} - {s.classSection})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344C3D] mb-1">
                  Task Title / Action Item
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="e.g. Verify fee receipt with bursar's office..."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#344C3D] mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={e => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#344C3D] mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#F0E8DC]">
                <button
                  type="button"
                  onClick={() => setCreateTaskModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#80776D] hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#344C3D] text-white text-xs font-semibold hover:bg-[#344C3D]/90"
                >
                  Schedule Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Outcome Note on Task Complete */}
      {outcomeModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E4DCD0] shadow-xl p-5 space-y-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#344C3D]">
                Complete Follow-up Task
              </h3>
              <p className="text-xs text-[#80776D]">
                Task: {outcomeModal.taskTitle}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344C3D] mb-1">
                Document Resolution Outcome
              </label>
              <textarea
                rows={3}
                value={outcomeModal.note}
                onChange={e =>
                  setOutcomeModal(prev => ({ ...prev, note: e.target.value }))
                }
                placeholder="e.g. Student submitted receipt in person; accounts approved fee clearance."
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#F0E8DC]">
              <button
                type="button"
                onClick={() =>
                  setOutcomeModal({ open: false, taskId: '', taskTitle: '', note: '' })
                }
                className="px-4 py-2 rounded-xl text-xs text-[#80776D] hover:bg-[#FAF7F2]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOutcome}
                className="px-5 py-2 rounded-xl bg-[#344C3D] text-white text-xs font-semibold hover:bg-[#344C3D]/90"
              >
                Confirm Completion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
