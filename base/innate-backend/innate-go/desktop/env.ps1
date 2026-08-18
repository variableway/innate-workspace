# Shared desktop Cargo env. Usage:
#   . .\base\desktop-cargo\env.ps1
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $env:CARGO_TARGET_DIR) {
    $env:CARGO_TARGET_DIR = Join-Path $Root "target"
}
New-Item -ItemType Directory -Force -Path $env:CARGO_TARGET_DIR | Out-Null
