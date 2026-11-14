# Rebuild runtime sheets from the untouched supplied ZIP; no generated character art.
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root = Split-Path $PSScriptRoot -Parent
$zip = [IO.Compression.ZipFile]::OpenRead((Join-Path $root 'Kael_Animacoes_Novas_Para_Jogo.zip'))
$dest = Join-Path $root 'assets/characters/protagonist/kael/spritesheets'
# Explicit pose crops exclude export debris beneath/between the supplied poses.
$poses = @{
 jump = @(@(45,330,395,234),@(470,270,370,294),@(900,200,360,315),@(1310,155,380,282))
 dash = @(@(10,238,300,238),@(320,285,270,191),@(595,270,280,206),@(890,300,285,176),@(1210,310,345,166),@(1570,270,270,206),@(1855,255,290,221))
 damage = @(@(30,225,420,339),@(470,220,390,344),@(875,220,395,344),@(1310,250,390,314),@(1730,245,415,319))
 death = @(@(0,200,280,290),@(280,200,245,290),@(525,200,225,290),@(750,280,250,210),@(1000,310,280,190),@(1280,370,320,130),@(1600,385,275,115),@(1875,390,297,110))
}
# The supplied fall includes floor collapse poses: only its first three airborne poses are used.
$poses.fall = @($poses.death[0],$poses.death[1],$poses.death[2],$poses.death[2],$poses.death[1],$poses.death[0],$poses.death[1],$poses.death[2])
$scales = @{jump=.22;dash=.30;damage=.215;death=.325;fall=.325}
try {
 foreach ($name in @('jump','fall','dash','damage','death')) {
  $entry=$zip.GetEntry("Kael_Animacoes_Novas_Para_Jogo/$name.png")
  $stream=$entry.Open();$source=[Drawing.Bitmap]::new($stream)
  $cells=$poses[$name];$output=[Drawing.Bitmap]::new((145*$cells.Count),114)
  $g=[Drawing.Graphics]::FromImage($output)
  $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
  for($i=0;$i -lt $cells.Count;$i++) {
   $r=$cells[$i];$w=[int][Math]::Round($r[2]*$scales[$name]);$h=[int][Math]::Round($r[3]*$scales[$name])
   $target=[Drawing.Rectangle]::new(($i*145+[int][Math]::Round((145-$w)/2)),(95-$h),$w,$h)
   $g.DrawImage($source,$target,$r[0],$r[1],$r[2],$r[3],[Drawing.GraphicsUnit]::Pixel)
  }
  $g.Dispose();$source.Dispose();$stream.Dispose()
  $output.Save((Join-Path $dest "$name.png"),[Drawing.Imaging.ImageFormat]::Png);$output.Dispose()
 }
} finally {$zip.Dispose()}
