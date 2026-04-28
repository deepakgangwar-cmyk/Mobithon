/**
 * levels.js — All 8 puzzle level renderers and validators
 * 
 * Letters earned in scrambled order: B, H, O, T, N, I, M, O
 * Final jumble answer: MOBITHON
 */

const Levels = {
  /**
   * Render a level into the #level-content container
   */
  render(levelId) {
    const container = document.getElementById('level-content');
    container.innerHTML = '';

    switch (levelId) {
      case 1: this.renderLevel1(container); break;
      case 2: this.renderLevel2(container); break;
      case 3: this.renderLevel3(container); break;
      case 4: this.renderLevel4(container); break;
      case 5: this.renderLevel5(container); break;
      case 6: this.renderLevel6(container); break;
      case 7: this.renderLevel7(container); break;
      case 8: this.renderLevel8(container); break;
    }
  },

  // ========== LEVEL 1: Riddle → earns "B" ==========
  renderLevel1(container) {
    container.innerHTML = `
      <div class="puzzle-card">
        <p class="puzzle-instruction">
          Solve this riddle to identify the object. Then, find the <strong>1st letter</strong> of the answer — 
          that's your fragment!
        </p>
        <div class="riddle-text">
          "I am a competition where minds race,<br/>
          Code and innovation set the pace.<br/>
          Teams build dreams from dusk to dawn,<br/>
          What am I? The answer carries on."
        </div>
        <div class="input-row">
          <input type="text" class="input-field" id="answer-1" placeholder="What is the answer to the riddle?" autocomplete="off" />
          <button class="btn btn-submit" onclick="Levels.checkLevel1()">Submit</button>
        </div>
        <div class="answer-feedback" id="feedback-1"></div>
        <p style="margin-top: 16px; font-size: 12px; color: var(--text-muted);">
          💡 Find the object, then extract its <strong>1st letter</strong>.
        </p>
      </div>
    `;

    document.getElementById('answer-1').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.checkLevel1();
    });
  },

  checkLevel1() {
    const input = document.getElementById('answer-1').value.trim().toUpperCase();
    const feedback = document.getElementById('feedback-1');

    if (input === 'HACKATHON' || input === 'A HACKATHON') {
      feedback.className = 'answer-feedback correct';
      feedback.textContent = '✅ Correct! HACKATHON — You earn the fragment letter "B"!';
      setTimeout(() => UI.showLevelSuccess(1, 'B'), 800);
    } else {
      feedback.className = 'answer-feedback wrong';
      feedback.textContent = '❌ That\'s not it. Think about coding events where teams build overnight...';
    }
  },

  // ========== LEVEL 2: Word Scramble → earns "H" ==========
  renderLevel2(container) {
    const scrambled = 'IPUVELR';
    container.innerHTML = `
      <div class="puzzle-card">
        <p class="puzzle-instruction">
          The letters below have been scrambled. Rearrange them to form the name of a well-known brand
          — one of our clients!
        </p>
        <div class="puzzle-display" id="scramble-display">${scrambled.split('').map(c =>
          `<span class="scramble-letter">${c}</span>`
        ).join(' ')}</div>
        <div class="input-row">
          <input type="text" class="input-field" id="answer-2" placeholder="Type the unscrambled brand name..." autocomplete="off" />
          <button class="btn btn-submit" onclick="Levels.checkLevel2()">Submit</button>
        </div>
        <div class="answer-feedback" id="feedback-2"></div>
      </div>
    `;

    document.getElementById('answer-2').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.checkLevel2();
    });
  },

  checkLevel2() {
    const input = document.getElementById('answer-2').value.trim().toUpperCase();
    const feedback = document.getElementById('feedback-2');

    if (input === 'LIVPURE' || input === 'LIV PURE') {
      feedback.className = 'answer-feedback correct';
      feedback.textContent = '✅ Correct! The brand is LIVPURE! You earn the fragment letter "H"!';
      setTimeout(() => UI.showLevelSuccess(2, 'H'), 800);
    } else {
      feedback.className = 'answer-feedback wrong';
      feedback.textContent = '❌ Not quite. Think about a brand that deals with water purifiers and wellness...';
    }
  },

  // ========== LEVEL 3: Math Cipher → earns "O" ==========
  renderLevel3(container) {
    container.innerHTML = `
      <div class="puzzle-card">
        <p class="puzzle-instruction">
          Solve the following equation. Then map the numerical answer to a letter of the alphabet 
          (A=1, B=2, C=3, ... Z=26). Enter the <strong>letter</strong> as your answer.
        </p>
        <div class="equation-cards">
          <div class="equation-card">
            <div class="eq">(7 × 3) − (2 × 3)</div>
            <div class="eq-label">Solve this equation</div>
          </div>
          <div class="equation-card">
            <div class="eq">A=1, B=2, ... Z=26</div>
            <div class="eq-label">Map to alphabet</div>
          </div>
          <div class="equation-card">
            <div class="eq">? → Letter</div>
            <div class="eq-label">Your answer</div>
          </div>
        </div>
        <div class="input-row">
          <input type="text" class="input-field" id="answer-3" placeholder="Enter the letter (e.g. A, B, C...)" maxlength="1" autocomplete="off" />
          <button class="btn btn-submit" onclick="Levels.checkLevel3()">Submit</button>
        </div>
        <div class="answer-feedback" id="feedback-3"></div>
      </div>
    `;

    document.getElementById('answer-3').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.checkLevel3();
    });
  },

  checkLevel3() {
    const input = document.getElementById('answer-3').value.trim().toUpperCase();
    const feedback = document.getElementById('feedback-3');

    // (7*3) - (2*3) = 21 - 6 = 15 → O
    if (input === 'O') {
      feedback.className = 'answer-feedback correct';
      feedback.textContent = '✅ Correct! (7×3)−(2×3) = 21−6 = 15 → O!';
      setTimeout(() => UI.showLevelSuccess(3, 'O'), 800);
    } else {
      feedback.className = 'answer-feedback wrong';
      if (input === '15') {
        feedback.textContent = '❌ Close! 15 is the number. Now map it to a letter: A=1, B=2, ... Z=26.';
      } else {
        feedback.textContent = '❌ Not quite. Solve the equation first, then convert the number to a letter.';
      }
    }
  },

  // ========== LEVEL 4: Colgate Riddle → earns "T" ==========
  renderLevel4(container) {
    container.innerHTML = `
      <div class="puzzle-card">
        <p class="puzzle-instruction">
          Solve this riddle to identify the brand. Then, find the <strong>answer</strong> — 
          that's your clue to the fragment!
        </p>
        <div class="riddle-text">
          "Split me in two:<br/>
          The first is dark like coal,<br/>
          The second protects an entry.<br/>
          I am used by you every day,<br/>
          Loyal like your daily client.<br/>
          What am I?"
        </div>
        <div class="input-row">
          <input type="text" class="input-field" id="answer-4" placeholder="What brand am I?" autocomplete="off" />
          <button class="btn btn-submit" onclick="Levels.checkLevel4()">Submit</button>
        </div>
        <div class="answer-feedback" id="feedback-4"></div>
        <p style="margin-top: 16px; font-size: 12px; color: var(--text-muted);">
          💡 Think of a well-known brand name that can be split into two meaningful words.
        </p>
      </div>
    `;

    document.getElementById('answer-4').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.checkLevel4();
    });
  },

  checkLevel4() {
    const input = document.getElementById('answer-4').value.trim().toUpperCase();
    const feedback = document.getElementById('feedback-4');

    if (input === 'COLGATE') {
      feedback.className = 'answer-feedback correct';
      feedback.textContent = '✅ Correct! COLGATE — Coal + Gate! You earn the fragment letter "T"!';
      setTimeout(() => UI.showLevelSuccess(4, 'T'), 800);
    } else {
      feedback.className = 'answer-feedback wrong';
      feedback.textContent = '❌ Not quite. Think about what "dark like coal" and "protects an entry" could mean when combined...';
    }
  },

  // ========== LEVEL 5: Memory Match → earns "N" ==========
  _memoryState: { cards: [], flipped: [], matched: [], lockBoard: false },

  renderLevel5(container) {
    // Use images from images/memory-match/ folder
    const images = [
      'images/memory-match/logo_round.png',
      'images/memory-match/logo_round_2.png',
      'images/memory-match/logo_round_3.png',
      'images/memory-match/logo_round_4.png'
    ];
    // Create pairs and shuffle
    const pairs = [...images, ...images];
    const shuffled = pairs.sort(() => Math.random() - 0.5);
    
    this._memoryState = {
      cards: shuffled,
      flipped: [],
      matched: new Array(8).fill(false),
      lockBoard: false
    };

    container.innerHTML = `
      <div class="puzzle-card">
        <p class="puzzle-instruction">
          Match all the pairs! Click cards to flip them. Find matching pairs to clear the board.
          Once all pairs are matched, the hidden letter will be revealed.
        </p>
        <div class="memory-grid" id="memory-grid">
          ${shuffled.map((img, i) => `
            <div class="memory-card" data-index="${i}" onclick="Levels.flipCard(${i})">
              <span class="card-front">?</span>
              <span class="card-back"><img src="${img}" alt="card" style="width:100%;height:100%;object-fit:contain;border-radius:8px;" /></span>
            </div>
          `).join('')}
        </div>
        <div class="answer-feedback" id="feedback-5"></div>
      </div>
    `;
  },

  flipCard(index) {
    const state = this._memoryState;
    if (state.lockBoard) return;
    if (state.matched[index]) return;
    if (state.flipped.includes(index)) return;

    const cards = document.querySelectorAll('.memory-card');
    cards[index].classList.add('flipped');
    state.flipped.push(index);

    if (state.flipped.length === 2) {
      state.lockBoard = true;
      const [a, b] = state.flipped;
      
      if (state.cards[a] === state.cards[b]) {
        // Match!
        state.matched[a] = true;
        state.matched[b] = true;
        cards[a].classList.add('matched');
        cards[b].classList.add('matched');
        state.flipped = [];
        state.lockBoard = false;

        // Check if all matched
        if (state.matched.every(m => m)) {
          const feedback = document.getElementById('feedback-5');
          feedback.className = 'answer-feedback correct';
          feedback.textContent = '✅ All pairs matched! The hidden letter is "N"!';
          setTimeout(() => UI.showLevelSuccess(5, 'N'), 1000);
        }
      } else {
        // No match
        setTimeout(() => {
          cards[a].classList.remove('flipped');
          cards[b].classList.remove('flipped');
          state.flipped = [];
          state.lockBoard = false;
        }, 800);
      }
    }
  },

  // ========== LEVEL 6: Caesar Cipher → earns "I" ==========
  renderLevel6(container) {
    const encrypted = 'LTIWJO';
    container.innerHTML = `
      <div class="puzzle-card">
        <p class="puzzle-instruction">
          The word below has been encrypted using a <strong>Caesar Cipher</strong> with a shift of <strong>5</strong>. 
          Shift each letter <strong>backward</strong> by 5 positions to decrypt it. Then enter the decrypted word.
        </p>
        <p class="puzzle-instruction" style="font-size: 14px; text-align: center; color: var(--accent-cyan);">
          If <strong>UMNQNUX → PHILIPS</strong>,
          then what is 
        </p>
        <div class="cipher-display">${encrypted}</div>
        <div class="input-row">
          <input type="text" class="input-field" id="answer-6" placeholder="Enter the full decrypted word" autocomplete="off" />
          <button class="btn btn-submit" onclick="Levels.checkLevel6()">Submit</button>
        </div>
        <div class="answer-feedback" id="feedback-6"></div>
      </div>
    `;

    document.getElementById('answer-6').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.checkLevel6();
    });
  },

  checkLevel6() {
    const input = document.getElementById('answer-6').value.trim().toUpperCase();
    const feedback = document.getElementById('feedback-6');

    if (input === 'GODREJ') {
      feedback.className = 'answer-feedback correct';
      feedback.textContent = '✅ Correct! LTIWJO → GODREJ! You earn the fragment letter "I"!';
      setTimeout(() => UI.showLevelSuccess(6, 'I'), 800);
    } else {
      feedback.className = 'answer-feedback wrong';
      feedback.textContent = '❌ Not quite. Shift each letter back by 5: L→G, T→O, I→D, W→R, J→E, O→J.';
    }
  },

  // ========== LEVEL 7: Environment Day Puzzle → earns "M" ==========
  renderLevel7(container) {
    container.innerHTML = `
      <div class="puzzle-card">
        <p class="puzzle-instruction">
          Study the pattern of global environmental days below. One date is missing — can you figure it out?
        </p>
        <div class="env-days-grid">
          <div class="env-day-card">
            <span class="env-day-icon">🌍</span>
            <span class="env-day-name">Earth Day</span>
            <span class="env-day-date">22nd April</span>
          </div>
          <div class="env-day-card">
            <span class="env-day-icon">🦋</span>
            <span class="env-day-name">Biodiversity Day</span>
            <span class="env-day-date">22nd May</span>
          </div>
          <div class="env-day-card env-day-mystery">
            <span class="env-day-icon">🌿</span>
            <span class="env-day-name">Environment Day</span>
            <span class="env-day-date">???</span>
          </div>
        </div>
        <p class="puzzle-instruction" style="font-size: 13px; margin-top: 16px;">
          When is <strong>World Environment Day</strong> celebrated? Enter the date .
        </p>
        <div class="input-row">
          <input type="text" class="input-field" id="answer-7" placeholder="Enter the date " autocomplete="off" />
          <button class="btn btn-submit" onclick="Levels.checkLevel7()">Submit</button>
        </div>
        <div class="answer-feedback" id="feedback-7"></div>
      </div>
    `;

    document.getElementById('answer-7').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.checkLevel7();
    });
  },

  checkLevel7() {
    const input = document.getElementById('answer-7').value.trim().toLowerCase().replace(/\s+/g, ' ');
    const feedback = document.getElementById('feedback-7');

    // Accept various formats: "5th june", "5 june", "june 5", "june 5th", "5th jun", "5 jun"
    const valid = [
      '5th june', '5 june', 'june 5', 'june 5th',
      '5th jun', '5 jun', 'jun 5', 'jun 5th',
      '5th of june', '5 of june',
      '05th june', '05 june', 'june 05', 'june 05th',
      '05th jun', '05 jun', 'jun 05', 'jun 05th',
      '05th of june', '05 of june',
      '05 june', '05/06', '05.06',
      'Date of Mobithon', 'Mbithon Date'
    ];

    if (valid.includes(input)) {
      feedback.className = 'answer-feedback correct';
      feedback.textContent = '✅ Correct! World Environment Day is celebrated on 5th June! You earn the fragment letter "M"!';
      setTimeout(() => UI.showLevelSuccess(7, 'M'), 800);
    } else {
      feedback.className = 'answer-feedback wrong';
      feedback.textContent = '❌ Not quite. Think about the most well-known global day for nature and the environment...';
    }
  },

  // ========== LEVEL 8: Jigsaw Puzzle → earns "O" ==========
  _jigsawState: { pieces: [], solved: 0, total: 12, draggedIdx: null },

  renderLevel8(container) {
    const ROWS = 4;
    const COLS = 3;
    const TOTAL = ROWS * COLS;

    // Create pieces array [0..11] and shuffle
    const shuffled = Array.from({ length: TOTAL }, (_, i) => i);
    do {
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    } while (shuffled.every((v, i) => v === i));

    this._jigsawState = {
      pieces: shuffled,
      total: TOTAL,
      rows: ROWS,
      cols: COLS,
      draggedIdx: null
    };

    container.innerHTML = `
      <div class="puzzle-card">
        <p class="puzzle-instruction">
          The homepage of <strong>JKOne Connect</strong> has been scrambled into ${TOTAL} pieces!
          <strong>Drag and drop</strong> pieces to swap them and reassemble the original screenshot.
        </p>
        <div class="jigsaw-progress">
          <span id="jigsaw-count">0</span> / ${TOTAL} pieces correct
        </div>
        <div class="jigsaw-grid" id="jigsaw-grid">
            ${this._jigsawBuildPieces(shuffled, ROWS, COLS)}
          </div>
        <div class="answer-feedback" id="feedback-8"></div>
      </div>
    `;

    this._jigsawUpdateCount();
  },

  _jigsawBuildPieces(pieces, rows, cols) {
    return pieces.map((pieceIdx, slotIdx) => {
      const pieceRow = Math.floor(pieceIdx / cols);
      const pieceCol = pieceIdx % cols;
      const bgX = cols > 1 ? (pieceCol / (cols - 1)) * 100 : 0;
      const bgY = rows > 1 ? (pieceRow / (rows - 1)) * 100 : 0;
      const isCorrect = pieceIdx === slotIdx;
      return `
        <div class="jigsaw-slot" data-slot="${slotIdx}"
             ondragover="event.preventDefault(); this.classList.add('jigsaw-over')"
             ondragleave="this.classList.remove('jigsaw-over')"
             ondrop="Levels.jigsawDrop(event, ${slotIdx})">
          <div class="jigsaw-piece ${isCorrect ? 'jigsaw-correct' : ''}"
               draggable="true"
               data-piece="${pieceIdx}"
               ondragstart="Levels.jigsawDragStart(event, ${slotIdx})"
               style="background-image: url('images/jkone-homepage.png'); background-size: ${cols * 100}% ${rows * 100}%; background-position: ${bgX}% ${bgY}%;">
          </div>
        </div>
      `;
    }).join('');
  },

  jigsawDragStart(e, slotIdx) {
    this._jigsawState.draggedIdx = slotIdx;
    e.dataTransfer.effectAllowed = 'move';
  },

  jigsawDrop(e, targetSlotIdx) {
    e.preventDefault();
    const state = this._jigsawState;
    const sourceSlotIdx = state.draggedIdx;
    if (sourceSlotIdx === null || sourceSlotIdx === targetSlotIdx) return;

    // Swap
    [state.pieces[sourceSlotIdx], state.pieces[targetSlotIdx]] =
      [state.pieces[targetSlotIdx], state.pieces[sourceSlotIdx]];

    // Re-render
    const grid = document.getElementById('jigsaw-grid');
    grid.innerHTML = this._jigsawBuildPieces(state.pieces, state.rows, state.cols);
    this._jigsawUpdateCount();

    // Check solved
    if (state.pieces.every((p, i) => p === i)) {
      const feedback = document.getElementById('feedback-8');
      feedback.className = 'answer-feedback correct';
      feedback.textContent = '✅ You reassembled the JKOne Connect homepage! You earn the fragment letter "O"!';
      setTimeout(() => UI.showLevelSuccess(8, 'O'), 1000);
    }

    state.draggedIdx = null;
  },

  _jigsawUpdateCount() {
    const state = this._jigsawState;
    const correct = state.pieces.filter((p, i) => p === i).length;
    const el = document.getElementById('jigsaw-count');
    if (el) el.textContent = correct;
  },

  checkLevel8() {}
};
