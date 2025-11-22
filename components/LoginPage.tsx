
import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, AuthError, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { EyeIcon, EyeOffIcon } from './icons/Icons';

interface LoginPageProps {
  onLogin?: () => void; // Optional now as App.tsx handles state
}

const LoginPage: React.FC<LoginPageProps> = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!companyName.trim()) {
            throw new Error("Company Name is required.");
        }

        // Create user first to establish authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        try {
            // Normalize company name for uniqueness check
            const normalizedCompanyName = companyName.trim().toLowerCase();
            const companyRef = doc(db, 'registered_companies', normalizedCompanyName);
            
            // Check if company name is already taken
            const companySnap = await getDoc(companyRef);
            if (companySnap.exists()) {
                const data = companySnap.data();
                let existingUserEmail = data.email;

                // If email is not stored in registered_companies (legacy data), try to fetch from user profile
                if (!existingUserEmail && data.uid) {
                    try {
                        const userSnap = await getDoc(doc(db, 'users', data.uid));
                        if (userSnap.exists()) {
                            existingUserEmail = userSnap.data().email;
                        }
                    } catch (e) {
                        console.log("Could not fetch existing user email", e);
                    }
                }

                throw new Error(`"${companyName}" have already been registered by user (${existingUserEmail || 'unknown'}).`);
            }

            // Reserve the company name
            await setDoc(companyRef, {
                name: companyName.trim(),
                uid: user.uid,
                email: email, // Store email for future duplicate checks
                createdAt: new Date().toISOString()
            });

            // Create user profile with company info
            await setDoc(doc(db, 'users', user.uid), {
                companyName: companyName.trim(),
                email: email,
                createdAt: new Date().toISOString()
            });
            
            // Send Verification Email
            await sendEmailVerification(user);

        } catch (innerError: any) {
            // If Firestore operations fail (e.g. duplicate company), delete the created auth user
            await deleteUser(user);
            throw innerError;
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Auth listener in App.tsx will handle redirection
    } catch (err: any) {
      // Handle specific custom errors first
      if (err.message.includes("have already been registered by user") || err.message === "Company Name is required.") {
          if (err.message.includes("have already been registered by user")) {
              alert(err.message);
          }
          setError(err.message);
          setLoading(false);
          return;
      }

      const firebaseError = err as AuthError;
      let errorMessage = "An error occurred. Please try again.";
      
      if (firebaseError.code) {
          switch (firebaseError.code) {
            case 'auth/invalid-credential':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                errorMessage = "Invalid email or password.";
                break;
            case 'auth/email-already-in-use':
                errorMessage = "This email is already registered.";
                break;
            case 'auth/weak-password':
                errorMessage = "Password should be at least 6 characters.";
                break;
            case 'auth/invalid-email':
                errorMessage = "Please enter a valid email address.";
                break;
            default:
                errorMessage = firebaseError.message;
          }
      } else {
          errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    setLoading(true);

    if (!email) {
        setError('Please enter your email address.');
        setLoading(false);
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        setResetMessage('Check your email for a link to reset your password.');
    } catch (err) {
        const firebaseError = err as AuthError;
        let errorMessage = "Failed to send reset email.";
        if (firebaseError.code === 'auth/user-not-found') {
             errorMessage = "No account found with this email.";
        } else if (firebaseError.code === 'auth/invalid-email') {
            errorMessage = "Please enter a valid email address.";
        }
        setError(errorMessage);
    }
    setLoading(false);
  };

  const handleClear = () => {
      setCompanyName('');
      setEmail('');
      setPassword('');
      setError('');
      setResetMessage('');
  };

  const toggleMode = () => {
      setIsSignUp(!isSignUp);
      handleClear();
      setShowPassword(false);
  };

  const toggleResetMode = () => {
      setIsResetMode(!isResetMode);
      handleClear();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light px-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-brand-primary px-8 py-8 text-center">
            <div className="mb-4 inline-flex p-3 bg-white bg-opacity-20 rounded-full">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Warranty Keeper</h1>
            <p className="text-blue-100 mt-2 text-sm">Securely manage your customer warranties</p>
        </div>
        
        <div className="p-8">
            {isResetMode ? (
                // Reset Password Form
                <form onSubmit={handlePasswordReset} className="space-y-6">
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Reset Password</h2>
                        <p className="text-sm text-gray-500 mt-1">Enter your email to receive a reset link.</p>
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 border-l-4 border-brand-danger p-4 text-sm text-red-700 rounded">
                            <p>{error}</p>
                        </div>
                    )}

                    {resetMessage && (
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 text-sm text-green-700 rounded">
                            <p>{resetMessage}</p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            id="reset-email"
                            type="email"
                            required
                            className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all sm:text-sm"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-600 bg-white hover:bg-gray-50 focus:outline-none transition-all"
                        >
                            Clear
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !!resetMessage}
                            className={`flex-[2] py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-brand-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all transform hover:-translate-y-0.5 ${loading || !!resetMessage ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Sending...' : 'Send Link'}
                        </button>
                    </div>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={toggleResetMode}
                            className="text-sm text-brand-primary hover:text-blue-600 hover:underline font-medium"
                        >
                            Back to Sign In
                        </button>
                    </div>
                </form>
            ) : (
                // Login / Signup Form
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-brand-danger p-4 text-sm text-red-700 rounded">
                            <p>{error}</p>
                        </div>
                    )}

                    {isSignUp && (
                        <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
                            <input
                                id="companyName"
                                type="text"
                                required={isSignUp}
                                className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all sm:text-sm"
                                placeholder="e.g. Acme Solutions"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Each company name must be unique.</p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            required
                            className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all sm:text-sm"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all sm:text-sm pr-10"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 mt-1 focus:outline-none"
                            >
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                        {!isSignUp && (
                            <div className="flex justify-end mt-1">
                                <button
                                    type="button"
                                    onClick={toggleResetMode}
                                    className="text-xs text-brand-primary hover:text-blue-600 hover:underline"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-600 bg-white hover:bg-gray-50 focus:outline-none transition-all"
                        >
                            Clear
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-[2] flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-brand-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all transform hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                                </>
                            ) : (isSignUp ? 'Create Account' : 'Sign In')}
                        </button>
                    </div>
                </form>
            )}
            
            {!isResetMode && (
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        {isSignUp ? "Already have an account?" : "Don't have an account?"}
                        <button 
                            onClick={toggleMode}
                            className="ml-1 font-medium text-brand-primary hover:text-blue-500 focus:outline-none hover:underline"
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            )}
        </div>
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} Warranty Keeper. Ver 2.0</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
