# MicroSIP Clean Register - No PowerShell Wrapper
$path = "C:\Users\Rovan\AppData\Local\MicroSIP\microsip.exe"

Write-Host "Forcing clean direct command for MicroSIP..." -ForegroundColor Cyan

foreach ($proto in @("tel", "callto")) {
    $key = "HKCU:\Software\Classes\$proto\shell\open\command"
    if (!(Test-Path $key)) { New-Item $key -Force | Out-Null }
    
    # On utilise une commande CMD très simple qui nettoie le préfixe
    # C'est souvent plus stable que PowerShell pour le registre
    $command = "cmd /c `"set num=%1&set num=%num:tel:=%&set num=%num:callto:=%&start /b `"`" `"$path`" %num%`""
    
    Set-ItemProperty $key -Name "(Default)" -Value $command
}

Write-Host "✅ Terminé. Essayez à nouveau dans le CRM." -ForegroundColor Green
