
import React, { useState, useMemo, useEffect } from 'react';
import { Warranty, Product, AppSettings, WarrantyStatus } from './types';
import { useWarranties, useSettings } from './hooks/useFirestore';
import WarrantyForm from './components/WarrantyForm';
import WarrantyList from './components/WarrantyList';
import Header from './components/Header';
import WarrantyPreviewModal from './components/WarrantyPreviewModal';
import { triggerShare, getWarrantyStatusInfo, exportWarrantiesToCSV } from './utils/warrantyUtils';
import SettingsModal from './components/SettingsModal';
import LoginPage from './components/LoginPage';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  companyName: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, companyName }) => {
  // Use Firestore hooks
  const { warranties, loading: warrantiesLoading, addWarranty: addWarrantyToDb, updateWarranty: updateWarrantyInDb, deleteWarranty: deleteWarrantyFromDb, bulkDeleteWarranties } = useWarranties(user.uid);
  const { settings, updateSettings } = useSettings(user.uid);
  
  const [formSeedData, setFormSeedData] = useState<Warranty | Omit<Warranty, 'id'> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewData, setPreviewData] = useState<Warranty | Omit<Warranty, 'id'> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WarrantyStatus | 'all'>('all');
  const [selectedWarranties, setSelectedWarranties] = useState<Set<string>>(new Set());
  
  const productList = useMemo(() => {
    const allProductNames = warranties.flatMap(w => w.products.map(p => p.productName));
    return [...new Set(allProductNames)].sort();
  }, [warranties]);
  
  const addWarranty = async (warranty: Omit<Warranty, 'id'>) => {
    const newWarranty: Warranty = { ...warranty, id: new Date().toISOString() };
    await addWarrantyToDb(newWarranty);
  };

  const updateWarranty = async (updatedWarranty: Warranty) => {
    await updateWarrantyInDb(updatedWarranty);
  };

  const deleteWarranty = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this warranty record? This action cannot be undone.')) {
        // We await here to ensure the UI doesn't glitch, but persistence makes this fast locally
        await deleteWarrantyFromDb(id);
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

  const handlePreviewConfirm = async (shareOptions: { email: boolean, whatsapp: boolean }) => {
    if (!previewData) return;
    const data = previewData;

    // Optimistic update: Close the modal immediately so the user can continue working.
    // The database update happens in the background.
    setPreviewData(null);

    try {
        if ('id' in data && data.id) {
            await updateWarranty(data as Warranty);
        } else {
            await addWarranty(data);
        }
        
        // Trigger sharing after the data is queued for saving
        triggerShare(data, shareOptions);
    } catch (error) {
        console.error("Error saving warranty in background:", error);
        alert("There was an issue saving your data to the cloud. It will retry automatically when connection is available.");
    }
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
      // This triggers a background update
      updateSettings(newSettings);
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

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedWarranties.size} selected records? This action cannot be undone.`)) {
        const idsToDelete = Array.from(selectedWarranties);
        await bulkDeleteWarranties(idsToDelete);
        setSelectedWarranties(new Set());
    }
  };

  const getSelectedWarrantiesData = () => {
    return warranties.filter(w => selectedWarranties.has(w.id));
  };

  const handleBulkExportCSV = () => {
    exportWarrantiesToCSV(getSelectedWarrantiesData());
  };

  if (warrantiesLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
                <p className="text-gray-500">Loading warranties...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-brand-dark flex flex-col">
      <Header
        onAddNew={handleAddNew}
        onSettingsClick={handleOpenSettings}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onLogout={onLogout}
        companyName={companyName}
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
        Data is securely synced with the cloud in real-time.
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
      if (user) {
          const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
              if (docSnap.exists()) {
                  setCompanyName(docSnap.data().companyName || '');
              }
          });
          return () => unsubscribe();
      } else {
          setCompanyName('');
      }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
       console.error("Error signing out", e);
    }
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

  return <Dashboard key={user.uid} user={user} companyName={companyName} onLogout={handleLogout} />;
};

export default App;
