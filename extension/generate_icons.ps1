Add-Type -AssemblyName System.Drawing

function Create-Icon {
    param($size, $path)
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Enable high quality drawing
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    # 1. Fill background
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 10, 10, 15)) # #0a0a0f
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)
    
    # 2. Draw a target lock circle (neon red)
    $redPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 255, 46, 76)), ($size * 0.05)
    $margin = $size * 0.15
    $diameter = $size - (2 * $margin)
    $g.DrawEllipse($redPen, $margin, $margin, $diameter, $diameter)
    
    # 3. Draw crosshair lines
    $cyanPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 0, 229, 255)), ($size * 0.04)
    $center = $size / 2
    $lineLen = $size * 0.12
    # top
    $g.DrawLine($cyanPen, $center, $margin, $center, ($margin + $lineLen))
    # bottom
    $g.DrawLine($cyanPen, $center, ($size - $margin), $center, ($size - $margin - $lineLen))
    # left
    $g.DrawLine($cyanPen, $margin, $center, ($margin + $lineLen), $center)
    # right
    $g.DrawLine($cyanPen, ($size - $margin), $center, ($size - $margin - $lineLen), $center)
    
    # 4. Draw central dot (neon green)
    $greenBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 255, 157))
    $dotSize = $size * 0.1
    $g.FillEllipse($greenBrush, ($center - $dotSize/2), ($center - $dotSize/2), $dotSize, $dotSize)
    
    # Save and clean up
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bgBrush.Dispose()
    $redPen.Dispose()
    $cyanPen.Dispose()
    $greenBrush.Dispose()
    $g.Dispose()
    $bmp.Dispose()
}

Create-Icon 16 "e:\project\LeadSniper\icon16.png"
Create-Icon 48 "e:\project\LeadSniper\icon48.png"
Create-Icon 128 "e:\project\LeadSniper\icon128.png"

Write-Output "✅ Icons generated successfully at e:\project\LeadSniper\"
