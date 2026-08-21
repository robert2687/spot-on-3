import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely (prevent duplicate initializeApp calls)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// All Google Drive and Workspace scopes configured
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
GOOGLE_DRIVE_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account',
});

export const getGoogleAuthErrorMessage = (error: any): string => {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  if (code === 'auth/unauthorized-domain') {
    return `This site is not authorized in Firebase. Add ${window.location.hostname} to Firebase Authentication > Settings > Authorized domains.`;
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is not enabled in Firebase Authentication. Enable the Google provider and try again.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Your browser blocked the Google sign-in popup. Allow popups for this site and try again.';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return '';
  }
  if (code === 'auth/invalid-api-key' || code === 'auth/configuration-not-found') {
    return 'Firebase authentication is not configured for this deployment. Check the Firebase web app configuration.';
  }
  if (message.toLowerCase().includes('redirect_uri_mismatch')) {
    return 'Google rejected this redirect URL. Add the Firebase auth handler domain to Google Cloud OAuth authorized redirect URIs.';
  }
  return 'Google sign-in could not be completed. Check the Firebase Authorized domains and Google OAuth settings, then try again.';
};

// Flag to indicate if sign-in is currently in flight
let isSigningIn = false;

// In-memory access token cache (MANDATORY: never stored in localStorage)
let cachedAccessToken: string | null = null;

/**
 * Initialize Firebase Auth listener.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  void getRedirectResult(auth).then((result) => {
    if (!result) return;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    onAuthSuccess?.(result.user, cachedAccessToken || '');
  }).catch((error) => {
    console.error('[v0] Google redirect sign-in failed:', error);
    onAuthFailure?.();
  });

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken || '');
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Perform Google Sign-in with popup and extract access token
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Drive OAuth access token');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const code = error?.code || '';
    // Gracefully handle standard user cancellation actions (closing window, clicking away, cancelling request)
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/user-cancelled'
    ) {
      return null;
    }
    if (code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, provider);
      return null;
    }
    console.error('[v0] Google Sign-In Error:', { code, message: error?.message });
    throw new Error(getGoogleAuthErrorMessage(error));
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get the cached access token in memory
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Sign out and clear cached token
 */
export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Get currently authenticated user
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};
