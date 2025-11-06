import React from 'react';
import { WarrantyStatus } from '../types';

interface WarrantyStatusBadgeProps {
  status: WarrantyStatus;
  color: string;
}

const WarrantyStatusBadge: React.FC<WarrantyStatusBadgeProps> = ({ status, color }) => {

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold text-white rounded-full ${color}`}>
      {status}
    </span>
  );
};

export default WarrantyStatusBadge;
