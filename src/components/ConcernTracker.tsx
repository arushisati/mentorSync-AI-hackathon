import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Concern, ConcernStatus, PriorityLevel, ConcernMessage } from '../types';
import {
  MessageSquare,
  Lock,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  Languages,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  User,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

export const ConcernTracker: React.FC = () => {
  const {
    concerns,
    addConcernMessage,
    updateConcernStatus,
    role,
    currentMentor,
    t,
  } = useApp();

  const [selectedConcernId, setSelectedConcernId] = useState<string>(
    concerns.length > 0 ? concerns[0].id : ''
  );
  const [statusFilter, setStatusFilter] = useState<'all' | ConcernStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | PriorityLevel>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active dialogue form state
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Status updating modal/form state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [nextStatus, setNextStatus] = useState<ConcernStatus>('in_progress');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [nextResolutionSummary, setNextResolutionSummary] = useState('');

  // Toggle between original and translated for each message
  const [messageViewModes, setMessageViewModes] = useState<Record<string, 'original' | 'translated'>>({});

  const selectedConcern = concerns.find(c => c.id === selectedConcernId) || concerns[0];

  const filteredConcerns = concerns.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
    if (
      searchQuery &&
      !c.subject.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.id.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConcern) return;

    setIsSubmittingReply(true);
    try {
      await addConcernMessage(selectedConcern.id, replyText, isInternalNote);
      setReplyText('');
      setIsInternalNote(false);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleSaveStatus = () => {
    if (!selectedConcern) return;
    updateConcernStatus(
      selectedConcern.id,
      nextStatus,
      nextFollowUpDate || selectedConcern.followUpDate,
      nextResolutionSummary || selectedConcern.resolutionSummary
    );
    setShowStatusModal(false);
  };

  const toggleMessageMode = (msgId: string) => {
    setMessageViewModes(prev => ({
      ...prev,
      [msgId]: prev[msgId] === 'original' ? 'translated' : 'original',
    }));
  };

  return (
    <div className="space-y-6">
      {/* Tracker Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#E4DCD0] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-[#829681] uppercase tracking-wider">
                Concern-to-Resolution Life Cycle
              </span>
              <span className="text-xs text-[#80776D]">·</span>
              <span className="text-xs text-[#80776D]">Multilingual Cross-Translation</span>
            </div>
            <h1 className="text-2xl font-bold font-serif text-[#344C3D]">
              Student Concern Resolution Center
            </h1>
            <p className="text-sm text-[#80776D] mt-1 max-w-2xl">
              Mentors receive concerns in English while students communicate in their native language. Internal staff notes remain completely private.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E4DCD0] text-[#344C3D] font-medium">
              Total Concerns: <strong>{concerns.length}</strong>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-[#829681]/15 text-[#344C3D] font-medium">
              Resolved: <strong>{concerns.filter(c => c.status === 'resolved').length}</strong>
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 pt-5 border-t border-[#F0E8DC] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#80776D] font-medium">Status:</span>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                statusFilter === 'all'
                  ? 'bg-[#344C3D] text-white'
                  : 'bg-white border border-[#E4DCD0] text-[#80776D]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('open')}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                statusFilter === 'open'
                  ? 'bg-[#344C3D] text-white'
                  : 'bg-white border border-[#E4DCD0] text-[#80776D]'
              }`}
            >
              Open
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                statusFilter === 'in_progress'
                  ? 'bg-[#344C3D] text-white'
                  : 'bg-white border border-[#E4DCD0] text-[#80776D]'
              }`}
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('awaiting_student')}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                statusFilter === 'awaiting_student'
                  ? 'bg-[#344C3D] text-white'
                  : 'bg-white border border-[#E4DCD0] text-[#80776D]'
              }`}
            >
              Awaiting Student
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('resolved')}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                statusFilter === 'resolved'
                  ? 'bg-[#829681] text-white'
                  : 'bg-white border border-[#E4DCD0] text-[#80776D]'
              }`}
            >
              Resolved
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by ID, student, subject..."
              className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
            />
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Concern List & Selected Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Concern List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {filteredConcerns.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-[#80776D] border border-[#E4DCD0]">
              No concerns matching current filters.
            </div>
          ) : (
            filteredConcerns.map(concern => {
              const isSelected = selectedConcern?.id === concern.id;
              return (
                <div
                  key={concern.id}
                  onClick={() => setSelectedConcernId(concern.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#344C3D] shadow-md ring-1 ring-[#344C3D]'
                      : 'bg-white border-[#E4DCD0] hover:border-[#829681] shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono font-semibold text-[#80776D]">
                      {concern.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        concern.status === 'resolved'
                          ? 'bg-[#829681]/20 text-[#344C3D]'
                          : concern.status === 'awaiting_student'
                          ? 'bg-[#C9826B]/20 text-[#C9826B]'
                          : 'bg-[#F0E8DC] text-[#344C3D]'
                      }`}
                    >
                      {concern.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="font-bold text-xs text-[#344C3D] line-clamp-1">
                    {concern.subject}
                  </h3>

                  <p className="text-[11px] text-[#80776D] line-clamp-2 mt-1">
                    {concern.translatedMessage || concern.originalMessage}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-[#F0E8DC] flex items-center justify-between text-[11px] text-[#80776D]">
                    <span className="font-medium text-[#344C3D]">
                      {concern.studentName} ({concern.studentClassSection})
                    </span>
                    <span className="text-[10px] bg-[#FAF7F2] border border-[#E4DCD0] px-1.5 py-0.5 rounded">
                      Lang: {concern.studentLanguage.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Thread Drawer (8 cols) */}
        {selectedConcern ? (
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E4DCD0] shadow-xs overflow-hidden flex flex-col justify-between">
            {/* Thread Header */}
            <div>
              <div className="p-6 border-b border-[#E4DCD0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 text-xs">
                    <span className="font-mono font-bold text-[#80776D]">
                      {selectedConcern.id}
                    </span>
                    <span>·</span>
                    <span className="text-[#829681] font-semibold uppercase">
                      {selectedConcern.category.replace('_', ' ')}
                    </span>
                    <span>·</span>
                    <span className="text-[#80776D]">
                      Student Language: <strong>{selectedConcern.studentLanguage.toUpperCase()}</strong>
                    </span>
                  </div>
                  <h2 className="text-lg font-bold font-serif text-[#344C3D]">
                    {selectedConcern.subject}
                  </h2>
                  <p className="text-xs text-[#80776D] mt-0.5">
                    Student: <strong>{selectedConcern.studentName}</strong> ({selectedConcern.studentRollNo} - Section {selectedConcern.studentClassSection}) · Mentor: {selectedConcern.mentorName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNextStatus(selectedConcern.status);
                      setNextFollowUpDate(selectedConcern.followUpDate || '');
                      setNextResolutionSummary(selectedConcern.resolutionSummary || '');
                      setShowStatusModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F0E8DC] border border-[#E4DCD0] text-xs font-semibold text-[#344C3D] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Update Status</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Message Stream */}
              <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
                {selectedConcern.messages.map(msg => {
                  const isStudent = msg.senderRole === 'student';
                  const isInternal = msg.isInternalNote;
                  const viewMode = messageViewModes[msg.id] || (isStudent ? 'translated' : 'original');

                  if (isInternal) {
                    return (
                      <div
                        key={msg.id}
                        className="p-4 rounded-xl bg-[#F0E8DC]/60 border border-[#C9826B]/30 text-xs text-[#373833]"
                      >
                        <div className="flex items-center gap-2 text-[#C9826B] font-bold text-[11px] mb-1">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Internal Staff Note · Hidden from student</span>
                          <span className="text-[#80776D] font-normal ml-auto">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="leading-relaxed">{msg.textOriginal}</p>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isStudent ? 'items-start' : 'items-end'
                      }`}
                    >
                      <div className="text-[11px] text-[#80776D] mb-1 px-1 flex items-center gap-2">
                        <span className="font-semibold text-[#344C3D]">
                          {msg.senderName} ({msg.senderRole.toUpperCase()})
                        </span>
                        <span>·</span>
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed ${
                          isStudent
                            ? 'bg-[#FAF7F2] border border-[#E4DCD0] text-[#373833] rounded-tl-sm'
                            : 'bg-[#344C3D] text-white rounded-tr-sm shadow-xs'
                        }`}
                      >
                        {/* If student submitted in native language, allow toggling English translation */}
                        {isStudent && msg.textTranslated ? (
                          <div>
                            <p className="text-xs">
                              {viewMode === 'translated' ? msg.textTranslated : msg.textOriginal}
                            </p>
                            <div className="mt-2 pt-2 border-t border-[#E4DCD0] flex items-center justify-between text-[10px] text-[#80776D]">
                              <span className="flex items-center gap-1 text-[#829681] font-medium">
                                <Sparkles className="w-3 h-3" />
                                <span>{viewMode === 'translated' ? 'English Translation' : `Original (${msg.originalLanguage.toUpperCase()})`}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleMessageMode(msg.id)}
                                className="underline hover:text-[#344C3D] cursor-pointer"
                              >
                                {viewMode === 'translated' ? 'View Original Words' : 'View English Translation'}
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
            </div>

            {/* Mentor Reply & Internal Note Composer */}
            <div className="p-4 bg-[#FAF7F2]/60 border-t border-[#E4DCD0]">
              <form onSubmit={handleSendReply} className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[#344C3D] font-medium">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={e => setIsInternalNote(e.target.checked)}
                        className="rounded border-[#E4DCD0] text-[#344C3D] focus:ring-[#829681]"
                      />
                      <span>Internal Faculty Note (Hidden from Student)</span>
                    </label>
                  </div>
                  {!isInternalNote && (
                    <span className="text-[11px] text-[#829681] flex items-center gap-1">
                      <Languages className="w-3.5 h-3.5" />
                      <span>Will auto-translate to {selectedConcern.studentLanguage.toUpperCase()} for student</span>
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    required
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={
                      isInternalNote
                        ? 'Add internal administrative note or consultation details...'
                        : 'Reply to student in English (automatically translated to student\'s native tongue)...'
                    }
                    className="flex-1 px-3.5 py-2.5 text-xs bg-white border border-[#E4DCD0] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#829681]"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingReply}
                    className={`px-5 rounded-xl text-xs font-semibold text-white transition-all flex items-center gap-1.5 cursor-pointer ${
                      isInternalNote
                        ? 'bg-[#C9826B] hover:bg-[#C9826B]/90'
                        : 'bg-[#344C3D] hover:bg-[#344C3D]/90'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingReply ? 'Sending...' : 'Post'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-white rounded-2xl p-12 text-center text-xs text-[#80776D] border border-[#E4DCD0]">
            Select a concern from the left to view the complete resolution thread.
          </div>
        )}
      </div>

      {/* MODAL: Update Status & Document Resolution */}
      {showStatusModal && selectedConcern && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E4DCD0] shadow-xl p-5 space-y-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#344C3D]">
                Update Concern Status
              </h3>
              <p className="text-xs text-[#80776D]">
                {selectedConcern.id} · {selectedConcern.studentName}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344C3D] mb-1">
                Progress Status
              </label>
              <select
                value={nextStatus}
                onChange={e => setNextStatus(e.target.value as ConcernStatus)}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
              >
                <option value="open">Open (Initial Review)</option>
                <option value="in_progress">In Progress (Active Investigation)</option>
                <option value="awaiting_student">Awaiting Student Response</option>
                <option value="resolved">Resolved (Complete Resolution)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344C3D] mb-1">
                Scheduled Follow-up Date (Optional)
              </label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={e => setNextFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
              />
            </div>

            {nextStatus === 'resolved' && (
              <div>
                <label className="block text-xs font-semibold text-[#344C3D] mb-1">
                  Resolution Documentation Summary
                </label>
                <textarea
                  rows={3}
                  required
                  value={nextResolutionSummary}
                  onChange={e => setNextResolutionSummary(e.target.value)}
                  placeholder="Document how this concern was resolved for institutional audits..."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
                />
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 border-t border-[#F0E8DC]">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-[#80776D] hover:bg-[#FAF7F2]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                className="px-5 py-2 rounded-xl bg-[#344C3D] text-white text-xs font-semibold hover:bg-[#344C3D]/90"
              >
                Save Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
