import React, { useState, useEffect } from 'react';
import {
  Layers,
  Truck,
  Plus,
  Search,
  Filter,
  CheckSquare,
  Square,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  FileSpreadsheet,
  Eye,
} from 'lucide-react';
import { dispatchService } from '../services/api';
import { ProformaInvoice, Vehicle, Driver } from '../types';
import { CapacityBar } from '../components/common/CapacityBar';
import { StatusBadge } from '../components/common/StatusBadge';

interface DispatchPlanningPageProps {
  onNavigate: (path: string) => void;
  onOpenPIDetails: (pi: ProformaInvoice) => void;
  onOpenNewPI: () => void;
}

export const DispatchPlanningPage: React.FC<DispatchPlanningPageProps> = ({
  onNavigate,
  onOpenPIDetails,
  onOpenNewPI,
}) => {
  const [pendingPIs, setPendingPIs] = useState<ProformaInvoice[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Filters for PIs
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Selected State
  const [selectedPiIds, setSelectedPiIds] = useState<string[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [dispatchDate, setDispatchDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [timeSlot, setTimeSlot] = useState<string>('14:00 - 16:00');
  const [routeText, setRouteText] = useState<string>('Thane Hub -> Target Delivery Locations');
  const [freightCost, setFreightCost] = useState<number>(24000);
  const [remarks, setRemarks] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const load = () => {
      const pis = dispatchService.getPendingPIs();
      const vList = dispatchService.getVehicles();
      const dList = dispatchService.getDrivers();

      setPendingPIs(pis);
      setVehicles(vList);
      setDrivers(dList);

      const availV = vList.filter((v) => v.status === 'AVAILABLE');
      if (availV.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(availV[0].id);
      } else if (vList.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(vList[0].id);
      }

      const availD = dList.filter((d) => d.status === 'AVAILABLE');
      if (availD.length > 0 && !selectedDriverId) {
        setSelectedDriverId(availD[0].id);
      } else if (dList.length > 0 && !selectedDriverId) {
        setSelectedDriverId(dList[0].id);
      }
    };
    load();
    const unsub = dispatchService.subscribe(load);
    return () => unsub();
  }, []);

  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const currentDriver = drivers.find((d) => d.id === selectedDriverId);

  // Filter pending PIs
  const filteredPIs = pendingPIs.filter((pi) => {
    const matchesSearch =
      pi.piNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pi.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pi.destinationCity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = cityFilter === 'ALL' || pi.destinationCity === cityFilter;
    const matchesPriority = priorityFilter === 'ALL' || pi.priority === priorityFilter;
    return matchesSearch && matchesCity && matchesPriority;
  });

  const uniqueCities = Array.from(new Set(pendingPIs.map((p) => p.destinationCity)));

  const toggleSelectPI = (id: string) => {
    if (selectedPiIds.includes(id)) {
      setSelectedPiIds(selectedPiIds.filter((piId) => piId !== id));
    } else {
      setSelectedPiIds([...selectedPiIds, id]);
    }
  };

  const selectAllFiltered = () => {
    if (selectedPiIds.length === filteredPIs.length) {
      setSelectedPiIds([]);
    } else {
      setSelectedPiIds(filteredPIs.map((p) => p.id));
    }
  };

  // Payload Metrics
  const mappedPIs = pendingPIs.filter((pi) => selectedPiIds.includes(pi.id));
  const totalWeight = mappedPIs.reduce((sum, pi) => sum + pi.totalWeightKg, 0);
  const totalVolume = Number(
    mappedPIs.reduce((sum, pi) => sum + pi.totalVolumeCbm, 0).toFixed(2)
  );
  const totalInvoiceValue = mappedPIs.reduce((sum, pi) => sum + pi.totalAmount, 0);

  const maxWeight = currentVehicle?.capacityWeightKg || 10000;
  const maxVolume = currentVehicle?.capacityVolumeCbm || 40;
  const isOverweight = totalWeight > maxWeight;

  const handleCreateDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVehicle) {
      setErrorMsg('Please select an active vehicle.');
      return;
    }
    if (selectedPiIds.length === 0) {
      setErrorMsg('Please select at least 1 pending Proforma Invoice to consolidate.');
      return;
    }

    const routeStops = routeText.split('->').map((s) => s.trim()).filter(Boolean);

    const plan = dispatchService.createDispatchPlan({
      planningDate: new Date().toISOString().split('T')[0],
      dispatchDate,
      scheduledTimeSlot: timeSlot,
      status: 'READY_FOR_LOADING',
      vehicleId: currentVehicle.id,
      vehicleNumber: currentVehicle.vehicleNumber,
      vehicleType: currentVehicle.type,
      driverId: currentDriver?.id,
      driverName: currentDriver?.name || currentVehicle.driverName || 'Designated Driver',
      driverPhone: currentDriver?.phone || currentVehicle.driverPhone || '+91 98000 00000',
      transporterName: currentVehicle.transporterName || 'Dispatch Fleet Services',
      route: routeStops.length > 0 ? routeStops : ['Thane Hub', 'Client Location'],
      piIds: selectedPiIds,
      totalWeightKg: totalWeight,
      maxWeightCapacityKg: maxWeight,
      totalVolumeCbm: totalVolume,
      maxVolumeCapacityCbm: maxVolume,
      estimatedFreightCost: freightCost,
      remarks,
      isRollbackAllowed: true,
    });

    setSuccessMsg(`Dispatch Plan ${plan.dispatchNumber} successfully created and sent to Loading Dock!`);
    setSelectedPiIds([]);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Dispatch Planning Console
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold border border-blue-200">
              Vehicle & Cargo Consolidation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select pending Proforma Invoices, verify vehicle payload capacity, allocate drivers, and generate loading orders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenNewPI}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dispatch Planning Form</span>
          </button>
          <button
            onClick={() => onNavigate('/todays-planning')}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>View Today's Dispatches</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => onNavigate('/todays-planning')}
            className="text-xs text-emerald-900 underline font-bold"
          >
            Go to Today's Queue &rarr;
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main 2-Column Planning Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Available PIs selection */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Header & Filter Bar */}
            <div className="p-4 border-b border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Pending Proforma Invoices ({pendingPIs.length})
                  </h3>
                </div>
                <button
                  onClick={selectAllFiltered}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>
                    {selectedPiIds.length === filteredPIs.length && filteredPIs.length > 0
                      ? 'Deselect All'
                      : 'Select All Filtered'}
                  </span>
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search PI / Client..."
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                >
                  <option value="ALL">All Destinations</option>
                  {uniqueCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="URGENT">Urgent Express</option>
                  <option value="HIGH">High Priority</option>
                  <option value="NORMAL">Normal Priority</option>
                </select>
              </div>
            </div>

            {/* List of PIs */}
            <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
              {filteredPIs.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400">
                  No pending proforma invoices matching the current filter.
                </div>
              ) : (
                filteredPIs.map((pi) => {
                  const isSelected = selectedPiIds.includes(pi.id);
                  return (
                    <div
                      key={pi.id}
                      className={`p-3.5 hover:bg-slate-50/80 transition-all flex items-start gap-3 ${
                        isSelected ? 'bg-amber-50/60 border-l-4 border-[#F4B400]' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSelectPI(pi.id)}
                        className="mt-0.5 text-slate-400 hover:text-amber-600"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900">
                              {pi.piNumber}
                            </span>
                            <StatusBadge status={pi.priority} size="sm" />
                          </div>
                          <span className="text-xs font-bold text-slate-900">
                            ₹{(pi.totalAmount).toLocaleString()}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {pi.clientName}
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{pi.destinationCity}, {pi.state}</span>
                          </span>

                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-800">
                              Weight: {pi.totalWeightKg.toLocaleString()} kg
                            </span>
                            <span>Vol: {pi.totalVolumeCbm} cbm</span>
                            <button
                              type="button"
                              onClick={() => onOpenPIDetails(pi)}
                              className="text-slate-400 hover:text-slate-700 p-0.5"
                              title="View Order Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selection Status Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>{selectedPiIds.length} PIs Selected for Vehicle Mapping</span>
              <span className="font-bold text-slate-900">
                Consolidated: {totalWeight.toLocaleString()} kg / {totalVolume} cbm
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Vehicle Allocation & Plan Assembly */}
        <div className="lg:col-span-5 space-y-4">
          <form
            onSubmit={handleCreateDispatch}
            className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5"
          >
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-900" />
                <h3 className="font-bold text-sm text-slate-900">Vehicle & Route Setup</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Step 2 of 2
              </span>
            </div>

            {/* Capacity Visualizer */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Live Vehicle Capacity Check</span>
                <span className={isOverweight ? 'text-rose-600' : 'text-emerald-700'}>
                  {isOverweight ? 'OVERLOAD DETECTED' : 'CAPACITY NORMAL'}
                </span>
              </div>

              <CapacityBar
                current={totalWeight}
                max={maxWeight}
                unit="kg"
                label="Weight Load (kg)"
              />

              <CapacityBar
                current={totalVolume}
                max={maxVolume}
                unit="cbm"
                label="Volume Space (cbm)"
              />
            </div>

            {/* Vehicle Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Assign Vehicle
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
                required
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNumber} ({v.type}) - Cap: {(v.capacityWeightKg / 1000).toFixed(1)}T [
                    {v.status}]
                  </option>
                ))}
              </select>
            </div>

            {/* Driver Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Assign Driver
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone}) - Rating: ★{d.rating} [{d.status}]
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Slot */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dispatch Date</label>
                <input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Loading Slot</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
                >
                  <option value="08:00 - 10:00">08:00 - 10:00 AM</option>
                  <option value="11:00 - 13:00">11:00 - 13:00 PM</option>
                  <option value="14:00 - 16:00">14:00 - 16:00 PM</option>
                  <option value="17:00 - 19:00">17:00 - 19:00 PM</option>
                  <option value="20:00 - 22:00">20:00 - 22:00 PM</option>
                </select>
              </div>
            </div>

            {/* Route & Cost */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Planned Route Sequence (Separated by {'->'})
              </label>
              <input
                type="text"
                value={routeText}
                onChange={(e) => setRouteText(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Freight Budget (₹)
              </label>
              <input
                type="number"
                value={freightCost}
                onChange={(e) => setFreightCost(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
              />
            </div>

            {/* Financial Summary */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Selected Cargo Value:</span>
                <span className="font-semibold text-slate-900">
                  ₹{totalInvoiceValue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Freight Cost:</span>
                <span className="font-semibold text-slate-900">₹{freightCost.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={selectedPiIds.length === 0}
              className={`w-full py-3 text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all ${
                selectedPiIds.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#F4B400] hover:bg-[#e0a400] text-slate-950'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Initialize Dispatch Plan ({selectedPiIds.length} PIs)</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
