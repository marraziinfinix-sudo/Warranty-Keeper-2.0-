
import React from 'react';
import { PlusIcon, SettingsIcon, LogoutIcon, ClipboardListIcon, UsersIcon, CubeIcon, WrenchIcon } from './icons/Icons';

interface HeaderProps {
    onAddNew: () => void;
    onSettingsClick: () => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onLogout: () => void;
    companyName?: string;
    userEmail?: string | null;
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
    userEmail,
    currentView,
    onViewChange
}) => {
    return (
        <header className="bg-white shadow-md sticky top-0 z-30">
            <div className="container mx-auto px-3 md:px-6 pt-3 md:pt-4 pb-3 md:pb-0">
                {/* Top Row: Title/Info & Actions */}
                <div className="flex justify-between items-start gap-2 md:items-center mb-3 md:mb-4">
                    {/* Left: Title & Company Info */}
                    <div className="flex flex-col flex-grow min-w-0 mr-2">
                        <h1 className="text-xl md:text-3xl font-bold text-brand-primary leading-tight truncate">
                            Warranty Keeper
                        </h1>
                        <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2 text-xs md:text-sm text-gray-500 mt-1">
                            {companyName && (
                                <span className="font-bold truncate leading-tight">{companyName}</span>
                            )}
                            {companyName && userEmail && (
                                <span className="hidden md:inline text-gray-300">|</span>
                            )}
                            {userEmail && (
                                <span className="truncate text-gray-400 md:text-gray-500 leading-tight">{userEmail}</span>
                            )}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button 
                            onClick={onAddNew}
                            className="flex items-center gap-1 md:gap-2 bg-brand-primary text-white font-bold py-1.5 px-3 md:py-2 md:px-4 rounded-lg hover:bg-blue-600 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm md:text-base"
                        >
                            <PlusIcon />
                            <span className="hidden sm:inline">Register New</span>
                            <span className="sm:hidden">New</span>
                        </button>
                        <button
                            onClick={onSettingsClick}
                            className="p-1.5 md:p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-brand-primary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            aria-label="Settings"
                        >
                            <SettingsIcon />
                        </button>
                        <div className="h-5 md:h-6 w-px bg-gray-300 mx-0.5 md:mx-1"></div>
                        <button
                            onClick={onLogout}
                            className="p-1.5 md:p-2 text-gray-500 rounded-full hover:bg-red-50 hover:text-brand-danger transition-colors focus:outline-none focus:ring-2 focus:ring-brand-danger"
                            aria-label="Logout"
                            title="Sign Out"
                        >
                            <LogoutIcon />
                        </button>
                    </div>
                </div>

                {/* Middle Row: Search (Full width on mobile, auto on desktop) */}
                <div className="mb-0 md:mb-4">
                    <input
                        type="text"
                        placeholder={`Search ${currentView}...`}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition text-sm md:text-base shadow-sm"
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)}
                    />
                </div>

                {/* Bottom Row: Navigation Tabs (Desktop Only) */}
                <div className="hidden md:flex space-x-1 overflow-x-auto pb-1 no-scrollbar -mx-3 px-3 md:mx-0 md:px-0">
                    <TabButton 
                        isActive={currentView === 'warranties'} 
                        onClick={() => onViewChange('warranties')} 
                        icon={<ClipboardListIcon />} 
                        label="Warranties" 
                    />
                    <TabButton 
                        isActive={currentView === 'customers'} 
                        onClick={() => onViewChange('customers')} 
                        icon={<UsersIcon />} 
                        label="Customers" 
                    />
                    <TabButton 
                        isActive={currentView === 'products'} 
                        onClick={() => onViewChange('products')} 
                        icon={<CubeIcon />} 
                        label="Products" 
                    />
                     <TabButton 
                        isActive={currentView === 'services'} 
                        onClick={() => onViewChange('services')} 
                        icon={<WrenchIcon />} 
                        label="Services" 
                    />
                </div>
            </div>
        </header>
    );
};

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ isActive, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 border-b-2 font-medium text-xs md:text-sm transition-colors whitespace-nowrap ${
            isActive
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
    >
        <span className="scale-90 md:scale-100">{icon}</span>
        {label}
    </button>
);

export default Header;
