# Zoiper Final Dialing Fix
$zoiperExe = "C:\Program Files (x86)\Zoiper5\Zoiper5.exe"

Write-Host "Simplifying Zoiper command line for direct dialing..." -ForegroundColor Cyan

$protocols = @("tel", "callto")

foreach ($proto in $protocols) {
    # Update the ProgID command
    $progIdKey = "HKCU:\Software\Classes\Zoiper5.Url.$proto\shell\open\command"
    $appKey = "HKCU:\Software\Classes\Applications\Zoiper5.exe\shell\open\command"
    $directKey = "HKCU:\Software\Classes\$proto\shell\open\command"

    $keys = @($progIdKey, $appKey, $directKey)

    foreach ($key in $keys) {
        if (Test-Path $key) {
            # Simplest command: "Path" "%1"
            Set-ItemProperty $key -Name "(Default)" -Value "`"$zoiperExe`" `"%1`""
        }
    }
}

Write-Host "`n✅ Commande simplifiÃ©e." -ForegroundColor Green
Write-Host "âš ï¸  RAPPEL IMPORTANT dans Zoiper :" -ForegroundColor Yellow
Write-Host "1. Allez dans Settings > Automation"
Write-Host "2. COCHEZ 'Start dialing on automated calls'"
Write-Host ""
Read-Host "Appuyez sur EntrÃ©e pour terminer"
