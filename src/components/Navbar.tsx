import React from 'react';
import { useApp } from '../context/AppContext';
import { SUPPORTED_LANGUAGES } from '../i18n/languages';
import {
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Languages,
  RotateCcw,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    role,
    setRole,
    language,
    setLanguage,
    t,
    students,
    teachers,
    currentStudentId,
    setCurrentStudentId,
    currentMentorId,
    setCurrentMentorId,
    resetToInitialData,
  } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#F0E8DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#344C3D] flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold tracking-tight text-[#344C3D]">
                  MentorSync AI
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#829681]/15 text-[#344C3D]">
                  Campus v2.6
                </span>
              </div>
              <p className="text-xs text-[#80776D] hidden md:block">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Right Controls: Role Selector, Persona Switcher & Language Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Role Switcher */}
            <div className="bg-[#F0E8DC]/80 p-1 rounded-xl flex items-center border border-[#E4DCD0]">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  role === 'student'
                    ? 'bg-white text-[#344C3D] shadow-sm font-semibold'
                    : 'text-[#80776D] hover:text-[#373833]'
                }`}
                title="Switch to Student view"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{t.roleStudent}</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('mentor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  role === 'mentor'
                    ? 'bg-white text-[#344C3D] shadow-sm font-semibold'
                    : 'text-[#80776D] hover:text-[#373833]'
                }`}
                title="Switch to Mentor view"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{t.roleMentor}</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  role === 'admin'
                    ? 'bg-white text-[#344C3D] shadow-sm font-semibold'
                    : 'text-[#80776D] hover:text-[#373833]'
                }`}
                title="Switch to Administrator view"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.roleAdmin}</span>
              </button>
            </div>

            {/* Persona picker for Mentor or Student */}
            {role === 'student' && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#80776D]">
                <span className="text-[11px]">Student:</span>
                <select
                  value={currentStudentId}
                  onChange={e => setCurrentStudentId(e.target.value)}
                  className="bg-white border border-[#E4DCD0] rounded-lg px-2 py-1 text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.rollNo} - {s.classSection})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {role === 'mentor' && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#80776D]">
                <span className="text-[11px]">Faculty:</span>
                <select
                  value={currentMentorId}
                  onChange={e => setCurrentMentorId(e.target.value)}
                  className="bg-white border border-[#E4DCD0] rounded-lg px-2 py-1 text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Language Selector: Speak Your Language */}
            <div className="relative">
              <div className="flex items-center gap-1.5 bg-white border border-[#E4DCD0] rounded-xl px-2.5 py-1.5 shadow-xs text-xs font-medium text-[#344C3D]">
                <Languages className="w-4 h-4 text-[#829681]" />
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value as any)}
                  aria-label={t.languageSelect}
                  className="bg-transparent text-xs font-medium text-[#344C3D] focus:outline-none cursor-pointer pr-1"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code} className="py-1">
                      {lang.nativeName} ({lang.label})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-[#80776D] pointer-events-none" />
              </div>
            </div>

            {/* Reset data helper */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset application data to initial verified demo state?')) {
                  resetToInitialData();
                }
              }}
              title="Reset sample data"
              className="p-2 text-[#80776D] hover:text-[#C9826B] hover:bg-[#F0E8DC]/50 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
