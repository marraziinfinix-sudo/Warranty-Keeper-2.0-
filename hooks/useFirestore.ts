
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  query,
  writeBatch
} from 'firebase/firestore';
import { Warranty, AppSettings } from '../types';

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

  return { warranties, loading, addWarranty, updateWarranty, deleteWarranty, bulkDeleteWarranties };
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
