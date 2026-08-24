# scripts/derive-icons-from-ai.ps1
# JustWord PWA 应用图标派生：从 AI 生成主图裁剪中心 80%（去除四角水印）后派生 4 枚图标
# 用法: powershell -ExecutionPolicy Bypass -File scripts/derive-icons-from-ai.ps1
param(
  [string]$Master = "scripts/ai-assets/justword-master-icon.jpg",
  [string]$OutDir = "public/icons"
)

Add-Type -AssemblyName System.Drawing

# ---------- 工具函数 ----------
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

function Get-Pixel {
  param($bmp, [int]$x, [int]$y)
  return $bmp.GetPixel($x, $y)
}

# 加载主图
$srcPath = Join-Path $PSScriptRoot "..\$Master"
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

# ---------- 方形图标（直接缩放，无圆角） ----------
function Save-Square {
  param([int]$Size, [string]$OutPath)
  $bmp = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($cropBmp, 0, 0, $Size, $Size)
  $g.Dispose()
  $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "generated: $OutPath"
}

# ---------- 圆角图标（圆角矩形裁剪 + 主图填充） ----------
function Save-Rounded {
  param([int]$Size, [float]$CornerRatio, [string]$OutPath)
  $bmp = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $r = $Size * $CornerRatio
  $clip = New-RoundedRectPath 0 0 $Size $Size $r
  $g.SetClip($clip)
  $g.DrawImage($cropBmp, 0, 0, $Size, $Size)
  $g.ResetClip()
  $g.Dispose()
  $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "generated: $OutPath"
}

# ---------- maskable 图标（内容 72% 居中 + 边缘色背景，满足安全区） ----------
function Save-Maskable {
  param([int]$Size, [float]$ContentRatio, [string]$OutPath)
  # 从裁剪图四角取样平均色作为背景
  $p1 = Get-Pixel $cropBmp 2 2
  $p2 = Get-Pixel $cropBmp ($crop - 3) 2
  $p3 = Get-Pixel $cropBmp 2 ($crop - 3)
  $p4 = Get-Pixel $cropBmp ($crop - 3) ($crop - 3)
  $r = [int](($p1.R + $p2.R + $p3.R + $p4.R) / 4)
  $gr = [int](($p1.G + $p2.G + $p3.G + $p4.G) / 4)
  $b = [int](($p1.B + $p2.B + $p3.B + $p4.B) / 4)

  $bmp = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, $r, $gr, $b))
  $g.FillRectangle($bg, 0, 0, $Size, $Size)
  $bg.Dispose()
  $inner = $Size * $ContentRatio
  $off = ($Size - $inner) / 2
  $g.DrawImage($cropBmp, $off, $off, $inner, $inner)
  $g.Dispose()
  $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "generated: $OutPath"
}

# ---------- 派生 4 枚图标 ----------
Save-Rounded  -Size 192  -CornerRatio 0.22 -OutPath (Join-Path $outDir "icon-192.png")
Save-Rounded  -Size 512  -CornerRatio 0.22 -OutPath (Join-Path $outDir "icon-512.png")
Save-Maskable -Size 512  -ContentRatio 0.72 -OutPath (Join-Path $outDir "icon-maskable-512.png")
Save-Square   -Size 180  -OutPath (Join-Path $outDir "apple-touch-icon-180.png")

$cropBmp.Dispose()
Write-Host "done."
