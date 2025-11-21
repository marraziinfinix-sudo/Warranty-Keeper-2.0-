
import React from 'react';
import { PlusIcon, SettingsIcon, LogoutIcon, ClipboardListIcon, UsersIcon, CubeIcon, WrenchIcon } from './icons/Icons';

interface HeaderProps {
    onAddNew: () => void;
    onSettingsClick: () => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onLogout: () => void;
    companyName?: string;
    currentView: 'warranties' | 'customers' | 'products' | 'services';
    onViewChange: (view: 'warranties' | 'customers' | 'products' | 'services') => void;
}

const Header: React.FC<HeaderProps> = ({ 
    onAddNew,
    onSettingsClick, 
    searchTerm, 
    onSearchChange, 
    onLogout,
    companyName,
    currentView,
    onViewChange
}) => {
    return (
        <header className="bg-white shadow-md sticky top-0 z-10">
            <div className="container mx-auto px-4 md:px-6 pt-4 pb-0">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <div className="flex flex-col">
                        <h1 className="text-2xl md:text-3xl font-bold text-brand-primary leading-tight">
                            Warranty Keeper
                        </h1>
                        {companyName && (
                            <span className="text-sm font-semibold text-gray-500">{companyName}</span>
                        )}
                    </div>
                    <div className="w-full md:w-auto md:flex-grow max-w-lg order-3 md:order-2">
                        <input
                            type="text"
                            placeholder={`Search ${currentView}...`}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                            value={searchTerm}
                            onChange={e => onSearchChange(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 order-2 md:order-3">
                        <button 
                            onClick={onAddNew}
                            className="flex items-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                            <PlusIcon />
                            <span className="hidden sm:inline">Register New Warranty</span>
                            <span className="sm:hidden">New</span>
                        </button>
                        <button
                            onClick={onSettingsClick}
                            className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-brand-primary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            aria-label="Settings"
                        >
                            <SettingsIcon />
                        </button>
                        <div className="h-6 w-px bg-gray-300 mx-1"></div>
                        <button
                            onClick={onLogout}
                            className="p-2 text-gray-500 rounded-full hover:bg-red-50 hover:text-brand-danger transition-colors focus:outline-none focus:ring-2 focus:ring-brand-danger"
                            aria-label="Logout"
                            title="Sign Out"
                        >
                            <LogoutIcon />
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex space-x-1 overflow-x-auto">
                    <button
                        onClick={() => onViewChange('warranties')}
                        className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                            currentView === 'warranties'
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <ClipboardListIcon />
                        Warranties
                    </button>
                    <button
                        onClick={() => onViewChange('customers')}
                        className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                            currentView === 'customers'
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <UsersIcon />
                        Customers
                    </button>
                    <button
                        onClick={() => onViewChange('products')}
                        className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                            currentView === 'products'
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <CubeIcon />
                        Products
                    </button>
                    <button
                        onClick={() => onViewChange('services')}
                        className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                            currentView === 'services'
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <WrenchIcon />
                        Services
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
