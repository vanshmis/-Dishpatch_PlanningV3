import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Eye,
  Truck,
  ArrowUpDown,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  FileText,
  Edit,
} from 'lucide-react';
import { dispatchService } from '../services/api';
import { ProformaInvoice, PIStatus, PriorityLevel } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ApprovePIModal } from '../components/modals/ApprovePIModal';

interface PendingPIPageProps {
  onOpenPIDetails: (pi: ProformaInvoice) => void;
  onOpenNewPI: () => void;
  onOpenNewDispatch: (piId?: string) => void;
}

export const PendingPIPage: React.FC<PendingPIPageProps> = ({
  onOpenPIDetails,
  onOpenNewPI,
  onOpenNewDispatch,
}) => {
  const [pis, setPis] = useState<ProformaInvoice[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [divisionFilter, setDivisionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [selectedPIToApprove, setSelectedPIToApprove] = useState<ProformaInvoice | null>(null);

  useEffect(() => {
    const load = () => {
      setPis(dispatchService.getPIs());
    };
    load();
    const unsub = dispatchService.subscribe(load);
    return () => unsub();
  }, []);

  const filteredPIs = pis.filter((pi) => {
    const matchesStatus = statusFilter === 'ALL' || pi.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || pi.priority === priorityFilter;
    const matchesDivision = divisionFilter === 'ALL' || (pi.division || 'GT') === divisionFilter;
    const matchesClient = clientFilter === 'ALL' || pi.clientName === clientFilter;
    const matchesSearch =
      pi.piNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pi.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pi.clientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pi.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pi.destinationCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pi.division || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesPriority && matchesDivision && matchesClient && matchesSearch;
  });

  const uniqueClients = Array.from(new Set(pis.map((p) => p.clientName)));
  const pendingCount = pis.filter((p) => p.status === 'PENDING').length;
  const draftCount = pis.filter((p) => p.status === 'DRAFT').length;

  const totalPendingWeight = pis
    .filter((p) => p.status === 'PENDING' || p.status === 'DRAFT')
    .reduce((sum, p) => sum + p.totalWeightKg, 0);
  const totalPendingValue = pis
    .filter((p) => p.status === 'PENDING' || p.status === 'DRAFT')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const handleExportCSV = () => {
    const headers = ['PI Number', 'Order No', 'Party Code', 'Client', 'Destination', 'Date', 'Expected Date', 'Weight (kg)', 'Amount (INR)', 'Status', 'Priority'];
    const rows = filteredPIs.map(p => [
      p.piNumber,
      p.orderNumber,
      p.clientCode,
      `"${p.clientName}"`,
      p.destinationCity,
      p.piDate,
      p.expectedDeliveryDate,
      p.totalWeightKg,
      p.totalAmount,
      p.status,
      p.priority,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dispatch_Planning_PI_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Proforma Invoices & Orders Registry
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-200">
              {pendingCount} Pending | {draftCount} Drafts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage incoming sales orders, monitor fulfillment deadlines, and push batches to dispatch planning.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenNewPI}
            className="px-4 py-2 bg-[#F4B400] hover:bg-[#e0a400] text-slate-950 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Dispatch Planning Form</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Cards (Compact) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-2.5 px-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider block">
              Pending Payload Backlog
            </span>
            <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
              {totalPendingWeight.toLocaleString()} kg <span className="text-[10px] text-slate-500 font-normal">({(totalPendingWeight / 1000).toFixed(1)} MT)</span>
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-2.5 px-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider block">
              Pending Invoice Value
            </span>
            <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">
              ₹{(totalPendingValue / 100000).toFixed(2)} Lakhs <span className="text-[10px] text-slate-500 font-normal">({pendingCount} Orders, {draftCount} Drafts)</span>
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0 border border-emerald-200">
            ₹
          </div>
        </div>

        <div className="p-2.5 px-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider block">
              High Priority & Urgent Orders
            </span>
            <span className="text-sm font-extrabold text-rose-600 mt-0.5 block">
              {pis.filter((p) => (p.status === 'PENDING' || p.status === 'DRAFT') && (p.priority === 'URGENT' || p.priority === 'HIGH')).length} Orders
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Status Tab Filters */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {['PENDING', 'DRAFT', 'ALL', 'PLANNED', 'DISPATCHED', 'DELIVERED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-[#181309] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {st === 'ALL' ? 'All Records' : st.replace(/_/g, ' ')}
                {st === 'PENDING' && ` (${pendingCount})`}
                {st === 'DRAFT' && ` (${draftCount})`}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredPIs.length} of {pis.length} PIs
          </span>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PI number, party code, client, division..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]"
            />
          </div>

          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Clients ({uniqueClients.length})</option>
            {uniqueClients.map((cl) => (
              <option key={cl} value={cl}>
                {cl}
              </option>
            ))}
          </select>

          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-purple-900 focus:ring-2 focus:ring-[#F4B400]"
          >
            <option value="ALL">All Divisions (GT, MT, SMT...)</option>
            <option value="GT">GT (General Trade)</option>
            <option value="MT">MT (Modern Trade)</option>
            <option value="SMT">SMT</option>
            <option value="SMT-Direct">SMT-Direct</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Priority Levels</option>
            <option value="URGENT">Urgent Express</option>
            <option value="HIGH">High Priority</option>
            <option value="NORMAL">Normal Priority</option>
          </select>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-3 whitespace-nowrap min-w-[130px]">PI & Order No</th>
                <th className="px-3 py-3 whitespace-nowrap min-w-[90px] font-bold text-slate-700">Party Code</th>
                <th className="px-3.5 py-3 min-w-[160px]">Client & Destination</th>
                <th className="px-3 py-3 whitespace-nowrap min-w-[100px] font-bold text-slate-800">Division</th>
                <th className="px-3 py-3 text-center whitespace-nowrap font-bold text-slate-700">PI Link</th>
                <th className="px-3 py-3 whitespace-nowrap min-w-[110px]">Issue / Due Date</th>
                <th className="px-3 py-3 text-right whitespace-nowrap">Weight (kg)</th>
                <th className="px-3.5 py-3 text-right whitespace-nowrap">Amount (₹)</th>
                <th className="px-3 py-3 whitespace-nowrap">Priority</th>
                <th className="px-3 py-3 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredPIs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-slate-400">
                    No proforma invoices found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredPIs.map((pi) => (
                  <tr
                    key={pi.id}
                    className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                      pi.status === 'DRAFT' ? 'bg-slate-50/50' : ''
                    }`}
                    onClick={() => onOpenPIDetails(pi)}
                  >
                    {/* PI & Order No */}
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900 leading-snug">{pi.piNumber}</div>
                      <div className="text-[10px] text-slate-500 font-mono leading-tight">{pi.orderNumber}</div>
                    </td>

                    {/* Party Code (Plain text, no box) */}
                    <td className="px-3 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <span className="font-mono font-bold text-xs text-slate-800">
                        {pi.clientCode || 'PTY-101'}
                      </span>
                    </td>

                    {/* Client & Destination */}
                    <td className="px-3.5 py-3">
                      <div className="font-semibold text-slate-900 leading-snug">{pi.clientName}</div>
                      <div className="text-[11px] text-slate-500">
                        {pi.destinationCity}, {pi.state}
                      </div>
                    </td>

                    {/* Division */}
                    <td className="px-3 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                        {pi.division || 'GT'}
                      </span>
                    </td>

                    {/* PI Link */}
                    <td className="px-3 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onOpenPIDetails(pi)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold transition-colors border border-blue-200"
                        title="Open PI Document"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>PI Doc</span>
                        <ExternalLink className="w-3 h-3 text-blue-500" />
                      </button>
                    </td>

                    {/* Issue / Due Date */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-slate-800 font-mono text-xs leading-snug">{pi.piDate}</div>
                      <div className="text-[10px] text-amber-700 font-semibold font-mono leading-tight">
                        Due: {pi.expectedDeliveryDate}
                      </div>
                    </td>

                    {/* Weight */}
                    <td className="px-3 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {pi.totalWeightKg.toLocaleString()}
                    </td>

                    {/* Amount */}
                    <td className="px-3.5 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      ₹{pi.totalAmount.toLocaleString()}
                    </td>

                    {/* Priority */}
                    <td className="px-3 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={pi.priority} size="sm" />
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={pi.status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenPIDetails(pi)}
                          className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {pi.status === 'DRAFT' && (
                          <button
                            onClick={() => {
                              dispatchService.updatePIStatus(pi.id, 'PENDING');
                              alert(`Draft ${pi.piNumber} has been published to Pending PIs!`);
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded text-[11px] flex items-center gap-1 shadow-2xs"
                            title="Publish Draft"
                          >
                            <Edit className="w-3 h-3 text-amber-400" />
                            <span>Publish</span>
                          </button>
                        )}

                        {pi.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => setSelectedPIToApprove(pi)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] flex items-center gap-1 shadow-2xs"
                              title="Approve PI"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>

                            <button
                              onClick={() => onOpenNewDispatch(pi.id)}
                              className="px-2.5 py-1 bg-[#F4B400] hover:bg-[#e0a400] text-slate-950 font-bold rounded text-[11px] flex items-center gap-1 shadow-2xs"
                              title="Plan Dispatch"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Plan</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
