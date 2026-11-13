Add-Type -AssemblyName System.Drawing
$dest = Join-Path $PSScriptRoot '../assets/enemies/e7_shield'
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$source = Join-Path $PSScriptRoot '../E7'
Copy-Item -LiteralPath (Join-Path $source 'idle.png') -Destination (Join-Path $dest 'idle.png')
Copy-Item -LiteralPath (Join-Path $source 'pixel-art-walk (1).png') -Destination (Join-Path $dest 'walk.png')
Copy-Item -LiteralPath (Join-Path $source 'idle_to_guard.png') -Destination (Join-Path $dest 'idle_to_guard.png')
# Remove the one-pixel vertical export jitter; do not rescale these sheets.
foreach ($sheet in @(@('walk.png',160,8,122),@('idle_to_guard.png',150,6,116))) {
    $sheetPath = Join-Path $dest $sheet[0]
    $sheetImage = [System.Drawing.Bitmap]::FromFile($sheetPath)
    $aligned = New-Object System.Drawing.Bitmap $sheetImage.Width,$sheetImage.Height
    $drawing = [System.Drawing.Graphics]::FromImage($aligned)
    for ($frame=0; $frame -lt $sheet[2]; $frame++) {
        $bottom = -1
        for ($py=0; $py -lt $sheetImage.Height; $py++) {
            for ($px=0; $px -lt 160; $px++) {
                if ($sheetImage.GetPixel($frame*160+$px,$py).A -gt 0) { $bottom=$py }
            }
        }
        $cell = $sheetImage.Clone([System.Drawing.Rectangle]::new($frame*160,0,160,$sheetImage.Height),$sheetImage.PixelFormat)
        $drawing.DrawImageUnscaled($cell,$frame*160,$sheet[3]-1-$bottom)
        $cell.Dispose()
    }
    $drawing.Dispose(); $sheetImage.Dispose()
    $aligned.Save($sheetPath,[System.Drawing.Imaging.ImageFormat]::Png); $aligned.Dispose()
}
# The supplied guard is the final transition pose at twice its native size.
# Fit it back into that pose's canvas without stretching or changing anatomy.
$inputImage = [System.Drawing.Bitmap]::FromFile((Join-Path $source 'defesa.png'))
if ($inputImage.Width -ne 160 -or $inputImage.Height -ne 150) { throw 'Unexpected guard dimensions' }
$outputImage = New-Object System.Drawing.Bitmap 160,150
$graphics = [System.Drawing.Graphics]::FromImage($outputImage)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$graphics.DrawImage($inputImage, [System.Drawing.Rectangle]::new(39,41,80,75), 0,0,160,150,[System.Drawing.GraphicsUnit]::Pixel)
$outputImage.Save((Join-Path $dest 'guard.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose(); $inputImage.Dispose(); $outputImage.Dispose()
