import React from 'react';
import { WarrantyStatus, Warranty } from '../types';
import { getWarrantyStatusInfo } from '../utils/warrantyUtils';

interface WarrantyStatusBadgeProps {
  warranty: Warranty;
}

const WarrantyStatusBadge: React.FC<WarrantyStatusBadgeProps> = ({ warranty }) => {
  const { status, color } = getWarrantyStatusInfo(warranty);

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold text-white rounded-full ${color}`}>
      {status}
    </span>
  );
};

export default WarrantyStatusBadge;