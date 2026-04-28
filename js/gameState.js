/**
 * gameState.js — Game state management (Firestore only)
 * 
 * Strategy:
 * - Firestore is the ONLY source of truth
 * - No localStorage for game state or leaderboard
 */

const LETTERS = ['B', 'H', 'O', 'T', 'N', 'I', 'M', 'O', 'N'];
const FINAL_ANSWER = 'MOBITHON';

const LEVEL_DEFS = [
  {
    id: 1, title: 'The Riddle', icon: '🧩',
    desc: 'Solve the riddle to unlock the next letter.', letter: 'B',
    story: 'A mysterious informant has left you a riddle. Solve it to find the event, then extract the 1st letter as your fragment.',
    hints: [
      'It is a competition where developers code overnight to build something new.',
      'Teams race against the clock to build projects. The answer starts with "H" and ends with "N".'
    ]
  },
  {
    id: 2, title: 'Word Scramble', icon: '🔤',
    desc: 'Unscramble the letters to find the brand name.', letter: 'H',
    story: 'An encrypted transmission has arrived — the letters of a well-known brand have been scattered. Rearrange them to decode the name.',
    hints: [
      'This brand is known for water purifiers and wellness products. Think "pure" living.',
      'The brand name has 7 letters. It starts with "L" and ends with "E". Think: LIV + .....'
    ]
  },
  {
    id: 3, title: 'Math Cipher', icon: '🔢',
    desc: 'Solve equations and map the answer to the alphabet.', letter: 'O',
    story: 'The enemy is using mathematical codes. Solve the equation to find a number, then convert it to the corresponding letter of the alphabet (A=1, B=2, ...).',
    hints: [
      'Solve: (7 × 3) − (2 × 3) = ?. The answer maps to a letter where A=1, B=2, etc.',
      'The answer to the equation is 15. The 15th letter of the alphabet is ....'
    ]
  },
  {
    id: 4, title: 'The Brand Riddle', icon: '🧴',
    desc: 'Solve the riddle to identify the brand.', letter: 'T',
    story: 'A cryptic message has been intercepted. It describes a well-known brand by splitting its name into two parts. Decode the riddle to identify it.',
    hints: [
      'There\'s a "gate" in my name — but no one goes inside.',
      'Think: Coal + .... = ? It\'s something you use every morning.'
    ]
  },
  {
    id: 5, title: 'Memory Match', icon: '🧠',
    desc: 'Match all pairs to reveal the hidden letter.', letter: 'N',
    story: 'Your memory will be tested. Hidden among the matched pairs lies the next fragment. Match them all to uncover it.',
    hints: [
      'Focus on remembering positions. The letter will appear once you match all pairs.',
      'Try matching from the corners first, then work inward.'
    ]
  },
  {
    id: 6, title: 'Caesar Cipher', icon: '🔐',
    desc: 'Decrypt the message using a classic cipher shift.', letter: 'I',
    story: 'An ancient encryption method has been used to hide the message. Shift each letter backward by the given key to reveal the truth.',
    hints: [
      'A Caesar cipher shifts each letter. With shift 5, "Y" becomes "T", "F" becomes "A".',
      'The encoded word is "LTIWJO". Shift each letter BACK by 5 to find the brand name.'
    ]
  },
  {
    id: 7, title: 'Environment Day', icon: '🌿',
    desc: 'Find the missing date in the environmental calendar.', letter: 'M',
    story: 'The world celebrates nature on special days throughout the year. Two dates are known — but one is missing. Your knowledge of the planet will reveal the final clue.',
    hints: [
      'This day is celebrated every year in June. It\'s the biggest global day for the environment.',
      'Name of our New Kitchen.'
    ]
  },
  {
    id: 8, title: 'Jigsaw Puzzle', icon: '🧩',
    desc: 'Reassemble the scrambled app screenshot.', letter: 'O',
    story: 'The final piece of intelligence — a screenshot of the JKOne Connect homepage has been scrambled. Drag the pieces back into place to complete your mission.',
    hints: [
      'Go to the Play Store, download JKOne Connect, and see what the homepage looks like! login cred NO:9039503358. OTP:270415',
      '<img src="images/jkone-homepage.png" alt="JKOne Connect Homepage" style="max-width:240px;border-radius:12px;margin:0 auto 8px;display:block;border:1px solid rgba(0,240,255,0.2);"><span>Here\'s the original homepage. Match the pieces to this image.</span>'
    ]
  }
];

// Firestore reference
let db = null;
function _getDb() {
  if (!db && typeof firebase !== 'undefined' && firebase.firestore) {
    db = firebase.firestore();
  }
  return db;
}

function _getUserDocId() {
  if (typeof Auth !== 'undefined' && Auth.currentUser) {
    return Auth.currentUser.email.replace(/[.@]/g, '_');
  }
  return null;
}

