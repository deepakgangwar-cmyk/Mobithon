/**
 * auth.js — Firebase Google Sign-In authentication and per-user session management
 * 
 * Features:
 * - Google Sign-In via Firebase Auth
 * - Company email domain restriction (configurable)
 * - Per-user localStorage keyed by email
 * - Session persistence (resume from where left off)
 * - "Already completed" detection for returning users
 */

// ============================================
// 🔧 FIREBASE CONFIGURATION
// Replace these with your own Firebase project config
// ============================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA9V3azAY9v64lmtSLFbXUCsOPkcNKXGoE",
  authDomain: "bizom-mysteryreveal.firebaseapp.com",
  projectId: "bizom-mysteryreveal",
  storageBucket: "bizom-mysteryreveal.firebasestorage.app",
  messagingSenderId: "943180293766",
  appId: "1:943180293766:web:bf417a0e8b884d716fd307",
  measurementId: "G-2J11MT492Q"
};
// ============================================

// ============================================
// 🔧 ALLOWED EMAIL DOMAINS
// ============================================
const ALLOWED_EMAIL_DOMAINS = ['mobisy.com'];
// ============================================

// Initialize Firebase
firebase.initializeApp(FIREBASE_CONFIG);
const firebaseAuth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Restrict to specific Google Workspace domains via login_hint
// This shows only matching accounts in the Google picker
ALLOWED_EMAIL_DOMAINS.forEach(domain => {
  googleProvider.setCustomParameters({ hd: domain });
});

const AUTH_SESSION_KEY = 'mobithon_current_user';

/**
 * Promise that resolves when Firebase Auth has finished restoring
 * the previous session (or determined there is none).
 */
let _firebaseAuthReady;
const firebaseAuthReady = new Promise(resolve => {
  _firebaseAuthReady = resolve;
});

// Listen for Firebase Auth state changes
firebaseAuth.onAuthStateChanged(user => {
  _firebaseAuthReady(user); // Resolve with user (or null)
});

const Auth = {
  currentUser: null, // { email, name }

  /**
   * Initialize: check if user is already logged in (from localStorage session)
   */
  init() {
    try {
      const session = localStorage.getItem(AUTH_SESSION_KEY);
      if (session) {
        const parsed = JSON.parse(session);
        // Re-validate domain on session restore to enforce restriction
        const validation = this.validateEmail(parsed.email || '');
        if (!validation.valid) {
          localStorage.removeItem(AUTH_SESSION_KEY);
          return false; // Stored session has disallowed domain
        }
        this.currentUser = parsed;
        return true; // Already logged in
      }
    } catch (e) { /* ignore */ }
    return false; // Need to login
  },

  /**
   * Validate that the email belongs to an allowed domain
   */
  validateEmail(email) {
    email = email.trim().toLowerCase();
    const domain = email.split('@')[1];

    if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
      return {
        valid: false,
        error: `Only company emails are allowed (${ALLOWED_EMAIL_DOMAINS.map(d => '@' + d).join(', ')}).`
      };
    }

    return { valid: true, email: email };
  },

  /**
   * Sign in with Google via Firebase popup
   * Returns: { success, user?, error? }
   */
  async signInWithGoogle() {
    try {
      const result = await firebaseAuth.signInWithPopup(googleProvider);
      const user = result.user;
      const email = user.email.trim().toLowerCase();

      // Validate domain
      const validation = this.validateEmail(email);
      if (!validation.valid) {
        // Sign them out of Firebase since domain isn't allowed
        await firebaseAuth.signOut();
        return { success: false, error: validation.error };
      }

      // Extract display name
      const displayName = user.displayName || email.split('@')[0];

      // Save session locally
      this.login(email, displayName);

      return { success: true, user: this.currentUser };
    } catch (err) {
      // User closed popup or other error
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return { success: false, error: null }; // Silent cancel
      }
      console.error('Google Sign-In error:', err);
      return { success: false, error: 'Sign-in failed. Please try again.' };
    }
  },

  /**
   * Login user — save session to localStorage
   */
  login(email, displayName) {
    email = email.trim().toLowerCase();
    const name = displayName.trim() || email.split('@')[0];

    this.currentUser = { email, name };

    try {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(this.currentUser));
    } catch (e) { /* ignore */ }

    return this.currentUser;
  },

  /**
   * Logout user — clear local session and sign out of Firebase
   */
  async logout() {
    this.currentUser = null;
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch (e) { /* ignore */ }
    try {
      await firebaseAuth.signOut();
    } catch (e) { /* ignore */ }
  },

  /**
   * Get the storage key prefix for current user
   * This ensures each user has their own game state
   */
  getUserStorageKey(baseKey) {
    if (!this.currentUser) return baseKey;
    return `${baseKey}_${this.currentUser.email}`;
  },

  /**
   * Check if user has already completed the game
   */
  hasCompleted() {
    if (!this.currentUser) return false;
    // Check from GameState if loaded, otherwise localStorage
    if (typeof GameState !== 'undefined' && GameState._state) {
      return GameState._state.gameCompleted === true;
    }
    try {
      const key = this.getUserStorageKey('mobithon_game_state');
      const data = localStorage.getItem(key);
      if (data) {
        const state = JSON.parse(data);
        return state.gameCompleted === true;
      }
    } catch (e) { /* ignore */ }
    return false;
  },

  /**
   * Get completion info for display
   */
  getCompletionInfo() {
    if (!this.currentUser) return null;
    // Use GameState if loaded
    if (typeof GameState !== 'undefined' && GameState._state) {
      const state = GameState._state;
      if (state.gameCompleted) {
        return {
          completed: true,
          time: state.timerElapsed,
          completedAt: state.completedAt || 'Unknown'
        };
      }
      const completedLevels = state.levels ? state.levels.filter(l => l.completed).length : 0;
      if (completedLevels > 0) {
        return { completed: false, progress: completedLevels, time: state.timerElapsed };
      }
      return null;
    }
    // Fallback to localStorage
    try {
      const key = this.getUserStorageKey('mobithon_game_state');
      const data = localStorage.getItem(key);
      if (data) {
        const state = JSON.parse(data);
        if (state.gameCompleted) {
          return {
            completed: true,
            time: state.timerElapsed,
            completedAt: state.completedAt || 'Unknown'
          };
        }
        const completedLevels = state.levels ? state.levels.filter(l => l.completed).length : 0;
        if (completedLevels > 0) {
          return { completed: false, progress: completedLevels, time: state.timerElapsed };
        }
      }
    } catch (e) { /* ignore */ }
    return null;
  }
};
