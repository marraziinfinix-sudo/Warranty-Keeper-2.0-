
import React, { useState, useRef } from 'react';
import { AppSettings, UserProfile, SubUser } from '../types';
import { DownloadIcon, UploadIcon, UsersIcon, PlusIcon, TrashIcon, LockIcon, KeyIcon, EyeIcon, EyeOffIcon } from './icons/Icons';
import { useSubUsers } from '../hooks/useFirestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, sendEmailVerification, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig, db, auth } from '../firebase'; // Re-import config for secondary app

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
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'users' | 'data'>('general');
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

        <div className="px-6 mb-4 border-b border-gray-200 overflow-x-auto">
            <div className="flex gap-4 min-w-max">
                <button 
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'general' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('general')}
                >
                    General
                </button>
                
                <button 
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'security' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('security')}
                >
                    Security
                </button>
                
                {isAdmin && (
                    <>
                        <button 
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'data' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('data')}
                        >
                            Data Management
                        </button>
                        <button 
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'users' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('users')}
                        >
                            User Management
                        </button>
                    </>
                )}
            </div>
        </div>

        {activeTab === 'general' && (
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
                </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-600 transition">Save</button>
            </div>
            </form>
        )}
        
        {activeTab === 'security' && (
            <SecurityTab userEmail={userProfile.email} />
        )}

        {activeTab === 'data' && isAdmin && (
             <div className="p-6 pt-2">
                <div className="space-y-6">
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
                            <h3 className="text-lg font-semibold text-red-600">Data Cleanup</h3>
                            <p className="text-sm text-gray-500 mt-1">Permanently delete specific data categories.</p>
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
                        </div>

                        <div className="pt-4 mt-4 border-t border-gray-200">
                             <h3 className="text-lg font-semibold text-red-700 mb-2">Danger Zone</h3>
                            <button type="button" onClick={() => handleClear('all')} className="w-full text-left px-4 py-3 border border-red-300 bg-red-50 rounded-md text-sm font-bold text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors mb-3">
                                Factory Reset (Clear All Data)
                            </button>
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
            </div>
        )}

        {activeTab === 'users' && isAdmin && (
            <UserManagementTab adminId={userProfile.uid} companyName={userProfile.companyName} />
        )}
      </div>
    </div>
  );
};

const SecurityTab: React.FC<{ userEmail: string }> = ({ userEmail }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' as 'success' | 'error' });
    const [loading, setLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ text: '', type: 'error' });
        setLoading(true);

        if (newPassword.length < 6) {
            setMessage({ text: 'New password must be at least 6 characters long.', type: 'error' });
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ text: 'New passwords do not match.', type: 'error' });
            setLoading(false);
            return;
        }

        const user = auth.currentUser;
        if (!user || !user.email) {
            setMessage({ text: 'User not authenticated.', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            // Re-authenticate user first
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            
            // Update password
            await updatePassword(user, newPassword);
            
            setMessage({ text: 'Password updated successfully!', type: 'success' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            let errMsg = 'Failed to update password.';
            if (error.code === 'auth/wrong-password') {
                errMsg = 'Incorrect current password.';
            } else if (error.code === 'auth/too-many-requests') {
                errMsg = 'Too many attempts. Please try again later.';
            } else if (error.code === 'auth/requires-recent-login') {
                errMsg = 'Please sign out and sign in again to change your password.';
            }
            setMessage({ text: errMsg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 pt-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Change Your Password</h3>
            <p className="text-sm text-gray-500 mb-4">
                Update the password for your account (<span className="font-medium text-gray-700">{userEmail}</span>).
            </p>

            {message.text && (
                <div className={`mb-4 p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Current Password</label>
                    <div className="relative mt-1">
                        <input 
                            type={showCurrent ? "text" : "password"} 
                            required 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrent(!showCurrent)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <div className="relative mt-1">
                        <input 
                            type={showNew ? "text" : "password"} 
                            required 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm pr-10"
                        />
                         <button
                            type="button"
                            onClick={() => setShowNew(!showNew)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            {showNew ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input 
                        type="password" 
                        required 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    />
                </div>

                <div className="pt-2">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full flex justify-center items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Updating...' : <><LockIcon /> Update Password</>}
                    </button>
                </div>
            </form>
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
                await sendEmailVerification(userCred.user);
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
            alert(`User "${email}" created successfully with password "654321". A verification email has been sent.`);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to create user.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleResetPassword = async (email: string) => {
        if(window.confirm(`Send a password reset email to ${email}?\n\nThis allows the user to set their own new password safely via email link.`)) {
            try {
                await sendPasswordResetEmail(auth, email);
                alert(`Password reset email sent to ${email}.`);
            } catch (err: any) {
                console.error("Error sending reset email:", err);
                alert("Failed to send reset email. " + (err.message || ""));
            }
        }
    };

    return (
        <div className="p-6 pt-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Manage Users</h3>
            <p className="text-sm text-gray-500 mb-4">
                Create accounts for your team. Admin can reset user passwords here if needed.
            </p>

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
                                        <div className="flex justify-end items-center gap-2">
                                            <button
                                                onClick={() => handleResetPassword(user.username)}
                                                className="text-gray-400 hover:text-brand-primary p-1"
                                                title="Send Password Reset Email"
                                            >
                                                <KeyIcon />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if(window.confirm("Remove this user from list? (Note: Account deletion requires contacting support)")) {
                                                        deleteSubUser(user.uid);
                                                    }
                                                }} 
                                                className="text-gray-400 hover:text-red-600 p-1"
                                                title="Remove User"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
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
