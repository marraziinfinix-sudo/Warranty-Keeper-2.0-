
import React from 'react';
import { ClipboardListIcon, UsersIcon, CubeIcon, WrenchIcon } from './icons/Icons';

interface MobileNavBarProps {
  currentView: 'warranties' | 'customers' | 'products' | 'services';
  onViewChange: (view: 'warranties' | 'customers' | 'products' | 'services') => void;
}

const MobileNavBar: React.FC<MobileNavBarProps> = ({ currentView, onViewChange }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center z-20 pb-safe pt-2 pb-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <NavItem 
        isActive={currentView === 'warranties'} 
        onClick={() => onViewChange('warranties')} 
        icon={<ClipboardListIcon />} 
        label="Warranties" // Label for accessibility, hidden visually
      />
      <NavItem 
        isActive={currentView === 'customers'} 
        onClick={() => onViewChange('customers')} 
        icon={<UsersIcon />} 
        label="Customers" 
      />
      <NavItem 
        isActive={currentView === 'products'} 
        onClick={() => onViewChange('products')} 
        icon={<CubeIcon />} 
        label="Products" 
      />
      <NavItem 
        isActive={currentView === 'services'} 
        onClick={() => onViewChange('services')} 
        icon={<WrenchIcon />} 
        label="Services" 
      />
    </nav>
  );
};

interface NavItemProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ isActive, onClick, icon, label }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-full ${
        isActive ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'
      }`}
      aria-label={label}
    >
      <div className="transform scale-110">
        {icon}
      </div>
    </button>
  );
};

export default MobileNavBar;
