
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
import { Warranty, AppSettings, Customer, SavedProduct, SavedService } from '../types';

// Helper to remove undefined values which Firestore dislikes
const sanitize = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const useWarranties = (userId: string) => {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
        setWarranties([]);
        setLoading(false);
        return;
    }

    const q = query(collection(db, 'users', userId, 'warranties'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Warranty);
      setWarranties(data);
      setLoading(false);
    }, (err) => {
        console.error("Error fetching warranties", err);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const addWarranty = async (warranty: Warranty) => {
    await setDoc(doc(db, 'users', userId, 'warranties', warranty.id), sanitize(warranty));
  };

  const updateWarranty = async (warranty: Warranty) => {
    await setDoc(doc(db, 'users', userId, 'warranties', warranty.id), sanitize(warranty), { merge: true });
  };

  const deleteWarranty = async (id: string) => {
    await deleteDoc(doc(db, 'users', userId, 'warranties', id));
  };
  
  const bulkDeleteWarranties = async (ids: string[]) => {
      const batch = writeBatch(db);
      ids.forEach(id => {
          const ref = doc(db, 'users', userId, 'warranties', id);
          batch.delete(ref);
      });
      await batch.commit();
  }

  const clearWarranties = async () => {
      const q = query(collection(db, 'users', userId, 'warranties'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
      });
      await batch.commit();
  };

  return { warranties, loading, addWarranty, updateWarranty, deleteWarranty, bulkDeleteWarranties, clearWarranties };
};

export const useSettings = (userId: string) => {
    const [settings, setSettings] = useState<AppSettings>({ expiryReminderDays: 30 });
    
    useEffect(() => {
        if (!userId) return;
        
        const unsubscribe = onSnapshot(doc(db, 'users', userId, 'settings', 'general'), (docSnap) => {
            if (docSnap.exists()) {
                setSettings(docSnap.data() as AppSettings);
            }
        });
        
        return () => unsubscribe();
    }, [userId]);

    const updateSettings = async (newSettings: AppSettings) => {
        await setDoc(doc(db, 'users', userId, 'settings', 'general'), sanitize(newSettings), { merge: true });
    };

    return { settings, updateSettings };
}

export const useCustomers = (userId: string) => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (!userId) {
        setCustomers([]);
        return;
    }
    const q = query(collection(db, 'users', userId, 'customers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Customer);
      setCustomers(data.sort((a, b) => a.name.localeCompare(b.name)));
    });
    return () => unsubscribe();
  }, [userId]);

  const addCustomer = async (customer: Customer) => {
    await setDoc(doc(db, 'users', userId, 'customers', customer.id), sanitize(customer));
  };

  const updateCustomer = async (customer: Customer) => {
    await setDoc(doc(db, 'users', userId, 'customers', customer.id), sanitize(customer), { merge: true });
  };

  const deleteCustomer = async (id: string) => {
    await deleteDoc(doc(db, 'users', userId, 'customers', id));
  };

  const clearCustomers = async () => {
      const q = query(collection(db, 'users', userId, 'customers'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
      });
      await batch.commit();
  };

  return { customers, addCustomer, updateCustomer, deleteCustomer, clearCustomers };
};

export const useSavedProducts = (userId: string) => {
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);

  useEffect(() => {
    if (!userId) {
        setSavedProducts([]);
        return;
    }
    const q = query(collection(db, 'users', userId, 'saved_products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as SavedProduct);
      setSavedProducts(data.sort((a, b) => a.name.localeCompare(b.name)));
    });
    return () => unsubscribe();
  }, [userId]);

  const addSavedProduct = async (product: SavedProduct) => {
    await setDoc(doc(db, 'users', userId, 'saved_products', product.id), sanitize(product));
  };

  const updateSavedProduct = async (product: SavedProduct) => {
    await setDoc(doc(db, 'users', userId, 'saved_products', product.id), sanitize(product), { merge: true });
  };

  const deleteSavedProduct = async (id: string) => {
    await deleteDoc(doc(db, 'users', userId, 'saved_products', id));
  };

  const clearSavedProducts = async () => {
      const q = query(collection(db, 'users', userId, 'saved_products'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
      });
      await batch.commit();
  };

  return { savedProducts, addSavedProduct, updateSavedProduct, deleteSavedProduct, clearSavedProducts };
};

export const useSavedServices = (userId: string) => {
  const [savedServices, setSavedServices] = useState<SavedService[]>([]);

  useEffect(() => {
    if (!userId) {
        setSavedServices([]);
        return;
    }
    const q = query(collection(db, 'users', userId, 'saved_services'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as SavedService);
      setSavedServices(data.sort((a, b) => a.name.localeCompare(b.name)));
    });
    return () => unsubscribe();
  }, [userId]);

  const addSavedService = async (service: SavedService) => {
    await setDoc(doc(db, 'users', userId, 'saved_services', service.id), sanitize(service));
  };

  const updateSavedService = async (service: SavedService) => {
    await setDoc(doc(db, 'users', userId, 'saved_services', service.id), sanitize(service), { merge: true });
  };

  const deleteSavedService = async (id: string) => {
    await deleteDoc(doc(db, 'users', userId, 'saved_services', id));
  };

  const clearSavedServices = async () => {
      const q = query(collection(db, 'users', userId, 'saved_services'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
      });
      await batch.commit();
  };

  return { savedServices, addSavedService, updateSavedService, deleteSavedService, clearSavedServices };
};
