import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { StudentPortal } from './components/StudentPortal';
import { MentorMatchEngine } from './components/MentorMatchEngine';
import { StudentRadar } from './components/StudentRadar';
import { ConcernTracker } from './components/ConcernTracker';
import { ActionCenter } from './components/ActionCenter';
import { InstitutionInsights } from './components/InstitutionInsights';
import {
  Sparkles,
  Users,
  Radar,
  MessageSquare,
  CheckSquare,
  BarChart3,
  GraduationCap,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { role, currentMentor, students, concerns, isRtl, t } = useApp();

  // Navigation state for Mentor and Admin roles
  const [adminTab, setAdminTab] = useState<'match' | 'radar' | 'action' | 'concerns' | 'insights'>('match');
  const [mentorTab, setMentorTab] = useState<'mentees' | 'concerns' | 'action' | 'radar'>('mentees');

  // Filter students assigned to the active mentor
  const mentorMentees = students.filter(s => s.mentorId === currentMentor?.id);

  return (
    <div className={`min-h-screen bg-[#FAF7F2] text-[#373833] flex flex-col font-sans ${isRtl ? 'rtl' : 'ltr'}`}>
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Role Navigation Bar for Admin and Mentor */}
        {role === 'admin' && (
          <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-[#E4DCD0] pb-3">
            <button
              type="button"
              onClick={() => setAdminTab('match')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === 'match'
                  ? 'bg-[#344C3D] text-white shadow-xs'
                  : 'text-[#80776D] hover:text-[#373833] hover:bg-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#829681]" />
              <span>Smart MentorMatch AI</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('radar')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === 'radar'
                  ? 'bg-[#344C3D] text-white shadow-xs'
                  : 'text-[#80776D] hover:text-[#373833] hover:bg-white'
              }`}
            >
              <Radar className="w-3.5 h-3.5" />
              <span>Support Radar</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('action')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === 'action'
                  ? 'bg-[#344C3D] text-white shadow-xs'
                  : 'text-[#80776D] hover:text-[#373833] hover:bg-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Action Center</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('concerns')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === 'concerns'
                  ? 'bg-[#344C3D] text-white shadow-xs'
                  : 'text-[#80776D] hover:text-[#373833] hover:bg-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Concern Tracker ({concerns.filter(c => c.status !== 'resolved').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('insights')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === 'insights'
                  ? 'bg-[#344C3D] text-white shadow-xs'
                  : 'text-[#80776D] hover:text-[#373833] hover:bg-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Institution Insights</span>
            </button>
          </div>
        )}

        {role === 'mentor' && (
          <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-[#E4DCD0] pb-3">
            <button
              type="button"
              onClick={() => setMentorTab('mentees')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                mentorTab === 'mentees'
                  ? 'bg-[#344C3D] text-white shadow-xs'
                  : 'text-[#80776D] hover:text-[#373833] hover:bg-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>My Assigned Mentees ({mentorMentees.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMentorTab('concerns')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                mentorTab === 'concerns'
                  ? 'bg-[#344C3D] text-white shadow-xs'
                  : 'text-[#80776D] hover:text-[#373833] hover:bg-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Concern Dialogue Queue</span>
            </button>
            <button
              type="button"
              onClick={() => setMentorTab('action')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                mentorTab === 'action'
                  ? 'bg-[#344C3D] text-white shadow-xs'
                  : 'text-[#80776D] hover:text-[#373833] hover:bg-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Review Queue & Tasks</span>
            </button>
            <button
              type="button"
              onClick={() => setMentorTab('radar')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                mentorTab === 'radar'
                  ? 'bg-[#344C3D] text-white shadow-xs'
                  : 'text-[#80776D] hover:text-[#373833] hover:bg-white'
              }`}
            >
              <Radar className="w-3.5 h-3.5" />
              <span>Department Radar</span>
            </button>
          </div>
        )}

        {/* View Routing */}
        {role === 'student' && <StudentPortal />}

        {role === 'admin' && (
          <>
            {adminTab === 'match' && <MentorMatchEngine />}
            {adminTab === 'radar' && <StudentRadar />}
            {adminTab === 'action' && <ActionCenter />}
            {adminTab === 'concerns' && <ConcernTracker />}
            {adminTab === 'insights' && <InstitutionInsights />}
          </>
        )}

        {role === 'mentor' && (
          <>
            {mentorTab === 'mentees' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-[#E4DCD0] shadow-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-[#829681] uppercase tracking-wider">
                          Faculty Portfolio
                        </span>
                        <span className="text-xs text-[#80776D]">·</span>
                        <span className="text-xs text-[#80776D]">
                          Capacity: {currentMentor?.existingMentoringLoad! + currentMentor?.activeMenteeCount!} / {currentMentor?.mentoringCapacity}
                        </span>
                      </div>
                      <h1 className="text-2xl font-bold font-serif text-[#344C3D]">
                        Welcome, {currentMentor?.name}
                      </h1>
                      <p className="text-sm text-[#80776D] mt-1">
                        {currentMentor?.designation} · {currentMentor?.department}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E4DCD0] text-[#344C3D] font-medium">
                        Active Mentees: <strong>{mentorMentees.length}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mentees Table */}
                <div className="bg-white rounded-2xl border border-[#E4DCD0] shadow-xs overflow-hidden">
                  <div className="p-4 bg-[#FAF7F2]/60 border-b border-[#E4DCD0] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#344C3D]">
                      Enrolled Students Assigned Under Your Mentorship
                    </span>
                    <span className="text-[11px] text-[#80776D]">
                      All subjects verified through approved course allocations
                    </span>
                  </div>

                  {mentorMentees.length === 0 ? (
                    <div className="p-12 text-center text-xs text-[#80776D]">
                      No mentees currently assigned. Please run the Smart MentorMatch algorithm or review allocations in Administrator mode.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF7F2] text-[#80776D] uppercase text-[10px] tracking-wider border-b border-[#E4DCD0]">
                          <tr>
                            <th className="py-3 px-4 font-semibold">Student Name & Roll</th>
                            <th className="py-3 px-3 font-semibold">Class & Section</th>
                            <th className="py-3 px-3 font-semibold">Exam Form</th>
                            <th className="py-3 px-3 font-semibold">Fee Status</th>
                            <th className="py-3 px-3 font-semibold">Sessional</th>
                            <th className="py-3 px-4 font-semibold text-right">Direct Support</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0E8DC]">
                          {mentorMentees.map(s => (
                            <tr key={s.id} className="hover:bg-[#FAF7F2]/80 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-[#344C3D]">{s.name}</div>
                                <span className="text-[10px] text-[#80776D] font-mono">{s.rollNo}</span>
                              </td>
                              <td className="py-3.5 px-3">
                                <span className="px-2 py-0.5 rounded bg-[#F0E8DC] text-[#344C3D] font-semibold text-[11px]">
                                  {s.classSection}
                                </span>
                              </td>
                              <td className="py-3.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    s.examFormStatus === 'verified'
                                      ? 'bg-[#829681]/20 text-[#344C3D]'
                                      : s.examFormStatus === 'overdue'
                                      ? 'bg-[#C9826B]/20 text-[#C9826B]'
                                      : 'bg-[#F0E8DC] text-[#80776D]'
                                  }`}
                                >
                                  {s.examFormStatus.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-3.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    s.feeStatus === 'paid'
                                      ? 'bg-[#829681]/20 text-[#344C3D]'
                                      : s.feeStatus === 'pending'
                                      ? 'bg-[#C9826B]/20 text-[#C9826B]'
                                      : 'bg-[#F0E8DC] text-[#344C3D]'
                                  }`}
                                >
                                  {s.feeStatus === 'paid' ? 'Paid' : `₹${(s.feeTotalAmount - s.feePaidAmount).toLocaleString()} Due`}
                                </span>
                              </td>
                              <td className="py-3.5 px-3">
                                <span className="text-[11px] text-[#80776D]">
                                  {s.sessionalStatus.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setMentorTab('concerns')}
                                  className="px-3 py-1.5 rounded-lg border border-[#E4DCD0] bg-white hover:bg-[#FAF7F2] text-xs font-medium text-[#344C3D] transition-colors cursor-pointer"
                                >
                                  View Concerns
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
            {mentorTab === 'concerns' && <ConcernTracker />}
            {mentorTab === 'action' && <ActionCenter />}
            {mentorTab === 'radar' && <StudentRadar />}
          </>
        )}
      </main>

      {/* Institutional Academic Footer */}
      <footer className="mt-auto border-t border-[#F0E8DC] bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-[#80776D] space-y-1">
          <p className="font-medium text-[#344C3D]">
            MentorSync AI — Every Student Connected. Every Concern Tracked.
          </p>
          <p className="text-[11px]">
            Complies with institutional data protection standards · Multilingual translation engine active · Simulated reminders recorded in audit ledger
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
