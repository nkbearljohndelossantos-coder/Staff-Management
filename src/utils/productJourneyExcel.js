import * as XLSX from 'xlsx';

/**
 * Generates and downloads a multi-sheet printable Excel report for Product Journeys
 * Categorized by last procedure:
 *  - In Inventory
 *  - Claimed by Employee (whose employee)
 *  - Voided Back to Inventory
 *  - Master summary (All Product Journeys)
 */
export function exportProductJourneyExcel(productJourneys = []) {
  if (!productJourneys || productJourneys.length === 0) {
    alert('No product journeys to export.');
    return;
  }

  const generatedDate = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  // 1. MASTER SHEET: ALL PRODUCT JOURNEYS
  const masterData = productJourneys.map((j, idx) => ({
    'No.': idx + 1,
    'Batch / Lot #': j.batchNumber || 'N/A',
    'Barcode': j.barcode || 'N/A',
    'Product Name': j.productName || 'N/A',
    'Brand': j.brand || 'N/A',
    'Size': j.size || 'N/A',
    'Supplier / Company': j.supplier || 'N/A',
    'Quantity': j.quantity || 1,
    'Current Stage': j.milestones && j.milestones[j.currentStageIndex]?.stageName 
      ? j.milestones[j.currentStageIndex].stageName 
      : (j.currentProcedure || 'Inventory'),
    'Last Procedure': j.currentProcedure || (j.currentStageIndex === 4 ? 'Voided Back to Inventory' : j.currentStageIndex === 3 ? 'Claimed by Employee' : 'Inventory'),
    'Last Procedure Date': j.lastProcedureDate ? new Date(j.lastProcedureDate).toLocaleString() : new Date(j.updatedAt || Date.now()).toLocaleString(),
    'Claimed By Employee': j.claimedBy || (j.currentStageIndex >= 3 ? 'Unassigned' : 'N/A (Not Claimed)'),
    'Employee ID': j.claimedByEmployeeId || (j.currentStageIndex >= 3 ? '-' : 'N/A'),
    'Department': j.claimedByDepartment || (j.currentStageIndex >= 3 ? '-' : 'N/A'),
    'Claim Date': j.claimedAt ? new Date(j.claimedAt).toLocaleString() : (j.currentStageIndex >= 3 ? 'Recorded' : 'N/A'),
    'Void Date': j.voidedAt ? new Date(j.voidedAt).toLocaleString() : 'N/A',
    'Void Authorized By': j.voidedBy || 'N/A',
    'Void Reason / Notes': j.voidReason || (j.currentStageIndex === 4 ? 'Returned to active inventory' : 'None'),
    'Current Status': j.status || 'Active'
  }));

  // 2. CATEGORY 1: IN INVENTORY
  const inventoryJourneys = productJourneys.filter(j => 
    j.currentProcedure === 'Inventory' || 
    j.currentStageIndex === 2 || 
    (!j.currentProcedure && j.currentStageIndex < 3)
  );

  const inventoryData = inventoryJourneys.map((j, idx) => ({
    'Item #': idx + 1,
    'Batch / Lot #': j.batchNumber,
    'Barcode': j.barcode,
    'Product Name': j.productName,
    'Brand': j.brand || 'N/A',
    'Size': j.size || 'N/A',
    'Supplier / Company': j.supplier,
    'Quantity in Stock': j.quantity || 1,
    'Date Stocked in Inventory': j.lastProcedureDate ? new Date(j.lastProcedureDate).toLocaleString() : new Date(j.updatedAt || Date.now()).toLocaleString(),
    'Storage Location / Status': j.status || 'Canteen Pantry & Warehouse Shelves',
    'Inspector': j.inspector || 'Nannette MANUEL'
  }));

  // 3. CATEGORY 2: CLAIMED BY EMPLOYEE (Whose employee)
  const claimedJourneys = productJourneys.filter(j => 
    j.currentProcedure === 'Claimed by Employee' || 
    j.currentStageIndex === 3 ||
    (j.claimedBy && j.currentStageIndex !== 4)
  );

  const claimedData = claimedJourneys.map((j, idx) => ({
    'Claim #': idx + 1,
    'Batch / Lot #': j.batchNumber,
    'Barcode': j.barcode,
    'Product Name': j.productName,
    'Brand': j.brand || 'N/A',
    'Size': j.size || 'N/A',
    'Claimed Employee Name (Whose Employee)': j.claimedBy || 'Unassigned Staff',
    'Employee ID': j.claimedByEmployeeId || 'N/A',
    'Employee Department': j.claimedByDepartment || 'N/A',
    'Date & Time of Claim': j.claimedAt ? new Date(j.claimedAt).toLocaleString() : new Date(j.lastProcedureDate || j.updatedAt || Date.now()).toLocaleString(),
    'Handover Status': 'Officially Claimed & Verified',
    'Procedure History Note': j.milestones?.find(m => m.stageId === 'employee_claimed')?.note || j.status
  }));

  // 4. CATEGORY 3: VOIDED BACK TO INVENTORY
  const voidedJourneys = productJourneys.filter(j => 
    j.currentProcedure === 'Voided Back to Inventory' || 
    j.currentStageIndex === 4 ||
    j.stockRestored === true
  );

  const voidedData = voidedJourneys.map((j, idx) => ({
    'Void #': idx + 1,
    'Batch / Lot #': j.batchNumber,
    'Barcode': j.barcode,
    'Product Name': j.productName,
    'Brand': j.brand || 'N/A',
    'Size': j.size || 'N/A',
    'Original Claimant': j.claimedBy || 'N/A',
    'Claimant ID & Dept': j.claimedByEmployeeId ? (j.claimedByEmployeeId + ' (' + (j.claimedByDepartment || 'N/A') + ')') : 'N/A',
    'Date & Time Voided': j.voidedAt ? new Date(j.voidedAt).toLocaleString() : new Date(j.lastProcedureDate || j.updatedAt || Date.now()).toLocaleString(),
    'Void Authorized By (Supervisor)': j.voidedBy || 'Nannette MANUEL (Canteen Administrator)',
    'Supervisor Badge / Card ID': j.voidCardBadgeId || 'MGR-CARD-001',
    'Void Reason': j.voidReason || 'Order cancelled; items returned intact to inventory',
    'Stock Restored Status': j.stockRestored ? 'RESTOCKED (+1 Active Stock)' : 'Restored'
  }));

  // Build Workbook
  const wb = XLSX.utils.book_new();

  // Helper to create and style worksheets
  const addSheetWithAutoWidth = (data, sheetName) => {
    if (data.length === 0) {
      const wsEmpty = XLSX.utils.json_to_sheet([{ 'Status': 'No records recorded for this procedure category.' }]);
      XLSX.utils.book_append_sheet(wb, wsEmpty, sheetName);
      return;
    }

    const ws = XLSX.utils.json_to_sheet(data);

    // Calculate dynamic column widths based on maximum content length
    const colWidths = Object.keys(data[0]).map(key => {
      const headerLength = key.length;
      const maxValLength = Math.max(...data.map(row => String(row[key] || '').length));
      return { wch: Math.max(headerLength, maxValLength, 12) + 3 };
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };

  // Append Sheets in Order
  addSheetWithAutoWidth(masterData, 'All Product Journeys');
  addSheetWithAutoWidth(inventoryData, 'In Inventory');
  addSheetWithAutoWidth(claimedData, 'Claimed by Employee');
  addSheetWithAutoWidth(voidedData, 'Voided Back to Inventory');

  // Trigger Excel File Download
  const filenameDate = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, 'NKB_Product_Journey_Report_' + filenameDate + '.xlsx');
}