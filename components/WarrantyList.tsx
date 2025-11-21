
import React from 'react';
import { Warranty, AppSettings, WarrantyStatus } from '../types';
import WarrantyCard from './WarrantyCard';
import { TrashIcon } from './icons/Icons';

interface WarrantyListProps {
  warranties: Warranty[];
  onEdit: (warranty: Warranty) => void;
  onDelete: (id: string) => void;
  settings: AppSettings;
  statusFilter: WarrantyStatus | 'all';
  onStatusFilterChange: (status: WarrantyStatus | 'all') => void;
  selectedWarranties: Set<string>;
  onSelectionChange: (id: string) => void;
  onSelectAll: (isChecked: boolean) => void;
  onBulkDelete: () => void;
  onBulkExportCSV: () => void;
}

const WarrantyList: React.FC<WarrantyListProps> = ({ 
  warranties, onEdit, onDelete, settings, statusFilter, onStatusFilterChange,
  selectedWarranties, onSelectionChange, onSelectAll, onBulkDelete, onBulkExportCSV
}) => {

  const numSelected = selectedWarranties.size;
  const isAllSelected = warranties.length > 0 && numSelected === warranties.length;

  return (
    <div className="relative">
      {/* Controls Bar */}
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-100 md:bg-transparent md:shadow-none md:border-none md:p-0">
        <div className="flex items-center">
            <input 
              type="checkbox"
              id="select-all"
              className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
              checked={isAllSelected}
              onChange={(e) => onSelectAll(e.target.checked)}
              aria-label="Select all warranties"
            />
            <label htmlFor="select-all" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">Select All</label>
        </div>
        <div className="flex items-center w-full sm:w-auto">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">Status:</label>
          <div className="relative w-full sm:w-48">
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as WarrantyStatus | 'all')}
              className="appearance-none block w-full bg-white border border-gray-300 text-gray-700 py-1.5 px-3 pr-8 rounded-md leading-tight focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary text-sm"
              aria-label="Filter warranties by status"
            >
              <option value="all">All Statuses</option>
              <option value={WarrantyStatus.Active}>Active</option>
              <option value={WarrantyStatus.ExpiringSoon}>Expiring Soon</option>
              <option value={WarrantyStatus.Expired}>Expired</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
      </div>

      {warranties.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-lg shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No Warranty Records Found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter !== 'all' ? `No warranties match the current filter.` : `Get started by adding a new warranty record.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-24">
          {warranties.sort((a,b) => b.id.localeCompare(a.id)).map(warranty => (
            <WarrantyCard 
              key={warranty.id} 
              warranty={warranty} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              settings={settings}
              isSelected={selectedWarranties.has(warranty.id)}
              onSelectionChange={onSelectionChange}
            />
          ))}
        </div>
      )}

      {numSelected > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-20 safe-area-pb">
          <div className="container mx-auto p-3 md:p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="font-semibold text-brand-primary text-sm sm:text-base">{numSelected} record{numSelected > 1 ? 's' : ''} selected</p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onBulkExportCSV}
                className="flex-1 sm:flex-none justify-center px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Export CSV
              </button>
              <button
                onClick={onBulkDelete}
                className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 text-sm bg-brand-danger text-white rounded-lg hover:bg-red-700 transition"
              >
                <TrashIcon /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarrantyList;
