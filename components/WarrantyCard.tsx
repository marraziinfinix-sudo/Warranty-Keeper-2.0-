import React, { useState } from 'react';
import { Warranty, WarrantyStatus } from '../types';
import WarrantyStatusBadge from './WarrantyStatusBadge';
import { EditIcon, TrashIcon, CalendarIcon, UserIcon, SerialIcon, NotificationBellIcon, EmailIcon, WhatsAppIcon, LocationPinIcon, BuildingIcon, ToolboxIcon } from './icons/Icons';
import WarrantyDetailModal from './WarrantyDetailModal';
import { getWarrantyStatusInfo, formatDate, calculateExpiryDate, formatPhoneNumberForWhatsApp, generateShareMessage, getEarliestProductExpiry, getServiceText } from '../utils/warrantyUtils';

interface WarrantyCardProps {
  warranty: Warranty;
  onEdit: (warranty: Warranty) => void;
  onDelete: (id: string) => void;
}

const getBuildingTypeText = (warranty: Warranty): string => {
    // Handle old data where buildingType might be 'residential'
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

const WarrantyCard: React.FC<WarrantyCardProps> = ({ warranty, onEdit, onDelete }) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showNotifyOptions, setShowNotifyOptions] = useState(false);

  const { status } = getWarrantyStatusInfo(warranty);
  const isExpiringSoon = status === WarrantyStatus.ExpiringSoon;
  const isExpired = status === WarrantyStatus.Expired;

  const productExpiryDate = getEarliestProductExpiry(warranty.products);
  const installationExpiryDate = calculateExpiryDate(warranty.installDate, warranty.installationWarrantyPeriod, warranty.installationWarrantyUnit);

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
    setShowNotifyOptions(false);
  };

  const locationText = [warranty.state, warranty.district, warranty.postcode].filter(Boolean).join(', ');
  
  const primaryProduct = warranty.products?.[0];
  const additionalProductsCount = warranty.products?.length > 1 ? warranty.products.length - 1 : 0;
  const cardTitle = primaryProduct?.productName || `${getServiceText(warranty.servicesProvided)} Warranty`;

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform transform hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between">
        <div className="p-5">
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-brand-dark tracking-tight">
                    {cardTitle}
                    {additionalProductsCount > 0 && (
                        <span className="text-sm font-normal text-gray-500 ml-2">(+{additionalProductsCount} more)</span>
                    )}
                </h3>
                <div className="flex items-center gap-2">
                    {isExpiringSoon && !isExpired && (
                        <div className="relative">
                            <button 
                                onClick={() => setShowNotifyOptions(!showNotifyOptions)} 
                                className="text-yellow-500 hover:text-yellow-600 p-1 rounded-full relative"
                                aria-label="Notify Customer"
                            >
                                <NotificationBellIcon />
                                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                            </button>
                            {showNotifyOptions && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border">
                                    <div className="py-1">
                                        <button onClick={() => handleNotify('email')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                            <EmailIcon /> Notify via Email
                                        </button>
                                        <button onClick={() => handleNotify('whatsapp')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                            <WhatsAppIcon /> Notify via WhatsApp
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <WarrantyStatusBadge 
                        warranty={warranty}
                    />
                </div>
            </div>
            
            <p className="text-brand-secondary font-medium flex items-center gap-2 mb-2"><UserIcon /> {warranty.customerName}</p>
            <div className="text-gray-500 text-sm flex items-start gap-2 mb-4">
                <div className="mt-0.5"><LocationPinIcon /></div>
                <div className="flex flex-col">
                    <span>{locationText || 'No location set'}</span>
                    <span className="text-xs text-gray-400 capitalize flex items-center gap-1"><BuildingIcon />{getBuildingTypeText(warranty)}</span>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              {productExpiryDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarIcon />
                      <span>Product warranty expires: {formatDate(productExpiryDate)}</span>
                  </div>
              )}
              {warranty.servicesProvided?.install && installationExpiryDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarIcon />
                    <span>Installation expires: {formatDate(installationExpiryDate)}</span>
                </div>
              )}
              {warranty.servicesProvided?.supply && !warranty.servicesProvided?.install && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ToolboxIcon />
                    <span>Service: Supply Only</span>
                </div>
              )}
            </div>
        </div>
        
        <div className="bg-gray-50 px-5 py-3 flex justify-between items-center">
            <button onClick={() => setIsDetailModalOpen(true)} className="text-brand-primary font-semibold hover:underline">
                View Details
            </button>
            <div className="flex items-center gap-2">
                <button onClick={() => onEdit(warranty)} className="text-gray-500 hover:text-brand-primary p-2 rounded-full transition-colors">
                    <EditIcon />
                </button>
                <button onClick={() => onDelete(warranty.id)} className="text-gray-500 hover:text-brand-danger p-2 rounded-full transition-colors">
                    <TrashIcon />
                </button>
            </div>
        </div>
      </div>
      {isDetailModalOpen && <WarrantyDetailModal warranty={warranty} onClose={() => setIsDetailModalOpen(false)} />}
    </>
  );
};

export default WarrantyCard;