import React from 'react';
import { Warranty, WarrantyStatus, Product } from '../types';
import { getWarrantyStatusInfo, formatDate, formatPhoneNumberForWhatsApp, formatWarrantyText, calculateExpiryDate, generateShareMessage, getServiceText } from '../utils/warrantyUtils';
import { EmailIcon, WhatsAppIcon } from './icons/Icons';

interface WarrantyDetailModalProps {
  warranty: Warranty;
  onClose: () => void;
}

const getBuildingTypeText = (warranty: Warranty): string => {
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

const WarrantyDetailModal: React.FC<WarrantyDetailModalProps> = ({ warranty, onClose }) => {
  const { status } = getWarrantyStatusInfo(warranty);
  const isExpired = status === WarrantyStatus.Expired;
  
  const installationExpiryDate = calculateExpiryDate(warranty.installDate, warranty.installationWarrantyPeriod, warranty.installationWarrantyUnit);
  const installationWarrantyText = formatWarrantyText(warranty.installationWarrantyPeriod, warranty.installationWarrantyUnit);

  const handleNotify = (channel: 'email' | 'whatsapp') => {
    const message = generateShareMessage(warranty, true);

    if (channel === 'email') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstUnexpiredProduct = warranty.products.find(p => {
            if (p.productWarrantyPeriod <= 0) return false;
            const expiry = calculateExpiryDate(p.purchaseDate, p.productWarrantyPeriod, p.productWarrantyUnit);
            return expiry ? expiry >= today : false;
        });

        const installationExpiry = warranty.installDate && warranty.installationWarrantyPeriod > 0
            ? calculateExpiryDate(warranty.installDate, warranty.installationWarrantyPeriod, warranty.installationWarrantyUnit)
            : null;
        const isInstallationUnexpired = installationExpiry ? installationExpiry >= today : false;

        let subjectTarget = 'Your Product/Service';
        if (firstUnexpiredProduct) {
            subjectTarget = firstUnexpiredProduct.productName;
        } else if (isInstallationUnexpired) {
            subjectTarget = 'Installation Service';
        }
        
        const subject = `Warranty Expiry Reminder - ${subjectTarget}`;
        window.location.href = `mailto:${warranty.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    } else if (channel === 'whatsapp') {
        const whatsappNumber = formatPhoneNumberForWhatsApp(warranty.phoneNumber);
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-brand-dark">Warranty Details</h2>
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

            <div className="pt-2">
                 <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Notification Actions</h3>
                 <div className="flex items-center gap-4 py-2">
                    <p className="font-medium text-gray-600">Send Reminder</p>
                    <div className="flex-grow flex justify-end gap-2">
                        <button onClick={() => handleNotify('email')} disabled={isExpired} className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed">
                            <EmailIcon /> Email
                        </button>
                        <button onClick={() => handleNotify('whatsapp')} disabled={isExpired} className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition disabled:opacity-50 disabled:cursor-not-allowed">
                            <WhatsAppIcon /> WhatsApp
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-600 transition"
            >
                Close
            </button>
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

export default WarrantyDetailModal;