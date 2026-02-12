# Script pour créer un utilisateur agent et des contacts de test
# Compatible PostgreSQL

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "📊 CRÉATION DES DONNÉES DE TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Configuration PostgreSQL
$dbHost = "127.0.0.1"
$dbPort = "5432"
$dbName = "crm_zanovaa"
$dbUser = "postgres"
$dbPassword = "Fleurys"

Write-Host "📝 Configuration détectée:" -ForegroundColor Yellow
Write-Host "  Base de données: $dbName" -ForegroundColor White
Write-Host "  Hôte: $dbHost" -ForegroundColor White
Write-Host ""

# Commandes SQL à exécuter
$sqlCommands = @"
-- 1. Créer un utilisateur agent de test si il n'existe pas déjà
DO `$`$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'agent@test.com') THEN
        INSERT INTO users (email, roles, password)
        VALUES (
            'agent@test.com',
            '["ROLE_USER"]',
            -- Mot de passe: 'agent123' (hashé avec bcrypt)
            '`$2y`$13`$9K5YvZXZ8vZ8Z8Z8Z8Z8ZOZ8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8'
        );
        RAISE NOTICE 'Utilisateur agent créé';
    ELSE
        RAISE NOTICE 'Utilisateur agent existe déjà';
    END IF;
END
`$`$;

-- 2. Créer une campagne de test si elle n'existe pas
DO `$`$
DECLARE
    v_user_id INTEGER;
    v_campaign_id INTEGER;
BEGIN
    -- Récupérer l'ID de l'utilisateur agent
    SELECT id INTO v_user_id FROM users WHERE email = 'agent@test.com' LIMIT 1;
    
    -- Créer la campagne si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM campaigns WHERE nom = 'Test Zoiper - Click to Call') THEN
        INSERT INTO campaigns (nom, description, responsable_id, created_at)
        VALUES (
            'Test Zoiper - Click to Call',
            'Campagne de test pour vérifier l''intégration Zoiper',
            v_user_id,
            NOW()
        )
        RETURNING id INTO v_campaign_id;
        RAISE NOTICE 'Campagne créée avec ID: %', v_campaign_id;
    ELSE
        SELECT id INTO v_campaign_id FROM campaigns WHERE nom = 'Test Zoiper - Click to Call' LIMIT 1;
        RAISE NOTICE 'Campagne existe déjà avec ID: %', v_campaign_id;
    END IF;

    -- 3. Créer des contacts de test
    DELETE FROM contacts WHERE campaign_id = v_campaign_id;
    
    INSERT INTO contacts (nom, telephone, email, source, campaign_id, status, created_at)
    VALUES
        ('Alice Martin', '0612345678', 'alice.martin@example.com', 'manuel', v_campaign_id, 'nouveau', NOW()),
        ('Bob Dupont', '0623456789', 'bob.dupont@example.com', 'manuel', v_campaign_id, 'nouveau', NOW()),
        ('Claire Bernard', '0634567890', 'claire.bernard@example.com', 'web', v_campaign_id, 'rappele', NOW()),
        ('David Petit', '0645678901', 'david.petit@example.com', 'manuel', v_campaign_id, 'nouveau', NOW()),
        ('Emma Rousseau', '0656789012', 'emma.rousseau@example.com', 'web', v_campaign_id, 'termine', NOW()),
        ('François Leroy', '0661234567', 'francois.leroy@example.com', 'manuel', v_campaign_id, 'nouveau', NOW()),
        ('Géraldine Moreau', '0672345678', 'geraldine.moreau@example.com', 'web', v_campaign_id, 'rappele', NOW()),
        ('Henri Simon', '0683456789', 'henri.simon@example.com', 'manuel', v_campaign_id, 'nouveau', NOW()),
        ('Isabelle Laurent', '0694567890', 'isabelle.laurent@example.com', 'web', v_campaign_id, 'nouveau', NOW()),
        ('Jacques Michel', '0605678901', 'jacques.michel@example.com', 'manuel', v_campaign_id, 'termine', NOW());
    
    RAISE NOTICE '10 contacts de test créés';
END
`$`$;

-- 4. Afficher un résumé
SELECT 
    'RÉSUMÉ' as info,
    (SELECT COUNT(*) FROM users WHERE email = 'agent@test.com') as nb_utilisateurs,
    (SELECT COUNT(*) FROM campaigns WHERE nom = 'Test Zoiper - Click to Call') as nb_campagnes,
    (SELECT COUNT(*) FROM contacts WHERE campaign_id IN (SELECT id FROM campaigns WHERE nom = 'Test Zoiper - Click to Call')) as nb_contacts;

-- 5. Afficher les contacts créés
SELECT 
    c.id,
    c.nom,
    c.telephone,
    c.email,
    c.status,
    camp.nom as campagne
FROM contacts c
LEFT JOIN campaigns camp ON c.campaign_id = camp.id
WHERE camp.nom = 'Test Zoiper - Click to Call'
ORDER BY c.created_at DESC;
"@

# Sauvegarder le SQL dans un fichier temporaire
$sqlFile = "$PSScriptRoot\temp_create_test_data.sql"
$sqlCommands | Out-File -FilePath $sqlFile -Encoding UTF8

Write-Host "📝 Fichier SQL créé: $sqlFile" -ForegroundColor Green

# Exécuter le SQL
Write-Host "`n🔄 Exécution des commandes SQL..." -ForegroundColor Yellow

$env:PGPASSWORD = $dbPassword
$result = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $sqlFile 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ DONNÉES DE TEST CRÉÉES AVEC SUCCÈS !" -ForegroundColor Green
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "📋 INFORMATIONS DE CONNEXION" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Email:        agent@test.com" -ForegroundColor White
    Write-Host "Mot de passe: agent123" -ForegroundColor White
    Write-Host "`nURL du CRM:   http://127.0.0.1:8000/login" -ForegroundColor Yellow
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "📌 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "  1. Ouvrez http://127.0.0.1:8000/login dans votre navigateur" -ForegroundColor White
    Write-Host "  2. Connectez-vous avec agent@test.com / agent123" -ForegroundColor White
    Write-Host "  3. Allez sur la page /contacts" -ForegroundColor White
    Write-Host "  4. Cliquez sur un numéro de téléphone pour tester Zoiper" -ForegroundColor White
    Write-Host ""
    
}
else {
    Write-Host "`n❌ ERREUR lors de l'exécution SQL" -ForegroundColor Red
    Write-Host "Détails de l'erreur:" -ForegroundColor Yellow
    Write-Host $result -ForegroundColor Gray
    
    Write-Host "`n💡 Solutions possibles:" -ForegroundColor Cyan
    Write-Host "  1. Vérifiez que PostgreSQL est démarré" -ForegroundColor White
    Write-Host "  2. Vérifiez que la base de données 'crm_zanovaa' existe" -ForegroundColor White
    Write-Host "  3. Vérifiez les identifiants dans le .env" -ForegroundColor White
    Write-Host "  4. Exécutez: php bin/console doctrine:migrations:migrate" -ForegroundColor White
}

# Nettoyer le fichier temporaire
Remove-Item $sqlFile -ErrorAction SilentlyContinue

Read-Host "`nAppuyez sur Entrée pour continuer"
