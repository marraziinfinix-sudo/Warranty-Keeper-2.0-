
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  query,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { Warranty, AppSettings, Customer, SavedProduct, SavedService, SubUser } from '../types';

// Helper to remove undefined values which Firestore dislikes
const sanitize = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const useWarranties = (dataOwnerId: string) => {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dataOwnerId) {
        setWarranties([]);
        setLoading(false);
        return;
    }

    const q = query(collection(db, 'users', dataOwnerId, 'warranties'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Warranty);
      setWarranties(data);
      setLoading(false);
    }, (err) => {
        console.error("Error fetching warranties", err);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [dataOwnerId]);

  const addWarranty = async (warranty: Warranty) => {
    await setDoc(doc(db, 'users', dataOwnerId, 'warranties', warranty.id), sanitize(warranty));
  };

  const updateWarranty = async (warranty: Warranty) => {
    await setDoc(doc(db, 'users', dataOwnerId, 'warranties', warranty.id), sanitize(warranty), { merge: true });
  };

  const deleteWarranty = async (id: string) => {
    await deleteDoc(doc(db, 'users', dataOwnerId, 'warranties', id));
  };
  
  const bulkDeleteWarranties = async (ids: string[]) => {
      const batch = writeBatch(db);
      ids.forEach(id => {
          const ref = doc(db, 'users', dataOwnerId, 'warranties', id);
          batch.delete(ref);
      });
      await batch.commit();
  }

  const clearWarranties = async () => {
      const q = query(collection(db, 'users', dataOwnerId, 'warranties'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
      });
      await batch.commit();
  };

  return { warranties, loading, addWarranty, updateWarranty, deleteWarranty, bulkDeleteWarranties, clearWarranties };
};

export const useSettings = (dataOwnerId: string) => {
    const [settings, setSettings] = useState<AppSettings>({ expiryReminderDays: 30 });
    
    useEffect(() => {
        if (!dataOwnerId) return;
        
        const unsubscribe = onSnapshot(doc(db, 'users', dataOwnerId, 'settings', 'general'), (docSnap) => {
            if (docSnap.exists()) {
                setSettings(docSnap.data() as AppSettings);
            }
        });
        
        return () => unsubscribe();
    }, [dataOwnerId]);

    const updateSettings = async (newSettings: AppSettings) => {
        await setDoc(doc(db, 'users', dataOwnerId, 'settings', 'general'), sanitize(newSettings), { merge: true });
    };

    const deleteSettings = async () => {
        await deleteDoc(doc(db, 'users', dataOwnerId, 'settings', 'general'));
    };

    return { settings, updateSettings, deleteSettings };
}

export const useCustomers = (dataOwnerId: string) => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (!dataOwnerId) {
        setCustomers([]);
        return;
    }
    const q = query(collection(db, 'users', dataOwnerId, 'customers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Customer);
      setCustomers(data.sort((a, b) => a.name.localeCompare(b.name)));
    });
    return () => unsubscribe();
  }, [dataOwnerId]);

  const addCustomer = async (customer: Customer) => {
    await setDoc(doc(db, 'users', dataOwnerId, 'customers', customer.id), sanitize(customer));
  };

  const updateCustomer = async (customer: Customer) => {
    await setDoc(doc(db, 'users', dataOwnerId, 'customers', customer.id), sanitize(customer), { merge: true });
  };

  const deleteCustomer = async (id: string) => {
    await deleteDoc(doc(db, 'users', dataOwnerId, 'customers', id));
  };

  const clearCustomers = async () => {
      const q = query(collection(db, 'users', dataOwnerId, 'customers'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
      });
      await batch.commit();
  };

  return { customers, addCustomer, updateCustomer, deleteCustomer, clearCustomers };
};

export const useSavedProducts = (dataOwnerId: string) => {
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);

  useEffect(() => {
    if (!dataOwnerId) {
        setSavedProducts([]);
        return;
    }
    const q = query(collection(db, 'users', dataOwnerId, 'saved_products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as SavedProduct);
      setSavedProducts(data.sort((a, b) => a.name.localeCompare(b.name)));
    });
    return () => unsubscribe();
  }, [dataOwnerId]);

  const addSavedProduct = async (product: SavedProduct) => {
    await setDoc(doc(db, 'users', dataOwnerId, 'saved_products', product.id), sanitize(product));
  };

  const updateSavedProduct = async (product: SavedProduct) => {
    await setDoc(doc(db, 'users', dataOwnerId, 'saved_products', product.id), sanitize(product), { merge: true });
  };

  const deleteSavedProduct = async (id: string) => {
    await deleteDoc(doc(db, 'users', dataOwnerId, 'saved_products', id));
  };

  const clearSavedProducts = async () => {
      const q = query(collection(db, 'users', dataOwnerId, 'saved_products'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
      });
      await batch.commit();
  };

  return { savedProducts, addSavedProduct, updateSavedProduct, deleteSavedProduct, clearSavedProducts };
};

