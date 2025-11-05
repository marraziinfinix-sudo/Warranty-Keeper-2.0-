import React, { useState, useEffect } from 'react';
import { Warranty, Product } from '../types';
import { formatDate } from '../utils/warrantyUtils';
import { PlusIcon, TrashIcon } from './icons/Icons';

interface WarrantyFormProps {
  onClose: () => void;
  onPreview: (warranty: Warranty | Omit<Warranty, 'id'>) => void;
  initialData: Warranty | Omit<Warranty, 'id'> | null;
  productList: string[];
}

const malaysianStates = [
    "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", 
    "Pulau Pinang", "Perak", "Perlis", "Sabah", "Sarawak", "Selangor", "Terengganu",
    "W.P. Kuala Lumpur", "W.P. Labuan", "W.P. Putrajaya"
];


const WarrantyForm: React.FC<WarrantyFormProps> = ({ onClose, onPreview, initialData, productList }) => {
  const [formData, setFormData] = useState<Omit<Warranty, 'id'>>({
    customerName: '',
    phoneNumber: '',
    email: '',
    products: [],
    servicesProvided: { supply: false, install: false },
    installDate: '',
    installationWarrantyPeriod: 0,
    installationWarrantyUnit: 'months',
    postcode: '',
    district: '',
    state: '',
    buildingType: 'home',
    otherBuildingType: '',
  });

  useEffect(() => {
    if (initialData) {
      // The migration in App.tsx should handle the heavy lifting.
      // This part just populates the form with the correct new structure.
      setFormData({
        customerName: initialData.customerName,
        phoneNumber: initialData.phoneNumber,
        email: initialData.email,
        products: initialData.products,
        servicesProvided: initialData.servicesProvided ?? { supply: false, install: !!initialData.installDate },
        installDate: initialData.installDate ?? '',
        installationWarrantyPeriod: initialData.installationWarrantyPeriod ?? 0,
        installationWarrantyUnit: initialData.installationWarrantyUnit ?? 'months',
        postcode: initialData.postcode ?? '',
        district: initialData.district ?? '',
        state: initialData.state ?? '',
        buildingType: (initialData as any).buildingType === 'residential' ? 'home' : (initialData.buildingType ?? 'home'),
        otherBuildingType: initialData.otherBuildingType ?? '',
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const newState = { 
            ...prev, 
            [name]: name === 'installationWarrantyPeriod' ? parseInt(value, 10) : value 
        };
        if (name === 'buildingType' && value !== 'others') {
            newState.otherBuildingType = '';
        }
        return newState;
    });
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target as { name: 'supply' | 'install', checked: boolean };
    setFormData(prev => {
        const newServices = { ...prev.servicesProvided, [name]: checked };
        // If install is unchecked, clear install data
        if (name === 'install' && !checked) {
            return {
                ...prev,
                servicesProvided: newServices,
                installDate: '',
                installationWarrantyPeriod: 0
            };
        }
        return { ...prev, servicesProvided: newServices };
    });
  };

  const handleProductChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newProducts = [...formData.products];
    const productToUpdate = { ...newProducts[index] };

    if (name === 'productWarrantyPeriod') {
      (productToUpdate as any)[name] = parseInt(value, 10) || 0;
    } else {
      (productToUpdate as any)[name] = value;
    }
    
    newProducts[index] = productToUpdate;
    setFormData(prev => ({ ...prev, products: newProducts }));
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { 
          productName: '', 
          serialNumber: '',
          purchaseDate: '', // Default to empty
          productWarrantyPeriod: 0,
          productWarrantyUnit: 'months'
      }],
      servicesProvided: { ...prev.servicesProvided, supply: true } // Automatically check 'Supply'
    }));
  };

  const removeProduct = (index: number) => {
    const newProducts = formData.products.filter((_, i) => i !== index);
    setFormData(prev => {
        const newState = { ...prev, products: newProducts };
        // If the last product was just removed, uncheck 'supply'
        if (newProducts.length === 0) {
            newState.servicesProvided = { ...newState.servicesProvided, supply: false };
        }
        return newState;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData && 'id' in initialData) {
      onPreview({ ...formData, id: initialData.id });
    } else {
      onPreview(formData);
    }
    onClose();
  };
  
  const formInputStyles = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm";
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-brand-dark mb-6">{initialData && 'id' in initialData ? 'Edit Warranty' : 'Register New Warranty'}</h2>
                    
                    {/* Customer & Location */}
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Customer & Location</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Customer Name" name="customerName" value={formData.customerName} onChange={handleChange} required />
                        <InputField label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />
                        <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label htmlFor="state" className="block text-sm font-medium text-gray-700">State<span className="text-red-500">*</span></label>
                            <select id="state" name="state" value={formData.state} onChange={handleChange} required className={formInputStyles}>
                                <option value="">Select State</option>
                                {malaysianStates.map(state => <option key={state} value={state}>{state}</option>)}
                            </select>
                        </div>
                        <InputField label="District" name="district" value={formData.district} onChange={handleChange} required />
                        <InputField label="Postcode" name="postcode" value={formData.postcode} onChange={handleChange} required />
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Building Type<span className="text-red-500">*</span></label>
                            <div className="mt-2 flex gap-4">
                                <RadioOption name="buildingType" value="home" checked={formData.buildingType === 'home'} onChange={handleChange} label="Home" />
                                <RadioOption name="buildingType" value="office" checked={formData.buildingType === 'office'} onChange={handleChange} label="Office" />
                                <RadioOption name="buildingType" value="others" checked={formData.buildingType === 'others'} onChange={handleChange} label="Others" />
                            </div>
                        </div>
                        {formData.buildingType === 'others' && (
                            <InputField label="Specify Building Type" name="otherBuildingType" value={formData.otherBuildingType || ''} onChange={handleChange} required placeholder="e.g., Warehouse, Factory" />
                        )}
                    </div>
                    
                    <hr className="my-6"/>

                    {/* Products Section */}
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-800">Products & Warranties</h3>
                         <button type="button" onClick={addProduct} className="flex items-center gap-2 text-sm text-brand-primary font-semibold hover:text-blue-700">
                            <PlusIcon /> Add Product
                        </button>
                    </div>
                    <div className="space-y-4">
                        {formData.products.length === 0 && (
                            <div className="text-center py-6 px-4 bg-gray-50 rounded-lg border-2 border-dashed">
                                <p className="text-sm text-gray-500">No products added for this warranty.</p>
                                <p className="text-xs text-gray-400 mt-1">Click "Add Product" to include product details.</p>
                            </div>
                        )}
                        {formData.products.map((product, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-gray-50 relative">
                                <button type="button" onClick={() => removeProduct(index)} className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition">
                                    <TrashIcon />
                                </button>
                                <InputField label="Product Name" name="productName" value={product.productName} onChange={e => handleProductChange(index, e)} required list="product-list"/>
                                <InputField label="Serial Number" name="serialNumber" value={product.serialNumber} onChange={e => handleProductChange(index, e)} required />
                                <div>
                                    <InputField label="Purchase Date" name="purchaseDate" type="date" value={product.purchaseDate} onChange={e => handleProductChange(index, e)} required />
                                    {product.purchaseDate && <p className="text-xs text-gray-500 mt-1 pr-1 text-right">Selected: {formatDate(product.purchaseDate)}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Product Warranty</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input type="number" name="productWarrantyPeriod" value={product.productWarrantyPeriod} onChange={e => handleProductChange(index, e)} min="0" className={`flex-grow ${formInputStyles}`} />
                                        <select name="productWarrantyUnit" value={product.productWarrantyUnit} onChange={e => handleProductChange(index, e)} className={formInputStyles}>
                                            <option value="days">Days</option>
                                            <option value="weeks">Weeks</option>
                                            <option value="months">Months</option>
                                            <option value="years">Years</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                     <datalist id="product-list">
                        {productList.map(productName => <option key={productName} value={productName} />)}
                    </datalist>
                    
                    <hr className="my-6"/>
                    
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Service Details</h3>
                    <div className="flex items-center gap-6 mb-4">
                        <div className="flex items-center gap-2">
                            <CheckboxOption
                                label="Supply"
                                name="supply"
                                checked={formData.servicesProvided?.supply ?? false}
                                onChange={handleServiceChange}
                                disabled={true}
                            />
                             <span className="text-xs text-gray-500">
                                {formData.products.length > 0
                                    ? '(Required with products)'
                                    : '(Add a product to include Supply)'
                                }
                            </span>
                        </div>
                        <CheckboxOption
                            label="Install"
                            name="install"
                            checked={formData.servicesProvided?.install ?? false}
                            onChange={handleServiceChange}
                        />
                    </div>
                    
                    {/* Installation Fields - Conditional */}
                    {formData.servicesProvided?.install && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <InputField label="Install Date" name="installDate" type="date" value={formData.installDate || ''} onChange={handleChange} />
                                {formData.installDate && <p className="text-xs text-gray-500 mt-1 pr-1 text-right">Selected: {formatDate(formData.installDate)}</p>}
                            </div>
                             <div>
                                <label htmlFor="installationWarrantyPeriod" className="block text-sm font-medium text-gray-700">Installation Warranty</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input type="number" id="installationWarrantyPeriod" name="installationWarrantyPeriod" value={formData.installationWarrantyPeriod} onChange={handleChange} min="0" className={`flex-grow ${formInputStyles}`} />
                                    <select name="installationWarrantyUnit" value={formData.installationWarrantyUnit} onChange={handleChange} className={formInputStyles}>
                                        <option value="days">Days</option>
                                        <option value="weeks">Weeks</option>
                                        <option value="months">Months</option>
                                        <option value="years">Years</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="bg-white border-t px-6 py-4 flex justify-end items-center flex-wrap gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-600 transition">Preview Details</button>
                </div>
            </form>
        </div>
    </div>
  );
};

interface InputFieldProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    required?: boolean;
    placeholder?: string;
    list?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, value, onChange, type = "text", required = false, placeholder, list }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500">*</span>}</label>
        <input type={type} name={name} id={name} value={value} onChange={onChange} required={required} placeholder={placeholder} list={list} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
    </div>
);

interface RadioOptionProps {
    name: string;
    value: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label: string;
}

const RadioOption: React.FC<RadioOptionProps> = ({ name, value, checked, onChange, label }) => (
    <label className="flex items-center">
        <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="h-4 w-4 text-brand-primary border-gray-300 focus:ring-brand-primary" />
        <span className="ml-2 text-sm text-gray-700">{label}</span>
    </label>
);

interface CheckboxOptionProps {
    name: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label: string;
    disabled?: boolean;
}

const CheckboxOption: React.FC<CheckboxOptionProps> = ({ name, checked, onChange, label, disabled = false }) => (
    <label className={`flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
        <input 
            type="checkbox" 
            name={name} 
            checked={checked} 
            onChange={onChange} 
            disabled={disabled}
            className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary" 
        />
        <span className="ml-2 text-sm font-medium text-gray-700">{label}</span>
    </label>
);

export default WarrantyForm;