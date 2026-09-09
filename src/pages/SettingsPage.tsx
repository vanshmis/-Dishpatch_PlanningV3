import React, { useState } from 'react';
import {
  Settings,
  Truck,
  Users,
  Building,
  Radio,
  Plus,
  Check,
  RotateCcw,
  Shield,
  Save,
  Server,
  Zap,
  Warehouse as WarehouseIcon,
  Trash2,
} from 'lucide-react';
import { dispatchService } from '../services/api';
import { Vehicle, Driver, Client, Warehouse } from '../types';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'VEHICLES' | 'DRIVERS' | 'CLIENTS' | 'INTEGRATIONS' | 'WAREHOUSES'>(
    'VEHICLES'
  );

  const [vehicles, setVehicles] = useState<Vehicle[]>(dispatchService.getVehicles());
  const [drivers, setDrivers] = useState<Driver[]>(dispatchService.getDrivers());
  const [clients, setClients] = useState<Client[]>(dispatchService.getClients());
  const [warehouses, setWarehouses] = useState<Warehouse[]>(dispatchService.getWarehouses());

  // New Vehicle Modal State
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vNum, setVNum] = useState('');
  const [vType, setVType] = useState('19ft Container (7.5T)');
  const [vCap, setVCap] = useState(7500);
  const [vVol, setVVol] = useState(32);
  const [vTransporter, setVTransporter] = useState('Dispatch Fleet Services');

  // New Warehouse Modal State
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [whName, setWhName] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whCity, setWhCity] = useState('');
  const [whState, setWhState] = useState('');
  const [whCap, setWhCap] = useState(5000);

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vNum) return;

    dispatchService.addVehicle({
      vehicleNumber: vNum,
      type: vType,
      capacityWeightKg: Number(vCap),
      capacityVolumeCbm: Number(vVol),
      ownerType: 'OWN',
      transporterName: vTransporter,
      status: 'AVAILABLE',
      rcExpiryDate: '2029-12-31',
      insuranceExpiryDate: '2027-12-31',
      fitnessExpiryDate: '2028-12-31',
      currentLocation: 'Bhiwandi Central Hub',
    });

    setVehicles(dispatchService.getVehicles());
    setShowAddVehicle(false);
    setVNum('');
  };

  const handleAddWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName || !whCode) return;

    dispatchService.addWarehouse({
      name: whName,
      code: whCode,
      city: whCity || 'Bhiwandi',
      state: whState || 'Maharashtra',
      capacityTons: Number(whCap) || 5000,
      status: 'ACTIVE',
    });

    setWarehouses(dispatchService.getWarehouses());
    setShowAddWarehouse(false);
    setWhName('');
    setWhCode('');
    setWhCity('');
    setWhState('');
  };

  const handleDeleteWarehouse = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete warehouse "${name}"?`)) {
      dispatchService.deleteWarehouse(id);
      setWarehouses(dispatchService.getWarehouses());
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all demo data (PIs, Dispatches, Rollbacks) to default factory state?')) {
      dispatchService.resetToFactory();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              System Settings & Enterprise Master Data
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-800 font-bold">
              Administration
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure vehicle fleet masters, driver registries, client delivery zones, and external FMS/ERP API integrations.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo to Factory State</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'VEHICLES', label: 'Vehicle Fleet Master', icon: Truck },
          { id: 'DRIVERS', label: 'Driver Registry', icon: Users },
          { id: 'CLIENTS', label: 'Client Accounts & Zones', icon: Building },
          { id: 'INTEGRATIONS', label: 'API & FMS Integrations', icon: Server },
          { id: 'WAREHOUSES', label: 'Warehouse Master', icon: WarehouseIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-[#181309] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#F4B400]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Vehicle Fleet Master */}
      {activeTab === 'VEHICLES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Registered Fleet Vehicles ({vehicles.length})
            </h3>
            <button
              onClick={() => setShowAddVehicle(!showAddVehicle)}
              className="px-3 py-1.5 bg-[#F4B400] hover:bg-[#e0a400] text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Vehicle</span>
            </button>
          </div>

          {showAddVehicle && (
            <form
              onSubmit={handleAddVehicle}
              className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs"
            >
              <div className="font-bold text-slate-800">Add Vehicle to Master Registry</div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    value={vNum}
                    onChange={(e) => setVNum(e.target.value)}
                    placeholder="e.g. MH-04-AB-1234"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Vehicle Type</label>
                  <select
                    value={vType}
                    onChange={(e) => setVType(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="19ft Container (7.5T)">19ft Container (7.5T)</option>
                    <option value="32ft Multi-Axle (15T)">32ft Multi-Axle (15T)</option>
                    <option value="14ft Eicher (4T)">14ft Eicher (4T)</option>
                    <option value="Tata Ace (1.2T)">Tata Ace (1.2T)</option>
                    <option value="22ft Open Body (9T)">22ft Open Body (9T)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Payload Capacity (kg)
                  </label>
                  <input
                    type="number"
                    value={vCap}
                    onChange={(e) => setVCap(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Carrier Name</label>
                  <input
                    type="text"
                    value={vTransporter}
                    onChange={(e) => setVTransporter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddVehicle(false)}
                  className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-[#F4B400] text-slate-950 font-bold rounded"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Vehicle Number</th>
                  <th className="px-4 py-3">Type & Ownership</th>
                  <th className="px-4 py-3 text-right">Max Weight (kg)</th>
                  <th className="px-4 py-3 text-right">Volume</th>
                  <th className="px-4 py-3">Current Location</th>
                  <th className="px-4 py-3">Insurance / Fitness</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {v.vehicleNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{v.type}</div>
                      <div className="text-[10px] text-slate-500">
                        {v.transporterName} ({v.ownerType})
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {v.capacityWeightKg.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {v.capacityVolumeCbm} cbm
                    </td>
                    <td className="px-4 py-3 text-slate-700">{v.currentLocation}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-emerald-700">
                      Fit: {v.fitnessExpiryDate}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          v.status === 'AVAILABLE'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : v.status === 'IN_TRANSIT'
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Driver Registry */}
      {activeTab === 'DRIVERS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Driver Name</th>
                <th className="px-4 py-3">Phone Number</th>
                <th className="px-4 py-3">Driving License No</th>
                <th className="px-4 py-3">License Expiry</th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3 text-center">Duty Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drivers.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-900">{d.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{d.phone}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{d.licenseNumber}</td>
                  <td className="px-4 py-3 font-mono text-emerald-700">{d.licenseExpiry}</td>
                  <td className="px-4 py-3">{d.experienceYears} Years</td>
                  <td className="px-4 py-3 text-amber-600 font-bold">★ {d.rating} / 5.0</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        d.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Client Accounts */}
      {activeTab === 'CLIENTS' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Client Name</th>
                <th className="px-4 py-3">Client Code</th>
                <th className="px-4 py-3">Contact Person</th>
                <th className="px-4 py-3">Email & Phone</th>
                <th className="px-4 py-3">Hub City & State</th>
                <th className="px-4 py-3">Delivery Zone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-900">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{c.code}</td>
                  <td className="px-4 py-3 text-slate-800">{c.contactPerson}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-800">{c.email}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{c.phone}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {c.city}, {c.state}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold">
                      {c.deliveryZone}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Integrations */}
      {activeTab === 'INTEGRATIONS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-bold text-sm text-slate-900">
              External Fleet Management System (FMS) & ERP Connectors
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Configured webhooks for real-time telemetry, SAP/Oracle ERP sync, and NIC E-Way Bill gateway.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">NIC E-Way Bill API Gateway</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                    CONNECTED
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Auto-generates Part-B vehicle conveyance credentials upon gate pass issuance.
                </p>
              </div>
              <span className="font-mono text-slate-600 bg-white px-2 py-1 border rounded">
                v1.03-LIVE
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    GPS Fleet Telematics Webhook
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                    POLLING ACTIVE
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Streams real-time truck geofence timestamps and toll booth milestones.
                </p>
              </div>
              <span className="font-mono text-slate-600 bg-white px-2 py-1 border rounded">
                15s INTERVAL
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">SAP ERP S/4HANA Sales Order Sync</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold">
                    BI-DIRECTIONAL
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Imports new Proforma Invoices automatically from centralized sales orders.
                </p>
              </div>
              <span className="font-mono text-slate-600 bg-white px-2 py-1 border rounded">
                SYNCED (1 min ago)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Warehouse Master */}
      {activeTab === 'WAREHOUSES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Registered Warehouses & Depots ({warehouses.length})
            </h3>
            <button
              onClick={() => setShowAddWarehouse(!showAddWarehouse)}
              className="px-3 py-1.5 bg-[#F4B400] hover:bg-[#e0a400] text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Warehouse</span>
            </button>
          </div>

          {showAddWarehouse && (
            <form
              onSubmit={handleAddWarehouse}
              className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs"
            >
              <div className="font-bold text-slate-800">Add Warehouse to Master Registry</div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Warehouse Name</label>
                  <input
                    type="text"
                    value={whName}
                    onChange={(e) => setWhName(e.target.value)}
                    placeholder="e.g. Thane Central Hub"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Warehouse Code</label>
                  <input
                    type="text"
                    value={whCode}
                    onChange={(e) => setWhCode(e.target.value)}
                    placeholder="e.g. WH-THN"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={whCity}
                    onChange={(e) => setWhCity(e.target.value)}
                    placeholder="e.g. Thane"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={whState}
                    onChange={(e) => setWhState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Capacity (Tons)</label>
                  <input
                    type="number"
                    value={whCap}
                    onChange={(e) => setWhCap(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWarehouse(false)}
                  className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-[#F4B400] text-slate-950 font-bold rounded cursor-pointer"
                >
                  Save Warehouse
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Warehouse Name</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">City & State</th>
                  <th className="px-4 py-3 text-right">Capacity (Tons)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {warehouses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No warehouses registered. Click "Register New Warehouse" to add one.
                    </td>
                  </tr>
                ) : (
                  warehouses.map((wh) => (
                    <tr key={wh.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900">{wh.name}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">{wh.code}</td>
                      <td className="px-4 py-3 text-slate-800">
                        {wh.city}, {wh.state}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {wh.capacityTons.toLocaleString()} T
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 text-emerald-800 border-emerald-200">
                          {wh.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteWarehouse(wh.id, wh.name)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete Warehouse"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
