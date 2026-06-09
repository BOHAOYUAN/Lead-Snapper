Add-Type -AssemblyName System.Drawing

# Helper function to resize image to exact dimensions with high quality
function Resize-Image {
    param(
        [string]$sourcePath,
        [string]$destPath,
        [int]$width,
        [int]$height,
        [string]$mode = "stretch" # "stretch", "pad", or "crop"
    )
    
    $srcImg = [System.Drawing.Image]::FromFile($sourcePath)
    $destBmp = New-Object System.Drawing.Bitmap $width, $height
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    
    # Configure high quality resizing
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    if ($mode -eq "stretch") {
        # Simple stretch to fill the dimensions
        $g.DrawImage($srcImg, 0, 0, $width, $height)
    }
    elseif ($mode -eq "pad") {
        # Fill background with top-left pixel color of source image to blend perfectly
        $bgColor = $srcImg.GetPixel(0, 0)
        $bgBrush = New-Object System.Drawing.SolidBrush $bgColor
        $g.FillRectangle($bgBrush, 0, 0, $width, $height)
        
        # Scale image to fit height, and place it
        $scale = $height / $srcImg.Height
        $newWidth = [int]($srcImg.Width * $scale)
        # Center or align left. Since it's a promo tile, let's draw it from the left
        $g.DrawImage($srcImg, 0, 0, $newWidth, $height)
        
        $bgBrush.Dispose()
    }
    elseif ($mode -eq "crop") {
        # Crop from center
        $srcRatio = $srcImg.Width / $srcImg.Height
        $destRatio = $width / $height
        
        $srcWidth = $srcImg.Width
        $srcHeight = $srcImg.Height
        $srcX = 0
        $srcY = 0
        
        if ($srcRatio -gt $destRatio) {
            # Source is wider than destination ratio
            $srcWidth = [int]($srcImg.Height * $destRatio)
            $srcX = [int](($srcImg.Width - $srcWidth) / 2)
        } else {
            # Source is taller than destination ratio
            $srcHeight = [int]($srcImg.Width / $destRatio)
            $srcY = [int](($srcImg.Height - $srcHeight) / 2)
        }
        
        $g.DrawImage(
            $srcImg, 
            [System.Drawing.Rectangle]::new(0, 0, $width, $height), 
            [System.Drawing.Rectangle]::new($srcX, $srcY, $srcWidth, $srcHeight), 
            [System.Drawing.GraphicsUnit]::Pixel
        )
    }
    
    # Save the file
    $destBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Clean up
    $g.Dispose()
    $destBmp.Dispose()
    $srcImg.Dispose()
}

# 1. Resize Logo to EXACTLY 300x300 (Microsoft Edge recommended format)
Resize-Image "e:\project\LeadSniper\leadsniper_logo.png" "e:\project\LeadSniper\leadsniper_logo_300.png" 300 300 "stretch"

# 2. Resize Small Promo Tile to EXACTLY 440x280 (Microsoft Edge STRICT requirement)
Resize-Image "e:\project\LeadSniper\leadsniper_promo_tile.png" "e:\project\LeadSniper\leadsniper_promo_tile_440.png" 440 280 "crop"

# 3. Resize Large Promo Tile to EXACTLY 1400x560 (Microsoft Edge STRICT requirement)
Resize-Image "e:\project\LeadSniper\leadsniper_large_promo_tile.png" "e:\project\LeadSniper\leadsniper_large_promo_tile_1400.png" 1400 560 "crop"

Write-Output "✅ Images successfully resized to exact Microsoft Partner Center dimensions!"
Write-Output "   - Logo (300x300): e:\project\LeadSniper\leadsniper_logo_300.png"
Write-Output "   - Small Tile (440x280): e:\project\LeadSniper\leadsniper_promo_tile_440.png"
Write-Output "   - Large Tile (1400x560): e:\project\LeadSniper\leadsniper_large_promo_tile_1400.png"
