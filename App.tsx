
import React, { useState, useMemo, useEffect } from 'react';
import { Warranty, AppSettings, WarrantyStatus, Customer, SavedProduct, SavedService } from './types';
import { useWarranties, useSettings, useCustomers, useSavedProducts, useSavedServices } from './hooks/useFirestore';
import WarrantyForm from './components/WarrantyForm';
import WarrantyList from './components/WarrantyList';
import CustomersView from './components/CustomersView';
import ProductsView from './components/ProductsView';
import ServicesView from './components/ServicesView';
import Header from './components/Header';
import WarrantyPreviewModal from './components/WarrantyPreviewModal';
import SaveEntitiesModal from './components/SaveEntitiesModal';
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
  const { warranties, loading: warrantiesLoading, addWarranty: addWarrantyToDb, updateWarranty: updateWarrantyInDb, deleteWarranty: deleteWarrantyFromDb, bulkDeleteWarranties, clearWarranties } = useWarranties(user.uid);
  const { settings, updateSettings } = useSettings(user.uid);
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
      services: SavedService[]
  }>({ customer: null, products: [], services: [] });
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
        // Ensure we don't add duplicates within the new list itself
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

    // 3. Check Services
    const newServicesData: SavedService[] = [];
    if (data.servicesProvided?.install && data.serviceName) {
        const serviceExists = savedServices.some(s => normalize(s.name) === normalize(data.serviceName!));
        if (!serviceExists) {
             newServicesData.push({
                id: new Date().toISOString() + Math.random(), // temp id
                name: data.serviceName,
                defaultWarrantyPeriod: data.installationWarrantyPeriod,
                defaultWarrantyUnit: data.installationWarrantyUnit
             });
        }
    }


    if (newCustomerData || newProductsData.length > 0 || newServicesData.length > 0) {
        // Found new entities, trigger modal flow
        setPotentialNewEntities({ customer: newCustomerData, products: newProductsData, services: newServicesData });
        setPendingSaveData({ warranty: data, shareOptions });
        setIsSaveEntitiesModalOpen(true);
    } else {
        // Nothing new, proceed to save directly
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

  const handleEntitiesSaveConfirm = async (saveCustomer: boolean, productsToSaveNames: string[], servicesToSaveNames: string[]) => {
      if (!pendingSaveData) return;

      // Save Customer if selected
      if (saveCustomer && potentialNewEntities.customer) {
          await addCustomer(potentialNewEntities.customer);
      }

      // Save Selected Products
      const productsToSave = potentialNewEntities.products.filter(p => productsToSaveNames.includes(p.name));
      for (const prod of productsToSave) {
          // Regenerate ID to be safe
          await addSavedProduct({ ...prod, id: new Date().toISOString() + Math.random().toString(36).substr(2, 9) });
      }

      // Save Selected Services
      const servicesToSave = potentialNewEntities.services.filter(s => servicesToSaveNames.includes(s.name));
      for (const serv of servicesToSave) {
          await addSavedService({ ...serv, id: new Date().toISOString() + Math.random().toString(36).substr(2, 9) });
      }

      setIsSaveEntitiesModalOpen(false);
      await performFinalSave(pendingSaveData.warranty, pendingSaveData.shareOptions);
      setPendingSaveData(null);
      setPotentialNewEntities({ customer: null, products: [], services: [] });
  };

  const handleEntitiesSaveCancel = async () => {
      if (!pendingSaveData) return;
      // Skip saving entities, just save warranty
      setIsSaveEntitiesModalOpen(false);
      await performFinalSave(pendingSaveData.warranty, pendingSaveData.shareOptions);
      setPendingSaveData(null);
      setPotentialNewEntities({ customer: null, products: [], services: [] });
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
          if (type === 'warranties' || type === 'all') {
              await clearWarranties();
          }
          if (type === 'customers' || type === 'all') {
              await clearCustomers();
          }
          if (type === 'products' || type === 'all') {
              await clearSavedProducts();
          }
          if (type === 'services' || type === 'all') {
              await clearSavedServices();
          }
          if (type === 'all') {
               alert("Factory reset complete. All data has been cleared.");
          } else {
               alert(`${type.charAt(0).toUpperCase() + type.slice(1)} data cleared successfully.`);
          }
          setIsSettingsOpen(false); 
      } catch (error) {
          console.error("Error clearing data:", error);
          alert("Failed to clear data. Please try again.");
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
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      <main className="container mx-auto p-4 md:p-6 lg:p-8 flex-grow">
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
        />
      )}
      
      {isSaveEntitiesModalOpen && (
        <SaveEntitiesModal 
            newCustomer={potentialNewEntities.customer}
            newProducts={potentialNewEntities.products}
            newServices={potentialNewEntities.services}
            onConfirm={handleEntitiesSaveConfirm}
            onCancel={handleEntitiesSaveCancel}
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
