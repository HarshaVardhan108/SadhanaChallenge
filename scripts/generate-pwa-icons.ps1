Add-Type -AssemblyName System.Drawing

function Save-Icon([int]$s, [string]$relPath) {
  $bmp = New-Object System.Drawing.Bitmap $s, $s
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = "AntiAlias"
  $g.TextRenderingHint = "AntiAliasGridFit"
  $g.Clear([System.Drawing.Color]::FromArgb(255, 26, 79, 163))

  $gold = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 213, 79))
  $m = [int]($s * 0.1)
  $g.FillEllipse($gold, $m, $m, ($s - 2 * $m), ($s - 2 * $m))

  $inner = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 26, 79, 163))
  $m2 = [int]($s * 0.22)
  $g.FillEllipse($inner, $m2, $m2, ($s - 2 * $m2), ($s - 2 * $m2))

  $fontSize = [float]($s * 0.38)
  $font = New-Object System.Drawing.Font "Arial", $fontSize, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $y = [float]($s * 0.02)
  $rect = New-Object System.Drawing.RectangleF 0, $y, $s, $s
  $g.DrawString("B", $font, $gold, $rect, $sf)

  $full = Join-Path (Get-Location) $relPath
  $dir = Split-Path $full -Parent
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
  $bmp.Save($full, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  $font.Dispose()
  Write-Output "ok $relPath ($((Get-Item $full).Length) bytes)"
}

Save-Icon 192 "public\icons\icon-192.png"
Save-Icon 512 "public\icons\icon-512.png"
Save-Icon 180 "public\icons\apple-touch-icon.png"
