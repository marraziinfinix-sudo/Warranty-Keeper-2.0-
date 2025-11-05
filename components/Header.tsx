
import React from 'react';
import { PlusIcon, SettingsIcon, ExportIcon } from './icons/Icons';

interface HeaderProps {
    onAddNew: () => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onExport: () => void;
    isExporting: boolean;
    isGoogleSheetConfigured: boolean;
    onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    onAddNew, 
    searchTerm, 
    onSearchChange, 
    onExport, 
    isExporting, 
    isGoogleSheetConfigured, 
    onOpenSettings 
}) => {
    return (
        <header className="bg-white shadow-md sticky top-0 z-10">
            <div className="container mx-auto px-4 md:px-6 py-4 flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-brand-primary">
                    Warranty Keeper
                </h1>
                <div className="w-full md:w-auto md:flex-grow max-w-lg">
                    <input
                        type="text"
                        placeholder="Search by customer, product, or serial number..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onAddNew}
                        className="flex items-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                        <PlusIcon />
                        <span className="hidden sm:inline">Register New Warranty</span>
                        <span className="sm:hidden">New</span>
                    </button>
                    {isGoogleSheetConfigured && (
                        <button
                            onClick={onExport}
                            disabled={isExporting}
                            className="flex items-center gap-2 bg-brand-success text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            title="Export all records to Google Sheet"
                        >
                            <ExportIcon />
                            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export to Sheet'}</span>
                            <span className="sm:hidden">Export</span>
                        </button>
                    )}
                    <button
                        onClick={onOpenSettings}
                        className="p-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                        aria-label="Settings"
                        title="Google Sheet Settings"
                    >
                        <SettingsIcon />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
