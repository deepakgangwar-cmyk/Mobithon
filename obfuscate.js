const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// Configuration for obfuscation
const obfuscationOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: true,
  debugProtectionInterval: 2000,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  rotateStringArray: true,
  selfDefending: true,
  shuffleStringArray: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

// List of JS files to obfuscate
const jsFiles = [
  'js/security.js',
  'js/auth.js',
  'js/gameState.js',
  'js/timer.js',
  'js/levels.js',
  'js/ui.js',
  'js/confetti.js',
  'js/app.js'
];

// Create obfuscated directory
const obfuscatedDir = 'js/obfuscated';
if (!fs.existsSync(obfuscatedDir)) {
  fs.mkdirSync(obfuscatedDir, { recursive: true });
}

console.log('🔒 Starting JavaScript obfuscation...');

jsFiles.forEach(filePath => {
  try {
    // Read the original file
    const sourceCode = fs.readFileSync(filePath, 'utf8');
    
    // Obfuscate the code
    const obfuscationResult = JavaScriptObfuscator.obfuscate(sourceCode, obfuscationOptions);
    
    // Write obfuscated code to new file
    const fileName = path.basename(filePath);
    const obfuscatedPath = path.join(obfuscatedDir, fileName);
    fs.writeFileSync(obfuscatedPath, obfuscationResult.getObfuscatedCode());
    
    console.log(`✅ Obfuscated: ${filePath} -> ${obfuscatedPath}`);
  } catch (error) {
    console.error(`❌ Error obfuscating ${filePath}:`, error.message);
  }
});

console.log('🎉 Obfuscation complete!');
console.log('📝 Remember to update HTML file to use obfuscated files');