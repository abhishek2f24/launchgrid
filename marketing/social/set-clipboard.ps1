param([string]$Path)
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($Path)
[System.Windows.Forms.Clipboard]::SetImage($img)
Write-Output "image on clipboard: $Path"
