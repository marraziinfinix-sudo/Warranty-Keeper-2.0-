import React, { useState } from 'react';
import { Warranty, Product } from '../types';
import { formatDate, formatWarrantyText, calculateExpiryDate, getServiceText } from '../utils/warrantyUtils';

interface WarrantyPreviewModalProps {
  warranty: Omit<Warranty, 'id'> | Warranty;
  onConfirm: (shareOptions: { email: boolean, whatsapp: boolean }) => void;
  onEdit: () => void;
  onClose: () => void;
}

const getBuildingTypeText = (warranty: Omit<Warranty, 'id'> | Warranty): string => {
    const buildingType = (warranty as any).buildingType === 'residential' ? 'home' : warranty.buildingType;
    switch (buildingType) {
        case 'home':
            return 'Home';
        case 'office':
            return 'Office';
        case 'others':
            return warranty.otherBuildingType || 'Others';
        default:
            return 'N/A';
    }
}

const WarrantyPreviewModal: React.FC<WarrantyPreviewModalProps> = ({ warranty, onConfirm, onEdit, onClose }) => {
  const [shareOptions, setShareOptions] = useState({ email: false, whatsapp: false });

  const installationExpiryDate = calculateExpiryDate(warranty.installDate, warranty.installationWarrantyPeriod, warranty.installationWarrantyUnit);
  const installationWarrantyText = formatWarrantyText(warranty.installationWarrantyPeriod, warranty.installationWarrantyUnit);

  const handleShareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setShareOptions(prev => ({ ...prev, [name]: checked }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-brand-dark">Preview Warranty Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mt-4 border-b pb-2">Customer & Location Details</h3>
            <DetailRow label="Customer" value={warranty.customerName} />
            <DetailRow label="Phone" value={warranty.phoneNumber} />
            <DetailRow label="Email" value={warranty.email || 'N/A'} />
            <DetailRow label="State" value={warranty.state || 'N/A'} />
            <DetailRow label="District" value={warranty.district || 'N/A'} />
            <DetailRow label="Postcode" value={warranty.postcode || 'N/A'} />
            <DetailRow label="Building Type" value={getBuildingTypeText(warranty)} />
            
            <h3 className="text-lg font-semibold text-gray-800 mt-4 border-b pb-2">Products & Warranties</h3>
             <div className="space-y-4">
                {warranty.products && warranty.products.length > 0 ? (
                    warranty.products.map((product, index) => {
                        const expiryDate = calculateExpiryDate(product.purchaseDate, product.productWarrantyPeriod, product.productWarrantyUnit);
                        return (
                            <div key={index} className="pl-2">
                                <p className="font-semibold text-gray-900">{index + 1}. {product.productName}</p>
                                <div className="pl-6 text-sm">
                                    <DetailRow label="Serial No" value={product.serialNumber} />
                                    <DetailRow label="Purchase Date" value={formatDate(product.purchaseDate)} />
                                    <DetailRow label="Warranty Period" value={formatWarrantyText(product.productWarrantyPeriod, product.productWarrantyUnit)} />
                                    <DetailRow label="Expires On" value={formatDate(expiryDate)} />
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <p className="text-sm text-gray-500 py-2">No products are associated with this warranty record.</p>
                )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-800 mt-4 border-b pb-2">Service Details</h3>
            <DetailRow label="Services Provided" value={getServiceText(warranty.servicesProvided)} />
            {warranty.servicesProvided?.install && (
                <>
                    {warranty.installDate ? <DetailRow label="Installation Date" value={formatDate(warranty.installDate)} /> : null}
                    <DetailRow label="Installation Warranty" value={installationWarrantyText} />
                    {installationExpiryDate && (
                        <DetailRow label="Installation Expiry Date" value={formatDate(installationExpiryDate)} />
                    )}
                </>
            )}
          </div>
        </div>
        <div className="bg-gray-50 border-t px-6 py-4 flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
                <label className="flex items-center text-sm text-gray-600 cursor-pointer">
                    <input 
                        type="checkbox" 
                        name="email"
                        checked={shareOptions.email} 
                        onChange={handleShareChange}
                        className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                    />
                    <span className="ml-2">Share via Email</span>
                </label>
                <label className="flex items-center text-sm text-gray-600 cursor-pointer">
                    <input 
                        type="checkbox" 
                        name="whatsapp"
                        checked={shareOptions.whatsapp} 
                        onChange={handleShareChange}
                        className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                    />
                    <span className="ml-2">Share via WhatsApp</span>
                </label>
            </div>
            <div className="flex justify-end gap-3 flex-grow">
                <button
                    type="button"
                    onClick={onEdit}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                    Edit
                </button>
                <button
                    type="button"
                    onClick={() => onConfirm(shareOptions)}
                    className="px-4 py-2 bg-brand-success text-white rounded-md hover:bg-green-600 transition"
                >
                    Confirm & Save
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

interface DetailRowProps {
    label: string;
    value: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
    <div className="flex justify-between items-center py-1.5 border-b last:border-b-0">
        <p className="font-medium text-gray-600">{label}</p>
        <p className="text-gray-800 text-right">{value}</p>
    </div>
)

export default WarrantyPreviewModal;