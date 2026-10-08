/**
 * staffUtils.js
 * Standard employee name formatting and helper utilities.
 * 
 * Enforces company standard:
 * ALL CAPITAL LETTERS · LAST NAME FIRST
 * Example: "DELOS SANTOS, EARL JOHN"
 */

export function formatStaffName(staff) {
  if (!staff) return 'STAFF MEMBER';
  if (typeof staff === 'string') return staff.trim().toUpperCase();
  const last = (staff.lastName || '').trim().toUpperCase();
  const first = (staff.firstName || '').trim().toUpperCase();
  if (last && first && last !== first) {
    return `${last}, ${first}`;
  }
  if (staff.rawName) return staff.rawName.trim().toUpperCase();
  if (staff.name) return staff.name.trim().toUpperCase();
  return (last || first || 'STAFF MEMBER').trim().toUpperCase();
}

/**
 * Returns the canonical login username for a staff member.
 * Example: "katherinea.bella" or custom assigned username.
 */
export function getStaffUsername(staff) {
  if (!staff) return '';
  if (staff.username && String(staff.username).trim()) {
    return String(staff.username).trim().toLowerCase().replace(/^@+/, '');
  }
  if (staff.email && String(staff.email).includes('@')) {
    return String(staff.email).split('@')[0].trim().toLowerCase();
  }
  const first = (staff.firstName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const last = (staff.lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (first && last) {
    return `${first}.${last}`;
  }
  if (last || first) {
    return last || first;
  }
  return (staff.employeeId || '').toLowerCase();
}

/**
 * Finds a staff member by username (with fallback support for email, employeeId, or name).
 */
export function findStaffByUsername(staffList = [], rawInput = '') {
  const clean = String(rawInput || '').trim().toLowerCase().replace(/^@+/, '');
  if (!clean || !Array.isArray(staffList)) return null;

  // 1. Exact match on username or email local-part
  let match = staffList.find(s => {
    const uname = getStaffUsername(s);
    const emailLocal = s.email && s.email.includes('@') ? s.email.split('@')[0].trim().toLowerCase() : '';
    return uname === clean || (emailLocal && emailLocal === clean);
  });
  if (match) return match;

  // 2. Match on first.last (without middle initial), firstlast, last.first, or full name
  const cleanNoDots = clean.replace(/[^a-z0-9]/g, '');
  match = staffList.find(s => {
    const unameNoDots = getStaffUsername(s).replace(/[^a-z0-9]/g, '');
    const firstFull = (s.firstName || '').trim().toLowerCase();
    // Strip trailing single-letter middle initial e.g. "katherine a." -> "katherine"
    const firstNoMiddle = firstFull.replace(/\s+[a-z]\.?$/i, '').replace(/[^a-z0-9]/g, '');
    const firstAll = firstFull.replace(/[^a-z0-9]/g, '');
    const lastAll = (s.lastName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    const candidates = [
      unameNoDots,
      `${firstNoMiddle}.${lastAll}`,
      `${firstNoMiddle}${lastAll}`,
      `${firstAll}.${lastAll}`,
      `${firstAll}${lastAll}`,
      `${lastAll}.${firstNoMiddle}`,
      `${lastAll}${firstNoMiddle}`,
      (s.email || '').trim().toLowerCase(),
      (s.employeeId || '').trim().toLowerCase(),
      (s.rawName || '').trim().toLowerCase()
    ];

    return candidates.includes(clean) || (cleanNoDots.length >= 4 && candidates.includes(cleanNoDots));
  });

  return match || null;
}

/**
 * Calculates upcoming milestone (birthday or work anniversary)
 * Returns object with daysUntil, formattedDate, milestoneYear, isToday, isTomorrow, yearsCompleted
 */
export function getUpcomingMilestoneInfo(dateStr, daysAhead = 14) {
  if (!dateStr) return null;
  try {
    const parts = dateStr.split('-');
    if (parts.length < 3) return null;
    const origYear = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    let milestoneDate = new Date(currentYear, month, day);
    milestoneDate.setHours(0, 0, 0, 0);

    let diffDays = Math.round((milestoneDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    let milestoneYear = currentYear;

    // If the date has already passed in this calendar year, check next year
    if (diffDays < 0) {
      milestoneDate = new Date(currentYear + 1, month, day);
      milestoneDate.setHours(0, 0, 0, 0);
      diffDays = Math.round((milestoneDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      milestoneYear = currentYear + 1;
    }

    if (diffDays >= 0 && diffDays <= daysAhead) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        daysUntil: diffDays,
        isToday: diffDays === 0,
        isTomorrow: diffDays === 1,
        formattedDate: `${monthNames[month]} ${day}`,
        milestoneYear,
        yearsCompleted: Math.max(0, milestoneYear - origYear),
        origYear
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Scan all staff members for upcoming birthdays and work anniversaries within daysAhead
 */
export function scanStaffMilestones(staffList = [], daysAhead = 14) {
  const birthdays = [];
  const anniversaries = [];

  staffList.forEach(staff => {
    if (staff.status === 'inactive') return;

    // Check birthday
    if (staff.birthday) {
      const bdayInfo = getUpcomingMilestoneInfo(staff.birthday, daysAhead);
      if (bdayInfo) {
        birthdays.push({
          staff,
          ...bdayInfo
        });
      }
    }

    // Check work anniversary
    const hireDateStr = staff.dateHired || staff.hireDate;
    if (hireDateStr) {
      const annivInfo = getUpcomingMilestoneInfo(hireDateStr, daysAhead);
      if (annivInfo && annivInfo.yearsCompleted >= 1) {
        anniversaries.push({
          staff,
          ...annivInfo
        });
      }
    }
  });

  birthdays.sort((a, b) => a.daysUntil - b.daysUntil);
  anniversaries.sort((a, b) => a.daysUntil - b.daysUntil);

  return { birthdays, anniversaries };
}
