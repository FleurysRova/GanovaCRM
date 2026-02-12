# Script de Test Rapide - Simulation Zoiper
# Ce script vérifie que tout est prêt pour votre démo

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🚀 TEST DE CONFIGURATION ZOIPER & CRM" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$allGood = $true

# Test 1 : Vérifier que Zoiper est installé
Write-Host "📋 Test 1: Vérification Zoiper..." -ForegroundColor Yellow
$zoiperPath = "C:\Program Files (x86)\Zoiper5\Zoiper5.exe"
if (Test-Path $zoiperPath) {
    Write-Host "  ✅ Zoiper5 détecté à: $zoiperPath" -ForegroundColor Green
} else {
    Write-Host "  ❌ Zoiper5 non trouvé. Installez-le depuis https://www.zoiper.com" -ForegroundColor Red
    $allGood = $false
}

# Test 2 : Vérifier que le projet Symfony existe
Write-Host "`n📋 Test 2: Vérification projet Symfony..." -ForegroundColor Yellow
$projectPath = "C:\Users\Rovan\Documents\Zanova_Entreprise\CRM_call_center\crm_call"
if (Test-Path $projectPath) {
    Write-Host "  ✅ Projet CRM trouvé" -ForegroundColor Green
    
    # Vérifier le Controller
    $controllerPath = "$projectPath\src\Controller\ContactController.php"
    if (Test-Path $controllerPath) {
        Write-Host "  ✅ ContactController.php créé" -ForegroundColor Green
    } else {
        Write-Host "  ❌ ContactController.php manquant" -ForegroundColor Red
        $allGood = $false
    }
    
    # Vérifier le Template
    $templatePath = "$projectPath\templates\contacts\list.html.twig"
    if (Test-Path $templatePath) {
        Write-Host "  ✅ Template contacts créé" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Template contacts manquant" -ForegroundColor Red
        $allGood = $false
    }
} else {
    Write-Host "  ❌ Projet CRM non trouvé" -ForegroundColor Red
    $allGood = $false
}

# Test 3 : Vérifier PHP
Write-Host "`n📋 Test 3: Vérification PHP..." -ForegroundColor Yellow
try {
    $phpVersion = php -v 2>&1 | Select-String "PHP (\d+\.\d+\.\d+)" | ForEach-Object { $_.Matches.Groups[1].Value }
    if ($phpVersion) {
        Write-Host "  ✅ PHP $phpVersion installé" -ForegroundColor Green
    } else {
        Write-Host "  ❌ PHP non détecté" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "  ❌ PHP non installé ou non dans le PATH" -ForegroundColor Red
    $allGood = $false
}

# Test 4 : Vérifier Composer
Write-Host "`n📋 Test 4: Vérification Composer..." -ForegroundColor Yellow
try {
    $composerCheck = composer --version 2>&1
    if ($composerCheck -match "Composer") {
        Write-Host "  ✅ Composer installé" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Composer non détecté" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Composer non installé (optionnel)" -ForegroundColor Yellow
}

# Test 5 : Vérifier MySQL/MariaDB
Write-Host "`n📋 Test 5: Vérification Base de Données..." -ForegroundColor Yellow
try {
    $mysqlCheck = mysql --version 2>&1
    if ($mysqlCheck -match "mysql") {
        Write-Host "  ✅ MySQL/MariaDB installé" -ForegroundColor Green
    } else {
        Write-Host "  ❌ MySQL non détecté" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "  ❌ MySQL/MariaDB non installé ou non dans le PATH" -ForegroundColor Red
    $allGood = $false
}

# Test 6 : Tester la connexion MySQL
Write-Host "`n📋 Test 6: Test connexion base de données..." -ForegroundColor Yellow
Write-Host "  ℹ️  Entrez votre mot de passe MySQL root (ou Entrée pour passer):" -ForegroundColor Cyan
$password = Read-Host -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

if ($passwordPlain) {
    try {
        $dbCheck = mysql -u root -p"$passwordPlain" -e "SHOW DATABASES LIKE 'crm_call';" 2>&1
        if ($dbCheck -match "crm_call") {
            Write-Host "  ✅ Base de données 'crm_call' trouvée" -ForegroundColor Green
            
            # Compter les contacts
            $contactCount = mysql -u root -p"$passwordPlain" crm_call -e "SELECT COUNT(*) as total FROM contacts;" 2>&1 | Select-String "\d+" | Select-Object -Last 1
            if ($contactCount) {
                Write-Host "  ✅ Contacts trouvés dans la DB" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️  Aucun contact trouvé. Exécutez test_contacts.sql" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ❌ Base de données 'crm_call' non trouvée" -ForegroundColor Red
            Write-Host "     Créez-la avec: mysql -u root -p -e 'CREATE DATABASE crm_call;'" -ForegroundColor Yellow
            $allGood = $false
        }
    } catch {
        Write-Host "  ❌ Erreur de connexion MySQL" -ForegroundColor Red
        $allGood = $false
    }
} else {
    Write-Host "  ⏭️  Test de connexion DB ignoré" -ForegroundColor Gray
}

# Résumé final
Write-Host "`n========================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✅ TOUS LES TESTS RÉUSSIS !" -ForegroundColor Green
    Write-Host "`nVous êtes prêt à lancer la simulation !" -ForegroundColor Green
    Write-Host "`nProchaines étapes:" -ForegroundColor Cyan
    Write-Host "  1. Configurez Zoiper (voir ZOIPER_TEST_CONFIG.md)" -ForegroundColor White
    Write-Host "  2. Ajoutez des contacts de test:" -ForegroundColor White
    Write-Host "     mysql -u root -p crm_call < test_contacts.sql" -ForegroundColor Gray
    Write-Host "  3. Lancez le serveur:" -ForegroundColor White
    Write-Host "     cd C:\Users\Rovan\Documents\Zanova_Entreprise\CRM_call_center\crm_call" -ForegroundColor Gray
    Write-Host "     symfony server:start" -ForegroundColor Gray
    Write-Host "  4. Ouvrez: http://localhost:8000/contacts" -ForegroundColor White
} else {
    Write-Host "❌ CERTAINS TESTS ONT ÉCHOUÉ" -ForegroundColor Red
    Write-Host "`nCorrigez les erreurs ci-dessus avant de continuer" -ForegroundColor Yellow
}
Write-Host "========================================`n" -ForegroundColor Cyan

# Demander si on doit ouvrir les guides
Write-Host "`nVoulez-vous ouvrir le guide de simulation ? (O/N): " -ForegroundColor Cyan -NoNewline
$response = Read-Host
if ($response -eq "O" -or $response -eq "o") {
    $guidePath = "C:\Users\Rovan\Documents\Zanova_Entreprise\CRM_call_center\RECAP_ZOIPER.md"
    if (Test-Path $guidePath) {
        Start-Process $guidePath
        Write-Host "✅ Guide ouvert !" -ForegroundColor Green
    } else {
        Write-Host "❌ Guide non trouvé" -ForegroundColor Red
    }
}

Write-Host "`nBonne simulation ! 🚀📞`n" -ForegroundColor Green
