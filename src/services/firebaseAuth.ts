import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

const provider = new GoogleAuthProvider();
GOOGLE_DRIVE_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'select_account' });

export const getGoogleAuthErrorMessage = (error: any): string => {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  if (code === 'auth/unauthorized-domain') return `This site is not authorized in Firebase. Add ${window.location.hostname} to Firebase Authentication > Settings > Authorized domains.`;
  if (code === 'auth/operation-not-allowed') return 'This sign-in method is not enabled in Firebase Authentication. Enable it and try again.';
  if (code === 'auth/popup-blocked') return 'Your browser blocked the Google sign-in popup. Allow popups for this site and try again.';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return '';
  if (code === 'auth/invalid-api-key' || code === 'auth/configuration-not-found') return 'Firebase authentication is not configured for this deployment. Check the Firebase web app configuration.';
  if (code === 'auth/email-already-in-use') return 'That email already has a SpotOn account. Try signing in instead.';
  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') return 'The email or password is incorrect.';
  if (code === 'auth/weak-password') return 'Choose a password with at least 6 characters.';
  if (code === 'auth/invalid-email') return 'Enter a valid email address.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait a moment and try again.';
  if (message.toLowerCase().includes('redirect_uri_mismatch')) return 'Google rejected this redirect URL. Add the Firebase auth handler domain to Google Cloud OAuth authorized redirect URIs.';
  return 'Authentication could not be completed. Check your Firebase settings and try again.';
};

let cachedAccessToken: string | null = null;

export const initAuth = (onAuthSuccess?: (user: User, token: string) => void, onAuthFailure?: () => void) => {
  void getRedirectResult(auth).then((result) => {
    if (!result) return;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    onAuthSuccess?.(result.user, cachedAccessToken || '');
  }).catch((error) => {
    console.error('[v0] Google redirect sign-in failed:', error);
    onAuthFailure?.();
  });
  return onAuthStateChanged(auth, (user) => {
    if (user) onAuthSuccess?.(user, cachedAccessToken || '');
    else { cachedAccessToken = null; onAuthFailure?.(); }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) throw new Error('Failed to obtain Google Drive OAuth access token');
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const code = error?.code || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' || code === 'auth/user-cancelled') return null;
    if (code === 'auth/popup-blocked') { await signInWithRedirect(auth, provider); return null; }
    console.error('[v0] Google Sign-In Error:', { code, message: error?.message });
    throw new Error(getGoogleAuthErrorMessage(error));
  }
};

export const emailSignIn = async (email: string, password: string) => {
  try { return (await signInWithEmailAndPassword(auth, email.trim(), password)).user; }
  catch (error) { console.error('[v0] Email sign-in failed:', error); throw new Error(getGoogleAuthErrorMessage(error)); }
};

export const emailSignUp = async (email: string, password: string) => {
  try { return (await createUserWithEmailAndPassword(auth, email.trim(), password)).user; }
  catch (error) { console.error('[v0] Email sign-up failed:', error); throw new Error(getGoogleAuthErrorMessage(error)); }
};

export const getAccessToken = async () => cachedAccessToken;
export const logoutGoogle = async () => { await signOut(auth); cachedAccessToken = null; };
export const logout = logoutGoogle;
export const getCurrentUser = (): User | null => auth.currentUser;
