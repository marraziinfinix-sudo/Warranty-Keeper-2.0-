
import React, { useState, useMemo, useEffect } from 'react';
import { Warranty, Product, AppSettings, WarrantyStatus } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import WarrantyForm from './components/WarrantyForm';
import WarrantyList from './components/WarrantyList';
import Header from './components/Header';
import WarrantyPreviewModal from './components/WarrantyPreviewModal';
import { triggerShare, getWarrantyStatusInfo, exportWarrantiesToCSV } from './utils/warrantyUtils';
import SettingsModal from './components/SettingsModal';
import LoginPage from './components/LoginPage';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [warranties, setWarranties] = useLocalStorage<Warranty[]>('warranties', []);
  const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', { expiryReminderDays: 30 });
  const [formSeedData, setFormSeedData] = useState<Warranty | Omit<Warranty, 'id'> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewData, setPreviewData] = useState<Warranty | Omit<Warranty, 'id'> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WarrantyStatus | 'all'>('all');
  const [selectedWarranties, setSelectedWarranties] = useState<Set<string>>(new Set());

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
       console.error("Error signing out", e);
    }
  };

  // Auto-migrate old data structure to new one
  useEffect(() => {
    // This migration handles both old structures: single product fields and single warranty fields
    const needsMigration = warranties.some(w => (w as any).productName || (w as any).purchaseDate || !w.servicesProvided);
    if (needsMigration) {
        const migratedWarranties = warranties.map(w => {
            const oldW = w as any;
            let newWarranty = { ...w };

            // Check if this record has legacy product fields that need migrating
            if (oldW.productName || oldW.purchaseDate) {
                const migratedProducts = oldW.products && oldW.products.length > 0
                    ? oldW.products.map((p: any) => ({
                        ...p,
                        // If product doesn't have its own date, inherit from parent
                        purchaseDate: p.purchaseDate || oldW.purchaseDate,
                        productWarrantyPeriod: p.productWarrantyPeriod ?? oldW.productWarrantyPeriod ?? 0,
                        productWarrantyUnit: p.productWarrantyUnit || oldW.productWarrantyUnit || 'months',
                    }))
                    // If there's no products array, create it from legacy fields
                    : [{
                        productName: oldW.productName || '',
                        serialNumber: oldW.serialNumber || '',
                        purchaseDate: oldW.purchaseDate,
                        productWarrantyPeriod: oldW.productWarrantyPeriod ?? 0,
                        productWarrantyUnit: oldW.productWarrantyUnit || 'months',
                    }];

                newWarranty = {
                    ...oldW,
                    products: migratedProducts,
                };
                
                // Clean up old top-level fields
                delete (newWarranty as any).productName;
                delete (newWarranty as any).serialNumber;
                delete (newWarranty as any).purchaseDate;
                delete (newWarranty as any).productWarrantyPeriod;
                delete (newWarranty as any).productWarrantyUnit;
            }

            // Migrate to new servicesProvided structure
            if (!w.servicesProvided) {
                 newWarranty.servicesProvided = {
                     supply: !w.installDate && !w.installationWarrantyPeriod, // If no install info, assume it was supply only
                     install: !!w.installDate || w.installationWarrantyPeriod > 0,
                 };
            }
            
            return newWarranty;
        });
        setWarranties(migratedWarranties);
    }
  }, []); // Run only once
  
  const productList = useMemo(() => {
    const allProductNames = warranties.flatMap(w => w.products.map(p => p.productName));
    return [...new Set(allProductNames)].sort();
  }, [warranties]);
  
  const addWarranty = (warranty: Omit<Warranty, 'id'>) => {
    const newWarranty: Warranty = { ...warranty, id: new Date().toISOString() };
    setWarranties(prevWarranties => [...prevWarranties, newWarranty]);
  };

  const updateWarranty = (updatedWarranty: Warranty) => {
    setWarranties(prevWarranties =>
      prevWarranties.map(w => (w.id === updatedWarranty.id ? updatedWarranty : w))
    );
  };

  const deleteWarranty = (id: string) => {
    if (window.confirm('Are you sure you want to delete this warranty record? This action cannot be undone.')) {
        setWarranties(prevWarranties => prevWarranties.filter(w => w.id !== id));
    }
  };

  const handleAddNew = () => {
    setFormSeedData(null);
    setIsFormOpen(true);
  };
  
  const handleEdit = (warranty: Warranty) => {
    setFormSeedData(warranty);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormSeedData(null);
  };

  const handlePreview = (data: Warranty | Omit<Warranty, 'id'>) => {
    setPreviewData(data);
    setIsFormOpen(false);
    setFormSeedData(null);
  };

  const handlePreviewConfirm = (shareOptions: { email: boolean, whatsapp: boolean }) => {
    if (!previewData) return;
    const data = previewData;

    if ('id' in data && data.id) {
        updateWarranty(data as Warranty);
    } else {
        addWarranty(data);
    }
    
    triggerShare(data, shareOptions);
    
    setPreviewData(null);
  };

  const handlePreviewEdit = () => {
      if (!previewData) return;
      setFormSeedData(previewData);
      setPreviewData(null);
      setIsFormOpen(true);
  };

  const handlePreviewClose = () => {
      setPreviewData(null);
  };

  const handleOpenSettings = () => setIsSettingsOpen(true);
  const handleCloseSettings = () => setIsSettingsOpen(false);
  const handleSaveSettings = (newSettings: AppSettings) => {
      setSettings(newSettings);
  };

  const filteredWarranties = useMemo(() => {
    let result = warranties;

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(w =>
        (w.customerName || '').toLowerCase().includes(lowercasedTerm) ||
        w.products.some(p => 
          (p.productName || '').toLowerCase().includes(lowercasedTerm) ||
          (p.serialNumber || '').toLowerCase().includes(lowercasedTerm)
        ) ||
        (w.postcode || '').toLowerCase().includes(lowercasedTerm) ||
        (w.district || '').toLowerCase().includes(lowercasedTerm) ||
        (w.state || '').toLowerCase().includes(lowercasedTerm)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(w => {
        const { status } = getWarrantyStatusInfo(w, settings.expiryReminderDays);
        return status === statusFilter;
      });
    }

    return result;
  }, [warranties, searchTerm, statusFilter, settings.expiryReminderDays]);
  
  const handleSelectionChange = (id: string) => {
    setSelectedWarranties(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        return newSelection;
    });
  };

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
        setSelectedWarranties(new Set(filteredWarranties.map(w => w.id)));
    } else {
        setSelectedWarranties(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedWarranties.size} selected records? This action cannot be undone.`)) {
        setWarranties(prev => prev.filter(w => !selectedWarranties.has(w.id)));
        setSelectedWarranties(new Set());
    }
  };

  const getSelectedWarrantiesData = () => {
    return warranties.filter(w => selectedWarranties.has(w.id));
  };

  const handleBulkExportCSV = () => {
    exportWarrantiesToCSV(getSelectedWarrantiesData());
  };

  if (authLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-brand-light">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
          </div>
      );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-brand-dark flex flex-col">
      <Header
        onAddNew={handleAddNew}
        onSettingsClick={handleOpenSettings}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onLogout={handleLogout}
      />

      <main className="container mx-auto p-4 md:p-6 lg:p-8 flex-grow">
        <WarrantyList
          warranties={filteredWarranties}
          onEdit={handleEdit}
          onDelete={deleteWarranty}
          settings={settings}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          selectedWarranties={selectedWarranties}
          onSelectionChange={handleSelectionChange}
          onSelectAll={handleSelectAll}
          onBulkDelete={handleBulkDelete}
          onBulkExportCSV={handleBulkExportCSV}
        />
      </main>

      {isFormOpen && (
        <WarrantyForm
          onClose={handleCloseForm}
          onPreview={handlePreview}
          initialData={formSeedData}
          productList={productList}
        />
      )}

      {previewData && (
        <WarrantyPreviewModal
            warranty={previewData}
            onConfirm={handlePreviewConfirm}
            onEdit={handlePreviewEdit}
            onClose={handlePreviewClose}
        />
      )}
      
      {isSettingsOpen && (
        <SettingsModal
            currentSettings={settings}
            onSave={handleSaveSettings}
            onClose={handleCloseSettings}
        />
      )}

      <footer className="text-center text-sm text-gray-500 py-4">
        <span className="block">Logged in as {user.email}</span>
        All data is stored securely on your device.
      </footer>
    </div>
  );
};

export default App;