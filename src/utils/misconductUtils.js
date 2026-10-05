/**
 * Misconduct & Incident Reporting Standards for NKB Manufacturing
 * Handles misconduct categorizations, CCTV evidence metadata, and official HR Call-Out (Notice to Explain) memos.
 */

export const MISCONDUCT_CATEGORIES = [
  {
    id: 'ATTENDANCE_FRAUD',
    label: 'Attendance Fraud / Buddy Punching',
    description: 'Tampering with timekeeping kiosk, ghost clock-ins, or scanning badges on behalf of absent workers',
    defaultSeverity: 'MAJOR'
  },
  {
    id: 'THEFT_PILFERAGE',
    label: 'Theft / Pilferage / Unauthorized Property Removal',
    description: 'Unauthorized taking, concealing, or moving of raw materials, manufactured goods, canteen items, or equipment',
    defaultSeverity: 'CRITICAL'
  },
  {
    id: 'SAFETY_VIOLATION',
    label: 'Safety & PPE Violation / Operational Hazard',
    description: 'Failure to wear mandatory safety gear, reckless machinery operation, or endangering co-workers',
    defaultSeverity: 'MAJOR'
  },
  {
    id: 'INSUBORDINATION',
    label: 'Insubordination / Disregard of Lawful Order',
    description: 'Refusal to follow reasonable managerial directives, walking off assigned posts, or open defiance of supervisors',
    defaultSeverity: 'MODERATE'
  },
  {
    id: 'VIOLENCE_ALTERCATION',
    label: 'Physical Altercation / Harassment / Fighting',
    description: 'Engaging in physical fights, verbal assault, intimidation, or harassment within company premises',
    defaultSeverity: 'CRITICAL'
  },
  {
    id: 'SLEEPING_ON_DUTY',
    label: 'Sleeping on Duty / Post Abandonment',
    description: 'Sleeping during scheduled working hours or abandoning assigned factory/guard/cashier station',
    defaultSeverity: 'MODERATE'
  },
  {
    id: 'RESTRICTED_ACCESS',
    label: 'Unauthorized Area Access / Security Breach',
    description: 'Entering high-security server rooms, executive vaults, restricted chemical storage, or bypassing turnstiles',
    defaultSeverity: 'MAJOR'
  },
  {
    id: 'PROPERTY_DAMAGE',
    label: 'Company Property Damage / Asset Sabotage',
    description: 'Destruction, intentional mishandling, or negligence resulting in damage to plant facilities or machinery',
    defaultSeverity: 'MAJOR'
  },
  {
    id: 'CONTRABAND_PHONE',
    label: 'Unauthorized Phone / Camera in Production Zone',
    description: 'Using personal mobile devices or recording equipment in sensitive manufacturing cleanrooms or assembly lines',
    defaultSeverity: 'MINOR'
  },
  {
    id: 'SUBSTANCE_ABUSE',
    label: 'Substance / Alcohol / Contraband Possession',
    description: 'Intoxication, alcohol consumption, or possession of prohibited substances on company grounds',
    defaultSeverity: 'CRITICAL'
  },
  {
    id: 'OTHER_MISCONDUCT',
    label: 'Other Policy Infraction / Unprofessional Conduct',
    description: 'General breach of company code of conduct, company values, or departmental procedures',
    defaultSeverity: 'MODERATE'
  }
];

