/**
 * ResearchNexus - Firebase Authentication Module
 * Configured with live Firebase credentials for Login & Sign Up
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDcBim3tK7GdAggYsu-geLYbs_nvCemcmo",
  authDomain: "story-telling-366105.firebaseapp.com",
  databaseURL: "https://story-telling-366105-default-rtdb.firebaseio.com",
  projectId: "story-telling-366105",
  storageBucket: "story-telling-366105.firebasestorage.app",
  messagingSenderId: "11882811020",
  appId: "1:11882811020:web:5f00468e331cd7407ff5a9"
};

// Initialize Firebase App instance
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Clean human-friendly Firebase Auth error mapping
export function getFriendlyAuthError(error) {
  if (!error) return 'An unknown error occurred.';
  const code = error.code || '';
  const message = error.message || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address format. Please provide a valid campus email.';
    case 'auth/user-not-found':
      return 'No academic profile found with this email. Please sign up or check for typos.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect credentials. Please verify your email and password.';
    case 'auth/email-already-in-use':
      return 'An institutional account already exists with this email. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters with mixed letters & numbers.';
    case 'auth/popup-closed-by-user':
      return 'SSO popup window was closed before completing authentication.';
    case 'auth/popup-blocked':
      return 'SSO popup was blocked by browser. Please allow popups for this domain.';
    case 'auth/network-request-failed':
      return 'Network communication error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Access temporarily locked due to multiple failed login attempts. Try again later.';
    case 'auth/operation-not-allowed':
      return 'Authentication method is currently disabled in the Firebase console. Please ensure Email/Password or Google provider is enabled.';
    default:
      return message || 'Authentication failed. Please try again.';
  }
}

/**
 * Sign In with Email & Password
 */
export async function loginWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Cache basic metadata in local state
    saveSessionMeta({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || email.split('@')[0],
      photoURL: user.photoURL,
      lastLogin: new Date().toISOString()
    });

    return { success: true, user };
  } catch (error) {
    console.error('[FirebaseAuth] Login error:', error);
    return {
      success: false,
      error: getFriendlyAuthError(error),
      rawError: error
    };
  }
}

/**
 * Sign Up with Email, Password & Academic Profile Info
 */
export async function signupWithEmail(email, password, displayName = '', role = 'researcher', department = 'cs') {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const formattedName = displayName.trim() || email.split('@')[0];
    
    // Update Firebase Auth user profile
    await updateProfile(user, {
      displayName: formattedName
    });

    // Save extra role and department metadata locally
    saveSessionMeta({
      uid: user.uid,
      email: user.email,
      displayName: formattedName,
      role: role,
      department: department,
      registeredAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    });

    return { success: true, user };
  } catch (error) {
    console.error('[FirebaseAuth] Sign up error:', error);
    return {
      success: false,
      error: getFriendlyAuthError(error),
      rawError: error
    };
  }
}

/**
 * Sign In with Google / University SSO Popup
 */
export async function loginWithGoogleSSO() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    saveSessionMeta({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL,
      provider: 'google.com',
      lastLogin: new Date().toISOString()
    });

    return { success: true, user };
  } catch (error) {
    console.error('[FirebaseAuth] Google SSO error:', error);
    return {
      success: false,
      error: getFriendlyAuthError(error),
      rawError: error
    };
  }
}

/**
 * Send Password Reset Email
 */
export async function sendPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('[FirebaseAuth] Password reset error:', error);
    return { success: false, error: getFriendlyAuthError(error) };
  }
}

/**
 * Sign Out from Firebase
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    localStorage.removeItem('rn_session_meta');
    return { success: true };
  } catch (error) {
    console.error('[FirebaseAuth] Logout error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current session metadata from localStorage
 */
export function getSavedSessionMeta() {
  try {
    const raw = localStorage.getItem('rn_session_meta');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Save session metadata to localStorage
 */
export function saveSessionMeta(meta) {
  try {
    const existing = getSavedSessionMeta() || {};
    const merged = { ...existing, ...meta };
    localStorage.setItem('rn_session_meta', JSON.stringify(merged));
  } catch (e) {
    console.warn('[FirebaseAuth] Unable to write session meta to localStorage', e);
  }
}

/**
 * Subscribe to Firebase Auth state updates
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, (user) => {
    const meta = getSavedSessionMeta();
    callback(user, meta);
  });
}

// Expose globally for convenience
window.FirebaseAuth = {
  app,
  auth,
  loginWithEmail,
  signupWithEmail,
  loginWithGoogleSSO,
  sendPasswordReset,
  logoutUser,
  getSavedSessionMeta,
  saveSessionMeta,
  onAuthChange
};
