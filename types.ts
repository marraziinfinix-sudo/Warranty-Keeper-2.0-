
export interface Product {
  productName: string;
  serialNumber: string;
  purchaseDate: string; // YYYY-MM-DD
  productWarrantyPeriod: number; // The number for the warranty period
  productWarrantyUnit: 'days' | 'weeks' | 'months' | 'years'; // The unit for the period
  expiryReminderDays?: number; // Optional override for global reminder setting
}

export interface Warranty {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  products: Product[];
  servicesProvided?: { // Add new services field
    supply: boolean;
    install: boolean;
  };
  serviceName?: string; // Specific name of the service (e.g., "Standard Installation")
  installDate?: string; // YYYY-MM-DD, optional
  installationWarrantyPeriod: number; // The number for the warranty period
  installationWarrantyUnit: 'days' | 'weeks' | 'months' | 'years'; // The unit for the period
  postcode: string;
  district: string;
  state: string;
  buildingType: 'home' | 'office' | 'others';
  otherBuildingType?: string;
}

export enum WarrantyStatus {
    Active = 'Active',
    ExpiringSoon = 'Expiring Soon',
    Expired = 'Expired'
}

export interface AppSettings {
  expiryReminderDays: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  state: string;
  district: string;
  postcode: string;
  buildingType: 'home' | 'office' | 'others';
  otherBuildingType?: string;
}

export interface SavedProduct {
  id: string;
  name: string;
  defaultWarrantyPeriod: number;
  defaultWarrantyUnit: 'days' | 'weeks' | 'months' | 'years';
}

export interface SavedService {
  id: string;
  name: string;
  defaultWarrantyPeriod: number;
  defaultWarrantyUnit: 'days' | 'weeks' | 'months' | 'years';
}
