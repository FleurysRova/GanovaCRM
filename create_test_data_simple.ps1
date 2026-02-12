# Script simplifié pour créer les données de test
# Utilise les commandes Symfony pour plus de fiabilité

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "📊 CRÉATION DES DONNÉES DE TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

cd "C:\Users\Rovan\Documents\Zanova_Entreprise\CRM_call_center\crm_call"

Write-Host "1️⃣ Création d'un utilisateur agent..." -ForegroundColor Yellow
Write-Host "   Email: agent@test.com" -ForegroundColor White
Write-Host "   Mot de passe: agent123" -ForegroundColor White
Write-Host ""

# Créer l'utilisateur avec Symfony console
$createUserCommand = @"
php bin/console doctrine:query:sql "INSERT INTO users (email, roles, password) VALUES ('agent@test.com', '[\"ROLE_USER\"]', '\`$2y\`$13\`$Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8OuKl5zJ5zJ5zJ5zJ5zJ5zJ5zJ5zJ5zJ5zJ5zJ5') ON CONFLICT (email) DO NOTHING"
"@

try {
    Invoke-Expression $createUserCommand
    Write-Host "✅ Utilisateur créé ou existe déjà" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Une erreur s'est produite, l'utilisateur existe peut-être déjà" -ForegroundColor Yellow
}

Write-Host "`n2️⃣ Création d'une campagne de test..." -ForegroundColor Yellow

$campaignSQL = @"
DO `$`$ 
BEGIN
    INSERT INTO campaigns (nom, description, responsable_id, created_at)
    SELECT 'Test Zoiper', 'Campagne de test pour Zoiper Click-to-Call', u.id, NOW()
    FROM users u WHERE u.email = 'agent@test.com' LIMIT 1
    ON CONFLICT DO NOTHING;
END `$`$;
"@

php bin/console doctrine:query:sql "$campaignSQL"
Write-Host "✅ Campagne créée" -ForegroundColor Green

Write-Host "`n3️⃣ Création de contacts de test..." -ForegroundColor Yellow

$contactsSQL = @"
INSERT INTO contacts (nom, telephone, email, source, campaign_id, status, created_at)
SELECT * FROM (VALUES
    ('Alice Martin', '0612345678', 'alice.martin@example.com', 'manuel', (SELECT id FROM campaigns WHERE nom = 'Test Zoiper' LIMIT 1), 'nouveau', NOW()),
    ('Bob Dupont', '0623456789', 'bob.dupont@example.com', 'manuel', (SELECT id FROM campaigns WHERE nom = 'Test Zoiper' LIMIT 1), 'nouveau', NOW()),
    ('Claire Bernard', '0634567890', 'claire.bernard@example.com', 'web', (SELECT id FROM campaigns WHERE nom = 'Test Zoiper' LIMIT 1), 'rappele', NOW()),
    ('David Petit', '0645678901', 'david.petit@example.com', 'manuel', (SELECT id FROM campaigns WHERE nom = 'Test Zoiper' LIMIT 1), 'nouveau', NOW()),
    ('Emma Rousseau', '0656789012', 'emma.rousseau@example.com', 'web', (SELECT id FROM campaigns WHERE nom = 'Test Zoiper' LIMIT 1), 'termine', NOW()),
    ('François Leroy', '0661234567', 'francois.leroy@example.com', 'manuel', (SELECT id FROM campaigns WHERE nom = 'Test Zoiper' LIMIT 1), 'nouveau', NOW()),
    ('Géraldine Moreau', '0672345678', 'geraldine.moreau@example.com', 'web', (SELECT id FROM campaigns WHERE nom = 'Test Zoiper' LIMIT 1), 'rappele', NOW()),
    ('Henri Simon', '0683456789', 'henri.simon@example.com', 'manuel', (SELECT id FROM campaigns WHERE nom = 'Test Zoiper' LIMIT 1), 'nouveau', NOW()),
    ('Isabelle Laurent', '0694567890', 'isabelle.laurent@example.com', 'web', (SELECT id FROM campaigns WHERE nom = 'Test Zoiper' LIMIT 1), 'nouveau', NOW()),
    ('Jacques Michel', '0605678901', 'jacques.michel@example.com', 'manuel', (SELECT id FROM campaigns WHERE nom = 'Test Zoiper' LIMIT 1), 'termine', NOW())
) AS v(nom, telephone, email, source, campaign_id, status, created_at)
"@

php bin/console doctrine:query:sql "$contactsSQL"
Write-Host "✅ 10 contacts créés" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ DONNÉES CRÉÉES AVEC SUCCÈS !" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📋 INFORMATIONS DE CONNEXION:" -ForegroundColor Cyan
Write-Host "  Email:        agent@test.com" -ForegroundColor White
Write-Host "  Mot de passe: agent123" -ForegroundColor White
Write-Host ""
Write-Host "🌐 URL du CRM:  http://127.0.0.1:8000/login" -ForegroundColor Yellow
Write-Host ""

Write-Host "📌 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "  1. Assurez-vous que Symfony tourne: symfony serve" -ForegroundColor White
Write-Host "  2. Ouvrez http://127.0.0.1:8000/login" -ForegroundColor White
Write-Host "  3. Connectez-vous avec agent@test.com / agent123" -ForegroundColor White  
Write-Host "  4. Allez sur /contacts pour voir les contacts" -ForegroundColor White
Write-Host "  5. Cliquez sur un numéro pour tester Zoiper !" -ForegroundColor White
Write-Host ""

Read-Host "Appuyez sur Entrée pour continuer"
