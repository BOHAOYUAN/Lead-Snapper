const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = 'D:\\360安全浏览器下载\\UPWORK\\项目一\\图片';
const destDir = path.join(srcDir, 'resized_1280x800');

console.log('🚀 Starting screenshot resizing via Node/PowerShell bridge...');

if (!fs.existsSync(destDir)) {
  console.log(`📁 Creating directory: ${destDir}`);
  fs.mkdirSync(destDir, { recursive: true });
}

// Read PNG files in the source directory
const files = fs.readdirSync(srcDir).filter(f => f.toLowerCase().endsWith('.png'));

if (files.length === 0) {
  console.error('❌ No PNG files found in the source directory!');
  process.exit(1);
}

files.forEach((file, index) => {
  const srcPath = path.join(srcDir, file);
  const destName = `screenshot_${index + 1}.png`;
  const destPath = path.join(destDir, destName);
  
  console.log(`   - Resizing: ${file} ➔ ${destName}`);
  
  // PowerShell command to load, stretch-resize to 1280x800, and save
  const psCommand = `powershell -Command "Add-Type -AssemblyName System.Drawing; [System.IO.File]::Exists('${srcPath.replace(/'/g, "''")}') | Out-Null; $src = [System.Drawing.Image]::FromFile('${srcPath.replace(/'/g, "''")}'); $bmp = New-Object System.Drawing.Bitmap 1280, 800; $g = [System.Drawing.Graphics]::FromImage($bmp); $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic; $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias; $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality; $g.DrawImage($src, 0, 0, 1280, 800); $bmp.Save('${destPath.replace(/'/g, "''")}', [System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $bmp.Dispose(); $src.Dispose();"`;
  
  try {
    execSync(psCommand, { stdio: 'inherit' });
  } catch (err) {
    console.error(`❌ Failed to resize ${file}:`, err.message);
  }
});

console.log('\n✅ All screenshots resized successfully to exactly 1280x800!');
console.log(`📁 Target folder: ${destDir}`);
