import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, addDoc, writeBatch } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, ReadingHistoryItem, Manhua, ReadingListItem } from '../types';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, data, { merge: true });
    return { user: { ...data, id: userId } as UserProfile, error: null };
};

export const fetchUserReadingHistory = async (userId: string): Promise<ReadingHistoryItem[]> => {
    const historyRef = collection(db, `users/${userId}/history`);
    const snapshot = await getDocs(historyRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReadingHistoryItem));
};

export const saveUserReadingHistory = async (userId: string, item: Omit<ReadingHistoryItem, 'id' | 'lastReadTime'>): Promise<ReadingHistoryItem> => {
    const historyRef = collection(db, `users/${userId}/history`);
    const docRef = await addDoc(historyRef, {
        ...item,
        lastReadTime: new Date().toISOString()
    });
    return { id: docRef.id, ...item, lastReadTime: new Date().toISOString() };
};

export const deleteUserHistoryItem = async (userId: string, historyId: string) => {
    const historyRef = doc(db, `users/${userId}/history`, historyId);
    await deleteDoc(historyRef);
};

export const clearUserReadingHistory = async (userId: string) => {
    const historyRef = collection(db, `users/${userId}/history`);
    const snapshot = await getDocs(historyRef);
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
};

export const fetchUserReadingList = async (userId: string): Promise<ReadingListItem[]> => {
    const listRef = collection(db, `users/${userId}/readingList`);
    const snapshot = await getDocs(listRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReadingListItem));
};

export const addManhuaToReadingList = async (userId: string, manhua: Manhua, type: 'favorite' | 'reading' | 'plan'): Promise<ReadingListItem> => {
    const listRef = collection(db, `users/${userId}/readingList`);
    const newItem = { 
        userId,
        manhuaId: manhua.id, 
        manhuaTitle: manhua.title,
        manhuaCover: manhua.coverUrl,
        listType: type,
        addedAt: new Date().toISOString() 
    };
    const docRef = await addDoc(listRef, newItem);
    return { id: docRef.id, ...newItem };
};

export const removeManhuaFromReadingList = async (userId: string, manhuaId: string) => {
    const listRef = collection(db, `users/${userId}/readingList`);
    const q = query(listRef, where('manhuaId', '==', manhuaId));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
};
