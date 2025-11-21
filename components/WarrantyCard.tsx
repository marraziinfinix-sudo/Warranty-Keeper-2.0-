
import React, { useState } from 'react';
import { Warranty, WarrantyStatus, AppSettings } from '../types';
import WarrantyStatusBadge from './WarrantyStatusBadge';
import { EditIcon, TrashIcon, CalendarIcon, UserIcon, SerialIcon, NotificationBellIcon, EmailIcon, WhatsAppIcon, LocationPinIcon, BuildingIcon, ToolboxIcon, WrenchIcon } from './icons/Icons';
import WarrantyDetailModal from './WarrantyDetailModal';
import { getWarrantyStatusInfo, formatDate, calculateExpiryDate, formatPhoneNumberForWhatsApp, generateShareMessage, getEarliestProductExpiry, getServiceText } from '../utils/warrantyUtils';

interface WarrantyCardProps {
  warranty: Warranty;
  onEdit: (warranty: Warranty) => void;
  onDelete: (id: string) => void;
  settings: AppSettings;
  isSelected: boolean;
  onSelectionChange: (id: string) => void;
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

const WarrantyCard: React.FC<WarrantyCardProps> = ({ warranty, onEdit, onDelete, settings, isSelected, onSelectionChange }) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showNotifyOptions, setShowNotifyOptions] = useState(false);

  const { status, color } = getWarrantyStatusInfo(warranty, settings.expiryReminderDays);
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
            subjectTarget = warranty.serviceName || 'Installation Service';
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
  const cardTitle = primaryProduct?.productName || `${getServiceText(warranty.servicesProvided, warranty.serviceName)} Warranty`;

  return (
    <>
      <div 
        className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 flex flex-col justify-between relative ring-2 ${isSelected ? 'ring-brand-primary' : 'ring-transparent'}`}
        onClick={() => setIsDetailModalOpen(true)} // Make whole card clickable for details
      >
        {/* Selection Checkbox - positioned absolutely */}
        <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
            <input
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer shadow-sm"
                checked={isSelected}
                onChange={() => onSelectionChange(warranty.id)}
                aria-label={`Select warranty for ${warranty.customerName}`}
            />
        </div>

        <div className="p-4 md:p-5 pl-10 md:pl-12">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                <h3 className="text-lg md:text-xl font-bold text-brand-dark tracking-tight leading-snug pr-8 sm:pr-0">
                    {cardTitle}
                    {additionalProductsCount > 0 && (
                        <span className="text-xs md:text-sm font-normal text-gray-500 ml-2 block sm:inline">(+{additionalProductsCount} more)</span>
                    )}
                </h3>
                <div className="flex items-center gap-2 self-start sm:self-auto absolute top-4 right-4 sm:static">
                    {isExpiringSoon && !isExpired && (
                        <div className="relative">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowNotifyOptions(!showNotifyOptions); }} 
                                className="text-yellow-500 hover:text-yellow-600 p-1 rounded-full relative focus:outline-none"
                                aria-label="Notify Customer"
                            >
                                <NotificationBellIcon />
                                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                            </button>
                            {showNotifyOptions && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border">
                                    <div className="py-1">
                                        <button onClick={(e) => { e.stopPropagation(); handleNotify('email'); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                            <EmailIcon /> Notify via Email
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleNotify('whatsapp'); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                            <WhatsAppIcon /> Notify via WhatsApp
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <WarrantyStatusBadge 
                        status={status}
                        color={color}
                    />
                </div>
            </div>
            
            <p className="text-brand-secondary font-medium flex items-center gap-2 mb-1.5 text-sm md:text-base">
                <UserIcon /> {warranty.customerName}
            </p>
            <div className="text-gray-500 text-xs md:text-sm flex items-start gap-2 mb-3">
                <div className="mt-0.5 flex-shrink-0"><LocationPinIcon /></div>
                <div className="flex flex-col">
                    <span className="line-clamp-1">{locationText || 'No location set'}</span>
                    <span className="text-xs text-gray-400 capitalize flex items-center gap-1 mt-0.5">
                        <BuildingIcon />{getBuildingTypeText(warranty)}
                    </span>
                </div>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-1.5">
              {productExpiryDate && (
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                      <CalendarIcon />
                      <span>Product warranty expires: <span className="font-medium">{formatDate(productExpiryDate)}</span></span>
                  </div>
              )}
              {warranty.servicesProvided?.install && installationExpiryDate && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                    <WrenchIcon />
                    <span>{warranty.serviceName || 'Installation'} expires: <span className="font-medium">{formatDate(installationExpiryDate)}</span></span>
                </div>
              )}
              {warranty.servicesProvided?.supply && !warranty.servicesProvided?.install && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                    <ToolboxIcon />
                    <span>Service: Supply Only</span>
                </div>
              )}
            </div>
        </div>
        
        <div className="bg-gray-50 px-4 md:px-5 py-2 md:py-3 flex justify-between items-center border-t border-gray-100">
            <span className="text-brand-primary text-xs md:text-sm font-semibold group-hover:underline">
                View Details
            </span>
            <div className="flex items-center gap-1 md:gap-2">
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(warranty); }} 
                    className="text-gray-500 hover:text-brand-primary p-1.5 md:p-2 rounded-full transition-colors focus:outline-none hover:bg-blue-50"
                    title="Edit Warranty"
                >
                    <EditIcon />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(warranty.id); }} 
                    className="text-gray-500 hover:text-brand-danger p-1.5 md:p-2 rounded-full transition-colors focus:outline-none hover:bg-red-50"
                    title="Delete Warranty"
                >
                    <TrashIcon />
                </button>
            </div>
        </div>
      </div>
      {isDetailModalOpen && <WarrantyDetailModal warranty={warranty} settings={settings} onClose={() => setIsDetailModalOpen(false)} />}
    </>
  );
};

export default WarrantyCard;
