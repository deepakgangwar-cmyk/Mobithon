/**
 * app.js — Main application initialization and event wiring
 * 
 * Flow:
 * 1. Check if user is logged in (Auth.init)
 *    - NOT logged in → show login overlay
 *    - Logged in → load per-user game state
 * 2. If game already completed → show completed overlay
 * 3. If game in progress → resume from where left off
 * 4. If fresh user → show story intro
 */

document.addEventListener('DOMContentLoaded', () => {
  // ===== STEP 1: Check Auth =====
  const isLoggedIn = Auth.init();

  if (isLoggedIn) {
    _startGameForUser();
  } else {
    _showLoginScreen();
  }

  // ===== GOOGLE LOGIN HANDLER =====
  const googleLoginBtn = document.getElementById('google-login-btn');
  const loginError = document.getElementById('login-error');

  googleLoginBtn.addEventListener('click', () => _handleGoogleLogin());

  async function _handleGoogleLogin() {
    // Disable button while signing in
    googleLoginBtn.disabled = true;
    const btnInner = googleLoginBtn.querySelector('.login-google-btn-inner');
    if (btnInner) btnInner.textContent = 'Signing in...';
    loginError.classList.add('hidden');

    const result = await Auth.signInWithGoogle();

    if (result.success) {
      // Hide login overlay with animation
      const loginOverlay = document.getElementById('login-overlay');
      loginOverlay.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      loginOverlay.style.opacity = '0';
      loginOverlay.style.transform = 'scale(1.05)';

      setTimeout(() => {
        loginOverlay.classList.add('hidden');
        loginOverlay.style.opacity = '';
        loginOverlay.style.transform = '';
        _startGameForUser();
      }, 500);
    } else {
      // Re-enable button
      googleLoginBtn.disabled = false;
      const btnInner = googleLoginBtn.querySelector('.login-google-btn-inner');
      if (btnInner) {
        btnInner.innerHTML = `
          <svg width="22" height="22" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continue with Google
        `;
      }

      // Show error if there is one (not a silent cancel)
      if (result.error) {
        loginError.textContent = result.error;
        loginError.classList.remove('hidden');
        _shakeElement(loginError);
      }
    }
  }

  // ===== COMPLETED OVERLAY HANDLERS =====
  const completedLeaderboardBtn = document.getElementById('completed-leaderboard-btn');
  const completedLogoutBtn = document.getElementById('completed-logout-btn');

  if (completedLeaderboardBtn) {
    completedLeaderboardBtn.addEventListener('click', () => {
      UI.showLeaderboard();
    });
  }

  if (completedLogoutBtn) {
    completedLogoutBtn.addEventListener('click', () => {
      _handleLogout();
    });
  }

  // ===== NAVBAR LOGOUT HANDLER =====
  document.getElementById('logout-btn').addEventListener('click', () => {
    _handleLogout();
  });

  // ===== Story start button =====
  document.getElementById('story-start-btn').addEventListener('click', () => {
    GameState.setStoryShown();
    UI.showScreen('map');
  });

  // ===== Back to map button =====
  document.getElementById('back-to-map').addEventListener('click', () => {
    UI.showScreen('map');
  });

  // ===== Logo — go to map =====
  document.getElementById('logo-btn').addEventListener('click', () => {
    if (UI.currentScreen === 'level') {
      UI.showScreen('map');
    }
  });

  // ===== Hint button =====
  document.getElementById('hint-btn').addEventListener('click', () => {
    UI.showHint();
  });

  // ===== Leaderboard =====
  document.getElementById('leaderboard-btn').addEventListener('click', () => {
    UI.showLeaderboard();
  });

  document.getElementById('close-leaderboard').addEventListener('click', () => {
    UI.hideLeaderboard();
  });

  // Close leaderboard on backdrop click
  document.getElementById('leaderboard-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      UI.hideLeaderboard();
    }
  });

  // ===== Keyboard shortcut: Escape to go back =====
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!document.getElementById('leaderboard-overlay').classList.contains('hidden')) {
        UI.hideLeaderboard();
      } else if (UI.currentScreen === 'level') {
        UI.showScreen('map');
      }
    }
  });

  // ===== SAVE STATE PERIODICALLY & ON PAGE UNLOAD =====
  // Save timer on page visibility change (user switches tab / minimizes)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && Timer._running) {
      GameState.updateTimerElapsed(Timer.getElapsed());
    }
  });

  // Save state before page unload (user closes tab / refreshes)
  window.addEventListener('beforeunload', () => {
    if (Timer._running) {
      GameState.updateTimerElapsed(Timer.getElapsed());
    }
  });
});


// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Start the game for the currently logged-in user.
 * Loads their per-user state and determines where to place them.
 */
function _startGameForUser() {
  // Hide login overlay since user is authenticated
  document.getElementById('login-overlay').classList.add('hidden');

  // Show a loading state while fetching from cloud
  document.getElementById('navbar').classList.remove('hidden');
  _updateUserDisplay();

  // Load per-user game state (async — tries Firestore first)
  GameState.load().then(() => {
    Timer.init();

    // Check if user already completed the game (jumble solved or game completed)
    if (GameState.state.gameCompleted || GameState.state.jumbleSolved) {
      // Ensure gameCompleted is set if jumble was solved
      if (!GameState.state.gameCompleted) {
        GameState.markGameCompleted();
      }
      _showCompletedScreen();
      return;
    }

    // Resume timer if it was running
    if (GameState.state.timerStarted && !GameState.isAllComplete()) {
      Timer.start();
    }

    // Check progress to determine where to resume
    const completedCount = GameState.getCompletedCount();
    const storyShown = GameState.state.storyShown;

    if (!storyShown && completedCount === 0) {
      // Fresh user — show story
      UI.showScreen('story');
      UI.typeStory();
    } else if (GameState.isAllComplete()) {
      // All levels done — show mission complete screen
      if (GameState.state.timerStarted && !Timer._running) {
        Timer.start();
      }
      UI._showMissionComplete();
    } else {
      // In-progress user — resume at level map
      UI.showScreen('map');

      // Show a welcome-back toast if they have progress
      if (completedCount > 0) {
        _showResumeToast(completedCount);
      }
    }
  });
}

/**
 * Show the login screen
 */
function _showLoginScreen() {
  // Hide everything except login
  document.getElementById('login-overlay').classList.remove('hidden');
  document.getElementById('completed-overlay').classList.add('hidden');
  document.getElementById('navbar').classList.add('hidden');
  document.getElementById('story-overlay').classList.add('hidden');
  document.getElementById('level-map').classList.add('hidden');
  document.getElementById('level-play').classList.add('hidden');
  document.getElementById('final-overlay').classList.add('hidden');
}

/**
 * Show the already-completed screen
 */
function _showCompletedScreen() {
  const overlay = document.getElementById('completed-overlay');
  overlay.classList.remove('hidden');

  // Hide navbar so user can't navigate away
  document.getElementById('navbar').classList.add('hidden');

  // Fill in completion info
  const info = Auth.getCompletionInfo();
  const userInfo = document.getElementById('completed-user-info');
  const timeInfo = document.getElementById('completed-time-info');
  const dateInfo = document.getElementById('completed-date-info');
  const lettersEl = document.getElementById('completed-letters');

  if (Auth.currentUser) {
    userInfo.textContent = `Agent ${Auth.currentUser.name}`;
  }

  if (info && info.completed) {
    const elapsed = info.time || 0;
    timeInfo.textContent = Timer.format(elapsed);
    if (info.completedAt && info.completedAt !== 'Unknown') {
      const d = new Date(info.completedAt);
      dateInfo.textContent = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    } else {
      dateInfo.textContent = 'Today';
    }
  } else {
    timeInfo.textContent = '00:00';
    dateInfo.textContent = '-';
  }

  // Show the final word with animated letters
  if (lettersEl) {
    lettersEl.innerHTML = 'MOBITHON'.split('').map((letter, i) =>
      `<div class="final-letter completed-final-letter" style="
        animation: pop-in 0.5s cubic-bezier(0.22,1,0.36,1) ${0.4 + i * 0.12}s both;
        border-color: var(--accent-green);
        color: var(--accent-green);
        box-shadow: 0 0 25px rgba(0, 255, 136, 0.4);
      ">${letter}</div>`
    ).join('');
  }

  // Hide game screens
  document.getElementById('story-overlay').classList.add('hidden');
  document.getElementById('level-map').classList.add('hidden');
  document.getElementById('level-play').classList.add('hidden');
  document.getElementById('final-overlay').classList.add('hidden');

  // Launch confetti celebration after a short delay
  setTimeout(() => _launchCompletionConfetti(), 600);
}

