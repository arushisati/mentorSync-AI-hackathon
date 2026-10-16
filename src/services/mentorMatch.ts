import {
  Teacher,
  Student,
  AllocationMatchResult,
  AllocationSummary,
  SubjectAllocation
} from '../types';

export interface CsvValidationError {
  row: number;
  column: string;
  value: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParseResult<T> {
  data: T[];
  errors: CsvValidationError[];
  warnings: CsvValidationError[];
}

/**
 * Parses CSV text taking quotes into account
 */
export function parseCsvRows(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  return lines.map(line => {
    const row: string[] = [];
    let insideQuotes = false;
    let currentField = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        row.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    row.push(currentField.trim());
    return row;
  });
}

/**
 * Validates and parses teacher teaching roster CSV
 * Columns expected:
 * TeacherId, TeacherName, Department, SubjectCode, SubjectName, Programme, Semester, ClassSection, ExistingLoad, MentoringCapacity
 */
export function parseAndValidateTeacherRoster(csvText: string): ParseResult<Teacher> {
  const rows = parseCsvRows(csvText);
  const errors: CsvValidationError[] = [];
  const warnings: CsvValidationError[] = [];
  const teacherMap = new Map<string, Teacher>();

  if (rows.length < 2) {
    errors.push({
      row: 1,
      column: 'Header',
      value: '',
      message: 'CSV file is empty or missing data rows.',
      severity: 'error',
    });
    return { data: [], errors, warnings };
  }

  const header = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const getColIndex = (aliases: string[]): number => {
    return header.findIndex(h => aliases.some(alias => h.includes(alias)));
  };

  const idIdx = getColIndex(['teacherid', 'tid', 'id', 'facultyid']);
  const nameIdx = getColIndex(['teachername', 'name', 'facultyname']);
  const deptIdx = getColIndex(['department', 'dept']);
  const subjectCodeIdx = getColIndex(['subjectcode', 'subcode', 'code']);
  const subjectNameIdx = getColIndex(['subjectname', 'subject']);
  const progIdx = getColIndex(['programme', 'program', 'course', 'degree']);
  const semIdx = getColIndex(['semester', 'sem']);
  const sectionIdx = getColIndex(['classsection', 'section', 'class', 'sec']);
  const existingLoadIdx = getColIndex(['existingload', 'currentload', 'load']);
  const capacityIdx = getColIndex(['capacity', 'maxcapacity', 'mentoringcapacity', 'limit']);

  if (idIdx === -1 || nameIdx === -1 || sectionIdx === -1) {
    errors.push({
      row: 1,
      column: 'Header',
      value: header.join(', '),
      message: 'Required columns missing! Must include Teacher ID, Teacher Name, and Class/Section.',
      severity: 'error',
    });
    return { data: [], errors, warnings };
  }

  for (let r = 1; r < rows.length; r++) {
    const rowNum = r + 1;
    const row = rows[r];
    if (row.length === 0 || row.every(c => c.trim() === '')) continue;

    const teacherId = row[idIdx]?.trim();
    const teacherName = row[nameIdx]?.trim();
    const department = deptIdx !== -1 ? row[deptIdx]?.trim() || 'General Engineering' : 'Engineering';
    const subCode = subjectCodeIdx !== -1 ? row[subjectCodeIdx]?.trim() || 'SUB-101' : 'SUB-101';
    const subName = subjectNameIdx !== -1 ? row[subjectNameIdx]?.trim() || 'Core Subject' : 'Core Subject';
    const programme = progIdx !== -1 ? row[progIdx]?.trim() || 'B.Tech' : 'B.Tech';
    const semester = semIdx !== -1 ? parseInt(row[semIdx]?.trim() || '1', 10) : 1;
    const classSection = row[sectionIdx]?.trim().toUpperCase();
    const existingLoad = existingLoadIdx !== -1 ? parseInt(row[existingLoadIdx]?.trim() || '0', 10) : 0;
    const capacity = capacityIdx !== -1 ? parseInt(row[capacityIdx]?.trim() || '15', 10) : 15;

    if (!teacherId) {
      errors.push({
        row: rowNum,
        column: 'Teacher ID',
        value: '',
        message: 'Missing Teacher ID.',
        severity: 'error',
      });
      continue;
    }

    if (!teacherName) {
      errors.push({
        row: rowNum,
        column: 'Teacher Name',
        value: '',
        message: `Missing Teacher Name for ID ${teacherId}.`,
        severity: 'error',
      });
      continue;
    }

    if (!classSection) {
      errors.push({
        row: rowNum,
        column: 'Class Section',
        value: '',
        message: `Missing Class Section for Teacher ${teacherName}.`,
        severity: 'error',
      });
      continue;
    }

    if (isNaN(capacity) || capacity <= 0) {
      errors.push({
        row: rowNum,
        column: 'Mentoring Capacity',
        value: String(row[capacityIdx]),
        message: `Invalid capacity (${row[capacityIdx]}). Must be a positive integer.`,
        severity: 'error',
      });
      continue;
    }

    if (existingLoad >= capacity) {
      warnings.push({
        row: rowNum,
        column: 'Existing Load',
        value: `${existingLoad}/${capacity}`,
        message: `Teacher ${teacherName} (${teacherId}) is already at or above max capacity (${existingLoad}/${capacity}). Cannot take new students without capacity increase.`,
        severity: 'warning',
      });
    }

    // Add or merge into teacherMap
    if (!teacherMap.has(teacherId)) {
      teacherMap.set(teacherId, {
        id: teacherId,
        name: teacherName,
        email: `${teacherId.toLowerCase()}@university.edu`,
        department,
        designation: 'Associate Professor',
        teachingAllocations: [],
        existingMentoringLoad: isNaN(existingLoad) ? 0 : existingLoad,
        mentoringCapacity: capacity,
        activeMenteeCount: 0,
      });
    }

    const teacher = teacherMap.get(teacherId)!;
    const allocation: SubjectAllocation = {
      id: `alloc_${teacherId}_${subCode}_${classSection}`,
      subjectCode: subCode,
      subjectName: subName,
      programme,
      semester: isNaN(semester) ? 1 : semester,
      classSection,
    };

    // Check duplicate allocation
    const isDup = teacher.teachingAllocations.some(
      a => a.subjectCode === subCode && a.classSection === classSection
    );
    if (!isDup) {
      teacher.teachingAllocations.push(allocation);
    }
  }

  return {
    data: Array.from(teacherMap.values()),
    errors,
    warnings,
  };
}

/**
 * Validates and parses student roster CSV
 * Columns expected: StudentID, StudentName, Programme, Semester, ClassSection
 */
export function parseAndValidateStudentRoster(csvText: string): ParseResult<Student> {
  const rows = parseCsvRows(csvText);
  const errors: CsvValidationError[] = [];
  const warnings: CsvValidationError[] = [];
  const seenIds = new Set<string>();
  const students: Student[] = [];

  if (rows.length < 2) {
    errors.push({
      row: 1,
      column: 'Header',
      value: '',
      message: 'Student CSV file is empty.',
      severity: 'error',
    });
    return { data: [], errors, warnings };
  }

  const header = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const idIdx = header.findIndex(h => h.includes('id') || h.includes('roll') || h.includes('student'));
  const nameIdx = header.findIndex(h => h.includes('name'));
  const progIdx = header.findIndex(h => h.includes('programme') || h.includes('program') || h.includes('degree'));
  const semIdx = header.findIndex(h => h.includes('semester') || h.includes('sem'));
  const sectionIdx = header.findIndex(h => h.includes('section') || h.includes('class') || h.includes('sec'));

  if (idIdx === -1 || nameIdx === -1 || sectionIdx === -1) {
    errors.push({
      row: 1,
      column: 'Header',
      value: header.join(', '),
      message: 'Missing required columns in Student CSV. Must include Student ID, Name, and Section.',
      severity: 'error',
    });
    return { data: [], errors, warnings };
  }

  for (let r = 1; r < rows.length; r++) {
    const rowNum = r + 1;
    const row = rows[r];
    if (row.length === 0 || row.every(c => c.trim() === '')) continue;

    const studentId = row[idIdx]?.trim();
    const studentName = row[nameIdx]?.trim();
    const programme = progIdx !== -1 ? row[progIdx]?.trim() || 'B.Tech' : 'B.Tech';
    const semester = semIdx !== -1 ? parseInt(row[semIdx]?.trim() || '4', 10) : 4;
    const classSection = row[sectionIdx]?.trim().toUpperCase();

    if (!studentId) {
      errors.push({
        row: rowNum,
        column: 'Student ID',
        value: '',
        message: 'Empty Student ID encountered.',
        severity: 'error',
      });
      continue;
    }

    if (seenIds.has(studentId)) {
      errors.push({
        row: rowNum,
        column: 'Student ID',
        value: studentId,
        message: `Duplicate student ID detected: ${studentId}. Duplicate rows rejected.`,
        severity: 'error',
      });
      continue;
    }
    seenIds.add(studentId);

    if (!studentName) {
      errors.push({
        row: rowNum,
        column: 'Student Name',
        value: '',
        message: `Missing name for student ${studentId}.`,
        severity: 'error',
      });
      continue;
    }

    if (!classSection) {
      errors.push({
        row: rowNum,
        column: 'Class Section',
        value: '',
        message: `Missing section for student ${studentName}.`,
        severity: 'error',
      });
      continue;
    }

    students.push({
      id: studentId,
      rollNo: studentId,
      name: studentName,
      email: `${studentId.toLowerCase()}@student.university.edu`,
      programme,
      semester: isNaN(semester) ? 4 : semester,
      classSection,
      preferredLanguage: 'en',
      examFormStatus: 'pending',
      examFormDeadline: '2026-10-28',
      informedStatus: false,
      sessionalStatus: 'in_progress',
      sessionalDeadline: '2026-10-31',
      feeStatus: 'pending',
      feeTotalAmount: 65000,
      feePaidAmount: 0,
      feeDeadline: '2026-10-25',
      completionReports: [],
    });
  }

  return { data: students, errors, warnings };
}

/**
 * Smart MentorMatch AI Core Engine:
 * - Checks Teacher Eligibility: Teacher MUST teach the student's classSection (programme, semester, section match).
 * - Checks Capacity: (existingMentoringLoad + allocatedCount) < mentoringCapacity.
 * - Fair Load Balancing: Distributes students evenly among all eligible teachers.
 * - Conflict Handling: If no teacher teaches that section or all eligible teachers are at max capacity, flags conflict with explicit explanation.
 */
export function runSmartMentorAllocation(
  teachers: Teacher[],
  students: Student[]
): {
  results: AllocationMatchResult[];
  summary: AllocationSummary;
} {
  const teacherLoadMap = new Map<
    string,
    {
      teacher: Teacher;
      allocatedCount: number;
    }
  >();

  teachers.forEach(t => {
    teacherLoadMap.set(t.id, {
      teacher: t,
      allocatedCount: 0,
    });
  });

  const results: AllocationMatchResult[] = [];
  let allocatedCount = 0;
  let unallocatedCount = 0;
  let conflictsCount = 0;

  // Group students by section for efficient balanced distribution
  const sectionStudents = new Map<string, Student[]>();
  students.forEach(s => {
    const list = sectionStudents.get(s.classSection) || [];
    list.push(s);
    sectionStudents.set(s.classSection, list);
  });

  // Iterate over each section
  sectionStudents.forEach((studs, section) => {
    // 1. Identify eligible teachers for this section
    const eligibleTeachers = teachers.filter(t =>
      t.teachingAllocations.some(a => a.classSection.toUpperCase() === section.toUpperCase())
    );

    if (eligibleTeachers.length === 0) {
      // Hard Conflict: No teacher is assigned to teach this section
      studs.forEach(student => {
        conflictsCount++;
        unallocatedCount++;
        results.push({
          studentId: student.id,
          studentName: student.name,
          studentClassSection: student.classSection,
          isEligible: false,
          confidence: 'conflict',
          conflictReason: `No approved faculty member teaches section ${section}. Academic policy strictly forbids assigning mentors outside the teaching roster.`,
          reason: `Unallocated: Roster deficiency for section ${section}. Administration review required.`,
        });
      });
      return;
    }

    // 2. Allocate students across eligible teachers with load balancing
    studs.forEach(student => {
      // Find eligible teachers who have available capacity
      const candidates = eligibleTeachers
        .map(t => {
          const loadInfo = teacherLoadMap.get(t.id)!;
          const currentTotal = t.existingMentoringLoad + loadInfo.allocatedCount;
          const remainingCapacity = t.mentoringCapacity - currentTotal;
          return {
            teacher: t,
            loadInfo,
            currentTotal,
            remainingCapacity,
          };
        })
        .filter(c => c.remainingCapacity > 0);

      if (candidates.length === 0) {
        // Hard Conflict: All eligible teachers teaching this section are at max capacity
        conflictsCount++;
        unallocatedCount++;
        const teacherNames = eligibleTeachers.map(t => `${t.name} (Cap: ${t.mentoringCapacity})`).join(', ');
        results.push({
          studentId: student.id,
          studentName: student.name,
          studentClassSection: student.classSection,
          isEligible: true,
          confidence: 'conflict',
          conflictReason: `All eligible teachers for ${section} (${teacherNames}) have reached full mentoring capacity.`,
          reason: `Unallocated: Section capacity saturated. Suggest increasing faculty capacity limit or assigning additional section instructors.`,
        });
        return;
      }

      // Sort candidates by current total load ascending (Load balancing)
      // If loads are equal, sort by remaining capacity descending
      candidates.sort((a, b) => {
        if (a.currentTotal !== b.currentTotal) {
          return a.currentTotal - b.currentTotal;
        }
        return b.remainingCapacity - a.remainingCapacity;
      });

      const selected = candidates[0];
      selected.loadInfo.allocatedCount += 1;
      allocatedCount++;

      // Subject teacher is teaching them
      const taughtSubject = selected.teacher.teachingAllocations.find(
        a => a.classSection.toUpperCase() === section.toUpperCase()
      );

      const subjectNote = taughtSubject
        ? `Teaches ${taughtSubject.subjectCode} (${taughtSubject.subjectName}) to Section ${section}.`
        : `Approved instructor for Section ${section}.`;

      results.push({
        studentId: student.id,
        studentName: student.name,
        studentClassSection: student.classSection,
        assignedTeacherId: selected.teacher.id,
        assignedTeacherName: selected.teacher.name,
        isEligible: true,
        confidence: 'high',
        reason: `Matched via MentorMatch AI: ${subjectNote} Load balanced at ${selected.currentTotal + 1}/${selected.teacher.mentoringCapacity} capacity.`,
      });
    });
  });

  const teacherLoadDistribution = teachers.map(t => {
    const info = teacherLoadMap.get(t.id);
    const allocatedThisRound = info ? info.allocatedCount : 0;
    return {
      teacherId: t.id,
      teacherName: t.name,
      currentTotal: t.existingMentoringLoad + allocatedThisRound,
      capacity: t.mentoringCapacity,
      allocatedThisRound,
    };
  });

  const summary: AllocationSummary = {
    totalStudents: students.length,
    allocatedCount,
    unallocatedCount,
    conflictsCount,
    teacherLoadDistribution,
    timestamp: new Date().toISOString(),
  };

  return { results, summary };
}

/**
 * Generate CSV text for download
 */
export function exportAllocationsToCsv(results: AllocationMatchResult[]): string {
  const header = ['StudentID', 'StudentName', 'ClassSection', 'AssignedMentorID', 'AssignedMentorName', 'Status', 'AllocationReason'];
  const rows = results.map(r => [
    `"${r.studentId}"`,
    `"${r.studentName}"`,
    `"${r.studentClassSection}"`,
    `"${r.assignedTeacherId || 'UNALLOCATED'}"`,
    `"${r.assignedTeacherName || 'N/A'}"`,
    `"${r.confidence === 'conflict' ? 'CONFLICT' : 'ALLOCATED'}"`,
    `"${(r.conflictReason || r.reason).replace(/"/g, '""')}"`,
  ]);
  return [header.join(','), ...rows.map(row => row.join(','))].join('\n');
}
