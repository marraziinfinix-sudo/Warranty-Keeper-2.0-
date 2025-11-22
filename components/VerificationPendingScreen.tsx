
import React, { useState } from 'react';
import { User, sendEmailVerification } from 'firebase/auth';
import { EmailIcon, LogoutIcon } from './icons/Icons';

interface VerificationPendingScreenProps {
    user: User;
    onLogout: () => void;
}

const VerificationPendingScreen: React.FC<VerificationPendingScreenProps> = ({ user, onLogout }) => {
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState('');

    const handleResendEmail = async () => {
        setSending(true);
        setMessage('');
        try {
            await sendEmailVerification(user);
            setMessage('Verification email sent! Please check your inbox.');
        } catch (e: any) {
            // Firebase restricts how often you can send emails
            if (e.code === 'auth/too-many-requests') {
                setMessage('Please wait a moment before requesting another email.');
            } else {
                setMessage('Failed to send email. Please try again later.');
            }
        }
        setSending(false);
    };

    const handleRefresh = async () => {
        try {
            await user.reload();
            // If verified, the parent App component needs to re-evaluate.
            // Since reload updates the internal object, we can force a page reload to be safe/simple
            // or the parent app's auth listener might pick it up (though onAuthStateChanged doesn't trigger on token refresh usually)
            window.location.reload();
        } catch (e) {
            console.error("Error reloading user", e);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-light px-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 text-center p-8">
                <div className="mb-6 inline-flex p-4 bg-blue-50 rounded-full text-brand-primary">
                    <EmailIcon />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h2>
                <p className="text-gray-600 mb-6">
                    We've sent a verification email to <span className="font-semibold text-gray-800">{user.email}</span>.
                    <br/>
                    Please verify your account to access the dashboard.
                </p>

                {message && (
                    <div className={`mb-4 p-3 rounded text-sm ${message.includes('sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message}
                    </div>
                )}

                <div className="space-y-3">
                    <button 
                        onClick={handleRefresh}
                        className="w-full py-3 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-blue-600 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                    >
                        I've Verified My Email
                    </button>
                    
                    <button 
                        onClick={handleResendEmail}
                        disabled={sending}
                        className={`w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition focus:outline-none ${sending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {sending ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <button 
                        onClick={onLogout}
                        className="flex items-center justify-center gap-2 w-full text-sm text-gray-500 hover:text-red-600 transition"
                    >
                        <LogoutIcon /> Sign Out / Use Different Email
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerificationPendingScreen;
