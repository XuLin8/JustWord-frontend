# scripts/generate-icons.ps1
# JustWord PWA 应用图标生成（品牌紫渐变 + 白色 J 字标）
# 用法: powershell -ExecutionPolicy Bypass -File scripts/generate-icons.ps1
param(
  [string]$OutDir = "public/icons"
)

Add-Type -AssemblyName System.Drawing

function New-RoundedRectPath {
  param([float]$x, [float]$y, [float]$w, [float]$h, [float]$r)
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-JustWordIcon {
  param(
    [int]$Size,
    [bool]$Rounded,
    [float]$CornerRatio,
    [float]$LetterRatio,
    [string]$OutPath
  )
  $bmp = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $cTop = [System.Drawing.Color]::FromArgb(255, 134, 59, 255)   # #863bff
  $cBottom = [System.Drawing.Color]::FromArgb(255, 91, 13, 204) # #5b0dcc
  $rect = New-Object System.Drawing.RectangleF(0, 0, $Size, $Size)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $cTop, $cBottom, 90)

  if ($Rounded) {
    $r = $Size * $CornerRatio
    $clip = New-RoundedRectPath 0 0 $Size $Size $r
    $g.SetClip($clip)
    $g.FillRectangle($brush, 0, 0, $Size, $Size)
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 255, 255, 255), [Math]::Max(1, $Size * 0.012))
    $g.DrawPath($pen, $clip)
    $g.ResetClip()
  } else {
    $g.FillRectangle($brush, 0, 0, $Size, $Size)
  }

  $fontSize = $Size * $LetterRatio
  $font = New-Object System.Drawing.Font("Segoe UI", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $layout = New-Object System.Drawing.RectangleF(0, 0, $Size, $Size)
  $g.DrawString("J", $font, [System.Drawing.Brushes]::White, $layout, $sf)

  $g.Dispose()
  $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "generated: $OutPath"
}

$full = Join-Path $PSScriptRoot "..\$OutDir"
New-Item -ItemType Directory -Force -Path $full | Out-Null

New-JustWordIcon -Size 192  -Rounded $true  -CornerRatio 0.22 -LetterRatio 0.52 -OutPath (Join-Path $full "icon-192.png")
New-JustWordIcon -Size 512  -Rounded $true  -CornerRatio 0.22 -LetterRatio 0.52 -OutPath (Join-Path $full "icon-512.png")
New-JustWordIcon -Size 512  -Rounded $false -CornerRatio 0    -LetterRatio 0.40 -OutPath (Join-Path $full "icon-maskable-512.png")
New-JustWordIcon -Size 180  -Rounded $false -CornerRatio 0    -LetterRatio 0.46 -OutPath (Join-Path $full "apple-touch-icon-180.png")