const GameState = {
  _state: null,
  _saving: false,

  _defaults() {
    return {
      levels: LEVEL_DEFS.map((def, i) => ({
        id: def.id,
        unlocked: i === 0,
        completed: false,
        earnedLetter: null,
        hintsUsed: 0
      })),
      timerStarted: false,
      timerElapsed: 0,
      storyShown: false,
      jumbleSolved: false,
      gameCompleted: false,
      completedAt: null
    };
  },

  /**
   * Load game state from Firestore only
   */
  async load() {
    try {
      await firebaseAuthReady;

      const firestore = _getDb();
      const docId = _getUserDocId();
      if (!firestore || !docId || !firebase.auth().currentUser) {
        this._state = this._defaults();
        return this._state;
      }

      const doc = await firestore.collection('gameStates').doc(docId).get();
      if (doc.exists) {
        const data = doc.data();
        if (data && data.levels && data.levels.length >= 8) {
          // Keep only 8 levels for the map display
          if (data.levels.length > 8) {
            data.levels = data.levels.slice(0, 8);
          }
          if (data.gameCompleted === undefined) data.gameCompleted = false;
          if (data.jumbleSolved === undefined) data.jumbleSolved = data.gameCompleted || false;
          if (data.completedAt === undefined) data.completedAt = null;
          if (data.timerElapsed > 86400 || data.timerElapsed < 0) data.timerElapsed = 0;
          this._state = data;
          return this._state;
        }
      }
    } catch (e) {
      console.warn('Firestore load failed:', e.message);
    }

    this._state = this._defaults();
    return this._state;
  },

  /**
   * Save to Firestore only
   */
  save() {
    this._saveToFirestore();
  },

  async _saveToFirestore() {
    if (this._saving) return;
    this._saving = true;

    try {
      const firestore = _getDb();
      const docId = _getUserDocId();
      if (!firestore || !docId || !this._state || !firebase.auth().currentUser) {
        this._saving = false;
        return;
      }

      const dataToSave = {
        ...this._state,
        email: Auth.currentUser?.email || '',
        name: Auth.currentUser?.name || '',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await firestore.collection('gameStates').doc(docId).set(dataToSave, { merge: true });
    } catch (e) {
      console.warn('Firestore save failed:', e.message);
    }

    this._saving = false;
  },

  get state() {
    if (!this._state) this._state = this._defaults();
    return this._state;
  },

  getLevel(id) {
    return this.state.levels[id - 1];
  },

  completeLevel(id, letter) {
    const level = this.getLevel(id);
    level.completed = true;
    level.earnedLetter = letter;
    if (id < 8) {
      this.state.levels[id].unlocked = true;
    }
    this.save();
  },

  useHint(levelId) {
    const level = this.getLevel(levelId);
    level.hintsUsed = Math.min(level.hintsUsed + 1, 2);
    this.save();
    return level.hintsUsed;
  },

  getCompletedCount() {
    return this.state.levels.filter(l => l.completed).length;
  },

  getCollectedLetters() {
    return this.state.levels.map(l => l.earnedLetter || null);
  },

  isAllComplete() {
    return this.state.levels.every(l => l.completed);
  },

  setTimerStarted() {
    this.state.timerStarted = true;
    this.save();
  },

  updateTimerElapsed(seconds) {
    this.state.timerElapsed = seconds;
    this.save();
  },

  setStoryShown() {
    this.state.storyShown = true;
    this.save();
  },

  markJumbleSolved() {
    this.state.jumbleSolved = true;
    this.save();
  },

  markGameCompleted() {
    this.state.gameCompleted = true;
    this.state.jumbleSolved = true;
    this.state.completedAt = new Date().toISOString();
    this.save();
  },

  reset() {
    this._state = this._defaults();
    this.save();
  },

  // ============================================
  // LEADERBOARD — Firestore only
  // ============================================

  async getLeaderboard() {
    try {
      const firestore = _getDb();
      if (!firestore || !firebase.auth().currentUser) return [];

      const entries = [];

      // Fetch from leaderboard collection
      const lbSnapshot = await firestore.collection('leaderboard').get();
      lbSnapshot.forEach(doc => {
        const data = doc.data();
        if (data && data.name) {
          let time = data.time;
          if (typeof time === 'string') time = parseInt(time, 10);
          if (typeof time !== 'number' || !isFinite(time) || time < 0) time = 0;
          entries.push({
            name: data.name,
            email: data.email || '',
            time: time,
            date: data.date || '',
            createdAt: data.createdAt || ''
          });
        }
      });

      // Sort by time ascending and return top 20
      entries.sort((a, b) => a.time - b.time);
      return entries.slice(0, 20);
    } catch (e) {
      console.error('Leaderboard load failed:', e);
    }
    return [];
  },

  async addToLeaderboard(name, timeInSeconds, email) {
    // Ensure time is stored as a valid number
    const time = typeof timeInSeconds === 'number' && isFinite(timeInSeconds) && timeInSeconds >= 0
      ? Math.round(timeInSeconds)
      : 0;

    const entry = {
      name: name.slice(0, 20),
      email: email || '',
      time: time,
      date: (() => { const d = new Date(); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; })(),
      createdAt: new Date().toISOString()
    };

    try {
      const firestore = _getDb();
      if (firestore && firebase.auth().currentUser) {
        // Use email-based docId so each user gets one best-time entry
        const docId = email ? email.replace(/[.@]/g, '_') : `anon_${Date.now()}`;

        const existing = await firestore.collection('leaderboard').doc(docId).get();
        if (existing.exists) {
          const existingData = existing.data();
          const existingTime = typeof existingData.time === 'number' ? existingData.time : Infinity;
          // Update only if new time is better
          if (time < existingTime) {
            await firestore.collection('leaderboard').doc(docId).set(entry);
          }
        } else {
          await firestore.collection('leaderboard').doc(docId).set(entry);
        }
      }
    } catch (e) {
      console.warn('Firestore leaderboard save failed:', e.message);
    }

    return [];
  }
};
