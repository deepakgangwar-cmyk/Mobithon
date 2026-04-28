/**
 * timer.js — Global timer that persists across page refreshes
 */

const Timer = {
  _interval: null,
  _startTime: null,
  _elapsed: 0, // in seconds
  _running: false,
  _display: null,

  init() {
    this._display = document.getElementById('timer-display');
    // Restore from game state, cap at 24 hours to prevent corrupted values
    let elapsed = GameState.state.timerElapsed || 0;
    if (elapsed < 0 || !isFinite(elapsed) || elapsed > 86400) elapsed = 0;
    this._elapsed = elapsed;
    this._running = false;
    this.render();
  },

  start() {
    if (this._running) return;
    this._running = true;
    this._startTime = Date.now() - (this._elapsed * 1000);
    GameState.setTimerStarted();

    this._interval = setInterval(() => {
      this._elapsed = Math.floor((Date.now() - this._startTime) / 1000);
      this.render();
      // Save every 5 seconds
      if (this._elapsed % 5 === 0) {
        GameState.updateTimerElapsed(this._elapsed);
      }
    }, 1000);
  },

  stop() {
    if (!this._running) return;
    this._running = false;
    clearInterval(this._interval);
    GameState.updateTimerElapsed(this._elapsed);
  },

  addPenalty(seconds) {
    this._elapsed += seconds;
    if (this._startTime) {
      this._startTime -= seconds * 1000;
    }
    this.render();
    GameState.updateTimerElapsed(this._elapsed);
  },

  getElapsed() {
    return this._elapsed;
  },

  format(totalSeconds) {
    if (totalSeconds < 0 || !isFinite(totalSeconds) || totalSeconds > 86400) totalSeconds = 0; // Cap at 24 hours
    totalSeconds = Math.floor(totalSeconds);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  render() {
    if (this._display) {
      this._display.textContent = this.format(this._elapsed);
    }
  },

  reset() {
    this.stop();
    this._elapsed = 0;
    this._startTime = null;
    this.render();
  }
};
