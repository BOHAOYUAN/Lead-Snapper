const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, 'dist');
const DIST_EXT_DIR = path.join(DIST_DIR, 'LeadSniper');
const OUTPUT_ZIP = path.join(__dirname, 'LeadSniper_Secure.zip');

console.log('🚀 Starting secure build for LeadSniper...');

// 1. Clean previous build
if (fs.existsSync(DIST_DIR)) {
  console.log('🧹 Cleaning existing dist directory...');
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR);
fs.mkdirSync(DIST_EXT_DIR);

if (fs.existsSync(OUTPUT_ZIP)) {
  console.log('🧹 Cleaning old ZIP archive...');
  fs.unlinkSync(OUTPUT_ZIP);
}

// 2. Copy instruction guide directly to root of dist/
const GUIDE_SRC = path.join(__dirname, 'How-to-Install.html');
const GUIDE_DEST = path.join(DIST_DIR, 'How-to-Install.html');
if (fs.existsSync(GUIDE_SRC)) {
  fs.copyFileSync(GUIDE_SRC, GUIDE_DEST);
  console.log('   - Copied How-to-Install.html to root');
} else {
  console.warn('   ⚠️ Missing How-to-Install.html');
}

// 3. Files to copy directly (assets, layouts, manifests) into LeadSniper/ folder
const FILES_TO_COPY = [
  'manifest.json',
  'popup.html',
  'sidepanel.html',
  'content.css',
  'three.min.js',
  'icon16.png',
  'icon48.png',
  'icon128.png'
];

console.log('📁 Copying extension assets into LeadSniper/ folder...');
FILES_TO_COPY.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(DIST_EXT_DIR, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`   - Copied ${file}`);
  } else {
    console.warn(`   ⚠️ File missing: ${file}`);
  }
});

// 4. Files to obfuscate (core logic) into LeadSniper/ folder
const FILES_TO_OBFUSCATE = [
  'background.js',
  'content.js',
  'sidepanel.js',
  'popup.js'
];

console.log('🔒 Obfuscating core Javascript files into LeadSniper/ folder...');
FILES_TO_OBFUSCATE.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(DIST_EXT_DIR, file);
  
  if (!fs.existsSync(src)) {
    console.warn(`   ⚠️ File missing: ${file}`);
    return;
  }

  console.log(`   - Obfuscating ${file}...`);
  const command = `npx --yes javascript-obfuscator "${src}" --output "${dest}" --compact true --control-flow-flattening true --control-flow-flattening-threshold 0.6 --numbers-to-expressions true --simplify true --string-array true --string-array-encoding base64 --string-array-threshold 0.75`;
  
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (err) {
    console.error(`❌ Failed to obfuscate ${file}:`, err.message);
    process.exit(1);
  }
});

// 5. Zip the dist folder using PowerShell (native to Windows)
console.log('📦 Compressing files into LeadSniper_Secure.zip...');
try {
  const psCommand = `powershell -Command "Compress-Archive -Path '${DIST_DIR}\\*' -DestinationPath '${OUTPUT_ZIP}' -Force"`;
  execSync(psCommand, { stdio: 'inherit' });
  console.log('✅ LeadSniper_Secure.zip created successfully!');
} catch (err) {
  console.error('❌ Compression failed:', err.message);
  process.exit(1);
}

console.log('\n🎉 Secure build completed! Upload LeadSniper_Secure.zip to Lemon Squeezy.');
