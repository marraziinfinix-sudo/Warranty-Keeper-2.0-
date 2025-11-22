
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
  servicesProvided?: {
    supply: boolean;
    install: boolean;
  };
  serviceName?: string; // To store the specific service from the catalog
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
    ExpiringSoon = 'Expiring',
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

export interface UserProfile {
  uid: string;
  email: string;
  companyName: string;
  role: 'admin' | 'user';
  parentId: string; // If admin, this is their own uid. If user, this is the admin's uid.
  username?: string;
}

export interface SubUser {
  uid: string;
  username: string;
  displayName: string; // usually used for internal naming if needed, or just reuse username
  createdAt: string;
  password?: string; // Stored password for Admin visibility
}