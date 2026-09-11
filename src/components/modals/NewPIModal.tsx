import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FilePlus, Check, Save } from 'lucide-react';
import { dispatchService } from '../../services/api';
import { Client, PIItem, PriorityLevel, ProformaInvoice } from '../../types';

interface NewPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewPIModal: React.FC<NewPIModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const clients = dispatchService.getClients();
  const pendingPIs = dispatchService.getPendingPIs();

  const [selectedClientCode, setSelectedClientCode] = useState(clients[0]?.code || 'REL-MUM');
  const [selectedPIId, setSelectedPIId] = useState<string>('');
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<PriorityLevel>('NORMAL');
  const [division, setDivision] = useState<'GT' | 'MT' | 'SMT' | 'SMT-Direct'>('GT');
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [totalAmountReceived, setTotalAmountReceived] = useState<number>(0);
  const [latitude, setLatitude] = useState<string>('19.0760° N');
  const [longitude, setLongitude] = useState<string>('72.8777° E');
  const [distanceKm, setDistanceKm] = useState<number>(32);

  // Update Lat/Long and Distance whenever client changes
  useEffect(() => {
    const client = clients.find((c) => c.code === selectedClientCode);
    if (client) {
      setLatitude(client.latitude || '19.0760° N');
      setLongitude(client.longitude || '72.8777° E');
      setDistanceKm(client.distanceKm || 35);
    }
  }, [selectedClientCode, clients]);

  const [items, setItems] = useState<PIItem[]>([
    {
      id: '1',
      itemCode: 'PRD-X101',
      description: 'Standard Corrugated Packaging Cartons',
      quantity: 1000,
      originalQuantity: 1000,
      unit: 'PCS',
      weightKg: 1200,
      volumeCbm: 4.5,
      rate: 110,
      amount: 110000,
    },
  ]);

  // When a PI is selected, auto-fill all its data
  useEffect(() => {
    if (selectedPIId) {
      const pi = pendingPIs.find(p => p.id === selectedPIId);
      if (pi) {
        setSelectedClientCode(pi.clientCode);
        setExpectedDate(pi.expectedDeliveryDate);
        setPriority(pi.priority);
        if (pi.division) setDivision(pi.division);
        const mappedItems = (pi.items.length > 0 ? pi.items : items).map((itm) => ({
          ...itm,
          originalQuantity: itm.originalQuantity ?? itm.quantity,
        }));
        setItems(mappedItems);
        setCreditLimit(500000);  // Mock backend limit
        setTotalAmountReceived(200000);  // Mock backend received
      }
    }
  }, [selectedPIId]);

  if (!isOpen) return null;

  const selectedClient = clients.find((c) => c.code === selectedClientCode) || clients[0];
  const selectedPI = pendingPIs.find(p => p.id === selectedPIId);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: String(Date.now()),
        itemCode: `PRD-X${Math.floor(100 + Math.random() * 900)}`,
        description: 'Industrial Packaging Goods',
        quantity: 500,
        unit: 'PCS',
        weightKg: 800,
        volumeCbm: 3.2,
        rate: 85,
        amount: 42500,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((itm) => itm.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof PIItem, val: string | number) => {
    setItems(
      items.map((itm) => {
        if (itm.id === id) {
          if (field === 'quantity') {
            const maxAllowed = itm.originalQuantity ?? itm.quantity;
            let newQty = Number(val);
            if (isNaN(newQty)) newQty = 0;

            // QTY CAN ONLY DECREASE, NOT INCREASE ABOVE ORIGINAL QTY
            if (newQty > maxAllowed) {
              newQty = maxAllowed;
            }
            if (newQty < 0) newQty = 0;

            const updated = {
              ...itm,
              quantity: newQty,
              amount: newQty * (Number(itm.rate) || 0),
            };
            return updated;
          }
          return { ...itm, [field]: val };
        }
        return itm;
      })
    );
  };

  const totalWeight = items.reduce((sum, itm) => sum + (Number(itm.weightKg) || 0), 0);
  const totalVolume = Number(
    items.reduce((sum, itm) => sum + (Number(itm.volumeCbm) || 0), 0).toFixed(2)
  );
  const totalAmount = items.reduce((sum, itm) => sum + (Number(itm.amount) || 0), 0);

  const availableBalance = totalAmountReceived + creditLimit;
  const isCreditSufficient = availableBalance >= totalAmount;

  const handleSubmit = (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();

    if (!isDraft && !isCreditSufficient) {
      alert(`Credit Validation Failed! Available Balance (₹${availableBalance.toLocaleString()}) is less than Total PI Amount (₹${totalAmount.toLocaleString()}).`);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    dispatchService.createPI({
      piNumber: selectedPI?.piNumber || `PI-2026-${Math.floor(1050 + Math.random() * 900)}`,
      orderNumber: selectedPI?.orderNumber || `ORD-${Math.floor(89450 + Math.random() * 500)}`,
      clientName: selectedClient.name,
      clientCode: selectedClient.code,
      destinationCity: selectedClient.city,
      state: selectedClient.state,
      deliveryAddress: `${selectedClient.city} Logistics Hub, Zone ${selectedClient.deliveryZone}`,
      pinCode: '400001',
      piDate: todayStr,
      expectedDeliveryDate: expectedDate,
      items,
      totalWeightKg: totalWeight,
      totalVolumeCbm: totalVolume,
      totalAmount,
      status: isDraft ? 'DRAFT' : 'PENDING',
      priority,
      division,
      latitude,
      longitude,
      distanceKm,
      remarks: `Credit Limit: ₹${creditLimit.toLocaleString()} | Amount Received: ₹${totalAmountReceived.toLocaleString()}`,
    });

    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F4B400] text-slate-900 flex items-center justify-center font-bold">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white">Dispatch Planning Form</h3>
              <p className="text-xs text-slate-400">
                Create dispatch bill from pending PI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {/* Row 1: PI Number + Client + Delivery Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PI Number <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedPIId}
                onChange={(e) => setSelectedPIId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
                required
              >
                <option value="">-- Select Pending PI --</option>
                {pendingPIs.map((pi) => (
                  <option key={pi.id} value={pi.id}>
                    {pi.piNumber} — {pi.clientName} (₹{pi.totalAmount.toLocaleString()})
                  </option>
                ))}
              </select>
              {selectedPIId && selectedPI && (
                <p className="mt-1 text-[10px] text-emerald-600 font-medium">
                  ✓ Mapped: {selectedPI.clientName} | {selectedPI.destinationCity} | Weight: {selectedPI.totalWeightKg.toLocaleString()} kg
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Client
              </label>
              <select
                value={selectedClientCode}
                onChange={(e) => setSelectedClientCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
                disabled={!!selectedPIId}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Delivery Expected By
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
                required
              />
            </div>
          </div>

          {/* Row 2: Priority + Division + Credit Limit + Total Amount Received */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
              >
                <option value="NORMAL">Normal Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent Express</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Division</label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-purple-900 focus:ring-2 focus:ring-[#F4B400]"
              >
                <option value="GT">GT (General Trade)</option>
                <option value="MT">MT (Modern Trade)</option>
                <option value="SMT">SMT</option>
                <option value="SMT-Direct">SMT-Direct</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Credit Limit (₹) <span className="text-[10px] text-blue-500 font-normal">(Backend Mapped)</span>
              </label>
              <input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(Number(e.target.value))}
                placeholder="e.g. 500000"
                className="w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Amount Received (₹) <span className="text-[10px] text-blue-500 font-normal">(Backend Mapped)</span>
              </label>
              <input
                type="number"
                value={totalAmountReceived}
                onChange={(e) => setTotalAmountReceived(Number(e.target.value))}
                placeholder="e.g. 200000"
                className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Line Items ({items.length})
                </label>
                <p className="text-[10px] text-amber-700 font-medium">
                  Note: Item details & UOM are backend-mapped. Only QTY can be modified (Decrease Only).
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Item Code</th>
                    <th className="px-3 py-2.5">Description</th>
                    <th className="px-3 py-2.5 text-center w-20">UOM</th>
                    <th className="px-3 py-2.5 w-32">Qty (Decrease Only)</th>
                    <th className="px-3 py-2.5 text-right w-24">Weight (kg)</th>
                    <th className="px-3 py-2.5 text-right w-24">Rate (₹)</th>
                    <th className="px-3 py-2.5 text-right w-28">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((itm) => {
                    const maxQty = itm.originalQuantity ?? itm.quantity;
                    return (
                      <tr key={itm.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3 py-2.5 font-mono text-xs font-semibold text-slate-800 bg-slate-50/50">
                          {itm.itemCode}
                        </td>
                        <td className="px-3 py-2.5 text-xs font-medium text-slate-800 bg-slate-50/50">
                          {itm.description}
                        </td>
                        <td className="px-3 py-2.5 text-center bg-slate-50/50">
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded text-[11px] font-bold font-mono inline-block">
                            {itm.unit || 'PCS'}
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="flex flex-col">
                            <input
                              type="number"
                              min={0}
                              max={maxQty}
                              value={itm.quantity}
                              onChange={(e) =>
                                handleItemChange(itm.id, 'quantity', Number(e.target.value))
                              }
                              className="w-full px-2 py-1 bg-white border border-amber-400 focus:border-amber-500 rounded text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#F4B400]"
                              title={`Max Allowed: ${maxQty} (Can only decrease)`}
                              required
                            />
                            <span className="text-[9.5px] text-slate-500 font-medium mt-0.5">
                              Max: {maxQty} {itm.unit || 'PCS'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs font-semibold text-slate-700 bg-slate-50/50">
                          {itm.weightKg.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs font-semibold text-slate-700 bg-slate-50/50">
                          ₹{itm.rate.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-700 bg-slate-50/50">
                          ₹{(itm.quantity * itm.rate).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Summary */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Consignment Summary:</span>
              <div className="flex gap-6">
                <span>Weight: {totalWeight.toLocaleString()} kg</span>
                <span>Volume: {totalVolume} cbm</span>
                <span className="text-emerald-700">Total: ₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer inside form */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 flex items-center gap-1.5 transition-all"
              >
                <Save className="w-4 h-4 text-slate-600" />
                <span>Save Draft</span>
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all text-slate-900 bg-[#F4B400] hover:bg-[#e0a400] cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save & Submit Dispatch Bill</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
