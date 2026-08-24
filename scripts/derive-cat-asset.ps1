# scripts/derive-cat-asset.ps1
# 云养猫主形象派生：从 AI 主图裁剪中心 80%（去除水印）后生成圆形透明 PNG
# 用法: powershell -ExecutionPolicy Bypass -File scripts/derive-cat-asset.ps1
param(
  [string]$Master = "scripts/ai-assets/cat-master.jpg",
  [string]$OutDir = "public/cat"
)

Add-Type -AssemblyName System.Drawing

function New-EllipsePath {
  param([float]$x, [float]$y, [float]$w, [float]$h)
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddEllipse($x, $y, $w, $h)
  $path.CloseFigure()
  return $path
}

# 加载主图
$srcPath = Join-Path $PSScriptRoot "..\$Master"
if (-not (Test-Path $srcPath)) {
  Write-Error "master image not found: $srcPath"
  exit 1
}
$src = [System.Drawing.Image]::FromFile($srcPath)

# 裁剪中心 80%，去除 AI 生成四角水印
$m = [Math]::Min($src.Width, $src.Height)
$crop = [int]($m * 0.80)
$cx = [int](($src.Width - $crop) / 2)
$cy = [int](($src.Height - $crop) / 2)
$cropBmp = New-Object System.Drawing.Bitmap($crop, $crop)
$g = [System.Drawing.Graphics]::FromImage($cropBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $crop, $crop)),
  (New-Object System.Drawing.Rectangle($cx, $cy, $crop, $crop)), [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$src.Dispose()
Write-Host "cropped master: ${crop}x${crop} (center 80%)"

$outDir = Join-Path $PSScriptRoot "..\$OutDir"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# 圆形透明 PNG（内容 84% 居中，留出呼吸动画余量）
function Save-Circle {
  param([int]$Size, [float]$ContentRatio, [string]$OutPath)
  $bmp = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

  $inner = [int]($Size * $ContentRatio)
  $off = [int](($Size - $inner) / 2)

  $circle = New-EllipsePath 0 0 $Size $Size
  $g.SetClip($circle)
  $g.DrawImage($cropBmp, $off, $off, $inner, $inner)
  $g.ResetClip()
  $g.Dispose()
  $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "generated: $OutPath"
}

Save-Circle -Size 512 -ContentRatio 0.84 -OutPath (Join-Path $outDir "cat-main.png")

$cropBmp.Dispose()
Write-Host "done."
