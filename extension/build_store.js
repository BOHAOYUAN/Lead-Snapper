const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_STORE_DIR = path.join(__dirname, 'dist_store');
const OUTPUT_ZIP = path.join(__dirname, 'LeadSniper_Store.zip');

console.log('🚀 Starting clean store build for LeadSniper (No Obfuscation)...');

// 1. Clean previous build
if (fs.existsSync(DIST_STORE_DIR)) {
  console.log('🧹 Cleaning existing dist_store directory...');
  fs.rmSync(DIST_STORE_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_STORE_DIR);

if (fs.existsSync(OUTPUT_ZIP)) {
  console.log('🧹 Cleaning old ZIP archive...');
  fs.unlinkSync(OUTPUT_ZIP);
}

// 2. Files to copy directly (all files are copied raw for store review compatibility)
const FILES_TO_COPY = [
  'manifest.json',
  'popup.html',
  'sidepanel.html',
  'content.css',
  'three.min.js',
  'background.js',
  'content.js',
  'sidepanel.js',
  'popup.js',
  'icon16.png',
  'icon48.png',
  'icon128.png'
];

console.log('📁 Copying clean source files...');
FILES_TO_COPY.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(DIST_STORE_DIR, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`   - Copied ${file}`);
  } else {
    console.warn(`   ⚠️ File missing: ${file}`);
  }
});

// 3. Zip the dist_store folder using PowerShell (native to Windows)
console.log('📦 Compressing files into LeadSniper_Store.zip...');
try {
  const psCommand = `powershell -Command "Compress-Archive -Path '${DIST_STORE_DIR}\\*' -DestinationPath '${OUTPUT_ZIP}' -Force"`;
  execSync(psCommand, { stdio: 'inherit' });
  console.log('✅ LeadSniper_Store.zip created successfully!');
} catch (err) {
  console.error('❌ Compression failed:', err.message);
  process.exit(1);
}

console.log('\n🎉 Store build completed! Upload LeadSniper_Store.zip to Microsoft Partner Center / Chrome Web Store.');
