
import React, { useState, useRef } from 'react';
import { AppSettings, UserProfile, SubUser } from '../types';
import { DownloadIcon, UploadIcon, UsersIcon, PlusIcon, TrashIcon } from './icons/Icons';
import { useSubUsers } from '../hooks/useFirestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig, db } from '../firebase'; // Re-import config for secondary app

interface SettingsModalProps {
  currentSettings: AppSettings;
  userProfile: UserProfile;
  onSave: (newSettings: AppSettings) => void;
  onClose: () => void;
  onClearData: (type: 'warranties' | 'customers' | 'products' | 'services' | 'all') => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onBackup: () => void;
  onRestore: (file: File) => Promise<void>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    currentSettings, 
    userProfile,
    onSave, 
    onClose, 
    onClearData, 
    onDeleteAccount,
    onBackup,
    onRestore
}) => {
  const [settings, setSettings] = useState<AppSettings>(currentSettings);
  const [activeTab, setActiveTab] = useState<'general' | 'users'>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = userProfile.role === 'admin';

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
          all: "WARNING: This will perform a FACTORY RESET and delete ALL data. This cannot be undone. Are you sure?"
      };
      
      if (window.confirm(messages[type])) {
          onClearData(type);
      }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (window.confirm("Restoring data will merge the backup file with your current cloud data. Existing records with the same ID will be updated. Continue?")) {
              onRestore(file);
          }
      }
      // Reset input
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        
        <div className="flex justify-between items-center p-6 pb-2">
            <h2 className="text-2xl font-bold text-brand-dark">Settings</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
        </div>

        {isAdmin && (
            <div className="px-6 mb-4 border-b border-gray-200">
                <div className="flex gap-4">
                    <button 
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'general' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('general')}
                    >
                        General
                    </button>
                    <button 
                         className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('users')}
                    >
                        User Management
                    </button>
                </div>
            </div>
        )}

        {activeTab === 'general' ? (
            <form onSubmit={handleSave}>
            <div className="p-6 pt-2">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Notification Preferences</h3>
                        <p className="text-sm text-gray-500 mt-1">Configure when you see the 'Expiring' status.</p>
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

                    {isAdmin && (
                        <>
                            <hr className="border-gray-200" />
                            <div>
                                <h3 className="text-lg font-semibold text-brand-primary">Data Backup & Restore</h3>
                                <p className="text-sm text-gray-500 mt-1">Save your data locally or restore from a file.</p>
                                
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <button 
                                        type="button" 
                                        onClick={onBackup}
                                        className="flex flex-col items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        <DownloadIcon />
                                        <span className="text-sm font-medium text-gray-700 mt-1">Backup to File</span>
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex flex-col items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        <UploadIcon />
                                        <span className="text-sm font-medium text-gray-700 mt-1">Restore from File</span>
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".json"
                                        className="hidden" 
                                    />
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
                                    
                                    <div className="pt-4 mt-4 border-t border-gray-200">
                                        <p className="text-xs text-gray-400 mb-2 uppercase font-semibold tracking-wider">Danger Zone</p>
                                        <button 
                                            type="button" 
                                            onClick={onDeleteAccount} 
                                            className="w-full text-left px-4 py-3 bg-red-600 text-white rounded-md text-sm font-bold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm"
                                        >
                                            Delete Account Permanently
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-600 transition">Save</button>
            </div>
            </form>
        ) : (
            <UserManagementTab adminId={userProfile.uid} companyName={userProfile.companyName} />
        )}
      </div>
    </div>
  );
};

interface UserManagementTabProps {
    adminId: string;
    companyName: string;
}

const UserManagementTab: React.FC<UserManagementTabProps> = ({ adminId, companyName }) => {
    const { subUsers, deleteSubUser } = useSubUsers(adminId);
    const [isCreating, setIsCreating] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        const email = newUserEmail.trim().toLowerCase();
        const password = "654321";

        if (!email.includes('@')) {
            setError("Username must be a valid email address.");
            setLoading(false);
            return;
        }

        try {
            // 1. Create User in Firebase Auth (using secondary app to avoid logging out admin)
            const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
            const secondaryAuth = getAuth(secondaryApp);
            
            let userCred;
            try {
                userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            } catch (authErr: any) {
                if (authErr.code === 'auth/email-already-in-use') {
                     throw new Error("This email address is already in use.");
                }
                throw authErr;
            }
            
            const newUid = userCred.user.uid;
            
            // 2. Create User Profile
            await setDoc(doc(db, 'users', newUid), {
                username: email,
                email: email,
                companyName: companyName,
                role: 'user',
                parentId: adminId,
                createdAt: new Date().toISOString()
            });

            // 3. Add to Sub-user list for Admin
            await setDoc(doc(db, 'users', adminId, 'sub_users', newUid), {
                uid: newUid,
                username: email,
                displayName: email,
                createdAt: new Date().toISOString()
            });

            // Cleanup
            await signOut(secondaryAuth);
            // Ideally deleteApp(secondaryApp) but Firebase JS SDK doesn't export it easily in v9 modular without full import. 
            // It's fine to leave instance for session or let it GC.

            setNewUserEmail('');
            setIsCreating(false);
            alert(`User "${email}" created successfully with password "654321".`);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to create user.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 pt-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Manage Users</h3>
            <p className="text-sm text-gray-500 mb-4">Create accounts for your team to access the app.</p>

            {isCreating ? (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">Create New User</h4>
                    {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
                    <form onSubmit={handleCreateUser} className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700">User Email (Username)</label>
                            <input 
                                type="email" 
                                required 
                                value={newUserEmail}
                                onChange={e => setNewUserEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-sm focus:ring-brand-primary focus:border-brand-primary"
                                placeholder="user@example.com"
                            />
                        </div>
                        <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 border border-blue-100">
                            <strong>Note:</strong> The default password will be set to <code>654321</code>.
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button type="submit" disabled={loading} className="px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded hover:bg-blue-600 disabled:opacity-50">
                                {loading ? 'Creating...' : 'Create User'}
                            </button>
                            <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-1.5 bg-white border border-gray-300 text-gray-600 text-xs font-medium rounded hover:bg-gray-50">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <button 
                    onClick={() => setIsCreating(true)}
                    className="mb-4 flex items-center gap-2 text-sm font-medium text-brand-primary hover:text-blue-700"
                >
                    <PlusIcon /> Add New User
                </button>
            )}

            <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {subUsers.length === 0 ? (
                            <tr>
                                <td colSpan={2} className="px-4 py-4 text-center text-sm text-gray-500">
                                    No sub-users created yet.
                                </td>
                            </tr>
                        ) : (
                            subUsers.map(user => (
                                <tr key={user.uid}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 flex items-center gap-2">
                                        <UsersIcon /> {user.username}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => {
                                                if(window.confirm("Remove this user from list? (Note: Account deletion requires contacting support)")) {
                                                    deleteSubUser(user.uid);
                                                }
                                            }} 
                                            className="text-gray-400 hover:text-red-600"
                                            title="Remove User"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default SettingsModal;