/**
 * Launch a sustained confetti burst on the completed screen
 */
function _launchCompletionConfetti() {
  // Use the existing confetti canvas if available, otherwise create one inside the overlay
  let canvas = document.getElementById('completed-confetti-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'completed-confetti-canvas';
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    document.getElementById('completed-overlay').appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#00f0ff', '#b060ff', '#ff3e8e', '#00ff88', '#ffd700', '#ff8c00'];
  const pieces = [];
  const PIECE_COUNT = 140;

  for (let i = 0; i < PIECE_COUNT; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 10 + 6,
      h: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.15,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * 3 + 1.5,
      opacity: 1
    });
  }

  let frame = 0;
  const MAX_FRAMES = 280;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      if (frame > MAX_FRAMES * 0.6) {
        p.opacity = Math.max(0, p.opacity - 0.012);
      }
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < MAX_FRAMES) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  draw();
}

/**
 * Handle logout — clear session and return to login
 */
function _handleLogout() {
  // Stop timer
  Timer.stop();
  Timer.reset();

  // Clear auth session (but keep game state for when they log back in)
  Auth.logout(); // async but we don't need to wait

  // Reset UI state
  GameState._state = null;

  // Hide everything
  document.getElementById('navbar').classList.add('hidden');
  document.getElementById('completed-overlay').classList.add('hidden');
  document.getElementById('story-overlay').classList.add('hidden');
  document.getElementById('level-map').classList.add('hidden');
  document.getElementById('level-play').classList.add('hidden');
  document.getElementById('final-overlay').classList.add('hidden');

  // Reset Google login button state
  const googleLoginBtn = document.getElementById('google-login-btn');
  if (googleLoginBtn) {
    googleLoginBtn.disabled = false;
    const btnInner = googleLoginBtn.querySelector('.login-google-btn-inner');
    if (btnInner) {
      btnInner.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Continue with Google
      `;
    }
  }

  // Clear login error
  document.getElementById('login-error').classList.add('hidden');

  // Show login
  _showLoginScreen();
}

/**
 * Update the user display in the navbar
 */
function _updateUserDisplay() {
  if (!Auth.currentUser) return;

  const avatar = document.getElementById('user-avatar');
  const nameDisplay = document.getElementById('user-name-display');
  const userInfo = document.getElementById('user-info');

  if (avatar) {
    avatar.textContent = Auth.currentUser.name.charAt(0).toUpperCase();
  }
  if (nameDisplay) {
    // Show first name only in navbar
    const firstName = Auth.currentUser.name.split(' ')[0];
    nameDisplay.textContent = firstName;
  }
  if (userInfo) {
    userInfo.title = `Logged in as ${Auth.currentUser.email}`;
  }
}

/**
 * Show a toast message when a returning user resumes
 */
function _showResumeToast(completedCount) {
  const toast = document.createElement('div');
  toast.className = 'resume-toast';
  toast.innerHTML = `
    <span class="resume-toast-icon">👋</span>
    <span>Welcome back, ${Auth.currentUser?.name || 'Agent'}! You've completed ${completedCount}/8 levels. Let's keep going!</span>
  `;
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

/**
 * Shake animation for error elements
 */
function _shakeElement(el) {
  el.classList.remove('shake');
  void el.offsetWidth; // Trigger reflow
  el.classList.add('shake');
}
