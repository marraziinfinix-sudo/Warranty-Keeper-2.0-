import { Warranty, WarrantyStatus, Product } from '../types';

export interface WarrantyStatusInfo {
  status: WarrantyStatus;
  color: string;
  expiryDate: Date;
}

export const formatDate = (date: Date | string | undefined | null): string => {
  if (!date) return 'N/A';

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  if (dateObj.getFullYear() > 9000) {
    return 'Does not expire';
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
};

export const calculateExpiryDate = (startDate: string | Date | undefined, period: number, unit: 'days' | 'weeks' | 'months' | 'years'): Date | null => {
    if (!startDate) return null;
    const date = new Date(startDate);
    if (isNaN(date.getTime())) return null;

    switch (unit) {
        case 'days':
            date.setDate(date.getDate() + period);
            break;
        case 'weeks':
            date.setDate(date.getDate() + (period * 7));
            break;
        case 'months':
            date.setMonth(date.getMonth() + period);
            break;
        case 'years':
        default:
            date.setFullYear(date.getFullYear() + period);
            break;
    }
    return date;
}

export const getEarliestProductExpiry = (products: Product[]): Date | null => {
    if (!products || products.length === 0) {
        return null;
    }
    const expiryDates = products
        .map(p => calculateExpiryDate(p.purchaseDate, p.productWarrantyPeriod, p.productWarrantyUnit))
        .filter((d): d is Date => d !== null);

    if (expiryDates.length === 0) {
        return null;
    }
    
    return new Date(Math.min.apply(null, expiryDates.map(d => d.getTime())));
}

export const getWarrantyStatusInfo = (warranty: Warranty): WarrantyStatusInfo => {
    const allExpiryDates: Date[] = [];

    if (warranty.products && warranty.products.length > 0) {
        warranty.products.forEach(p => {
            if (p.productWarrantyPeriod > 0) {
                const expiry = calculateExpiryDate(p.purchaseDate, p.productWarrantyPeriod, p.productWarrantyUnit);
                if (expiry) allExpiryDates.push(expiry);
            }
        });
    }

    if (warranty.servicesProvided?.install && warranty.installDate && warranty.installationWarrantyPeriod > 0) {
        const installExpiryDate = calculateExpiryDate(warranty.installDate, warranty.installationWarrantyPeriod, warranty.installationWarrantyUnit);
        if (installExpiryDate) {
            allExpiryDates.push(installExpiryDate);
        }
    }

    if (allExpiryDates.length === 0) {
        return { status: WarrantyStatus.Active, color: 'bg-brand-success', expiryDate: new Date('9999-12-31') };
    }
    
    const latestExpiryDate = new Date(Math.max.apply(null, allExpiryDates.map(d => d.getTime())));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    latestExpiryDate.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    thirtyDaysFromNow.setHours(0, 0, 0, 0);

    if (latestExpiryDate < today) {
        return { status: WarrantyStatus.Expired, color: 'bg-brand-danger', expiryDate: latestExpiryDate };
    }
    if (latestExpiryDate <= thirtyDaysFromNow) {
        return { status: WarrantyStatus.ExpiringSoon, color: 'bg-brand-warning', expiryDate: latestExpiryDate };
    }
    return { status: WarrantyStatus.Active, color: 'bg-brand-success', expiryDate: latestExpiryDate };
};

export const formatPhoneNumberForWhatsApp = (phone: string): string => {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '6' + cleaned;
    }
    if (!cleaned.startsWith('60')) {
        cleaned = '60' + cleaned;
    }
    return cleaned;
};

export const formatWarrantyText = (period: number, unit: 'days' | 'weeks' | 'months' | 'years') => {
    if (period === 0) return `0 ${unit}`;
    const unitName = period === 1 ? unit.slice(0, -1) : unit;
    return `${period} ${unitName}`;
}

export const getServiceText = (services?: { supply: boolean; install: boolean; }): string => {
    if (!services) return 'N/A';
    const { supply, install } = services;

    if (supply && !install) {
        return 'Supply Only';
    }
    if (!supply && install) {
        return 'Install';
    }
    if (supply && install) {
        return 'Supply & Install';
    }
    
    return 'N/A'; // In case both are false
};