export const SEVERITY_LEVELS = [
  { id: 'MINOR', label: 'Minor Infraction', badgeClass: 'bg-slate-100 text-slate-800 border-slate-300' },
  { id: 'MODERATE', label: 'Moderate Violation', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'MAJOR', label: 'Major Offense', badgeClass: 'bg-orange-100 text-orange-800 border-orange-300' },
  { id: 'CRITICAL', label: 'Critical / Gross Misconduct', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' }
];

export const CALLOUT_URGENCIES = [
  { id: 'IMMEDIATE', label: 'Immediate Call-Out (Report within 1 Hour)', deadlineText: 'within 1 hour of receipt' },
  { id: 'TODAY', label: 'End of Shift Call-Out (Report before leaving premises)', deadlineText: 'before the end of your current shift today' },
  { id: 'SCHEDULED', label: 'Scheduled Hearing / Specified Time', deadlineText: 'at the scheduled date and time indicated below' }
];

export const REPORT_STATUSES = [
  { id: 'PENDING_EXPLANATION', label: 'Pending Explanation (HR Call-Out Active)', color: 'rose' },
  { id: 'ACKNOWLEDGED', label: 'Notice Acknowledged by Staff', color: 'amber' },
  { id: 'EXPLANATION_SUBMITTED', label: 'Written Explanation Submitted', color: 'sky' },
  { id: 'UNDER_HR_INVESTIGATION', label: 'Under Formal HR Investigation', color: 'indigo' },
  { id: 'RESOLVED_WARNED', label: 'Resolved (Written Warning Issued)', color: 'slate' },
  { id: 'RESOLVED_SUSPENDED', label: 'Resolved (Suspension Imposed)', color: 'orange' },
  { id: 'RESOLVED_DISMISSED', label: 'Resolved (Exonerated / Dismissed)', color: 'emerald' }
];

export const FACTORY_LOCATIONS = [
  'Production Line 1 (Main Assembly)',
  'Production Line 2 (Sub-Assembly)',
  'Packaging & Sorting Zone',
  'Raw Materials Warehouse',
  'Finished Goods Loading Bay',
  'Employee Canteen & Dining Hall',
  'Canteen Cashier & POS Terminal',
  'Turnstile Main Gate & Security Booth',
  'Locker Room & Changing Facilities',
  'Administration & Executive Offices',
  'Maintenance & Machine Tooling Workshop',
  'Perimeter & Vehicle Parking Grounds'
];

/**
 * Generates an official, editable Notice to Explain (NTE) memo text for HR Admin
 */
export function generateDefaultMisconductMemo({
  staffName = 'Employee',
  employeeId = 'NKB-0000',
  categoryLabel = 'Workplace Policy Violation',
  incidentDate = new Date().toISOString().split('T')[0],
  incidentTime = '12:00 PM',
  location = 'Company Premises',
  urgency = 'IMMEDIATE',
  scheduledTime = '',
  cameraInfo = '',
  hrOfficerName = 'Human Resources Management'
} = {}) {
  let callOutDirective = 'You are hereby directed to report IMMEDIATELY to the HR Office (Admin Bldg, 2nd Floor) within one (1) hour of receiving this notification.';
  if (urgency === 'TODAY') {
    callOutDirective = 'You are hereby directed to report to the HR Office (Admin Bldg, 2nd Floor) before the conclusion of your shift today.';
  } else if (urgency === 'SCHEDULED' && scheduledTime) {
    callOutDirective = `You are hereby directed to report to the HR Office (Admin Bldg, 2nd Floor) on ${scheduledTime} for a formal conference.`;
  }

  const cameraRef = cameraInfo ? ` Security CCTV footage recorded on ${cameraInfo} has been archived in support of this report.` : '';

  return `FORMAL NOTICE TO EXPLAIN (NTE) & IMMEDIATE HR CALL-OUT

TO: ${staffName} (${employeeId})
FROM: ${hrOfficerName}
DATE: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
SUBJECT: Notice to Explain - Alleged Incident of ${categoryLabel}

This official notice serves to inform you that on ${incidentDate} at approximately ${incidentTime} at ${location}, an alleged workplace incident involving ${categoryLabel} was formally documented.${cameraRef}

DIRECTIVE TO APPEAR:
${callOutDirective}

You are required to present your verbal and/or written explanation regarding the circumstances of the aforementioned incident. Failure to report as instructed or failure to submit your explanation within the prescribed timeframe may be considered a waiver of your opportunity to be heard, and the Company will proceed to evaluate the matter based on the evidence on record.

Please treat this notice with utmost urgency.`;
}
