
import React, { useState, useMemo, useEffect } from 'react';
import { Warranty, AppSettings, WarrantyStatus, Customer, SavedProduct, SavedService } from './types';
import { useWarranties, useSettings, useCustomers, useSavedProducts, useSavedServices, restoreFirestoreData } from './hooks/useFirestore';
import WarrantyForm from './components/WarrantyForm';
import WarrantyList from './components/WarrantyList';
import CustomersView from './components/CustomersView';
import ProductsView from './components/ProductsView';
import ServicesView from './components/ServicesView';
import Header from './components/Header';
import MobileNavBar from './components/MobileNavBar';
import WarrantyPreviewModal from './components/WarrantyPreviewModal';
import SaveEntitiesModal from './components/SaveEntitiesModal';
import { triggerShare, getWarrantyStatusInfo, exportWarrantiesToCSV } from './utils/warrantyUtils';
import SettingsModal from './components/SettingsModal';
import LoginPage from './components/LoginPage';
import VerificationPendingScreen from './components/VerificationPendingScreen';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User, deleteUser } from 'firebase/auth';
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  companyName: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, companyName }) => {
  // Use Firestore hooks
  const { warranties, loading: warrantiesLoading, addWarranty: addWarrantyToDb, updateWarranty: updateWarrantyInDb, deleteWarranty: deleteWarrantyFromDb, bulkDeleteWarranties, clearWarranties } = useWarranties(user.uid);
  const { settings, updateSettings, deleteSettings } = useSettings(user.uid);
  const { customers, addCustomer, updateCustomer, deleteCustomer, clearCustomers } = useCustomers(user.uid);
  const { savedProducts, addSavedProduct, updateSavedProduct, deleteSavedProduct, clearSavedProducts } = useSavedProducts(user.uid);
  const { savedServices, addSavedService, updateSavedService, deleteSavedService, clearSavedServices } = useSavedServices(user.uid);
  
  const [formSeedData, setFormSeedData] = useState<Warranty | Omit<Warranty, 'id'> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewData, setPreviewData] = useState<Warranty | Omit<Warranty, 'id'> | null>(null);
  
  // States for "Save New Entities" flow
  const [isSaveEntitiesModalOpen, setIsSaveEntitiesModalOpen] = useState(false);
  const [potentialNewEntities, setPotentialNewEntities] = useState<{
      customer: Customer | null,
      products: SavedProduct[],
      service: SavedService | null,
  }>({ customer: null, products: [], service: null });
  const [pendingSaveData, setPendingSaveData] = useState<{
      warranty: Warranty | Omit<Warranty, 'id'>,
      shareOptions: { email: boolean, whatsapp: boolean }
  } | null>(null);

  // Navigation & Search State
  const [currentView, setCurrentView] = useState<'warranties' | 'customers' | 'products' | 'services'>('warranties');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [statusFilter, setStatusFilter] = useState<WarrantyStatus | 'all'>('all');
  const [selectedWarranties, setSelectedWarranties] = useState<Set<string>>(new Set());
  
  const addWarranty = async (warranty: Omit<Warranty, 'id'>) => {
    const newWarranty: Warranty = { ...warranty, id: new Date().toISOString() };
    await addWarrantyToDb(newWarranty);
  };

  const updateWarranty = async (updatedWarranty: Warranty) => {
    await updateWarrantyInDb(updatedWarranty);
  };

  const deleteWarranty = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this warranty record? This action cannot be undone.')) {
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

    setPreviewData(null); // Close preview modal immediately

    // Check for new entities to save
    const normalize = (s: string) => s.trim().toLowerCase();
    
    // 1. Check Customer
    let newCustomerData: Customer | null = null;
    const customerExists = customers.some(c => normalize(c.name) === normalize(data.customerName));
    if (!customerExists) {
        newCustomerData = {
            id: new Date().toISOString(),
            name: data.customerName,
            phone: data.phoneNumber,
            email: data.email,
            state: data.state,
            district: data.district,
            postcode: data.postcode,
            buildingType: (data as any).buildingType || 'home',
            otherBuildingType: data.otherBuildingType
        };
    }

    // 2. Check Products
    const newProductsData: SavedProduct[] = [];
    data.products.forEach(p => {
        const productExists = savedProducts.some(sp => normalize(sp.name) === normalize(p.productName));
        const alreadyInNewList = newProductsData.some(np => normalize(np.name) === normalize(p.productName));
        
        if (!productExists && !alreadyInNewList && p.productName.trim() !== '') {
            newProductsData.push({
                id: new Date().toISOString() + Math.random(), // temp id
                name: p.productName,
                defaultWarrantyPeriod: p.productWarrantyPeriod,
                defaultWarrantyUnit: p.productWarrantyUnit
            });
        }
    });
    
    // 3. Check Service
    let newServiceData: SavedService | null = null;
    if (data.serviceName && data.serviceName.trim() !== '') {
        const serviceExists = savedServices.some(ss => normalize(ss.name) === normalize(data.serviceName as string));
        if (!serviceExists) {
            newServiceData = {
                id: new Date().toISOString() + Math.random(), // temp id
                name: data.serviceName,
                defaultWarrantyPeriod: data.installationWarrantyPeriod,
                defaultWarrantyUnit: data.installationWarrantyUnit
            };
        }
    }


    if (newCustomerData || newProductsData.length > 0 || newServiceData) {
        setPotentialNewEntities({ customer: newCustomerData, products: newProductsData, service: newServiceData });
        setPendingSaveData({ warranty: data, shareOptions });
        setIsSaveEntitiesModalOpen(true);
    } else {
        await performFinalSave(data, shareOptions);
    }
  };

  const performFinalSave = async (
      data: Warranty | Omit<Warranty, 'id'>, 
      shareOptions: { email: boolean, whatsapp: boolean }
  ) => {
      try {
        if ('id' in data && data.id) {
            await updateWarranty(data as Warranty);
        } else {
            await addWarranty(data);
        }
        triggerShare(data, shareOptions);
    } catch (error) {
        console.error("Error saving warranty:", error);
        alert("There was an issue saving your data to the cloud. It will retry automatically when connection is available.");
    }
  };

  const handleEntitiesSaveConfirm = async (saveCustomer: boolean, productsToSaveNames: string[], saveService: boolean) => {
      if (!pendingSaveData) return;

      if (saveCustomer && potentialNewEntities.customer) {
          await addCustomer(potentialNewEntities.customer);
      }
      
      if (saveService && potentialNewEntities.service) {
          await addSavedService({ ...potentialNewEntities.service, id: new Date().toISOString() + Math.random().toString(36).substr(2, 9) });
      }

      const productsToSave = potentialNewEntities.products.filter(p => productsToSaveNames.includes(p.name));
      for (const prod of productsToSave) {
          await addSavedProduct({ ...prod, id: new Date().toISOString() + Math.random().toString(36).substr(2, 9) });
      }

      setIsSaveEntitiesModalOpen(false);
      await performFinalSave(pendingSaveData.warranty, pendingSaveData.shareOptions);
      setPendingSaveData(null);
      setPotentialNewEntities({ customer: null, products: [], service: null });
  };

  const handleEntitiesSaveCancel = async () => {
      if (!pendingSaveData) return;
      setIsSaveEntitiesModalOpen(false);
      await performFinalSave(pendingSaveData.warranty, pendingSaveData.shareOptions);
      setPendingSaveData(null);
      setPotentialNewEntities({ customer: null, products: [], service: null });
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
      updateSettings(newSettings);
  };

  const handleClearData = async (type: 'warranties' | 'customers' | 'products' | 'services' | 'all') => {
      try {
          if (type === 'warranties' || type === 'all') await clearWarranties();
          if (type === 'customers' || type === 'all') await clearCustomers();
          if (type === 'products' || type === 'all') await clearSavedProducts();
          if (type === 'services' || type === 'all') await clearSavedServices();

          alert(type === 'all' ? "Factory reset complete. All data has been cleared." : `${type.charAt(0).toUpperCase() + type.slice(1)} data cleared successfully.`);
          setIsSettingsOpen(false); 
      } catch (error) {
          console.error("Error clearing data:", error);
          alert("Failed to clear data. Please try again.");
      }
  };
  
  const handleBackup = () => {
      const backupData = {
          version: "1.0",
          timestamp: new Date().toISOString(),
          warranties,
          customers,
          savedProducts,
          savedServices,
          settings
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `warranty_keeper_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleRestore = async (file: File) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const content = e.target?.result;
              if (typeof content === 'string') {
                  const json = JSON.parse(content);
                  // Validate basic structure
                  if (!json.warranties && !json.customers && !json.savedProducts) {
                      throw new Error("Invalid backup file format.");
                  }
                  
                  await restoreFirestoreData(user.uid, json);
                  alert("Data restored successfully!");
                  setIsSettingsOpen(false);
              }
          } catch (error) {
              console.error("Restore error:", error);
              alert("Failed to restore data. Please ensure the file is a valid backup JSON.");
          }
      };
      reader.readAsText(file);
  };

  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm("DANGER: Are you sure you want to delete your account? This action is PERMANENT and cannot be undone.");
    if (!confirm1) return;

    const confirm2 = window.confirm("Please confirm again: All your warranties, customers, products, and account data will be deleted immediately.");
    if (!confirm2) return;

    try {
        // 1. Clear all subcollections
        await clearWarranties();
        await clearCustomers();
        await clearSavedProducts();
        await clearSavedServices();
        await deleteSettings();

        // 2. Delete Company Registration (free up name)
        if (companyName) {
           const normalizedCompanyName = companyName.trim().toLowerCase();
           await deleteDoc(doc(db, 'registered_companies', normalizedCompanyName));
        }

        // 3. Delete User Document
        await deleteDoc(doc(db, 'users', user.uid));

        // 4. Delete Auth User
        await deleteUser(user);
        
        // Auth listener will redirect to login
    } catch (error: any) {
        console.error("Error deleting account:", error);
        if (error.code === 'auth/requires-recent-login') {
            alert("For security reasons, please sign out and sign in again before deleting your account.");
        } else {
            alert("Failed to delete account. Please try again or contact support.");
        }
    }
  };

  const handleViewCustomerWarranties = (customerName: string) => {
      setSearchTerm(customerName);
      setCurrentView('warranties');
  };

  const filteredWarranties = useMemo(() => {
    let result = warranties;

    if (searchTerm && currentView === 'warranties') {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(w =>
        (w.customerName || '').toLowerCase().includes(lowercasedTerm) ||
        w.products.some(p => 
          (p.productName || '').toLowerCase().includes(lowercasedTerm) ||
          (p.serialNumber || '').toLowerCase().includes(lowercasedTerm)
        ) ||
        (w.serviceName || '').toLowerCase().includes(lowercasedTerm) ||
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
  }, [warranties, searchTerm, statusFilter, settings.expiryReminderDays, currentView]);
  
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
        const idsToDelete = Array.from(selectedWarranties) as string[];
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
                <p className="text-gray-500">Loading data...</p>
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
        userEmail={user.email}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      <main className="container mx-auto p-3 md:p-6 lg:p-8 flex-grow pb-20 md:pb-8">
        {currentView === 'warranties' && (
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
        )}

        {currentView === 'customers' && (
            <CustomersView 
                warranties={warranties} 
                customers={customers}
                searchTerm={searchTerm}
                onViewCustomerWarranties={handleViewCustomerWarranties}
                onAddCustomer={addCustomer}
                onUpdateCustomer={updateCustomer}
                onDeleteCustomer={deleteCustomer}
            />
        )}

        {currentView === 'products' && (
            <ProductsView 
                savedProducts={savedProducts}
                searchTerm={searchTerm}
                onAddProduct={addSavedProduct}
                onUpdateProduct={updateSavedProduct}
                onDeleteProduct={deleteSavedProduct}
            />
        )}

        {currentView === 'services' && (
            <ServicesView
                savedServices={savedServices}
                searchTerm={searchTerm}
                onAddService={addSavedService}
                onUpdateService={updateSavedService}
                onDeleteService={deleteSavedService}
            />
        )}
      </main>
      
      <MobileNavBar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />

      {isFormOpen && (
        <WarrantyForm
          onClose={handleCloseForm}
          onPreview={handlePreview}
          initialData={formSeedData}
          customers={customers}
          savedProducts={savedProducts}
          savedServices={savedServices}
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
            onClearData={handleClearData}
            onDeleteAccount={handleDeleteAccount}
            onBackup={handleBackup}
            onRestore={handleRestore}
        />
      )}
      
      {isSaveEntitiesModalOpen && (
        <SaveEntitiesModal 
            newCustomer={potentialNewEntities.customer}
            newProducts={potentialNewEntities.products}
            newService={potentialNewEntities.service}
            onConfirm={handleEntitiesSaveConfirm}
            onCancel={handleEntitiesSaveCancel}
        />
      )}

      <footer className="text-center text-xs md:text-sm text-gray-500 py-4 px-2 hidden md:block">
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

  // Email Verification Guard
  if (!user.emailVerified) {
    return <VerificationPendingScreen user={user} onLogout={handleLogout} />;
  }

  return <Dashboard key={user.uid} user={user} companyName={companyName} onLogout={handleLogout} />;
};

export default App;
