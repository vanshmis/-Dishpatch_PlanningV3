import React, { useState, useEffect } from 'react';
import {
  Clock,
  Truck,
  Plus,
  FileText,
  Shield,
  Play,
  CheckCircle2,
  RotateCcw,
  MapPin,
  Calendar,
  AlertTriangle,
  UserCheck,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { dispatchService } from '../services/api';
import { DispatchPlan, ProformaInvoice } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { CapacityBar } from '../components/common/CapacityBar';

interface TodaysPlanningPageProps {
  onOpenNewDispatch: () => void;
  onOpenGatePass: (dsp: DispatchPlan) => void;
  onOpenRollback: (dsp: DispatchPlan) => void;
  onOpenPIDetails: (pi: ProformaInvoice) => void;
}

export const TodaysPlanningPage: React.FC<TodaysPlanningPageProps> = ({
  onOpenNewDispatch,
  onOpenGatePass,
  onOpenRollback,
  onOpenPIDetails,
}) => {
  const [dispatches, setDispatches] = useState<DispatchPlan[]>([]);
  const [activeSlotFilter, setActiveSlotFilter] = useState<string>('ALL');

  useEffect(() => {
    const load = () => {
      setDispatches(dispatchService.getTodaysDispatches());
    };
    load();
    const unsub = dispatchService.subscribe(load);
    return () => unsub();
  }, []);

  const filteredDispatches = dispatches.filter((d) => {
    if (activeSlotFilter === 'ALL') return true;
    return d.scheduledTimeSlot.includes(activeSlotFilter);
  });

  const handleNextStatus = (dsp: DispatchPlan) => {
    if (dsp.status === 'DRAFT') {
      dispatchService.updateDispatchStatus(dsp.id, 'READY_FOR_LOADING');
    } else if (dsp.status === 'READY_FOR_LOADING') {
      dispatchService.updateDispatchStatus(dsp.id, 'LOADING');
    } else if (dsp.status === 'LOADING') {
      dispatchService.updateDispatchStatus(dsp.id, 'GATE_PASS_ISSUED');
    } else if (dsp.status === 'GATE_PASS_ISSUED') {
      dispatchService.updateDispatchStatus(dsp.id, 'IN_TRANSIT');
    } else if (dsp.status === 'IN_TRANSIT') {
      dispatchService.updateDispatchStatus(dsp.id, 'DELIVERED', {
        receivedBy: 'Client Warehouse Manager',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Today's Dispatch Execution Schedule
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 font-bold border border-blue-200">
              {dispatches.length} Vehicles Scheduled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time dock control, loading supervision, gate pass issuance, and trip dispatch triggers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Daily Manifest</span>
          </button>
          <button
            onClick={onOpenNewDispatch}
            className="px-4 py-2 bg-[#F4B400] hover:bg-[#e0a400] text-slate-950 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Dispatch</span>
          </button>
        </div>
      </div>

      {/* Loading Dock Bay Status Map */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-600">
            Bhiwandi Hub - Loading Bays Live Allocation
          </span>
          <span className="text-slate-400">Shift A Active (08:00 - 20:00)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-center text-xs">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((bay) => {
            const isOccupied = bay <= dispatches.length;
            const dsp = isOccupied ? dispatches[bay - 1] : null;

            return (
              <div
                key={bay}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  isOccupied
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950 font-medium'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <span className="block text-[10px] font-bold uppercase tracking-wider">
                  Bay #{bay}
                </span>
                {isOccupied && dsp ? (
                  <div className="mt-1">
                    <span className="text-[11px] font-mono font-bold block truncate">
                      {dsp.vehicleNumber.split('-').slice(0, 2).join('-')}
                    </span>
                    <span className="text-[10px] text-amber-800 font-semibold block">
                      {dsp.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 mt-1 block">Vacant</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Slot Filters */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs">
        {['ALL', '08:00', '11:00', '14:00', '17:00', '20:00'].map((slot) => (
          <button
            key={slot}
            onClick={() => setActiveSlotFilter(slot)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeSlotFilter === slot
                ? 'bg-[#181309] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {slot === 'ALL' ? 'All Time Slots' : `${slot} Slot`}
          </button>
        ))}
      </div>

      {/* Dispatch Cards List */}
      <div className="space-y-4">
        {filteredDispatches.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            No dispatches found for the selected time slot.
          </div>
        ) : (
          filteredDispatches.map((dsp) => (
            <div
              key={dsp.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 transition-all hover:border-slate-300"
            >
              {/* Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#181309] text-[#F4B400] flex items-center justify-center font-black">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {dsp.dispatchNumber}
                      </span>
                      <StatusBadge status={dsp.status} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Scheduled Slot: {dsp.scheduledTimeSlot}</span>
                      <span>•</span>
                      <span>Carrier: {dsp.transporterName}</span>
                    </div>
                  </div>
                </div>

                {/* Workflow Buttons */}
                <div className="flex items-center gap-2">
                  {dsp.gatePassNumber && (
                    <button
                      onClick={() => onOpenGatePass(dsp)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      <span>View Gate Pass ({dsp.gatePassNumber})</span>
                    </button>
                  )}

                  {dsp.status !== 'DELIVERED' && (
                    <button
                      onClick={() => handleNextStatus(dsp)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>
                        {dsp.status === 'READY_FOR_LOADING' && 'Start Loading'}
                        {dsp.status === 'LOADING' && 'Issue Gate Pass'}
                        {dsp.status === 'GATE_PASS_ISSUED' && 'Depart Vehicle'}
                        {dsp.status === 'IN_TRANSIT' && 'Mark Delivered'}
                      </span>
                    </button>
                  )}

                  {dsp.isRollbackAllowed && (
                    <button
                      onClick={() => onOpenRollback(dsp)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 flex items-center gap-1.5 transition-colors"
                      title="Rollback Dispatch"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Rollback</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Grid 3-Cols: Vehicle, Route, Cargo Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Vehicle & Driver */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-600" />
                    <span>{dsp.vehicleNumber}</span>
                  </div>
                  <div className="text-slate-600">Type: {dsp.vehicleType}</div>
                  <div className="text-slate-600">
                    Driver: <span className="font-semibold text-slate-800">{dsp.driverName}</span> (
                    {dsp.driverPhone})
                  </div>
                </div>

                {/* Route */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-600" />
                    <span>Route Drops ({dsp.route.length})</span>
                  </div>
                  <div className="text-slate-600 font-medium">
                    {dsp.route.join(' → ')}
                  </div>
                  <div className="text-slate-500">
                    Est. Freight: <span className="font-bold text-slate-900">₹{dsp.estimatedFreightCost.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payload Meter */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                  <CapacityBar
                    current={dsp.totalWeightKg}
                    max={dsp.maxWeightCapacityKg}
                    unit="kg"
                    label="Payload Utilization"
                  />
                  <CapacityBar
                    current={dsp.totalVolumeCbm}
                    max={dsp.maxVolumeCapacityCbm}
                    unit="cbm"
                    label="Cubic Volume"
                  />
                </div>
              </div>

              {/* Consolidated PIs Mini Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <div className="px-3 py-1.5 bg-slate-100 font-semibold text-slate-700 flex items-center justify-between">
                  <span>Mapped Consignments ({dsp.pis?.length || dsp.piIds.length} PIs)</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Click order to inspect items
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {dsp.pis && dsp.pis.length > 0 ? (
                    dsp.pis.map((pi) => (
                      <div
                        key={pi.id}
                        onClick={() => onOpenPIDetails(pi)}
                        className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 cursor-pointer text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-900">{pi.piNumber}</span>
                          <span className="font-semibold text-slate-800">{pi.clientName}</span>
                          <span className="text-slate-500">({pi.destinationCity})</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-medium text-slate-700">
                            {pi.totalWeightKg.toLocaleString()} kg
                          </span>
                          <span className="font-bold text-slate-900">
                            ₹{pi.totalAmount.toLocaleString()}
                          </span>
                          <StatusBadge status={pi.priority} size="sm" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-slate-400 text-center text-xs">
                      No PIs attached to this empty slot.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