export const useSavedServices = (dataOwnerId: string) => {
  const [savedServices, setSavedServices] = useState<SavedService[]>([]);

  useEffect(() => {
    if (!dataOwnerId) {
        setSavedServices([]);
        return;
    }
    const q = query(collection(db, 'users', dataOwnerId, 'saved_services'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as SavedService);
      setSavedServices(data.sort((a, b) => a.name.localeCompare(b.name)));
    });
    return () => unsubscribe();
  }, [dataOwnerId]);

  const addSavedService = async (service: SavedService) => {
    await setDoc(doc(db, 'users', dataOwnerId, 'saved_services', service.id), sanitize(service));
  };

  const updateSavedService = async (service: SavedService) => {
    await setDoc(doc(db, 'users', dataOwnerId, 'saved_services', service.id), sanitize(service), { merge: true });
  };

  const deleteSavedService = async (id: string) => {
    await deleteDoc(doc(db, 'users', dataOwnerId, 'saved_services', id));
  };

  const clearSavedServices = async () => {
      const q = query(collection(db, 'users', dataOwnerId, 'saved_services'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
      });
      await batch.commit();
  };

  return { savedServices, addSavedService, updateSavedService, deleteSavedService, clearSavedServices };
};

export const useSubUsers = (adminId: string) => {
    const [subUsers, setSubUsers] = useState<SubUser[]>([]);
    
    useEffect(() => {
        if (!adminId) return;
        
        const q = query(collection(db, 'users', adminId, 'sub_users'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => doc.data() as SubUser);
            setSubUsers(data.sort((a, b) => a.username.localeCompare(b.username)));
        });
        
        return () => unsubscribe();
    }, [adminId]);
    
    const deleteSubUser = async (id: string) => {
        await deleteDoc(doc(db, 'users', adminId, 'sub_users', id));
        // Note: This only deletes the reference. Deleting the actual user auth and profile 
        // requires Cloud Functions or Admin SDK usually, which we don't have here.
        // We will just orphan the user for now in this client-side only implementation.
    };
    
    return { subUsers, deleteSubUser };
}

export const restoreFirestoreData = async (userId: string, data: any) => {
    if (!userId || !data) return;

    const commitBatch = async (operations: any[]) => {
        if (operations.length === 0) return;
        // Firestore limits batches to 500 operations
        const chunkSize = 450; 
        for (let i = 0; i < operations.length; i += chunkSize) {
            const batch = writeBatch(db);
            const chunk = operations.slice(i, i + chunkSize);
            chunk.forEach(op => {
                if (op.type === 'set') {
                    batch.set(op.ref, op.data);
                }
            });
            await batch.commit();
        }
    };

    const operations = [];

    // 1. Settings
    if (data.settings) {
        operations.push({
            type: 'set',
            ref: doc(db, 'users', userId, 'settings', 'general'),
            data: sanitize(data.settings)
        });
    }

    // 2. Warranties
    if (Array.isArray(data.warranties)) {
        data.warranties.forEach((w: Warranty) => {
            operations.push({
                type: 'set',
                ref: doc(db, 'users', userId, 'warranties', w.id),
                data: sanitize(w)
            });
        });
    }

    // 3. Customers
    if (Array.isArray(data.customers)) {
        data.customers.forEach((c: Customer) => {
            operations.push({
                type: 'set',
                ref: doc(db, 'users', userId, 'customers', c.id),
                data: sanitize(c)
            });
        });
    }

    // 4. Saved Products
    if (Array.isArray(data.savedProducts)) {
        data.savedProducts.forEach((p: SavedProduct) => {
            operations.push({
                type: 'set',
                ref: doc(db, 'users', userId, 'saved_products', p.id),
                data: sanitize(p)
            });
        });
    }
    
    // 5. Saved Services
    if (Array.isArray(data.savedServices)) {
        data.savedServices.forEach((s: SavedService) => {
            operations.push({
                type: 'set',
                ref: doc(db, 'users', userId, 'saved_services', s.id),
                data: sanitize(s)
            });
        });
    }

    await commitBatch(operations);
};