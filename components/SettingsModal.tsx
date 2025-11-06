import React, { useState } from 'react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  currentSettings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ currentSettings, onSave, onClose }) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSave}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-brand-dark">Settings</h2>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
            </div>
            
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Notification Preferences</h3>
                    <p className="text-sm text-gray-500 mt-1">Configure when you see the 'Expiring Soon' status.</p>
                </div>
                <div className="flex items-center gap-4">
                    <label htmlFor="expiryReminderDays" className="block text-sm font-medium text-gray-700">Remind me</label>
                    <input
                        type="number"
                        id="expiryReminderDays"
                        name="expiryReminderDays"
                        value={settings.expiryReminderDays}
                        onChange={handleChange}
                        min="1"
                        className="mt-1 block w-20 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    />
                    <span className="text-sm font-medium text-gray-700">days before expiry.</span>
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