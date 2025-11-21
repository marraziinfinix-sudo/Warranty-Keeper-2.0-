
import React, { useState } from 'react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  currentSettings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onClose: () => void;
  onClearData: (type: 'warranties' | 'customers' | 'products' | 'services' | 'all') => Promise<void>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ currentSettings, onSave, onClose, onClearData }) => {
  const [settings, setSettings] = useState<AppSettings>(currentSettings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: parseInt(value, 10) || 0,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
    onClose();
  };

  const handleClear = (type: 'warranties' | 'customers' | 'products' | 'services' | 'all') => {
      const messages = {
          warranties: "Are you sure you want to delete ALL warranty records? This cannot be undone.",
          customers: "Are you sure you want to delete ALL saved customers? This cannot be undone.",
          products: "Are you sure you want to delete ALL saved products? This cannot be undone.",
          services: "Are you sure you want to delete ALL saved services? This cannot be undone.",
          all: "WARNING: This will perform a FACTORY RESET and delete ALL data (warranties, customers, products, services). This cannot be undone. Are you sure?"
      };
      
      if (window.confirm(messages[type])) {
          onClearData(type);
      }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSave}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-brand-dark">Settings</h2>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
            </div>
            
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Notification Preferences</h3>
                    <p className="text-sm text-gray-500 mt-1">Configure when you see the 'Expiring Soon' status.</p>
                    <div className="flex items-center gap-4 mt-3">
                        <label htmlFor="expiryReminderDays" className="block text-sm font-medium text-gray-700">Remind me</label>
                        <input
                            type="number"
                            id="expiryReminderDays"
                            name="expiryReminderDays"
                            value={settings.expiryReminderDays}
                            onChange={handleChange}
                            min="1"
                            className="block w-20 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                        />
                        <span className="text-sm font-medium text-gray-700">days before expiry.</span>
                    </div>
                </div>

                <hr className="border-gray-200" />
                
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-red-600">Data Management</h3>
                        <p className="text-sm text-gray-500 mt-1">Manage your stored data.</p>
                    </div>
                    
                    <div className="space-y-3">
                        <button type="button" onClick={() => handleClear('warranties')} className="w-full text-left px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-danger transition-colors">
                            Clear All Warranties
                        </button>
                        <button type="button" onClick={() => handleClear('customers')} className="w-full text-left px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-danger transition-colors">
                            Clear Customer List
                        </button>
                        <button type="button" onClick={() => handleClear('products')} className="w-full text-left px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-danger transition-colors">
                            Clear Product Catalog
                        </button>
                         <button type="button" onClick={() => handleClear('services')} className="w-full text-left px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-danger transition-colors">
                            Clear Service Catalog
                        </button>
                        <button type="button" onClick={() => handleClear('all')} className="w-full text-left px-4 py-3 border border-red-300 bg-red-50 rounded-md text-sm font-bold text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
                            Factory Reset (Clear All Data)
                        </button>
                    </div>
                </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-600 transition">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
