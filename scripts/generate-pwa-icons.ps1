# Resize lotus-source.jpg into PWA / favicon sizes.
# Source: public/icons/lotus-source.jpg (pink lotus on Krishna blue)

Add-Type -AssemblyName System.Drawing

$sourceRel = "public\icons\lotus-source.jpg"
if (-not (Test-Path $sourceRel)) {
  Write-Error "Missing $sourceRel — place the lotus artwork there first."
  exit 1
}

function Save-Sized([string]$inPath, [int]$s, [string]$outPath) {
  $srcImg = [System.Drawing.Image]::FromFile((Resolve-Path $inPath))
  $bmp = New-Object System.Drawing.Bitmap $s, $s
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = "HighQualityBicubic"
  $g.SmoothingMode = "HighQuality"
  $g.PixelOffsetMode = "HighQuality"
  $g.CompositingQuality = "HighQuality"
  $g.Clear([System.Drawing.Color]::FromArgb(255, 26, 79, 163))
  $g.DrawImage($srcImg, 0, 0, $s, $s)

  $full = Join-Path (Get-Location) $outPath
  $dir = Split-Path $full -Parent
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
  $bmp.Save($full, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  $srcImg.Dispose()
  Write-Output "ok $outPath ($((Get-Item $full).Length) bytes)"
}

Save-Sized $sourceRel 32 "public\icons\favicon-32.png"
Save-Sized $sourceRel 48 "public\icons\icon-48.png"
Save-Sized $sourceRel 180 "public\icons\apple-touch-icon.png"
Save-Sized $sourceRel 192 "public\icons\icon-192.png"
Save-Sized $sourceRel 512 "public\icons\icon-512.png"

# Next.js App Router static metadata icons
Copy-Item "public\icons\icon-192.png" "src\app\icon.png" -Force
Copy-Item "public\icons\apple-touch-icon.png" "src\app\apple-icon.png" -Force
Copy-Item "public\icons\favicon-32.png" "public\favicon.ico" -Force
Write-Output "ok src/app/icon.png, src/app/apple-icon.png, public/favicon.ico"
