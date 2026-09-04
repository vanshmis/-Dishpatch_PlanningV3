import React, { useState, useEffect } from 'react';
import {
  Truck,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Play,
  RotateCcw,
  IndianRupee,
  ShieldCheck,
  Layers,
  MapPin,
  FileText,
} from 'lucide-react';
import { dispatchService } from '../services/api';
import { DispatchPlan, ProformaInvoice, Vehicle } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { CapacityBar } from '../components/common/CapacityBar';
import { ApprovePIModal } from '../components/modals/ApprovePIModal';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
  onOpenNewDispatch: (piId?: string) => void;
  onOpenNewPI: () => void;
  onOpenGatePass: (dsp: DispatchPlan) => void;
  onOpenRollback: (dsp: DispatchPlan) => void;
  onOpenPIDetails: (pi: ProformaInvoice) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenNewDispatch,
  onOpenNewPI,
  onOpenGatePass,
  onOpenRollback,
  onOpenPIDetails,
}) => {
  const [pis, setPis] = useState<ProformaInvoice[]>([]);
  const [dispatches, setDispatches] = useState<DispatchPlan[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [selectedPIToApprove, setSelectedPIToApprove] = useState<ProformaInvoice | null>(null);

  useEffect(() => {
    const loadData = () => {
      setPis(dispatchService.getPIs());
      setDispatches(dispatchService.getDispatchPlans());
      setVehicles(dispatchService.getVehicles());
    };
    loadData();
    const unsub = dispatchService.subscribe(loadData);
    return () => unsub();
  }, []);

  const pendingPIs = pis.filter((p) => p.status === 'PENDING');
  const urgentPIs = pendingPIs.filter((p) => p.priority === 'URGENT' || p.priority === 'HIGH');
  const todaysDispatches = dispatches.filter(
    (d) => d.dispatchDate === '2026-03-02' || d.status === 'LOADING' || d.status === 'READY_FOR_LOADING'
  );
  const inTransitDispatches = dispatches.filter((d) => d.status === 'IN_TRANSIT');

  const totalPendingAmount = pendingPIs.reduce((sum, p) => sum + p.totalAmount, 0);
  const availableVehicles = vehicles.filter((v) => v.status === 'AVAILABLE');

  const handleAdvanceStatus = (dsp: DispatchPlan) => {
    if (dsp.status === 'READY_FOR_LOADING') {
      dispatchService.updateDispatchStatus(dsp.id, 'LOADING');
    } else if (dsp.status === 'LOADING') {
      dispatchService.updateDispatchStatus(dsp.id, 'GATE_PASS_ISSUED');
    } else if (dsp.status === 'GATE_PASS_ISSUED') {
      dispatchService.updateDispatchStatus(dsp.id, 'IN_TRANSIT');
    } else if (dsp.status === 'IN_TRANSIT') {
      dispatchService.updateDispatchStatus(dsp.id, 'DELIVERED', {
        receivedBy: 'Warehouse In-charge',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Operations Dispatch Dashboard
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold border border-amber-200">
              Bhiwandi Hub
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time control tower for vehicle allocations, pending orders, and active freight movements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenNewPI}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Dispatch Planning Form</span>
          </button>
          <button
            onClick={() => onOpenNewDispatch()}
            className="px-4 py-2 bg-[#F4B400] hover:bg-[#e0a400] text-slate-950 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Truck className="w-4 h-4" />
            <span>Plan New Dispatch</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid (Compact Size) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Total Pending PI */}
        <div
          onClick={() => onNavigate('/pending-pi')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs cursor-pointer hover:border-slate-300 transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Total Pending PI
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{pendingPIs.length} Orders</div>
            <span className="text-[10px] text-amber-700 font-semibold">
              {urgentPIs.length} High/Urgent Priority
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#181309] text-[#F4B400] flex items-center justify-center font-bold shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 2: Total Invoice Amount */}
        <div
          onClick={() => onNavigate('/pending-pi')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs cursor-pointer hover:border-slate-300 transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Total Invoice Amount
            </span>
            <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
              ₹{totalPendingAmount.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              ₹{(totalPendingAmount / 100000).toFixed(2)} Lakhs Pending
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0 border border-emerald-200">
            ₹
          </div>
        </div>

        {/* KPI 3: Today's Dispatch Queue */}
        <div
          onClick={() => onNavigate('/todays-planning')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs cursor-pointer hover:border-slate-300 transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Today's Dispatch Queue
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{todaysDispatches.length} Vehicles</div>
            <span className="text-[10px] text-slate-500 font-medium">Loading bays active</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 4: Fleet Available */}
        <div
          onClick={() => onNavigate('/settings')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs cursor-pointer hover:border-slate-300 transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Fleet Available
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {availableVehicles.length} / {vehicles.length}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Ready at yard</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Today's Dispatches */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Active Dispatch Schedule (Today's Queue)
                </h3>
              </div>
              <button
                onClick={() => onNavigate('/todays-planning')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <span>View Full Schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {todaysDispatches.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No active dispatches scheduled for today.
                </div>
              ) : (
                todaysDispatches.map((dsp) => (
                  <div key={dsp.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {dsp.dispatchNumber}
                        </span>
                        <StatusBadge status={dsp.status} />
                        <span className="text-xs text-slate-500 font-medium">
                          Slot: {dsp.scheduledTimeSlot}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {dsp.gatePassNumber ? (
                          <button
                            onClick={() => onOpenGatePass(dsp)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3 text-slate-500" />
                            <span>Gate Pass</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAdvanceStatus(dsp)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            <span>
                              {dsp.status === 'READY_FOR_LOADING'
                                ? 'Start Loading'
                                : dsp.status === 'LOADING'
                                ? 'Issue Gate Pass'
                                : 'Next Stage'}
                            </span>
                          </button>
                        )}

                        {dsp.isRollbackAllowed && (
                          <button
                            onClick={() => onOpenRollback(dsp)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                            title="Rollback / Revert Plan"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-slate-500" />
                          <span>{dsp.vehicleNumber}</span>
                          <span className="text-slate-400 font-normal">({dsp.vehicleType})</span>
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          Driver: {dsp.driverName} ({dsp.driverPhone})
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-500 flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>Route: {dsp.route.join(' → ')}</span>
                        </div>
                        <div className="text-indigo-700 font-semibold mt-0.5 text-[11px]">
                          {dsp.piIds.length} Proforma Invoices mapped (₹
                          {(dsp.estimatedFreightCost).toLocaleString()} freight)
                        </div>
                      </div>
                    </div>

                    <CapacityBar
                      current={dsp.totalWeightKg}
                      max={dsp.maxWeightCapacityKg}
                      unit="kg"
                      label="Payload Utilization"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Pending PIs to Approve */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900">Pending PI Approvals</h3>
              </div>
              <button
                onClick={() => onNavigate('/pending-pi')}
                className="text-xs text-amber-700 hover:text-amber-900 font-semibold"
              >
                All ({pendingPIs.length})
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {pendingPIs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No pending orders waiting for approval.
                </div>
              ) : (
                pendingPIs.map((pi) => (
                  <div
                    key={pi.id}
                    className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5 cursor-pointer" onClick={() => onOpenPIDetails(pi)}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{pi.piNumber}</span>
                        <StatusBadge status={pi.priority} size="sm" />
                      </div>
                      <div className="text-xs font-semibold text-slate-800">{pi.clientName}</div>
                      <div className="text-[11px] font-bold text-emerald-700">
                        ₹{pi.totalAmount.toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedPIToApprove(pi)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs flex items-center gap-1 shadow-2xs shrink-0"
                      title="Approve PI"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {selectedPIToApprove && (
        <ApprovePIModal
          isOpen={!!selectedPIToApprove}
          pi={selectedPIToApprove}
          onClose={() => setSelectedPIToApprove(null)}
          onSuccess={() => setSelectedPIToApprove(null)}
        />
      )}
    </div>
  );
};
