
import React, { useState, useRef } from 'react';
import { AppSettings, UserProfile, SubUser } from '../types';
import { DownloadIcon, UploadIcon, UsersIcon, PlusIcon, TrashIcon, LockIcon, KeyIcon, EyeIcon, EyeOffIcon, EditIcon } from './icons/Icons';
import { useSubUsers } from '../hooks/useFirestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, sendEmailVerification, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, updateDoc } from 'firebase/firestore';
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

  const tabs = [
    { id: 'general', label: 'General', show: true },
    { id: 'security', label: 'Security', show: true },
    { id: 'data', label: 'Data Mgmt', show: isAdmin },
    { id: 'users', label: 'User Mgmt', show: isAdmin }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-start md:items-center pt-0 md:p-4" onClick={onClose}>
      <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-xl md:rounded-lg shadow-xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 flex-shrink-0 bg-white z-10">
            <h2 className="text-2xl font-bold text-brand-dark">Settings</h2>
            <button type="button" onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
                <span className="text-3xl leading-none block">&times;</span>
            </button>
        </div>

        {/* Navigation Tabs */}
        <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="grid grid-cols-2 gap-2 md:flex md:gap-1 md:border-b md:border-gray-200 md:pb-0">
                {tabs.filter(t => t.show).map(tab => (
                     <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            py-2 px-3 text-sm font-medium rounded-lg md:rounded-b-none md:rounded-t-md transition-all text-center
                            ${activeTab === tab.id 
                                ? 'bg-brand-primary text-white shadow-md md:shadow-none md:bg-white md:text-brand-primary md:border-b-2 md:border-brand-primary md:mb-[-1px] md:border-t-0 md:border-x-0' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 md:bg-transparent md:text-gray-500 md:hover:text-gray-700'
                            }
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto bg-white">
            {activeTab === 'general' && (
                <form onSubmit={handleSave} className="flex flex-col h-full">
                    <div className="p-6">
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
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100 mt-auto">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-600 transition">Save</button>
                    </div>
                </form>
            )}
            
            {activeTab === 'security' && (
                <SecurityTab userProfile={userProfile} />
            )}

            {activeTab === 'data' && isAdmin && (
                 <div className="p-6">
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
    </div>
  );
};

const SecurityTab: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' as 'success' | 'error' });
    const [loading, setLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

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
            
            // If user is a Sub-user, update the password in Firestore for Admin visibility
            if (userProfile.role === 'user') {
                try {
                    await updateDoc(doc(db, 'users', userProfile.parentId, 'sub_users', user.uid), {
                        password: newPassword
                    });
                } catch (fsErr) {
                    console.error("Could not sync password to Firestore", fsErr);
                    // Non-critical error for the user, but affects admin visibility
                }
            }
            
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
        <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Change Your Password</h3>
            <p className="text-sm text-gray-500 mb-4">
                Update the password for your account (<span className="font-medium text-gray-700">{userProfile.email}</span>).
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
                    <div className="relative mt-1">
                        <input 
                            type={showConfirm ? "text" : "password"} 
                            required 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>
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
    
    // State for Direct Password Change
    const [changePwdUser, setChangePwdUser] = useState<SubUser | null>(null);
    const [newDirectPassword, setNewDirectPassword] = useState('');
    const [currentDirectPassword, setCurrentDirectPassword] = useState('');
    const [pwdLoading, setPwdLoading] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
    const [showNewDirectPwd, setShowNewDirectPwd] = useState(false);
    const [showCurrentDirectPwd, setShowCurrentDirectPwd] = useState(false);


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
            // Create a secondary app instance to create user without logging out current admin
            // Use a unique name to avoid conflict
            const appName = `SecondaryApp-${Date.now()}`;
            const secondaryApp = initializeApp(firebaseConfig, appName);
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

            // 3. Add to Sub-user list for Admin WITH PASSWORD
            await setDoc(doc(db, 'users', adminId, 'sub_users', newUid), {
                uid: newUid,
                username: email,
                displayName: email,
                createdAt: new Date().toISOString(),
                password: password 
            });

            // Cleanup
            await signOut(secondaryAuth);
            await deleteApp(secondaryApp);

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
    
    const handleChangeSubUserPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!changePwdUser || !newDirectPassword) return;
        
        if (newDirectPassword.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        // Determine credentials
        const pwdToUse = changePwdUser.password || currentDirectPassword;
        if (!pwdToUse) {
            alert("We need the user's current password to authorize the change.");
            return;
        }

        setPwdLoading(true);
        try {
            const appName = `PwdChangeApp-${Date.now()}`;
            const secondaryApp = initializeApp(firebaseConfig, appName);
            const secondaryAuth = getAuth(secondaryApp);

            // 1. Sign in as the user
            try {
                await signInWithEmailAndPassword(secondaryAuth, changePwdUser.username, pwdToUse);
            } catch (signInErr: any) {
                console.error(signInErr);
                let msg = "Could not authenticate as user.";
                if (signInErr.code === 'auth/wrong-password') {
                    msg = "Incorrect current password provided.";
                }
                throw new Error(msg);
            }

            // 2. Update password
            if (secondaryAuth.currentUser) {
                await updatePassword(secondaryAuth.currentUser, newDirectPassword);
                
                // 3. Update Firestore with NEW password so it is known next time
                await updateDoc(doc(db, 'users', adminId, 'sub_users', changePwdUser.uid), {
                    password: newDirectPassword
                });
                
                alert("Password updated successfully.");
                setChangePwdUser(null);
                setNewDirectPassword('');
                setCurrentDirectPassword('');
            }

            await signOut(secondaryAuth);
            await deleteApp(secondaryApp);

        } catch (err: any) {
            alert(err.message || "Failed to update password.");
        } finally {
            setPwdLoading(false);
        }
    }

    const togglePasswordVisibility = (uid: string) => {
        setVisiblePasswords(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uid)) newSet.delete(uid);
            else newSet.add(uid);
            return newSet;
        });
    };

    const handleResetPassword = async (email: string) => {
        if(window.confirm(`Send a password reset email to ${email}?\n\nUse this if you cannot change the password directly.`)) {
            try {
                await sendPasswordResetEmail(auth, email);
                alert(`Password reset email sent to ${email}.`);
            } catch (err: any) {
                alert("Failed to send reset email. " + (err.message || ""));
            }
        }
    };

    return (
        <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Manage Users</h3>
            <p className="text-sm text-gray-500 mb-4">
                Create and manage accounts for your team.
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
            
            {/* Change Password Modal */}
            {changePwdUser && (
                <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-[60]" onClick={() => setChangePwdUser(null)}>
                     <div className="bg-white p-5 rounded-lg shadow-lg max-w-sm w-full" onClick={e => e.stopPropagation()}>
                        <h4 className="text-lg font-bold mb-3">Change Password for {changePwdUser.username}</h4>
                        <form onSubmit={handleChangeSubUserPassword}>
                            {!changePwdUser.password && (
                                <div className="mb-4 bg-yellow-50 p-2 rounded text-xs text-yellow-800 border border-yellow-100">
                                    <p><strong>Note:</strong> We do not have the current password for this user. Please enter it below to verify authorization.</p>
                                </div>
                            )}
                            
                            {!changePwdUser.password && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Current User Password</label>
                                    <div className="relative mt-1">
                                        <input 
                                            type={showCurrentDirectPwd ? "text" : "password"} 
                                            value={currentDirectPassword}
                                            onChange={e => setCurrentDirectPassword(e.target.value)}
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm pr-10"
                                            placeholder="Enter current password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentDirectPwd(!showCurrentDirectPwd)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                        >
                                            {showCurrentDirectPwd ? <EyeOffIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">New Password</label>
                                <div className="relative mt-1">
                                    <input 
                                        type={showNewDirectPwd ? "text" : "password"} 
                                        value={newDirectPassword}
                                        onChange={e => setNewDirectPassword(e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm pr-10"
                                        placeholder="Min. 6 characters"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewDirectPwd(!showNewDirectPwd)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showNewDirectPwd ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setChangePwdUser(null)} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                                <button type="submit" disabled={pwdLoading} className="px-3 py-2 bg-brand-primary text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50">
                                    {pwdLoading ? 'Saving...' : 'Change Password'}
                                </button>
                            </div>
                        </form>
                     </div>
                </div>
            )}

            <div className="border rounded-lg overflow-hidden overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Password</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {subUsers.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">
                                    No sub-users created yet.
                                </td>
                            </tr>
                        ) : (
                            subUsers.map(user => (
                                <tr key={user.uid}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center gap-2">
                                            <UsersIcon /> {user.username}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <span>{user.password ? (visiblePasswords.has(user.uid) ? user.password : '••••••') : 'Unknown'}</span>
                                            {user.password && (
                                                <button 
                                                    onClick={() => togglePasswordVisibility(user.uid)}
                                                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                                >
                                                    {visiblePasswords.has(user.uid) ? <EyeOffIcon /> : <EyeIcon />}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setChangePwdUser(user);
                                                    setNewDirectPassword('');
                                                    setCurrentDirectPassword('');
                                                    setShowNewDirectPwd(false);
                                                    setShowCurrentDirectPwd(false);
                                                }}
                                                className="text-gray-500 hover:text-brand-primary p-1"
                                                title="Change Password"
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={() => handleResetPassword(user.username)}
                                                className="text-gray-400 hover:text-brand-primary p-1"
                                                title="Send Password Reset Email (Fallback)"
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
