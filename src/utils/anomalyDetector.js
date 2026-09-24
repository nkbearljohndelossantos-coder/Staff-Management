/**
 * Anomaly Detection & IT Evaluation Engine for NKB Manufacturing
 * Scans operational collections for security and audit irregularities.
 * Results are managed in the IT Admin tab, then evaluated for the Executive Dashboard.
 */

const EVALUATION_STORAGE_KEY = 'nkb_it_anomaly_evaluations';

export function getStoredEvaluations() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(EVALUATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveAnomalyEvaluation(anomalyId, evaluation) {
  if (typeof window === 'undefined') return;
  const evals = getStoredEvaluations();
  evals[anomalyId] = {
    ...evals[anomalyId],
    ...evaluation,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(EVALUATION_STORAGE_KEY, JSON.stringify(evals));
  return evals[anomalyId];
}

/**
 * Scans collections and detects active anomalies
 */
export function scanForAnomalies({
  attendanceLogs = [],
  canteenVoidLogs = [],
  canteenInventory = [],
  canteenReceipts = [],
  cashLoans = [],
  cashAdvances = [],
  staffList = []
}) {
  const anomalies = [];
  const evaluations = getStoredEvaluations();

  // 1. BUDDY PUNCHING DETECTION (punches within 3 seconds of each other)
  const sortedAttendance = [...attendanceLogs]
    .filter(a => a.timeIn)
    .sort((a, b) => new Date(`${a.date} ${a.timeIn}`).getTime() - new Date(`${b.date} ${b.timeIn}`).getTime());

  for (let i = 0; i < sortedAttendance.length - 1; i++) {
    const cur = sortedAttendance[i];
    const nxt = sortedAttendance[i + 1];

    if (cur.staffId !== nxt.staffId && cur.date === nxt.date) {
      const curTime = new Date(`${cur.date} ${cur.timeIn}`).getTime();
      const nxtTime = new Date(`${nxt.date} ${nxt.timeIn}`).getTime();
      const diffSec = Math.abs((nxtTime - curTime) / 1000);

      if (diffSec <= 3 && !isNaN(diffSec)) {
        const id = `anom-buddy-${cur.staffId}-${nxt.staffId}-${cur.date}`;
        const staff1 = staffList.find(s => s.id === cur.staffId);
        const staff2 = staffList.find(s => s.id === nxt.staffId);
        const staff1Name = cur.staffName || (staff1 ? `${staff1.firstName} ${staff1.lastName}` : cur.staffId);
        const staff2Name = nxt.staffName || (staff2 ? `${staff2.firstName} ${staff2.lastName}` : nxt.staffId);

        anomalies.push({
          id,
          category: 'ATTENDANCE',
          type: 'BUDDY_PUNCHING',
          severity: 'HIGH',
          title: 'Rapid Successive Punches (Suspected Buddy Punching)',
          description: `${staff1Name} (${cur.staffId}) and ${staff2Name} (${nxt.staffId}) clocked in within ${diffSec.toFixed(1)}s of each other at the plant kiosk on ${cur.date}.`,
          timestamp: `${cur.date} ${cur.timeIn}`,
          status: evaluations[id]?.status || 'PENDING_REVIEW',
          metadata: {
            staffId: cur.staffId,
            staffName: `${staff1Name} & ${staff2Name}`,
            deltaSeconds: Number(diffSec.toFixed(1))
          }
        });
      }
    }
  }

  // 2. HIGH VOID FREQUENCY (Supervisor card voids clustering)
  if (canteenVoidLogs.length >= 3) {
    const sortedVoids = [...canteenVoidLogs].sort((a, b) => {
      const tA = new Date(a.timestamp || a.voidedAt).getTime();
      const tB = new Date(b.timestamp || b.voidedAt).getTime();
      return tB - tA;
    });

    // Check if 3 or more voids occurred within a 2-hour window
    for (let i = 0; i <= sortedVoids.length - 3; i++) {
      const v1 = sortedVoids[i];
      const v3 = sortedVoids[i + 2];
      const t1 = new Date(v1.timestamp || v1.voidedAt).getTime();
      const t3 = new Date(v3.timestamp || v3.voidedAt).getTime();
      const diffHours = (t1 - t3) / (1000 * 60 * 60);

      if (diffHours <= 2 && !isNaN(diffHours)) {
        const id = `anom-voids-${v1.id}-${v3.id}`;
        if (!anomalies.some(a => a.id === id)) {
          anomalies.push({
            id,
            category: 'CANTEEN',
            type: 'HIGH_VOID_VELOCITY',
            severity: 'MEDIUM',
            title: 'Unusual Register Void Concentration',
            description: `3 supervisor card authorizations executed within ${diffHours.toFixed(1)} hours on register POS terminal.`,
            timestamp: v1.timestamp || v1.voidedAt || new Date().toISOString(),
            status: evaluations[id]?.status || 'PENDING_REVIEW',
            metadata: {
              voidCount: 3,
              timeWindow: `${diffHours.toFixed(1)} hrs`
            }
          });
        }
      }
    }
  }

  // 3. NEGATIVE INVENTORY BALANCE
  canteenInventory.forEach(item => {
    if (Number(item.quantity) < 0) {
      const id = `anom-neg-stock-${item.id}`;
      anomalies.push({
        id,
        category: 'CANTEEN',
        type: 'NEGATIVE_INVENTORY',
        severity: 'HIGH',
        title: `Negative Stock Level: ${item.name}`,
        description: `Product ${item.name} (${item.barcode || item.id}) has recorded stock of ${item.quantity}. Possible unrecorded stock receiving or inventory slip discrepancy.`,
        timestamp: new Date().toISOString(),
        status: evaluations[id]?.status || 'PENDING_REVIEW',
        metadata: {
          barcode: item.barcode,
          quantity: item.quantity,
          name: item.name
        }
      });
    }
  });

  // 4. LATE SALES TRANSACTION SPIKE (> 10:00 PM)
  canteenReceipts.forEach(receipt => {
    if (receipt.timestamp && receipt.status !== 'VOIDED') {
      const dateObj = new Date(receipt.timestamp);
      const hours = dateObj.getHours();
      if (hours >= 22 || hours < 5) {
        const id = `anom-late-sales-${receipt.id}`;
        if (!anomalies.some(a => a.id === id)) {
          anomalies.push({
            id,
            category: 'CANTEEN',
            type: 'AFTER_HOURS_TRANSACTION',
            severity: 'LOW',
            title: 'After-Hours POS Activity Registered',
            description: `Sale of ₱${Number(receipt.total).toFixed(2)} processed on ${dateObj.toLocaleDateString()} at ${dateObj.toLocaleTimeString()} outside scheduled day operational hours.`,
            timestamp: receipt.timestamp,
            status: evaluations[id]?.status || 'PENDING_REVIEW',
            metadata: {
              receiptNo: receipt.receiptNo || receipt.id,
              amount: receipt.total,
              time: dateObj.toLocaleTimeString()
            }
          });
        }
      }
    }
  });

  // 5. RAPID LOAN / ADVANCE REQUEST ACCUMULATION
  const staffLoanCounts = {};
  [...cashLoans, ...cashAdvances].forEach(loan => {
    if (!loan.staffId) return;
    staffLoanCounts[loan.staffId] = (staffLoanCounts[loan.staffId] || 0) + 1;
  });

  Object.entries(staffLoanCounts).forEach(([staffId, count]) => {
    if (count >= 3) {
      const id = `anom-rapid-loans-${staffId}`;
      const sample = [...cashLoans, ...cashAdvances].find(l => l.staffId === staffId);
      const staffMember = staffList.find(s => s.id === staffId);
      const staffName = sample?.staffName || (staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : staffId);

      anomalies.push({
        id,
        category: 'COOP',
        type: 'RAPID_LOAN_REQUESTS',
        severity: 'MEDIUM',
        title: 'High Credit Velocity Alert',
        description: `Staff member ${staffName} has ${count} concurrent active loans and canteen cash advances pending or disbursed.`,
        timestamp: new Date().toISOString(),
        status: evaluations[id]?.status || 'PENDING_REVIEW',
        metadata: {
          staffId,
          staffName,
          recentLoanCount: count
        }
      });
    }
  });

  return anomalies;
}

export const detectSystemAnomalies = scanForAnomalies;

/**
 * Derives Executive Risk Evaluation from IT Admin reviews
 */
export function computeExecutiveRiskSummary(anomalies = [], evaluations = {}) {
  const anomList = Array.isArray(anomalies) ? anomalies : [];
  const total = anomList.length;
  
  // evaluations may be passed in or loaded from storage
  const evals = (evaluations && Object.keys(evaluations).length > 0) ? evaluations : getStoredEvaluations();

  const confirmedAnomalies = anomList.filter(a => {
    const ev = evals[a.id];
    return ev?.status === 'CONFIRMED_ANOMALY';
  });

  const clearedLegitimate = anomList.filter(a => {
    const ev = evals[a.id];
    return ev?.status === 'CLEARED_LEGITIMATE' || ev?.status === 'ACTION_TAKEN';
  });

  const pendingReview = anomList.filter(a => {
    const ev = evals[a.id];
    return !ev || ev.status === 'UNDER_REVIEW' || ev.status === 'PENDING_REVIEW';
  });

  const confirmedCount = confirmedAnomalies.length;
  const clearedCount = clearedLegitimate.length;
  const pendingCount = pendingReview.length;

  let riskLevel = 'LOW';
  let systemRiskScore = Math.max(10, 100 - (confirmedCount * 25) - (pendingCount * 5));
  if (confirmedCount >= 2) {
    riskLevel = 'HIGH';
  } else if (confirmedCount === 1 || pendingCount >= 3) {
    riskLevel = 'MODERATE';
  }

  // Executive alerts: only confirmed anomalies evaluated by IT
  const executiveAlerts = confirmedAnomalies.map(a => ({
    ...a,
    evaluation: evals[a.id]
  }));

  return {
    systemRiskScore,
    riskLevel,
    overallRisk: riskLevel,
    healthScore: systemRiskScore,
    totalDetected: total,
    totalFlags: total,
    pendingReviewCount: pendingCount,
    openFlags: pendingCount,
    clearedCount,
    reviewedFlags: clearedCount,
    confirmedRisks: confirmedCount,
    executiveAlerts,
    statusLabel: riskLevel === 'LOW' ? 'Operational Integrity Verified' : riskLevel === 'MODERATE' ? 'Moderate Risk Detected' : 'High Security Priority',
    summary: `${pendingCount} potential anomalies under IT review. ${confirmedCount} confirmed risks escalated to Executive Dashboard.`
  };
}
