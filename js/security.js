/**
 * security.js — Clean security measures without annoying messages
 */

// Disable right-click context menu
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
  return false;
});

// Disable common developer shortcuts
document.addEventListener('keydown', function(e) {
  // F12
  if (e.key === 'F12') {
    e.preventDefault();
    return false;
  }
  
  // Ctrl+Shift+I/J/C/K (DevTools)
  if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'K'].includes(e.key)) {
    e.preventDefault();
    return false;
  }
  
  // Ctrl+U (View Source)
  if (e.ctrlKey && e.key === 'U') {
    e.preventDefault();
    return false;
  }
  
  // Cmd+Option+I/J/C/K (Mac DevTools)
  if (e.metaKey && e.altKey && ['I', 'J', 'C', 'K'].includes(e.key)) {
    e.preventDefault();
    return false;
  }
  
  // Cmd+U (Mac View Source)
  if (e.metaKey && e.key === 'U') {
    e.preventDefault();
    return false;
  }
});

// Silent debugger detection - only pause if devtools are actually open
let devtools = {
  open: false,
  orientation: null
};

const threshold = 160;

setInterval(function() {
  if (window.outerHeight - window.innerHeight > threshold || 
      window.outerWidth - window.innerWidth > threshold) {
    if (!devtools.open) {
      devtools.open = true;
      // Only pause execution with debugger, no visible messages
      debugger;
    }
  } else {
    devtools.open = false;
  }
}, 500);

// Disable console methods silently
if (typeof console !== 'undefined') {
  console.log = function() {};
  console.warn = function() {};
  console.error = function() {};
  console.info = function() {};
  console.debug = function() {};
  console.trace = function() {};
  console.table = function() {};
}