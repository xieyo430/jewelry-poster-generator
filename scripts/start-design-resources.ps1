$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$reactBits = Join-Path $root 'third-party\react-bits'
$designMd = Join-Path $root 'third-party\awesome-design-md\design-md'
$serveScript = Join-Path $PSScriptRoot 'serve-design-md.mjs'

if (-not (Test-Path $reactBits)) {
  throw 'React Bits 仓库缺失，请先克隆到 third-party/react-bits'
}
if (-not (Test-Path (Join-Path $reactBits 'node_modules'))) {
  throw 'React Bits dependencies are missing. Run: npm.cmd install --prefix third-party/react-bits'
}
if (-not (Test-Path $designMd)) {
  throw 'Awesome DESIGN.md 缺失，请先克隆 third-party/awesome-design-md'
}

$designMdPort = if ($env:DESIGN_MD_PORT) { [int]$env:DESIGN_MD_PORT } else { 5175 }
# Start-Process 子进程继承当前进程环境，借此把端口传给 serve-design-md.mjs
$env:DESIGN_MD_PORT = "$designMdPort"

Start-Process -FilePath 'npm.cmd' `
  -ArgumentList 'run','dev','--','--port','5174' `
  -WorkingDirectory $reactBits `
  -WindowStyle Hidden

Start-Process -FilePath 'node.exe' `
  -ArgumentList "`"$serveScript`"" `
  -WindowStyle Hidden

Write-Host 'React Bits: http://127.0.0.1:5174/'
Write-Host "Awesome DESIGN.md: http://127.0.0.1:$designMdPort/"
