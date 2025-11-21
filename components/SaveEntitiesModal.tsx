
import React, { useState } from 'react';
import { Customer, SavedProduct, SavedService } from '../types';
import { UsersIcon, CubeIcon, WrenchIcon } from './icons/Icons';

interface SaveEntitiesModalProps {
  newCustomer: Customer | null;
  newProducts: SavedProduct[];
  newServices: SavedService[];
  onConfirm: (saveCustomer: boolean, productsToSave: string[], servicesToSave: string[]) => void;
  onCancel: () => void; // Acts as "Skip"
}

const SaveEntitiesModal: React.FC<SaveEntitiesModalProps> = ({ 
  newCustomer, 
  newProducts,
  newServices, 
  onConfirm, 
  onCancel 
}) => {
  const [saveCustomer, setSaveCustomer] = useState(!!newCustomer);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(newProducts.map(p => p.name))
  );
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set(newServices.map(s => s.name))
  );

  const handleProductToggle = (productName: string) => {
    const newSet = new Set(selectedProducts);
    if (newSet.has(productName)) {
        newSet.delete(productName);
    } else {
        newSet.add(productName);
    }
    setSelectedProducts(newSet);
  };

  const handleServiceToggle = (serviceName: string) => {
    const newSet = new Set(selectedServices);
    if (newSet.has(serviceName)) {
        newSet.delete(serviceName);
    } else {
        newSet.add(serviceName);
    }
    setSelectedServices(newSet);
  };

  const handleConfirm = () => {
    onConfirm(saveCustomer, Array.from(selectedProducts), Array.from(selectedServices));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
            <div className="flex items-center justify-center mb-4 text-brand-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h2 className="text-xl font-bold text-center text-gray-900 mb-2">New Data Detected</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
                We noticed some new information. Would you like to save these to your master lists for quicker entry next time?
            </p>

            <div className="space-y-4">
                {newCustomer && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <label className="flex items-start cursor-pointer">
                            <div className="flex items-center h-5">
                                <input 
                                    type="checkbox" 
                                    checked={saveCustomer}
                                    onChange={(e) => setSaveCustomer(e.target.checked)}
                                    className="focus:ring-brand-primary h-4 w-4 text-brand-primary border-gray-300 rounded" 
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <span className="font-medium text-gray-900 flex items-center gap-2">
                                    <UsersIcon /> Save New Customer
                                </span>
                                <p className="text-gray-500 mt-1">{newCustomer.name}</p>
                            </div>
                        </label>
                    </div>
                )}

                {newProducts.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <CubeIcon /> Save New Products
                        </p>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {newProducts.map((product) => (
                                <label key={product.name} className="flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedProducts.has(product.name)}
                                        onChange={() => handleProductToggle(product.name)}
                                        className="focus:ring-brand-primary h-4 w-4 text-brand-primary border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">{product.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {newServices.length > 0 && (
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <WrenchIcon /> Save New Services
                        </p>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {newServices.map((service) => (
                                <label key={service.name} className="flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedServices.has(service.name)}
                                        onChange={() => handleServiceToggle(service.name)}
                                        className="focus:ring-brand-primary h-4 w-4 text-brand-primary border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">{service.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
            <button 
                onClick={onCancel} 
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
            >
                No, Skip
            </button>
            <button 
                onClick={handleConfirm} 
                className="px-6 py-2 bg-brand-primary text-white text-sm font-bold rounded-md hover:bg-blue-600 shadow-sm transition"
            >
                Save Selected & Continue
            </button>
        </div>
      </div>
    </div>
  );
};

export default SaveEntitiesModal;
