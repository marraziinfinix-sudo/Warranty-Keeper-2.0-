export interface Product {
  productName: string;
  serialNumber: string;
  purchaseDate: string; // YYYY-MM-DD
  productWarrantyPeriod: number; // The number for the warranty period
  productWarrantyUnit: 'days' | 'weeks' | 'months' | 'years'; // The unit for the period
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