export const generateShareMessage = (warranty: Omit<Warranty, 'id'> | Warranty, isReminder = false): string => {
    let message = `Hi ${warranty.customerName},\n\n`;

    if (isReminder) {
        message += `This is a friendly reminder that the warranty for the following item(s) is expiring soon. Here are the details:\n\n`;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const unexpiredProducts = warranty.products?.filter(p => {
            if (p.productWarrantyPeriod <= 0) return false;
            const expiry = calculateExpiryDate(p.purchaseDate, p.productWarrantyPeriod, p.productWarrantyUnit);
            return expiry ? expiry >= today : false;
        });

        const installationExpiry = warranty.installDate && warranty.installationWarrantyPeriod > 0 
            ? calculateExpiryDate(warranty.installDate, warranty.installationWarrantyPeriod, warranty.installationWarrantyUnit) 
            : null;
        const isInstallationUnexpired = installationExpiry ? installationExpiry >= today : false;

        let contentAdded = false;

        if (unexpiredProducts && unexpiredProducts.length > 0) {
            message += `--- Products & Warranties ---\n`;
            unexpiredProducts.forEach((p) => {
                const expiry = calculateExpiryDate(p.purchaseDate, p.productWarrantyPeriod, p.productWarrantyUnit);
                message += `Item: ${p.productName}\n`;
                message += `  Serial Number: ${p.serialNumber}\n`;
                message += `  Purchase Date: ${formatDate(p.purchaseDate)}\n`;
                message += `  Warranty: ${formatWarrantyText(p.productWarrantyPeriod, p.productWarrantyUnit)}\n`;
                message += `  Expires on: ${expiry ? formatDate(expiry) : 'N/A'}\n\n`;
            });
            contentAdded = true;
        }

        if (warranty.servicesProvided?.install && isInstallationUnexpired) {
            message += `--- Service Information ---\n`;
            message += `Service Type: Installation\n`;
            message += `Installation Date: ${formatDate(warranty.installDate)}\n`;
            message += `Installation Warranty: ${formatWarrantyText(warranty.installationWarrantyPeriod, warranty.installationWarrantyUnit)}\n`;
            message += `Installation Warranty Expires: ${installationExpiry ? formatDate(installationExpiry) : 'N/A'}\n\n`;
            contentAdded = true;
        }
        
        if (!contentAdded) {
            return `Hi ${warranty.customerName},\n\nThis is a friendly reminder regarding your warranties. Please review your records for items that may be expiring soon.\n\nThank you!`;
        }

        message += `Thank you!`;

    } else { // Logic for initial share
        message += `Here are the warranty details for your recent purchase:\n\n`;
        
        if (warranty.products && warranty.products.length > 0) {
            message += `--- Products & Warranties ---\n`;
            warranty.products?.forEach((p, i) => {
                const expiry = calculateExpiryDate(p.purchaseDate, p.productWarrantyPeriod, p.productWarrantyUnit);
                message += `Item ${i + 1}: ${p.productName}\n`;
                message += `  Serial Number: ${p.serialNumber}\n`;
                message += `  Purchase Date: ${formatDate(p.purchaseDate)}\n`;
                message += `  Warranty: ${formatWarrantyText(p.productWarrantyPeriod, p.productWarrantyUnit)}\n`;
                message += `  Expires on: ${expiry ? formatDate(expiry) : 'N/A'}\n\n`;
            });
        }
        
        message += `--- Service Information ---\n`;
        message += `Services Provided: ${getServiceText(warranty.servicesProvided)}\n`;
        
        if (warranty.servicesProvided?.install) {
            const installationExpiry = warranty.installDate ? calculateExpiryDate(warranty.installDate, warranty.installationWarrantyPeriod, warranty.installationWarrantyUnit) : null;
            message += `Installation Date: ${formatDate(warranty.installDate)}\n`;
            if (warranty.installationWarrantyPeriod > 0) {
                message += `Installation Warranty: ${formatWarrantyText(warranty.installationWarrantyPeriod, warranty.installationWarrantyUnit)}\n`;
                message += `Installation Warranty Expires: ${installationExpiry ? formatDate(installationExpiry) : 'N/A'}\n`;
            }
        }
        message += `\n`;

        message += `Thank you for your purchase!`;
    }

    return message;
};

export const triggerShare = (
    warranty: Omit<Warranty, 'id'> | Warranty, 
    shareOptions: { email: boolean, whatsapp: boolean }
) => {
    if (!shareOptions.email && !shareOptions.whatsapp) return;

    const message = generateShareMessage(warranty);
    const subject = `Warranty Details for ${warranty.products[0]?.productName || 'Your Purchase'}`;

    if (shareOptions.email) {
        window.location.href = `mailto:${warranty.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    }
    
    if (shareOptions.whatsapp) {
        const triggerWhatsApp = () => {
            const whatsappNumber = formatPhoneNumberForWhatsApp(warranty.phoneNumber);
            window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
        };
        
        if (shareOptions.email) {
            setTimeout(triggerWhatsApp, 500);
        } else {
            triggerWhatsApp();
        }
    }
};