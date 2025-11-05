
import React, { useState, useMemo, useEffect } from 'react';
import { Warranty, Product } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import WarrantyForm from './components/WarrantyForm';
import WarrantyList from './components/WarrantyList';
import Header from './components/Header';
import WarrantyPreviewModal from './components/WarrantyPreviewModal';
import GoogleSheetSetup from './components/GoogleSheetSetup';
import { triggerShare } from './utils/warrantyUtils';

// Type for flattened data for Google Sheet
interface SheetRow {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  productName: string;
  serialNumber: string;
  purchaseDate: string;
  installDate?: string;
  productWarrantyPeriod: number;
  productWarrantyUnit: 'days' | 'weeks' | 'months' | 'years';
  installationWarrantyPeriod: number;
  installationWarrantyUnit: 'days' | 'weeks' | 'months' | 'years';
  state: string;
  district: string;
  postcode: string;
  buildingType: 'home' | 'office' | 'others';
  otherBuildingType?: string;
}

const App: React.FC = () => {
  const [warranties, setWarranties] = useLocalStorage<Warranty[]>('warranties', []);
  const [formSeedData, setFormSeedData] = useState<Warranty | Omit<Warranty, 'id'> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [previewData, setPreviewData] = useState<Warranty | Omit<Warranty, 'id'> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // States for Google Sheet integration
  const [googleSheetUrl, setGoogleSheetUrl] = useLocalStorage<string>('googleSheetUrl', '');
  const [isSheetSetupOpen, setIsSheetSetupOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

  const handleExport = async () => {
    if (!googleSheetUrl) {
      alert("Please set up your Google Sheet URL in Settings first.");
      return;
    }

    setIsExporting(true);
    setExportMessage(null);

    try {
      // 1. Fetch existing data to know whether to add or update
      const getResponse = await fetch(googleSheetUrl);
      if (!getResponse.ok) throw new Error('Failed to fetch from Google Sheet. Check URL and script permissions.');
      const remoteData: SheetRow[] = await getResponse.json();
      const remoteIds = new Set(remoteData.map(row => row.id));

      // 2. Flatten local data into one row per product
      const flattenedWarranties: SheetRow[] = warranties.flatMap(w => {
        if (!w.products || w.products.length === 0) {
          // Create a row for service-only warranties
          return [{
            id: w.id,
            customerName: w.customerName,
            phoneNumber: w.phoneNumber,
            email: w.email,
            productName: 'N/A - Service Only',
            serialNumber: 'N/A',
            purchaseDate: '',
            installDate: w.installDate || '',
            productWarrantyPeriod: 0,
            productWarrantyUnit: 'months' as const,
            installationWarrantyPeriod: w.installationWarrantyPeriod,
            installationWarrantyUnit: w.installationWarrantyUnit,
            state: w.state,
            district: w.district,
            postcode: w.postcode,
            buildingType: w.buildingType,
            otherBuildingType: w.otherBuildingType || '',
          }];
        }
        return w.products.map((p, index) => ({
            id: `${w.id}-${index}`, // Create a unique ID for each product line item
            customerName: w.customerName,
            phoneNumber: w.phoneNumber,
            email: w.email,
            state: w.state,
            district: w.district,
            postcode: w.postcode,
            buildingType: w.buildingType,
            otherBuildingType: w.otherBuildingType || '',
            installDate: w.installDate || '',
            installationWarrantyPeriod: w.installationWarrantyPeriod,
            installationWarrantyUnit: w.installationWarrantyUnit,
            productName: p.productName,
            serialNumber: p.serialNumber,
            purchaseDate: p.purchaseDate,
            productWarrantyPeriod: p.productWarrantyPeriod,
            productWarrantyUnit: p.productWarrantyUnit,
        }));
      });
      
      // 3. Prepare POST requests for each row
      const promises = flattenedWarranties.map(row => {
        const action = remoteIds.has(row.id) ? 'update' : 'add';
        return fetch(googleSheetUrl, {
          method: 'POST',
          mode: 'no-cors', // Apps Script requires this for cross-origin POST from some environments
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload: row })
        });
      });

      await Promise.all(promises);

      // Since 'no-cors' prevents reading the response, we optimistically show success.
      setExportMessage({ type: 'success', text: `Export complete! ${flattenedWarranties.length} records processed. Please verify in your Google Sheet.` });

    } catch (error) {
      console.error('Export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setExportMessage({ type: 'error', text: `Export failed: ${errorMessage}` });
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(null), 7000); // Hide message after 7 seconds
    }
  };

  const filteredWarranties = useMemo(() => {
    if (!searchTerm) return warranties;
    const lowercasedTerm = searchTerm.toLowerCase();
    return warranties.filter(w =>
      (w.customerName || '').toLowerCase().includes(lowercasedTerm) ||
      w.products.some(p => 
        (p.productName || '').toLowerCase().includes(lowercasedTerm) ||
        (p.serialNumber || '').toLowerCase().includes(lowercasedTerm)
      ) ||
      (w.postcode || '').toLowerCase().includes(lowercasedTerm) ||
      (w.district || '').toLowerCase().includes(lowercasedTerm) ||
      (w.state || '').toLowerCase().includes(lowercasedTerm)
    );
  }, [warranties, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-brand-dark flex flex-col">
      <Header
        onAddNew={handleAddNew}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onExport={handleExport}
        isExporting={isExporting}
        isGoogleSheetConfigured={!!googleSheetUrl}
        onOpenSettings={() => setIsSheetSetupOpen(true)}
      />

      {exportMessage && (
        <div className={`text-center p-2 text-white ${exportMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {exportMessage.text}
        </div>
      )}

      <main className="container mx-auto p-4 md:p-6 lg:p-8 flex-grow">
        <WarrantyList
          warranties={filteredWarranties}
          onEdit={handleEdit}
          onDelete={deleteWarranty}
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

      {isSheetSetupOpen && (
        <GoogleSheetSetup
          currentUrl={googleSheetUrl}
          onSave={(url) => {
            setGoogleSheetUrl(url);
            setIsSheetSetupOpen(false);
          }}
          onClose={() => setIsSheetSetupOpen(false)}
        />
      )}

      <footer className="text-center text-sm text-gray-500 py-4">
        All data is stored securely on your device.
      </footer>
    </div>
  );
};

export default App;
