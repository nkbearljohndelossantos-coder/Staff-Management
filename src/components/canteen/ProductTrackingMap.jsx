import React, { useState } from 'react';
import { 
  Building2, 
  Truck, 
  PackageCheck, 
  Store, 
  ScanBarcode, 
  UserCheck, 
  Footprints, 
  Clock, 
  Thermometer, 
  Compass, 
  Radio, 
  CheckCircle2, 
  ShieldCheck,
  RotateCcw,
  User,
  Users,
  Edit3,
  X,
  Check,
  FileSpreadsheet,
  Printer,
  ShoppingCart,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PRODUCT_JOURNEY_STAGES } from '../../data/mockData';
import { exportProductJourneyExcel } from '../../utils/productJourneyExcel';

export default function ProductTrackingMap() {
  const { 
    productJourneys, 
    advanceProductJourneyStage, 
    voidProductJourneyToInventory,
    updateProductJourneyClaimant, 
    resetProductJourney,
    staffList,
    departments,
    currentUser
  } = useApp();

  const [selectedJourneyId, setSelectedJourneyId] = useState(
    productJourneys[0]?.id || 'journey-1'
  );

  // Modals
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showChangeClaimantModal, setShowChangeClaimantModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [showPrintReportModal, setShowPrintReportModal] = useState(false);

  // Form states
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [voidReasonInput, setVoidReasonInput] = useState('Employee emergency shift call-out; order cancelled and items returned intact to inventory');
  const [voidSupervisorInput, setVoidSupervisorInput] = useState(currentUser?.name ? `${currentUser.name} (Supervisor)` : 'Authorized Supervisor');
  const [voidCardBadgeInput, setVoidCardBadgeInput] = useState('MGR-CARD-001');

  const activeJourney = productJourneys.find(j => j.id === selectedJourneyId) || productJourneys[0];
  const currentStageIndex = activeJourney?.currentStageIndex || 0;
  const currentStage = PRODUCT_JOURNEY_STAGES[currentStageIndex] || PRODUCT_JOURNEY_STAGES[0];

  const getStageIcon = (id) => {
    switch (id) {
      case 'ordered': return ShoppingCart;
      case 'receiving_dock': return PackageCheck;
      case 'inventory': return Store;
      case 'employee_claimed': return UserCheck;
      case 'voided_back': return RotateCcw;
      default: return Store;
    }
  };

  const isAtFinalStage = currentStageIndex >= PRODUCT_JOURNEY_STAGES.length - 1;

  // Handle Advance Walk Trigger
  const handleAdvanceWalk = () => {
    // Stage 2 (inventory) -> Stage 3 (employee_claimed)
    if (currentStageIndex === 2) {
      const matchingStaff = staffList?.find(s => 
        s.id === activeJourney.claimedByStaffId || 
        s.employeeId === activeJourney.claimedByEmployeeId ||
        `${s.firstName} ${s.lastName}`.toLowerCase() === activeJourney.claimedBy?.toLowerCase()
      );
      setSelectedStaffId(matchingStaff ? matchingStaff.id : (staffList?.[0]?.id || ''));
      setShowHandoverModal(true);
    } 
    // Stage 3 (employee_claimed) -> Stage 4 (voided_back)
    else if (currentStageIndex === 3) {
      setShowVoidModal(true);
    } 
    else {
      advanceProductJourneyStage(activeJourney.id);
    }
  };

  // Confirm Handover to Employee
  const handleConfirmHandover = () => {
    const staff = staffList?.find(s => s.id === selectedStaffId);
    const dept = departments?.find(d => d.id === staff?.departmentId);
    const claimantInfo = staff ? {
      name: `${staff.firstName} ${staff.lastName}`,
      staffId: staff.id,
      employeeId: staff.employeeId,
      department: dept ? dept.name : (staff.departmentName || staff.departmentId)
    } : null;

    advanceProductJourneyStage(activeJourney.id, claimantInfo);
    setShowHandoverModal(false);
  };

  // Confirm Void Back to Inventory
  const handleConfirmVoid = () => {
    advanceProductJourneyStage(activeJourney.id, {
      reason: voidReasonInput.trim(),
      voidedBy: voidSupervisorInput.trim(),
      badgeId: voidCardBadgeInput.trim()
    });
    setShowVoidModal(false);
  };

  // Change / Reassign Claimant
  const handleSaveNewClaimant = () => {
    const staff = staffList?.find(s => s.id === selectedStaffId);
    const dept = departments?.find(d => d.id === staff?.departmentId);
    if (staff) {
      updateProductJourneyClaimant(activeJourney.id, {
        name: `${staff.firstName} ${staff.lastName}`,
        staffId: staff.id,
        employeeId: staff.employeeId,
        department: dept ? dept.name : (staff.departmentName || staff.departmentId)
      });
    }
    setShowChangeClaimantModal(false);
  };

  // Groupings for Categorized Report
  const inventoryJourneys = productJourneys.filter(j => 
    j.currentProcedure === 'Inventory' || 
    j.currentStageIndex === 2 || 
    (!j.currentProcedure && j.currentStageIndex < 3)
  );

  const claimedJourneys = productJourneys.filter(j => 
    j.currentProcedure === 'Claimed by Employee' || 
    j.currentStageIndex === 3 ||
    (j.claimedBy && j.currentStageIndex !== 4)
  );

  const voidedJourneys = productJourneys.filter(j => 
    j.currentProcedure === 'Voided Back to Inventory' || 
    j.currentStageIndex === 4 ||
    j.stockRestored === true
  );

  if (!activeJourney) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md text-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-white">
                <Compass className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                  Live Product Journey &amp; Systematic Route Map
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ordered → Receiving Dock → Inventory → Employee Claimed → Voided Back to Inventory.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportProductJourneyExcel(productJourneys)}
                className="h-10 px-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
              >
                <FileSpreadsheet className="h-4 w-4 text-white" />
                <span>Export Printable Excel</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center shadow-md">
          <Package className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white mb-1">No Active Product Journey Records</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All demo product journeys have been cleared. As inbound inventory supplies are scanned and received in the Canteen Hub, live product journeys will be tracked here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Controller Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm text-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-white">
              <Compass className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                  Live Product Journey &amp; Systematic Route Map
                </h3>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-[10px] font-bold text-slate-300">
                  <Radio className="h-2.5 w-2.5 text-slate-400 animate-pulse" />
                  5-Stage Systematic Lifecycle
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ordered → Receiving Dock → Inventory → Employee Claimed → Voided Back to Inventory.
              </p>
            </div>
          </div>

          {/* Export & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Download Printable Excel Button */}
            <button
              type="button"
              onClick={() => exportProductJourneyExcel(productJourneys)}
              className="h-10 px-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
              title="Download structured multi-sheet Excel report (.xlsx) categorized by last procedure with dates"
            >
              <FileSpreadsheet className="h-4 w-4 text-white" />
              <span>Export Printable Excel</span>
            </button>

            {/* Print Procedure Report Modal Button */}
            <button
              type="button"
              onClick={() => setShowPrintReportModal(true)}
              className="h-10 px-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
              title="Open categorized printable report view with print stylesheet"
            >
              <Printer className="h-4 w-4 text-white" />
              <span>Print Report</span>
            </button>

          </div>

        </div>

        {/* Second Row: Batch Selector & Walk Controls */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Select Tracked Product Batch
              </label>
              <select
                value={selectedJourneyId}
                onChange={(e) => setSelectedJourneyId(e.target.value)}
                className="h-10 px-3 pr-8 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-slate-500 cursor-pointer max-w-[300px] truncate"
              >
                {productJourneys.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.productName} ({j.batchNumber}) {j.claimedBy ? `→ Claimed: ${j.claimedBy}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Change Claimant Button */}
            <div className="self-end">
              <button
                type="button"
                onClick={() => {
                  const matchingStaff = staffList?.find(s => 
                    s.id === activeJourney.claimedByStaffId || 
                    s.employeeId === activeJourney.claimedByEmployeeId ||
                    `${s.firstName} ${s.lastName}`.toLowerCase() === activeJourney.claimedBy?.toLowerCase()
                  );
                  setSelectedStaffId(matchingStaff ? matchingStaff.id : (staffList?.[0]?.id || ''));
                  setShowChangeClaimantModal(true);
                }}
                className="h-10 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Change or reassign the employee claiming this product"
              >
                <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                <span>Claimant: <strong className="text-white underline decoration-slate-600 ml-1">{activeJourney.claimedBy || 'Assign'}</strong></span>
              </button>
            </div>
          </div>

          {/* Advance Walk & Reset */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAdvanceWalk}
              disabled={isAtFinalStage}
              className={`h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm ${
                isAtFinalStage
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-white hover:bg-slate-200 text-slate-950'
              }`}
            >
              {isAtFinalStage ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-slate-500" />
                  Voided Back to Inventory
                </>
              ) : currentStageIndex === 2 ? (
                <>
                  <UserCheck className="h-4 w-4 text-slate-950" />
                  Execute Employee Claim (Handover)
                </>
              ) : currentStageIndex === 3 ? (
                <>
                  <RotateCcw className="h-4 w-4 text-slate-950" />
                  Void Back to Inventory
                </>
              ) : (
                <>
                  <Footprints className="h-4 w-4 text-slate-950" />
                  Advance Stage Walk
                </>
              )}
            </button>

            {/* Direct Void Button if at Stage 3 */}
            {currentStageIndex === 3 && (
              <button
                type="button"
                onClick={() => setShowVoidModal(true)}
                className="h-10 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-1.5"
                title="Void product back to stock inventory with supervisor audit"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-300" />
                <span>Void to Stock</span>
              </button>
            )}

            {/* Reset Replay Button */}
            <button
              type="button"
              onClick={() => resetProductJourney(activeJourney.id)}
              className="h-10 px-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-1"
              title="Reset this product journey back to Stage 1: Ordered"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Systematic Product Walking Map Visualizer (5 STAGES) */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden">
        
        {/* Subtle Map Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

        {/* Map Header */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-800/80">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              System Route Topology (5 Lifecycle Procedures)
            </span>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
              <span>{activeJourney.productName}</span>
              {activeJourney.size && (
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-200">
                  {activeJourney.size}
                </span>
              )}
              <span className="font-mono text-xs text-slate-400 font-normal">[{activeJourney.barcode}]</span>
            </h4>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <Thermometer className="h-3.5 w-3.5 text-slate-400" />
              Temp: <strong className="text-slate-200">{activeJourney.temperature}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Truck className="h-3.5 w-3.5 text-slate-400" />
              Carrier: <strong className="text-slate-200">{activeJourney.carrier}</strong>
            </span>
          </div>
        </div>

        {/* Stations Route Pipeline (5 Nodes) */}
        <div className="relative z-10 py-6">
          
          {/* Connecting Progress Track Line */}
          <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1.5 bg-slate-800 rounded-full hidden md:block">
            <div 
              className="h-full bg-white transition-all duration-700 ease-in-out rounded-full"
              style={{ width: `${(currentStageIndex / (PRODUCT_JOURNEY_STAGES.length - 1)) * 100}%` }}
            />
          </div>

          {/* Map Node Stations (5 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-3 relative">
            {PRODUCT_JOURNEY_STAGES.map((stage, idx) => {
              const Icon = getStageIcon(stage.id);
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const isUpcoming = idx > currentStageIndex;

              return (
                <div 
                  key={stage.id} 
                  className={`flex flex-col items-center text-center transition-all duration-300 relative group ${
                    isCurrent ? 'scale-105' : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  
                  {/* Station Node Badge */}
                  <div className="relative mb-3">
                    
                    {/* Pulsing Aura if Product is Walking Here */}
                    {isCurrent && (
                      <span className="absolute -inset-2 rounded-2xl bg-white/20 animate-ping opacity-60 pointer-events-none" />
                    )}

                    <div 
                      className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 shadow-lg ${
                        isCurrent 
                          ? 'bg-white text-slate-950 border-white ring-4 ring-white/10' 
                          : isPast 
                          ? 'bg-slate-900 text-white border-slate-600' 
                          : 'bg-slate-950 text-slate-600 border-slate-800'
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${isCurrent ? 'text-slate-950' : isPast ? 'text-white' : 'text-slate-600'}`} />
                    </div>

                    {/* Step Number Tag */}
                    <span 
                      className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center border ${
                        isCurrent 
                          ? 'bg-slate-950 text-white border-white' 
                          : isPast 
                          ? 'bg-slate-800 text-slate-300 border-slate-700' 
                          : 'bg-slate-900 text-slate-600 border-slate-800'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </div>

                  {/* Active Product "Walking" Indicator Pill */}
                  {isCurrent && (
                    <div className="mb-2 px-2.5 py-1 rounded-full bg-white text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md animate-bounce">
                      <Footprints className="h-3 w-3 text-slate-950" />
                      Walking Here
                    </div>
                  )}

                  {/* Station Titles */}
                  <span className={`text-xs font-bold leading-tight ${isCurrent ? 'text-white' : isPast ? 'text-slate-300' : 'text-slate-500'}`}>
                    {stage.name}
                  </span>
                  
                  {/* FOR STAGE 4: EMPLOYEE CLAIMED (DISPLAY CLAIMANT EMPLOYEE DETAILS) */}
                  {stage.id === 'employee_claimed' ? (
                    <div className={`mt-2 w-full max-w-[170px] p-2.5 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-white text-slate-950 border-white shadow-xl ring-2 ring-white/30'
                        : isPast
                        ? 'bg-slate-900 text-slate-100 border-slate-700 shadow-md'
                        : 'bg-slate-950/90 text-slate-300 border-slate-800'
                    }`}>
                      <div className={`flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider mb-1 ${
                        isCurrent ? 'text-slate-700' : 'text-slate-400'
                      }`}>
                        <UserCheck className={`h-3 w-3 ${isCurrent ? 'text-slate-950' : 'text-slate-300'}`} />
                        <span>{isPast || isCurrent ? 'Claimed By:' : 'Target Claimant:'}</span>
                      </div>
                      <div className={`font-black text-xs leading-tight truncate ${
                        isCurrent ? 'text-slate-950 font-black' : 'text-white'
                      }`}>
                        {activeJourney.claimedBy || 'Unassigned Staff'}
                      </div>
                      <div className={`text-[9px] font-mono mt-0.5 truncate ${
                        isCurrent ? 'text-slate-700 font-bold' : 'text-slate-400'
                      }`}>
                        {activeJourney.claimedByEmployeeId || ''} {activeJourney.claimedByDepartment ? `· ${activeJourney.claimedByDepartment}` : ''}
                      </div>

                      <div className="mt-1.5 pt-1.5 border-t border-slate-700/50">
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950 text-white text-[8px] font-black uppercase tracking-wider">
                            <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                            Claim Complete
                          </span>
                        )}
                        {isPast && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[8px] font-bold uppercase tracking-wider">
                            Claim Handover Done
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                            Awaiting Claim
                          </span>
                        )}
                      </div>
                    </div>
                  ) : stage.id === 'voided_back' ? (
                    /* FOR STAGE 5: VOIDED BACK TO INVENTORY */
                    <div className={`mt-2 w-full max-w-[170px] p-2.5 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-white text-slate-950 border-white shadow-xl ring-2 ring-white/30'
                        : isPast
                        ? 'bg-slate-900 text-slate-100 border-slate-700 shadow-md'
                        : 'bg-slate-950/90 text-slate-300 border-slate-800'
                    }`}>
                      <div className={`flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider mb-1 ${
                        isCurrent ? 'text-slate-700' : 'text-slate-400'
                      }`}>
                        <RotateCcw className={`h-3 w-3 ${isCurrent ? 'text-slate-950' : 'text-slate-300'}`} />
                        <span>Restock Void</span>
                      </div>
                      <div className={`font-black text-xs leading-tight truncate ${
                        isCurrent ? 'text-slate-950 font-black' : 'text-white'
                      }`}>
                        {isCurrent ? (activeJourney.voidedBy || 'Restocked to Shelves') : 'Return Void'}
                      </div>
                      <div className={`text-[9px] font-mono mt-0.5 truncate ${
                        isCurrent ? 'text-slate-700 font-bold' : 'text-slate-400'
                      }`}>
                        {isCurrent ? (activeJourney.voidReason || 'Order Cancelled') : 'Inventory Restock'}
                      </div>
                      {isCurrent && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-700/50">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950 text-white text-[8px] font-black uppercase tracking-wider">
                            ✓ Restocked (+1)
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed max-w-[140px]">
                      {stage.description}
                    </span>
                  )}

                  {/* Checkpoint Status Badge */}
                  <div className="mt-2">
                    {isPast && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                        Passed
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-white text-slate-950">
                        Live Point
                      </span>
                    )}
                    {isUpcoming && (
                      <span className="text-[9px] font-medium uppercase text-slate-600">
                        Scheduled
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* Live Telemetry Card for Current Station & Claimant Details */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-slate-300">
          
          {/* Card 1: Geographic Location */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Current Procedure Stage
            </span>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-slate-400" />
              {currentStage.name}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
              {activeJourney.status}
            </p>
          </div>

          {/* Card 2: DEDICATED EMPLOYEE HANDOVER & CLAIM CARD */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            currentStage.id === 'employee_claimed'
              ? 'bg-slate-900 border-white ring-2 ring-white/10'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Claiming Employee
              </span>
              {currentStage.id === 'employee_claimed' && (
                <span className="px-1.5 py-0.2 rounded bg-white text-slate-950 text-[8px] font-black uppercase">
                  Claimed
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-slate-300" />
              <span className="truncate">{activeJourney.claimedBy || 'Unassigned'}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-mono truncate">
              {activeJourney.claimedByEmployeeId || 'ID: Pending'} {activeJourney.claimedByDepartment ? `· ${activeJourney.claimedByDepartment}` : ''}
            </p>
            <div className="mt-1 text-[9px] font-semibold text-slate-300">
              {activeJourney.claimedAt 
                ? `Claimed: ${new Date(activeJourney.claimedAt).toLocaleDateString()}` 
                : (currentStage.id === 'employee_claimed' ? '✓ Claimed & Released' : '⏳ Ready for Claim')}
            </div>
          </div>

          {/* Card 3: Cold Chain & Climate */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Cold Chain &amp; Climate
            </span>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Thermometer className="h-3.5 w-3.5 text-slate-400" />
              {activeJourney.temperature} · {activeJourney.humidity} RH
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Sensors calibrated &amp; compliant
            </p>
          </div>

          {/* Card 4: Logistics Unit & Carrier */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Logistics Unit &amp; Carrier
            </span>
            <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
              <Truck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{activeJourney.carrier}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate">
              Inspector: {activeJourney.inspector}
            </p>
          </div>

          {/* Card 5: Supplier & Lot Number */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Supplier &amp; Batch
            </span>
            <div className="text-xs font-bold text-white flex items-center gap-1.5 font-mono truncate">
              {activeJourney.batchNumber}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate">
              {activeJourney.supplier}
            </p>
          </div>

        </div>

      </div>

      {/* Systematic Milestones Walk Trail History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-slate-200">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Systematic Milestones Trail ({activeJourney.milestones?.length || 0} Registered Stages)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Updated: {new Date(activeJourney.updatedAt).toLocaleTimeString()}
          </span>
        </div>

        <div className="space-y-3">
          {activeJourney.milestones?.map((m, idx) => {
            const stageConfig = PRODUCT_JOURNEY_STAGES.find(s => s.id === m.stageId);
            const Icon = getStageIcon(m.stageId);
            const isClaimMilestone = m.stageId === 'employee_claimed';
            const isVoidMilestone = m.stageId === 'voided_back';

            return (
              <div 
                key={idx} 
                className={`flex items-start gap-3 p-3 rounded-xl border text-xs transition-all ${
                  isClaimMilestone || isVoidMilestone
                    ? 'bg-slate-950 border-slate-700 ring-1 ring-slate-600'
                    : 'bg-slate-950/60 border-slate-800/80'
                }`}
              >
                <div className={`p-2 rounded-lg border shrink-0 ${
                  isClaimMilestone || isVoidMilestone
                    ? 'bg-white text-slate-950 border-white'
                    : 'bg-slate-900 text-slate-300 border-slate-800'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        Stage {idx + 1}: {stageConfig?.name || m.stageName || m.stageId}
                      </span>
                      {isClaimMilestone && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-white text-[9px] font-mono font-bold border border-slate-700">
                          Official Employee Claim
                        </span>
                      )}
                      {isVoidMilestone && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-white text-[9px] font-mono font-bold border border-slate-700">
                          Authorized Return / Void
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(m.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    {m.note}
                  </p>

                  {/* PROMINENT CLAIMING EMPLOYEE BADGE ON HANDOVER MILESTONE */}
                  {isClaimMilestone && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-slate-300" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
                            Claimed &amp; Received by Employee:
                          </span>
                          <span className="text-xs font-black text-white">
                            {activeJourney.claimedBy || 'Registered Staff'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 ml-1.5">
                            [{activeJourney.claimedByEmployeeId}] · {activeJourney.claimedByDepartment}
                          </span>
                        </div>
                      </div>

                      <div className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono font-bold border border-slate-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-slate-300" />
                        <span>Digital Signature Verified</span>
                      </div>
                    </div>
                  )}

                  {/* PROMINENT VOID DETAILS ON VOID MILESTONE */}
                  {isVoidMilestone && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="h-4 w-4 text-slate-300" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
                            Voided Back to Inventory:
                          </span>
                          <span className="text-xs font-bold text-white">
                            Authorized by {activeJourney.voidedBy || 'Supervisor'} [{activeJourney.voidCardBadgeId || 'MGR-CARD'}]
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Reason: {activeJourney.voidReason}
                          </span>
                        </div>
                      </div>

                      <div className="px-2 py-0.5 rounded-md bg-slate-800 text-white text-[10px] font-mono font-bold border border-slate-700">
                        Stock Restored (+1)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* MODAL 1: CONFIRM EMPLOYEE HANDOVER & CLAIM                       */}
      {/* ---------------------------------------------------------------- */}
      {showHandoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-slate-200 animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-white">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Confirm Employee Handover &amp; Claim
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Stage 4 of 5 · Physical Item Handover &amp; Digital Ledger Signature
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHandoverModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4 text-xs">
              
              {/* Product Info Card */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Item to be Handed Over:
                </span>
                <h4 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>{activeJourney.productName}</span>
                  <span className="font-mono text-xs text-slate-400 font-normal">{activeJourney.barcode}</span>
                </h4>
                <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                  <span>Batch: <strong className="text-slate-200 font-mono">{activeJourney.batchNumber}</strong></span>
                  {activeJourney.size && <span>Size: <strong className="text-slate-200">{activeJourney.size}</strong></span>}
                </div>
              </div>

              {/* Claimant Selector (All 92 Masterlist Staff) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  Select Employee Claiming the Product ({staffList?.length} Masterlist Staff)
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-500 cursor-pointer"
                >
                  {staffList?.map(s => {
                    const dept = departments?.find(d => d.id === s.departmentId);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.employeeId}) — {dept ? dept.name : (s.departmentName || s.departmentId)}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  The selected employee's full name, employee ID, and department will be stamped permanently on this product's handover trail.
                </p>
              </div>

              {/* Handover Protocol Checklist */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-[11px]">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>Physical item inspected &amp; serial barcode verified</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>Employee identity badge verified against Employee Masterlist</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>Electronic ledger signed and recorded for printable Excel export</span>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowHandoverModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmHandover}
                className="px-5 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-950 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Check className="h-4 w-4 text-slate-950" />
                Confirm Handover &amp; Complete Claim
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL 2: CONFIRM VOID BACK TO INVENTORY                         */}
      {/* ---------------------------------------------------------------- */}
      {showVoidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-slate-200 animate-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-white">
                  <RotateCcw className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Void Product Back to Inventory
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Stage 5 of 5 · Authorized Return &amp; Stock Count Restoration
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVoidModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Item Being Returned:
                </span>
                <h4 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>{activeJourney.productName}</span>
                  <span className="font-mono text-xs text-slate-400">{activeJourney.barcode}</span>
                </h4>
                <div className="text-[11px] text-slate-400 pt-1">
                  Original Claimant: <strong className="text-white">{activeJourney.claimedBy || 'N/A'}</strong> ({activeJourney.claimedByEmployeeId || ''})
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Reason for Void / Return
                </label>
                <input
                  type="text"
                  value={voidReasonInput}
                  onChange={(e) => setVoidReasonInput(e.target.value)}
                  placeholder="e.g., Employee shift reassigned, order cancelled..."
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Authorized By (Supervisor)
                  </label>
                  <input
                    type="text"
                    value={voidSupervisorInput}
                    onChange={(e) => setVoidSupervisorInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Supervisor Badge ID
                  </label>
                  <input
                    type="text"
                    value={voidCardBadgeInput}
                    onChange={(e) => setVoidCardBadgeInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Inventory Restoration Notice:</strong> Completing this void will restore stock (+1) back to active Canteen inventory shelves and finalize the lifecycle.
                </span>
              </div>

            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowVoidModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                className="px-5 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-950 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <RotateCcw className="h-4 w-4 text-slate-950" />
                Confirm Void &amp; Restock Inventory
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL 3: CHANGE / REASSIGN CLAIMANT                             */}
      {/* ---------------------------------------------------------------- */}
      {showChangeClaimantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-slate-200 animate-in zoom-in-95 duration-150">
            
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-white" />
                <h3 className="text-xs font-black text-white">
                  Reassign Product Claiming Employee
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChangeClaimantModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono block">Product:</span>
                <span className="font-bold text-white text-xs">{activeJourney.productName}</span>
                <span className="text-[11px] text-slate-400 block font-mono">[{activeJourney.batchNumber}]</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select New Claiming Employee ({staffList?.length} Staff Available)
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-500 cursor-pointer"
                >
                  {staffList?.map(s => {
                    const dept = departments?.find(d => d.id === s.departmentId);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.employeeId}) — {dept ? dept.name : (s.departmentName || s.departmentId)}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowChangeClaimantModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewClaimant}
                className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 text-xs font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Check className="h-3.5 w-3.5 text-slate-950" />
                Update Claimant
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL 4: PRINTABLE AUDIT REPORT (CATEGORIZED BY PROCEDURE)       */}
      {/* ---------------------------------------------------------------- */}
      {showPrintReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-150 border border-slate-200">
            
            {/* Modal Header & Action Buttons (Hidden on Print) */}
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-white" />
                <div>
                  <h3 className="text-sm font-black">Printable Product Journey Audit Report</h3>
                  <p className="text-[11px] text-slate-400">Categorized by last procedure: Inventory, Claimed by Employee, Voided Back</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportProductJourneyExcel(productJourneys)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-white" />
                  Export .XLSX
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-950" />
                  Print Document
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintReportModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Report Document Body */}
            <div className="p-8 space-y-6 text-xs text-slate-800">
              
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    NKB INDUSTRIAL MANUFACTURING &amp; CANTEEN OPERATIONS
                  </span>
                  <h2 className="text-xl font-black text-slate-950 tracking-tight">
                    Product Lifecycle &amp; Procedure Audit Report
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Categorized by Last Operational Procedure · Verified with Employee Masterlist
                  </p>
                </div>

                <div className="text-right font-mono text-xs text-slate-600">
                  <div><strong>Date:</strong> {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</div>
                  <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
                  <div className="text-[10px] text-slate-500">Total Tracked Items: {productJourneys.length}</div>
                </div>
              </div>

              {/* 1. CATEGORY: IN INVENTORY */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-300">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Store className="h-4 w-4 text-slate-700" />
                    1. In Inventory ({inventoryJourneys.length} Items)
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">Active Stock on Canteen &amp; Warehouse Shelves</span>
                </div>

                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-[10px] font-extrabold uppercase text-slate-700">
                    <tr>
                      <th className="p-2 border-b">Batch #</th>
                      <th className="p-2 border-b">Product Name</th>
                      <th className="p-2 border-b">Brand &amp; Size</th>
                      <th className="p-2 border-b">Supplier</th>
                      <th className="p-2 border-b text-center">Qty</th>
                      <th className="p-2 border-b">Procedure Date</th>
                      <th className="p-2 border-b">Current Location / Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {inventoryJourneys.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-3 text-center text-slate-400">No items currently in inventory stage.</td>
                      </tr>
                    ) : (
                      inventoryJourneys.map(j => (
                        <tr key={j.id}>
                          <td className="p-2 font-mono font-bold text-slate-900">{j.batchNumber}</td>
                          <td className="p-2 font-bold text-slate-900">{j.productName}</td>
                          <td className="p-2 text-slate-700">{j.brand || 'N/A'} {j.size ? `(${j.size})` : ''}</td>
                          <td className="p-2 text-slate-600">{j.supplier}</td>
                          <td className="p-2 text-center font-bold">{j.quantity || 1}</td>
                          <td className="p-2 font-mono text-slate-600">{j.lastProcedureDate ? new Date(j.lastProcedureDate).toLocaleDateString() : 'Active'}</td>
                          <td className="p-2 text-slate-600">{j.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 2. CATEGORY: CLAIMED BY EMPLOYEE (Whose Employee) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-300">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-slate-700" />
                    2. Claimed by Employee ({claimedJourneys.length} Items)
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">Handed Over &amp; Signed in Digital Ledger</span>
                </div>

                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-[10px] font-extrabold uppercase text-slate-700">
                    <tr>
                      <th className="p-2 border-b">Batch #</th>
                      <th className="p-2 border-b">Product &amp; Size</th>
                      <th className="p-2 border-b">Claimed Employee (Whose Employee)</th>
                      <th className="p-2 border-b">Employee ID</th>
                      <th className="p-2 border-b">Department</th>
                      <th className="p-2 border-b">Date &amp; Time Claimed</th>
                      <th className="p-2 border-b">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {claimedJourneys.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-3 text-center text-slate-400">No items claimed by employees yet.</td>
                      </tr>
                    ) : (
                      claimedJourneys.map(j => (
                        <tr key={j.id} className="bg-slate-50/50">
                          <td className="p-2 font-mono font-bold text-slate-900">{j.batchNumber}</td>
                          <td className="p-2">
                            <span className="font-bold text-slate-900">{j.productName}</span>
                            {j.size && <span className="ml-1 text-[11px] font-mono text-slate-600">[{j.size}]</span>}
                          </td>
                          <td className="p-2 font-black text-slate-950">{j.claimedBy || 'Unassigned Staff'}</td>
                          <td className="p-2 font-mono text-slate-700">{j.claimedByEmployeeId || 'N/A'}</td>
                          <td className="p-2 text-slate-700">{j.claimedByDepartment || 'N/A'}</td>
                          <td className="p-2 font-mono text-slate-600">
                            {j.claimedAt ? new Date(j.claimedAt).toLocaleString() : (j.lastProcedureDate ? new Date(j.lastProcedureDate).toLocaleString() : 'Recorded')}
                          </td>
                          <td className="p-2 font-semibold text-slate-900">Claimed &amp; Released</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 3. CATEGORY: VOIDED BACK TO INVENTORY */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-300">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <RotateCcw className="h-4 w-4 text-slate-700" />
                    3. Voided Back to Inventory ({voidedJourneys.length} Items)
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">Restored to Inventory with Supervisor Audit</span>
                </div>

                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-[10px] font-extrabold uppercase text-slate-700">
                    <tr>
                      <th className="p-2 border-b">Batch #</th>
                      <th className="p-2 border-b">Product &amp; Size</th>
                      <th className="p-2 border-b">Original Claimant</th>
                      <th className="p-2 border-b">Date &amp; Time Voided</th>
                      <th className="p-2 border-b">Supervisor Authorized</th>
                      <th className="p-2 border-b">Reason for Void</th>
                      <th className="p-2 border-b text-center">Restocked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {voidedJourneys.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-3 text-center text-slate-400">No voided items recorded.</td>
                      </tr>
                    ) : (
                      voidedJourneys.map(j => (
                        <tr key={j.id}>
                          <td className="p-2 font-mono font-bold text-slate-900">{j.batchNumber}</td>
                          <td className="p-2 font-bold text-slate-900">
                            {j.productName} {j.size ? `(${j.size})` : ''}
                          </td>
                          <td className="p-2 text-slate-700">{j.claimedBy || 'N/A'}</td>
                          <td className="p-2 font-mono text-slate-600">
                            {j.voidedAt ? new Date(j.voidedAt).toLocaleString() : (j.lastProcedureDate ? new Date(j.lastProcedureDate).toLocaleString() : 'N/A')}
                          </td>
                          <td className="p-2 font-bold text-slate-900">
                            {j.voidedBy || 'Supervisor'} [{j.voidCardBadgeId || 'MGR'}]
                          </td>
                          <td className="p-2 text-slate-600 max-w-xs">{j.voidReason || 'Order cancelled'}</td>
                          <td className="p-2 text-center font-bold text-slate-950">✓ RESTOCKED</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Signatures & Certification */}
              <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-8 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 pb-8 mb-1"></div>
                  <span className="font-bold text-slate-900 block">Earl John DELOS SANTOS</span>
                  <span className="text-[10px] text-slate-500">Canteen &amp; Inventory Lead</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-8 mb-1"></div>
                  <span className="font-bold text-slate-900 block">Genevieve Anne A. JURADO</span>
                  <span className="text-[10px] text-slate-500">HR Manager &amp; Administrator</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-8 mb-1"></div>
                  <span className="font-bold text-slate-900 block">Katherine A. BELLA</span>
                  <span className="text-[10px] text-slate-500">Chief Executive Officer (CEO)</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
