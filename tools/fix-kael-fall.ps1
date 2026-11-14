# Use the approved final jump pose as a stable airborne fall, without repainting Kael.
Add-Type -AssemblyName System.Drawing
$sprites = Join-Path (Split-Path $PSScriptRoot -Parent) 'assets/characters/protagonist/kael/spritesheets'
$source = [Drawing.Bitmap]::FromFile((Join-Path $sprites 'jump.png'))
$output = [Drawing.Bitmap]::new(1160,114)
for ($y=0; $y -lt 114; $y++) {
 for ($x=0; $x -lt 145; $x++) {
  $color=$source.GetPixel((435+$x),$y)
  for ($frame=0; $frame -lt 8; $frame++) {$output.SetPixel(($frame*145+$x),$y,$color)}
 }
}
$source.Dispose()
$output.Save((Join-Path $sprites 'fall.png'),[Drawing.Imaging.ImageFormat]::Png);$output.Dispose()
