/**
 * ui.js — UI management: screen transitions, level map, success overlays, leaderboard
 */

const UI = {
  currentScreen: 'story', // 'story' | 'map' | 'level'
  currentLevelId: null,

  // ---------- Screen Management ----------
  showScreen(screen) {
    const storyOverlay = document.getElementById('story-overlay');
    const levelMap = document.getElementById('level-map');
    const levelPlay = document.getElementById('level-play');
    const completedOverlay = document.getElementById('completed-overlay');

    storyOverlay.classList.add('hidden');
    levelMap.classList.add('hidden');
    levelPlay.classList.add('hidden');
    completedOverlay.classList.add('hidden');

    switch (screen) {
      case 'story':
        storyOverlay.classList.remove('hidden');
        break;
      case 'map':
        levelMap.classList.remove('hidden');
        this.renderLevelMap();
        this.updateProgress();
        this.updateCollectedLetters();
        break;
      case 'level':
        levelPlay.classList.remove('hidden');
        break;
    }

    this.currentScreen = screen;
  },

  // ---------- Story Intro ----------
  typeStory() {
    const storyEl = document.getElementById('story-text');
    const story = `Agent, we've intercepted a <span class="highlight">classified transmission</span>.<br/><br/>
      The name of a secret operation has been <span class="highlight">fragmented into 8 encrypted pieces</span>, 
      each hidden behind a different puzzle.<br/><br/>
      Your mission: solve all 8 challenges, collect every letter, and <span class="highlight">reconstruct the codename</span>.<br/><br/>
      The clock starts when you begin. Good luck.`;

    storyEl.innerHTML = '';
    let index = 0;
    const raw = story;

    // Simple "type" effect — reveal character by character, skipping HTML tags
    let buffer = '';
    const typeChar = () => {
      if (index < raw.length) {
        // If we hit an HTML tag, add it all at once
        if (raw[index] === '<') {
          const closeIndex = raw.indexOf('>', index);
          buffer += raw.substring(index, closeIndex + 1);
          index = closeIndex + 1;
        } else {
          buffer += raw[index];
          index++;
        }
        storyEl.innerHTML = buffer;
        setTimeout(typeChar, 15);
      }
    };
    
    setTimeout(typeChar, 800);
  },

  // ---------- Level Map ----------
  renderLevelMap() {
    const grid = document.getElementById('level-grid');
    grid.innerHTML = '';

    LEVEL_DEFS.forEach((def, i) => {
      const levelState = GameState.getLevel(def.id);
      let statusClass = 'locked';
      let statusIcon = '';

      if (levelState.completed) {
        statusClass = 'completed';
        statusIcon = `<span class="level-check">✅</span>
                      <span class="level-letter-badge">${levelState.earnedLetter}</span>`;
      } else if (levelState.unlocked) {
        statusClass = 'current';
        statusIcon = '';
      } else {
        statusIcon = '<span class="level-lock">🔒</span>';
      }

      const card = document.createElement('div');
      card.className = `level-card ${statusClass}`;
      card.id = `level-card-${def.id}`;
      card.innerHTML = `
        <span class="level-number">LEVEL ${def.id}</span>
        <span class="level-icon">${def.icon}</span>
        <div class="level-card-title">${def.title}</div>
        <div class="level-card-desc">${def.desc}</div>
        ${statusIcon}
      `;

      if (levelState.unlocked && !levelState.completed) {
        card.addEventListener('click', () => this.openLevel(def.id));
      }

      grid.appendChild(card);
    });
  },

  // ---------- Update Progress ----------
  updateProgress() {
    const completed = GameState.getCompletedCount();
    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');
    if (fill) fill.style.width = `${(completed / 8) * 100}%`;
    if (text) text.textContent = `${completed} / 8`;
  },

  updateCollectedLetters() {
    const letters = GameState.getCollectedLetters();
    letters.forEach((letter, i) => {
      const slot = document.querySelector(`.letter-slot[data-index="${i}"]`);
      if (letter) {
        slot.textContent = letter;
        slot.classList.add('revealed');
      } else {
        slot.textContent = '?';
        slot.classList.remove('revealed');
      }
    });
  },

  // ---------- Open Level ----------
  openLevel(levelId) {
    this.currentLevelId = levelId;
    const def = LEVEL_DEFS[levelId - 1];
    const levelState = GameState.getLevel(levelId);

    // Start timer on first level open
    if (!GameState.state.timerStarted) {
      Timer.start();
    } else if (!Timer._running) {
      Timer.start();
    }

    // Update header
    document.getElementById('level-badge').textContent = `LEVEL ${levelId}`;
    document.getElementById('level-name').textContent = def.title;
    document.getElementById('level-story').textContent = def.story;

    // Reset hint display
    document.getElementById('hint-display').classList.add('hidden');
    
    // Update hint button
    const hintBtn = document.getElementById('hint-btn');
    if (levelState.hintsUsed >= 2) {
      hintBtn.style.opacity = '0.3';
      hintBtn.style.pointerEvents = 'none';
      document.getElementById('hint-text').textContent = 'No hints left';
    } else {
      hintBtn.style.opacity = '1';
      hintBtn.style.pointerEvents = 'auto';
      document.getElementById('hint-text').textContent = levelState.hintsUsed === 0 ? 'Hint (free)' : 'Hint (+30s)';
    }

    // Render level content
    Levels.render(levelId);

    this.showScreen('level');
  },

  // ---------- Hint ----------
  showHint() {
    if (!this.currentLevelId) return;
    const def = LEVEL_DEFS[this.currentLevelId - 1];
    const levelState = GameState.getLevel(this.currentLevelId);

    if (levelState.hintsUsed >= 2) return;

    const hintIndex = levelState.hintsUsed;
    const hint = def.hints[hintIndex];

    // Apply penalty for 2nd hint
    if (hintIndex === 1) {
      Timer.addPenalty(30);
    }

    GameState.useHint(this.currentLevelId);

    // Show hint
    const hintDisplay = document.getElementById('hint-display');
    const hintMessage = document.getElementById('hint-message');
    hintDisplay.classList.remove('hidden');
    hintMessage.innerHTML = hint;

    // Update button
    const hintBtn = document.getElementById('hint-btn');
    if (levelState.hintsUsed >= 2) {
      hintBtn.style.opacity = '0.3';
      hintBtn.style.pointerEvents = 'none';
      document.getElementById('hint-text').textContent = 'No hints left';
    } else {
      document.getElementById('hint-text').textContent = 'Hint (+30s)';
    }
  },

  // ---------- Level Success ----------
  showLevelSuccess(levelId, letter) {
    GameState.completeLevel(levelId, letter);

    // Check if all complete
    const allComplete = GameState.isAllComplete();

    const overlay = document.createElement('div');
    overlay.className = 'level-success';
    overlay.id = 'level-success-overlay';
    overlay.innerHTML = `
      <div class="success-card glass-card">
        <span class="success-icon">🎉</span>
        <div class="success-title">LEVEL ${levelId} COMPLETE!</div>
        <div class="success-letter">${letter}</div>
        <p class="success-msg">You've earned the fragment letter "${letter}". ${allComplete ? 'All 8 fragments collected! Now unscramble them!' : `${8 - GameState.getCompletedCount()} more to go.`}</p>
        <button class="btn btn-primary btn-glow" id="success-continue-btn">
          ${allComplete ? '🧩 Final Challenge: Unscramble!' : '→ Continue'}
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('success-continue-btn').addEventListener('click', () => {
      overlay.remove();
      if (allComplete) {
        this.showFinalJumble();
      } else {
        this.showScreen('map');
      }
    });
  },

  // ---------- Final Jumble Word Puzzle ----------
  showFinalJumble() {
    const overlay = document.getElementById('final-overlay');
    overlay.classList.remove('hidden');

    // Get collected letters in the order they were earned
    const collected = GameState.getCollectedLetters();
    const jumbled = [...collected];

    const lettersContainer = document.getElementById('final-letters');
    lettersContainer.innerHTML = '';

    // Show collected letters as display tiles (not clickable)
    jumbled.forEach((letter, i) => {
      const el = document.createElement('div');
      el.className = 'final-letter';
      el.textContent = letter;
      el.style.animationDelay = `${0.3 + i * 0.15}s`;
      lettersContainer.appendChild(el);
    });

    // Update subtitle
    const subtitle = document.querySelector('.final-subtitle');
    subtitle.textContent = '🧩 FINAL CHALLENGE: Unscramble the Letters!';
    subtitle.style.color = 'var(--accent-cyan)';

    // Show time so far
    const timeEl = document.getElementById('final-time');
    timeEl.textContent = `⏱ Time so far: ${Timer.format(Timer.getElapsed())}`;
    timeEl.style.animation = 'none';
    timeEl.style.opacity = '1';

    // Show text input + submit button
    const formEl = document.getElementById('final-form');
    formEl.style.animation = 'none';
    formEl.style.opacity = '1';
    formEl.classList.remove('hidden');
    formEl.innerHTML = `
      <div style="width: 100%; text-align: center;">
        <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 16px;">
          Rearrange these 8 letters to form the hackathon name!
        </p>
        <div style="display: flex; gap: 12px; max-width: 440px; margin: 0 auto;">
          <input type="text" class="input-field" id="jumble-input" placeholder="Type the unscrambled word..." maxlength="8" autocomplete="off" style="flex: 1;" />
          <button class="btn btn-submit" id="jumble-submit-btn">Submit</button>
        </div>
        <div class="answer-feedback" id="jumble-feedback" style="margin-top: 12px;"></div>
      </div>
    `;

    // Event listeners
    document.getElementById('jumble-submit-btn').addEventListener('click', () => this._checkJumbleAnswer());
    document.getElementById('jumble-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._checkJumbleAnswer();
    });
  },

  _checkJumbleAnswer() {
    const input = document.getElementById('jumble-input').value.trim().toUpperCase();
    const feedback = document.getElementById('jumble-feedback');

    if (input === FINAL_ANSWER) {
      feedback.className = 'answer-feedback correct';
      feedback.textContent = '🎉 YES! The answer is MOBITHON!';

      Timer.stop();

      setTimeout(() => this._showVictory(), 1200);
    } else if (input.length < 1) {
      feedback.className = 'answer-feedback wrong';
      feedback.textContent = '❌ Type your answer above!';
    } else {
      feedback.className = 'answer-feedback wrong';
      feedback.textContent = '❌ That\'s not right. Try again!';
    }
  },

  _showVictory() {
    // Mark the game as completed and save elapsed time
    const elapsed = Timer.getElapsed();
    GameState.updateTimerElapsed(elapsed);
    GameState.markGameCompleted();

    // Auto-submit score to leaderboard
    const playerName = (Auth.currentUser && Auth.currentUser.name) ? Auth.currentUser.name : 'Agent';
    const playerEmail = Auth.currentUser ? Auth.currentUser.email : '';
    GameState.addToLeaderboard(playerName, elapsed, playerEmail);

    // Hide the final jumble overlay
    document.getElementById('final-overlay').classList.add('hidden');

    // Show the completed screen directly
    _showCompletedScreen();
  },

  // ---------- Leaderboard ----------
  async showLeaderboard() {
    const overlay = document.getElementById('leaderboard-overlay');
    overlay.classList.remove('hidden');

    const tbody = document.getElementById('leaderboard-body');
    const emptyMsg = document.getElementById('leaderboard-empty');

    // Show loading state
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted); padding: 24px;">Loading leaderboard...</td></tr>';
    emptyMsg.classList.add('hidden');

    const leaderboard = await GameState.getLeaderboard();

    if (leaderboard.length === 0) {
      tbody.innerHTML = '';
      emptyMsg.classList.remove('hidden');
    } else {
      emptyMsg.classList.add('hidden');
      tbody.innerHTML = leaderboard.map((entry, i) => {
        // Sanitize time — cap at 24 hours
        let time = entry.time || 0;
        if (time < 0 || !isFinite(time) || time > 86400) time = 0;
        // Normalize date to DD/MM/YYYY
        let dateStr = entry.date || '';
        try {
          const d = new Date(entry.createdAt || entry.date);
          if (!isNaN(d.getTime())) {
            dateStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
          }
        } catch(e) { /* keep original */ }
        return `
          <tr class="${i < 3 ? 'rank-' + (i + 1) : ''}">
            <td>${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
            <td>${this.escapeHtml(entry.name)}</td>
            <td>${Timer.format(time)}</td>
            <td>${dateStr}</td>
          </tr>
        `;
      }).join('');
    }
  },

  hideLeaderboard() {
    document.getElementById('leaderboard-overlay').classList.add('hidden');
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
