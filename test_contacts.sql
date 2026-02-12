-- Script pour ajouter des contacts de test avec Zoiper
-- Ce script insère des contacts de test dans votre CRM pour simuler des appels

-- Assurez-vous d'avoir au moins une campagne existante
-- Si vous n'en avez pas, décommentez et exécutez ces lignes :

-- INSERT INTO campaigns (nom, description, responsable_id, created_at) 
-- VALUES ('Test Zoiper', 'Campagne de test pour Zoiper', 1, NOW());

-- Récupérer l'ID de la campagne (ajustez selon votre situation)
-- SET @campaign_id = LAST_INSERT_ID();

-- Ou utilisez une campagne existante :
SET @campaign_id = (SELECT id FROM campaigns ORDER BY id DESC LIMIT 1);

-- Insertion de contacts de test
INSERT INTO contacts (nom, telephone, email, source, campaign_id, status, created_at)
VALUES
    -- Contacts fictifs pour test
    ('Alice Martin', '+33612345678', 'alice.martin@example.com', 'manuel', @campaign_id, 'nouveau', NOW()),
    ('Bob Dupont', '+33623456789', 'bob.dupont@example.com', 'manuel', @campaign_id, 'nouveau', NOW()),
    ('Claire Bernard', '+33634567890', 'claire.bernard@example.com', 'web', @campaign_id, 'rappele', NOW()),
    ('David Petit', '+33645678901', 'david.petit@example.com', 'manuel', @campaign_id, 'nouveau', NOW()),
    ('Emma Rousseau', '+33656789012', 'emma.rousseau@example.com', 'web', @campaign_id, 'termine', NOW()),
    
    -- Contacts avec numéros internationaux pour test
    ('François Leroy', '+336123456789', 'francois.leroy@example.com', 'manuel', @campaign_id, 'nouveau', NOW()),
    ('Géraldine Moreau', '+336234567890', 'geraldine.moreau@example.com', 'web', @campaign_id, 'rappele', NOW()),
    ('Henri Simon', '+336345678901', 'henri.simon@example.com', 'manuel', @campaign_id, 'nouveau', NOW()),
    ('Isabelle Laurent', '+336456789012', 'isabelle.laurent@example.com', 'web', @campaign_id, 'nouveau', NOW()),
    ('Jacques Michel', '+336567890123', 'jacques.michel@example.com', 'manuel', @campaign_id, 'termine', NOW());

-- Vérifier l'insertion
SELECT 
    c.id,
    c.nom,
    c.telephone,
    c.email,
    c.status,
    camp.nom as campagne
FROM contacts c
LEFT JOIN campaigns camp ON c.campaign_id = camp.id
ORDER BY c.created_at DESC
LIMIT 10;

-- Afficher le nombre total de contacts
SELECT COUNT(*) as total_contacts FROM contacts;

-- NOTE IMPORTANTE POUR ZOIPER:
-- Ces numéros sont fictifs et ne fonctionneront PAS pour de vrais appels
-- Pour tester Zoiper:
-- 1. Configurez un compte SIP (voir ZOIPER_TEST_CONFIG.md)
-- 2. Testez avec sip:echo@sip.linphone.org
-- 3. Pour appeler un autre utilisateur Zoiper: sip:username@sip.linphone.org
