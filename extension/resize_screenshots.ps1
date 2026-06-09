Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param(
        [string]$sourcePath,
        [string]$destPath,
        [int]$width,
        [int]$height
    )
    
    $srcImg = [System.Drawing.Image]::FromFile($sourcePath)
    $destBmp = New-Object System.Drawing.Bitmap $width, $height
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    
    # Configure high quality resizing
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Stretch to fill the exact dimensions of 1280x800 (recommended for store screenshots to avoid cropping UI)
    $g.DrawImage($srcImg, 0, 0, $width, $height)
    
    # Save the file as PNG
    $destBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Clean up
    $g.Dispose()
    $destBmp.Dispose()
    $srcImg.Dispose()
}

$srcDir = "D:\360安全浏览器下载\UPWORK\项目一\图片"
$destDir = Join-Path $srcDir "resized_1280x800"

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
}

$files = Get-ChildItem -Path $srcDir -Filter *.png
$count = 1
foreach ($file in $files) {
    $destName = "screenshot_$count.png"
    $destPath = Join-Path $destDir $destName
    Write-Output "Resizing $($file.Name) -> $destName..."
    Resize-Image $file.FullName $destPath 1280 800
    $count++
}

Write-Output "✅ Resizing complete!"
Write-Output "📁 Resized screenshots saved at: $destDir"
