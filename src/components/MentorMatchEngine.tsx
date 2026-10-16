import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  parseAndValidateTeacherRoster,
  parseAndValidateStudentRoster,
  exportAllocationsToCsv,
  CsvValidationError
} from '../services/mentorMatch';
import { Teacher, Student, AllocationMatchResult } from '../types';
import {
  Sparkles,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Users,
  BookOpen,
  Filter,
  Check,
  RefreshCw,
  Edit2,
  FileSpreadsheet,
  Info
} from 'lucide-react';

export const MentorMatchEngine: React.FC = () => {
  const {
    teachers,
    students,
    allocationResults,
    allocationSummary,
    runMentorAllocation,
    approveAllocations,
    updateTeacherCapacity,
    setCustomTeachersAndStudents,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'review' | 'faculty' | 'upload'>('review');
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'high' | 'conflict'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [validationErrors, setValidationErrors] = useState<CsvValidationError[]>([]);
  const [isAllocating, setIsAllocating] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);

  // Editable capacity modal
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editCapacityVal, setEditCapacityVal] = useState<number>(10);

  // Manual override candidate map
  const [manualOverrides, setManualOverrides] = useState<Record<string, string>>({});

  const handleRunAllocation = () => {
    setIsAllocating(true);
    setApprovalSuccess(false);
    setTimeout(() => {
      runMentorAllocation();
      setIsAllocating(false);
    }, 400);
  };

  const handleApprove = () => {
    if (!allocationResults) return;

    // Apply any manual overrides selected by admin
    const finalResults = allocationResults.map(r => {
      const overrideTeacherId = manualOverrides[r.studentId];
      if (overrideTeacherId) {
        const teacher = teachers.find(t => t.id === overrideTeacherId);
        return {
          ...r,
          assignedTeacherId: overrideTeacherId,
          assignedTeacherName: teacher?.name || 'Manual Assignment',
          reason: `Admin Manual Assignment: Assigned by institutional supervisor.`,
          confidence: 'high' as const,
        };
      }
      return r;
    });

    approveAllocations(finalResults);
    setApprovalSuccess(true);
    setTimeout(() => setApprovalSuccess(false), 4000);
  };

  const handleExportCsv = () => {
    if (!allocationResults) return;
    const csvContent = exportAllocationsToCsv(allocationResults);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MentorSync_Allocations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sample CSV generators for instant 1-click test
  const handleLoadSampleBatch = () => {
    const sampleTeacherCsv = `TeacherID,TeacherName,Department,SubjectCode,SubjectName,Programme,Semester,ClassSection,ExistingLoad,MentoringCapacity
FAC-101,Dr. Rajesh Sharma,Computer Science,CS401,Design & Analysis of Algorithms,B.Tech CSE,4,CSE-A,4,12
FAC-101,Dr. Rajesh Sharma,Computer Science,CS402,Computer Architecture,B.Tech CSE,4,CSE-B,4,12
FAC-102,Dr. Sunita Sen,Computer Science,CS403,Operating Systems,B.Tech CSE,4,CSE-A,5,10
FAC-102,Dr. Sunita Sen,Computer Science,CS404,Database Systems,B.Tech CSE,4,CSE-B,5,10
FAC-103,Prof. Harpreet Singh Dhillon,Electronics,EC401,Analog Communication,B.Tech ECE,4,ECE-A,3,12
FAC-104,Dr. Meenakshi Sundaram,Computer Science,CS405,Software Engineering,B.Tech CSE,4,CSE-A,2,8
FAC-105,Prof. Tariq Ahmad Khan,Mechanical,ME401,Fluid Mechanics,B.Tech ME,4,MECH-A,2,10`;

    const sampleStudentCsv = `StudentID,StudentName,Programme,Semester,ClassSection
STU-2024-001,Aarav Malhotra,B.Tech CSE,4,CSE-A
STU-2024-002,Gurpreet Kaur,B.Tech CSE,4,CSE-A
STU-2024-003,Priyanka Das,B.Tech CSE,4,CSE-B
STU-2024-004,Karthik Subramaniam,B.Tech ECE,4,ECE-A
STU-2024-005,Zaid Farooq,B.Tech ME,4,MECH-A
STU-2024-006,Rohan Deshmukh,B.Tech CSE,4,CSE-A
STU-2024-007,Ananya Sen,B.Tech CSE,4,CSE-B
STU-2024-008,Deepak Verma,B.Tech CSE,4,CSE-A
STU-2024-009,Simranjeet Singh,B.Tech ECE,4,ECE-A
STU-2024-010,Tanvi Kulkarni,B.Tech ME,4,MECH-A`;

    const parsedT = parseAndValidateTeacherRoster(sampleTeacherCsv);
    const parsedS = parseAndValidateStudentRoster(sampleStudentCsv);

    setCustomTeachersAndStudents(parsedT.data, parsedS.data);
    setValidationErrors([...parsedT.errors, ...parsedS.errors]);
    setActiveTab('faculty');
  };

  const handleLoadConflictBatch = () => {
    // Deliberately test Section CSE-C with no teachers, and ECE-A with saturated capacity
    const conflictTeacherCsv = `TeacherID,TeacherName,Department,SubjectCode,SubjectName,Programme,Semester,ClassSection,ExistingLoad,MentoringCapacity
FAC-101,Dr. Rajesh Sharma,Computer Science,CS401,Algorithms,B.Tech CSE,4,CSE-A,10,10
FAC-103,Prof. Harpreet Singh Dhillon,Electronics,EC401,Communication,B.Tech ECE,4,ECE-A,12,12`;

    const conflictStudentCsv = `StudentID,StudentName,Programme,Semester,ClassSection
STU-2024-901,Vikas Sharma,B.Tech CSE,4,CSE-C
STU-2024-902,Neha Patel,B.Tech CSE,4,CSE-A
STU-2024-903,Rohit Gupta,B.Tech ECE,4,ECE-A`;

    const parsedT = parseAndValidateTeacherRoster(conflictTeacherCsv);
    const parsedS = parseAndValidateStudentRoster(conflictStudentCsv);

    setCustomTeachersAndStudents(parsedT.data, parsedS.data);
    setValidationErrors([...parsedT.errors, ...parsedS.errors, ...parsedT.warnings]);
    setActiveTab('faculty');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (!text) return;

      if (text.includes('MentoringCapacity') || text.includes('TeacherName') || text.includes('SubjectCode')) {
        const parsed = parseAndValidateTeacherRoster(text);
        setValidationErrors(parsed.errors);
        if (parsed.data.length > 0) {
          setCustomTeachersAndStudents(parsed.data, students);
          setActiveTab('faculty');
        }
      } else {
        const parsed = parseAndValidateStudentRoster(text);
        setValidationErrors(parsed.errors);
        if (parsed.data.length > 0) {
          setCustomTeachersAndStudents(teachers, parsed.data);
          setActiveTab('review');
        }
      }
    };
    reader.readAsText(file);
  };

  const filteredResults = (allocationResults || []).filter(r => {
    const matchesFilter =
      filterConfidence === 'all'
        ? true
        : filterConfidence === 'conflict'
        ? r.confidence === 'conflict'
        : r.confidence !== 'conflict';

    const matchesSearch =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentClassSection.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.assignedTeacherName && r.assignedTeacherName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Engine Hero & Allocation Bar */}
      <div className="bg-white rounded-2xl p-6 border border-[#E4DCD0] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-[#829681] uppercase tracking-wider">
                Fair Algorithmic Allocation
              </span>
              <span className="text-xs text-[#80776D]">·</span>
              <span className="text-xs text-[#80776D]">Section-bound Constraint Model</span>
            </div>
            <h1 className="text-2xl font-bold font-serif text-[#344C3D]">
              {t.mentorMatchTitle}
            </h1>
            <p className="text-sm text-[#80776D] mt-1 max-w-2xl">
              Strictly assigns teachers who teach the relevant class section, balances workload fairly, respects configured capacities, and flags impossible allocations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleRunAllocation}
              disabled={isAllocating}
              className="px-4 py-2.5 rounded-xl bg-[#344C3D] text-white text-xs font-semibold hover:bg-[#344C3D]/90 transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#829681]" />
              <span>{isAllocating ? 'Calculating Fair Allocations...' : t.runAllocationBtn}</span>
            </button>

            {allocationResults && (
              <>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-4 py-2.5 rounded-xl bg-[#829681] text-white text-xs font-semibold hover:bg-[#829681]/90 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.approveAllocations}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-3.5 py-2.5 rounded-xl border border-[#E4DCD0] bg-[#FAF7F2] hover:bg-[#F0E8DC] text-xs font-medium text-[#344C3D] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.exportCsvBtn}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Approval Success Banner */}
        {approvalSuccess && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#829681]/15 border border-[#829681]/30 text-xs font-medium text-[#344C3D] flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle className="w-4 h-4 text-[#344C3D]" />
            <span>{t.allocatedSuccess}</span>
          </div>
        )}

        {/* Summary Metric Cards */}
        {allocationSummary && (
          <div className="mt-6 pt-5 border-t border-[#F0E8DC] grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E4DCD0]">
              <span className="text-[11px] font-semibold text-[#80776D] uppercase">Total Students</span>
              <p className="text-xl font-bold font-serif text-[#344C3D] mt-0.5">
                {allocationSummary.totalStudents}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E4DCD0]">
              <span className="text-[11px] font-semibold text-[#80776D] uppercase">Allocated Fairly</span>
              <p className="text-xl font-bold font-serif text-[#344C3D] mt-0.5">
                {allocationSummary.allocatedCount}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E4DCD0]">
              <span className="text-[11px] font-semibold text-[#80776D] uppercase">Unallocated</span>
              <p className="text-xl font-bold font-serif text-[#80776D] mt-0.5">
                {allocationSummary.unallocatedCount}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E4DCD0]">
              <span className="text-[11px] font-semibold text-[#C9826B] uppercase">Hard Conflicts</span>
              <p className="text-xl font-bold font-serif text-[#C9826B] mt-0.5">
                {allocationSummary.conflictsCount}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs: Allocation Review | Faculty & Subject Eligibility | Roster Upload */}
      <div className="flex items-center gap-2 border-b border-[#E4DCD0] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('review')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'review'
              ? 'bg-[#344C3D] text-white shadow-xs'
              : 'text-[#80776D] hover:text-[#373833] hover:bg-white'
          }`}
        >
          Allocation Results & Overrides ({allocationResults ? allocationResults.length : 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('faculty')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'faculty'
              ? 'bg-[#344C3D] text-white shadow-xs'
              : 'text-[#80776D] hover:text-[#373833] hover:bg-white'
          }`}
        >
          Teacher Eligibility & Capacity ({teachers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'upload'
              ? 'bg-[#344C3D] text-white shadow-xs'
              : 'text-[#80776D] hover:text-[#373833] hover:bg-white'
          }`}
        >
          CSV Upload & Validation
        </button>
      </div>

      {/* TAB 1: ALLOCATION RESULTS */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          {!allocationResults ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E4DCD0]">
              <Sparkles className="w-10 h-10 text-[#829681] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#344C3D]">
                MentorMatch Allocation Ready to Run
              </h3>
              <p className="text-xs text-[#80776D] max-w-md mx-auto mt-1 mb-5">
                The algorithm will evaluate subject allocations across sections, balance load, and respect each teacher's capacity.
              </p>
              <button
                type="button"
                onClick={handleRunAllocation}
                className="px-5 py-2.5 bg-[#344C3D] text-white rounded-xl text-xs font-semibold hover:bg-[#344C3D]/90 transition-all shadow-xs cursor-pointer"
              >
                Run Smart Allocation Now
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E4DCD0] shadow-xs overflow-hidden">
              {/* Filter and Search Bar */}
              <div className="p-4 bg-[#FAF7F2]/60 border-b border-[#E4DCD0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#80776D] font-medium">Filter:</span>
                  <button
                    type="button"
                    onClick={() => setFilterConfidence('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      filterConfidence === 'all'
                        ? 'bg-[#344C3D] text-white'
                        : 'bg-white border border-[#E4DCD0] text-[#80776D]'
                    }`}
                  >
                    All ({allocationResults.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterConfidence('high')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      filterConfidence === 'high'
                        ? 'bg-[#829681] text-white'
                        : 'bg-white border border-[#E4DCD0] text-[#80776D]'
                    }`}
                  >
                    Eligible ({allocationResults.filter(r => r.confidence !== 'conflict').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterConfidence('conflict')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      filterConfidence === 'conflict'
                        ? 'bg-[#C9826B] text-white'
                        : 'bg-white border border-[#E4DCD0] text-[#80776D]'
                    }`}
                  >
                    Conflicts ({allocationResults.filter(r => r.confidence === 'conflict').length})
                  </button>
                </div>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search student, section, or mentor..."
                  className="px-3 py-1.5 bg-white border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681] w-full sm:w-64"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#80776D] uppercase text-[10px] tracking-wider border-b border-[#E4DCD0]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Student</th>
                      <th className="py-3 px-3 font-semibold">Section</th>
                      <th className="py-3 px-4 font-semibold">Assigned Faculty Mentor</th>
                      <th className="py-3 px-4 font-semibold">Status & Algorithmic Reason</th>
                      <th className="py-3 px-3 font-semibold text-right">Manual Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E8DC]">
                    {filteredResults.map(result => {
                      const isConflict = result.confidence === 'conflict';
                      // Eligible teachers for this section to populate override options
                      const eligibleTeachers = teachers.filter(t =>
                        t.teachingAllocations.some(
                          a => a.classSection.toUpperCase() === result.studentClassSection.toUpperCase()
                        )
                      );

                      return (
                        <tr
                          key={result.studentId}
                          className={`hover:bg-[#FAF7F2]/80 transition-colors ${
                            isConflict ? 'bg-[#C9826B]/5' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 font-medium text-[#344C3D]">
                            <div>{result.studentName}</div>
                            <span className="text-[10px] text-[#80776D] font-mono">{result.studentId}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-[#F0E8DC] text-[#344C3D] font-semibold text-[11px]">
                              {result.studentClassSection}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {manualOverrides[result.studentId] ? (
                              <div className="font-semibold text-[#829681]">
                                {teachers.find(t => t.id === manualOverrides[result.studentId])?.name} (Manual Override)
                              </div>
                            ) : result.assignedTeacherName ? (
                              <div className="font-semibold text-[#344C3D]">
                                {result.assignedTeacherName}
                              </div>
                            ) : (
                              <div className="text-[#C9826B] font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Unallocated</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-start gap-1.5">
                              {isConflict ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-[#C9826B] shrink-0 mt-0.5" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5 text-[#829681] shrink-0 mt-0.5" />
                              )}
                              <p
                                className={`text-[11px] leading-relaxed ${
                                  isConflict ? 'text-[#C9826B] font-medium' : 'text-[#80776D]'
                                }`}
                              >
                                {result.conflictReason || result.reason}
                              </p>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <select
                              value={manualOverrides[result.studentId] || result.assignedTeacherId || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setManualOverrides(prev => ({
                                  ...prev,
                                  [result.studentId]: val,
                                }));
                              }}
                              className="bg-white border border-[#E4DCD0] rounded-lg px-2 py-1 text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
                            >
                              <option value="">(Select Mentor)</option>
                              {eligibleTeachers.map(t => (
                                <option key={t.id} value={t.id}>
                                  {t.name} (Load: {t.existingMentoringLoad + t.activeMenteeCount}/{t.mentoringCapacity})
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FACULTY & SUBJECT ELIGIBILITY */}
      {activeTab === 'faculty' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#E4DCD0] shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#344C3D] mb-1">
              Teaching Allocations & Configured Mentoring Capacities
            </h3>
            <p className="text-xs text-[#80776D] mb-4">
              Teachers are only eligible to mentor students in the class sections they actively teach. You can configure individual mentoring capacities below.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#80776D] uppercase text-[10px] tracking-wider border-b border-[#E4DCD0]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Teacher ID & Name</th>
                    <th className="py-3 px-4 font-semibold">Department</th>
                    <th className="py-3 px-4 font-semibold">Approved Teaching Allocations</th>
                    <th className="py-3 px-3 font-semibold">Existing Load</th>
                    <th className="py-3 px-3 font-semibold">Mentoring Capacity</th>
                    <th className="py-3 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E8DC]">
                  {teachers.map(teacher => {
                    const totalCurrent = teacher.existingMentoringLoad + teacher.activeMenteeCount;
                    const isAtCapacity = totalCurrent >= teacher.mentoringCapacity;

                    return (
                      <tr key={teacher.id} className="hover:bg-[#FAF7F2]/80">
                        <td className="py-3.5 px-4 font-medium text-[#344C3D]">
                          <div>{teacher.name}</div>
                          <span className="text-[10px] text-[#80776D] font-mono">{teacher.id}</span>
                        </td>
                        <td className="py-3.5 px-4 text-[#80776D]">
                          {teacher.department}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {teacher.teachingAllocations.map(a => (
                              <span
                                key={a.id}
                                className="px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E4DCD0] text-[11px] text-[#344C3D]"
                              >
                                <strong>{a.classSection}</strong>: {a.subjectCode} ({a.subjectName})
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-[#80776D]">
                          {teacher.existingMentoringLoad} previous + {teacher.activeMenteeCount} active
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`font-semibold ${
                              isAtCapacity ? 'text-[#C9826B]' : 'text-[#344C3D]'
                            }`}
                          >
                            {totalCurrent} / {teacher.mentoringCapacity}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTeacher(teacher);
                              setEditCapacityVal(teacher.mentoringCapacity);
                            }}
                            className="p-1.5 rounded-lg text-[#829681] hover:bg-[#FAF7F2] border border-[#E4DCD0] transition-colors"
                            title="Edit Capacity"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CSV UPLOAD & VALIDATION */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-[#E4DCD0] shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#344C3D] mb-1">
              Roster CSV Ingestion & Pre-Validation
            </h3>
            <p className="text-xs text-[#80776D] mb-6">
              Upload institutional CSV exports containing faculty teaching allocations or student rosters. The system validates headers, identifies duplicate records, and flags over-capacity teachers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Uploader Box */}
              <div className="border-2 border-dashed border-[#E4DCD0] rounded-2xl p-6 text-center hover:border-[#829681] transition-colors bg-[#FAF7F2]/50">
                <Upload className="w-8 h-8 text-[#829681] mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#344C3D]">
                  Click or drag and drop CSV files here
                </p>
                <p className="text-[11px] text-[#80776D] mt-1 mb-4">
                  Accepts Faculty Roster CSV or Student Roster CSV
                </p>
                <label className="px-4 py-2 bg-[#344C3D] text-white rounded-xl text-xs font-semibold hover:bg-[#344C3D]/90 transition-all cursor-pointer inline-block">
                  <span>Browse Files</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Instant Test Presets */}
              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E4DCD0] flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-[#344C3D] mb-1">
                    Instant 1-Click Test Batches
                  </h4>
                  <p className="text-[11px] text-[#80776D] mb-3">
                    Quickly verify the allocation engine and conflict detector without preparing external spreadsheets.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleLoadSampleBatch}
                    className="w-full py-2 px-3 bg-white border border-[#E4DCD0] hover:border-[#829681] text-[#344C3D] rounded-xl text-xs font-medium transition-colors text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>Load 2026 Engineering Batch (Balanced)</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#829681]" />
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadConflictBatch}
                    className="w-full py-2 px-3 bg-white border border-[#E4DCD0] hover:border-[#C9826B] text-[#344C3D] rounded-xl text-xs font-medium transition-colors text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>Load Saturated Capacity Batch (Conflict Test)</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-[#C9826B]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Row-Level Validation Errors / Warnings */}
            {validationErrors.length > 0 && (
              <div className="mt-6 pt-5 border-t border-[#F0E8DC]">
                <h4 className="text-xs font-semibold text-[#C9826B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Row-Level Validation Feedback ({validationErrors.length})</span>
                </h4>
                <div className="space-y-2">
                  {validationErrors.map((err, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-xs border ${
                        err.severity === 'error'
                          ? 'bg-[#C9826B]/10 border-[#C9826B]/30 text-[#C9826B]'
                          : 'bg-[#F0E8DC] border-[#E4DCD0] text-[#80776D]'
                      }`}
                    >
                      <span className="font-semibold">
                        Row {err.row} [{err.column}]:
                      </span>{' '}
                      {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Edit Mentoring Capacity */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-[#E4DCD0] shadow-xl p-5 space-y-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#344C3D]">
                Adjust Mentoring Capacity
              </h3>
              <p className="text-xs text-[#80776D]">
                {editingTeacher.name} ({editingTeacher.id})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#344C3D] mb-1">
                Max Mentoring Capacity (Students)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={editCapacityVal}
                onChange={e => setEditCapacityVal(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E4DCD0] rounded-xl text-xs text-[#373833] focus:outline-none focus:ring-1 focus:ring-[#829681]"
              />
              <p className="text-[11px] text-[#80776D] mt-1">
                Current load: {editingTeacher.existingMentoringLoad + editingTeacher.activeMenteeCount}
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#F0E8DC]">
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-[#80776D] hover:bg-[#FAF7F2]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateTeacherCapacity(editingTeacher.id, editCapacityVal);
                  setEditingTeacher(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-[#344C3D] text-white text-xs font-semibold hover:bg-[#344C3D]/90"
              >
                Save Capacity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
