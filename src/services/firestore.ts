import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import { app, auth } from './firebaseAuth';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppSettings, PresetItem, Purchase, DailyCheckIn } from '../types';

// CRITICAL: Initialize Firestore using the exact configured database ID
export const db = getFirestore(
  app,
  (firebaseConfig as any).firestoreDatabaseId || undefined
);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate connection to Firestore on startup
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    if (auth.currentUser) {
      await getDocFromServer(doc(db, 'users', auth.currentUser.uid));
    }
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore client is currently offline or unreachable.');
    }
    return false;
  }
}

// ==========================================
// User Profile / Settings
// ==========================================

export async function saveUserSettingsToFirestore(
  userId: string,
  settings: AppSettings
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        userId,
        currency: settings.currency,
        currencySymbol: settings.currencySymbol,
        monthlyBudget: Number(settings.monthlyBudget) || 0,
        alcoholBudget: Number(settings.alcoholBudget) || 0,
        tobaccoBudget: Number(settings.tobaccoBudget) || 0,
        budgetAlertEnabled: settings.budgetAlertEnabled !== undefined ? Boolean(settings.budgetAlertEnabled) : true,
        budgetAlertThreshold: Number(settings.budgetAlertThreshold) || 80,
        showBudgetOnHome: Boolean(settings.showBudgetOnHome),
        theme: settings.theme || 'system',
        dailyReminderEnabled: Boolean(settings.dailyReminderEnabled),
        dailyReminderTime: settings.dailyReminderTime || '20:00',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToUserSettings(
  userId: string,
  onData: (data: Partial<AppSettings> | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}`;
  const docRef = doc(db, 'users', userId);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onData(data as Partial<AppSettings>);
      } else {
        onData(null);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// ==========================================
// Purchases Subcollection
// ==========================================

export async function savePurchaseToFirestore(
  userId: string,
  purchase: Purchase
): Promise<void> {
  const path = `users/${userId}/purchases/${purchase.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'purchases', purchase.id);
    await setDoc(docRef, {
      id: purchase.id,
      userId,
      category: purchase.category,
      subcategory: purchase.subcategory,
      price: Number(purchase.price),
      quantity: Number(purchase.quantity),
      totalPrice: Number(purchase.totalPrice),
      place: purchase.place,
      date: purchase.date,
      note: purchase.note || '',
      createdAt: purchase.createdAt || Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePurchaseFromFirestore(
  userId: string,
  purchaseId: string
): Promise<void> {
  const path = `users/${userId}/purchases/${purchaseId}`;
  try {
    const docRef = doc(db, 'users', userId, 'purchases', purchaseId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToPurchases(
  userId: string,
  onData: (purchases: Purchase[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}/purchases`;
  const collectionRef = collection(db, 'users', userId, 'purchases');
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const list: Purchase[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: d.id,
          category: d.category,
          subcategory: d.subcategory,
          price: Number(d.price),
          quantity: Number(d.quantity),
          totalPrice: Number(d.totalPrice),
          place: d.place,
          date: d.date,
          note: d.note || '',
          createdAt: Number(d.createdAt),
        });
      });
      // Sort newest date first
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ==========================================
// Presets Subcollection
// ==========================================

export async function savePresetToFirestore(
  userId: string,
  preset: PresetItem
): Promise<void> {
  const path = `users/${userId}/presets/${preset.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'presets', preset.id);
    await setDoc(docRef, {
      id: preset.id,
      userId,
      category: preset.category,
      name: preset.name,
      defaultPrice: Number(preset.defaultPrice),
      place: preset.place,
      icon: preset.icon || '',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePresetFromFirestore(
  userId: string,
  presetId: string
): Promise<void> {
  const path = `users/${userId}/presets/${presetId}`;
  try {
    const docRef = doc(db, 'users', userId, 'presets', presetId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToPresets(
  userId: string,
  onData: (presets: PresetItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}/presets`;
  const collectionRef = collection(db, 'users', userId, 'presets');
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const list: PresetItem[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: d.id,
          category: d.category,
          name: d.name,
          defaultPrice: Number(d.defaultPrice),
          place: d.place,
          icon: d.icon || undefined,
        });
      });
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ==========================================
// Daily Check-Ins Subcollection
// ==========================================

export async function saveCheckInToFirestore(
  userId: string,
  checkIn: DailyCheckIn
): Promise<void> {
  const path = `users/${userId}/checkins/${checkIn.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'checkins', checkIn.id);
    const payload: any = {
      id: checkIn.id,
      userId,
      date: checkIn.date,
      alcoholFree: Boolean(checkIn.alcoholFree),
      tobaccoFree: Boolean(checkIn.tobaccoFree),
      createdAt: checkIn.createdAt || Date.now(),
    };
    if (checkIn.note !== undefined && checkIn.note !== '') {
      payload.note = checkIn.note;
    }
    if (checkIn.mood) {
      payload.mood = checkIn.mood;
    }
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCheckInFromFirestore(
  userId: string,
  checkInId: string
): Promise<void> {
  const path = `users/${userId}/checkins/${checkInId}`;
  try {
    const docRef = doc(db, 'users', userId, 'checkins', checkInId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToCheckIns(
  userId: string,
  onData: (checkIns: DailyCheckIn[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}/checkins`;
  const collectionRef = collection(db, 'users', userId, 'checkins');
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const list: DailyCheckIn[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: d.id,
          userId: d.userId,
          date: d.date,
          alcoholFree: Boolean(d.alcoholFree),
          tobaccoFree: Boolean(d.tobaccoFree),
          note: d.note || '',
          mood: d.mood,
          createdAt: Number(d.createdAt) || Date.now(),
        });
      });
      // Sort newest date first
      list.sort((a, b) => b.date.localeCompare(a.date));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
