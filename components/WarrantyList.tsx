import React from 'react';
import { Warranty } from '../types';
import WarrantyCard from './WarrantyCard';

interface WarrantyListProps {
  warranties: Warranty[];
  onEdit: (warranty: Warranty) => void;
  onDelete: (id: string) => void;
}

const WarrantyList: React.FC<WarrantyListProps> = ({ warranties, onEdit, onDelete }) => {

  if (warranties.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-lg shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">No Warranty Records Found</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding a new warranty record.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {warranties.sort((a,b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()).map(warranty => (
        <WarrantyCard key={warranty.id} warranty={warranty} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default WarrantyList;