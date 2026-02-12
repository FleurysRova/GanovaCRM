# 🎯 RÉCAPITULATIF - Configuration Simulation Zoiper

## ✨ Ce qui a été fait pour vous

### 📁 Fichiers créés :

1. **Backend** :
   - ✅ `src/Controller/ContactController.php` → Controller pour afficher les contacts
   - ✅ Mise à jour de `ManagementController.php` → Imports ajoutés

2. **Frontend** :
   - ✅ `templates/contacts/list.html.twig` → Belle interface avec click-to-call

3. **Documentation** :
   - ✅ `ZOIPER_TEST_CONFIG.md` → Guide configuration SIP de test
   - ✅ `SIMULATION_GUIDE.md` → Guide complet A-Z
   - ✅ `RECAP_ZOIPER.md` → Ce récapitulatif

4. **Scripts** :
   - ✅ `test_contacts.sql` → Contacts de test

---

## 🚀 POUR LANCER VOTRE TEST - EN 5 ÉTAPES

### ⚙️ Étape 1 : Configurer Zoiper (2 minutes)

#### Option Simple (recommandée) :
1. Allez sur → [https://www.linphone.org/freesip/home](https://www.linphone.org/freesip/home)
2. Cliquez "Create a SIP account"
3. Remplissez :
   - Username : `votreNom2026` (exemple: `rovan2026`)
   - Password : `un_mot_de_passe`
   - Email : votre email
4. **Notez ces infos !**

#### Dans Zoiper :
1. Ouvrez Zoiper5
2. Cliquez **"Add"** (bouton vert)
3. Sélectionnez **"SIP"**
4. Entrez :
   ```
   Domain: sip.linphone.org
   Username: rovan2026  (votre username)
   Password: votre_mot_de_passe
   ```
5. Validez
6. ✅ **Vérifiez le point VERT** = "Registered"

---

### 🗄️ Étape 2 : Ajouter des Contacts de Test (1 minute)

#### Méthode A : Via Script SQL (Recommandée)
```bash
# Dans votre terminal
mysql -u root -p crm_call < test_contacts.sql
```

#### Méthode B : Commande SQL manuelle
```bash
# Lancez MySQL
mysql -u root -p crm_call
```

```sql
-- Vérifier qu'une campagne existe
SELECT * FROM campaigns;

-- Si pas de campagne, en créer une
INSERT INTO campaigns (nom, description, responsable_id, created_at)
VALUES ('Test Zoiper', 'Demo Click-to-Call', 1, NOW());

-- Récupérer l'ID
SET @campaign_id = (SELECT id FROM campaigns ORDER BY id DESC LIMIT 1);

-- Ajouter des contacts
INSERT INTO contacts (nom, telephone, email, source, campaign_id, status, created_at)
VALUES
    ('Alice Martin', '+33612345678', 'alice@example.com', 'manuel', @campaign_id, 'nouveau', NOW()),
    ('Bob Dupont', '+33623456789', 'bob@example.com', 'manuel', @campaign_id, 'nouveau', NOW()),
    ('Claire Bernard', '+33634567890', 'claire@example.com', 'web', @campaign_id, 'rappele', NOW());

-- Vérifier
SELECT nom, telephone FROM contacts;
```

---

### 🖥️ Étape 3 : Lancer le Serveur Symfony (30 secondes)

```bash
cd C:\Users\Rovan\Documents\Zanova_Entreprise\CRM_call_center\crm_call

# Méthode 1 : Symfony CLI (recommandée)
symfony server:start

# Méthode 2 : PHP natif
php -S localhost:8000 -t public
```

---

### 🌐 Étape 4 : Ouvrir la Page Contacts (10 secondes)

1. Ouvrez votre navigateur
2. Allez sur : **http://localhost:8000/contacts**
3. Si demandé, connectez-vous avec vos identifiants CRM

---

### 📞 Étape 5 : TEST ! (30 secondes)

1. **Vous verrez** :
   - Interface violette magnifique
   - Cartes de contacts avec avatars
   - Numéros de téléphone cliquables
   - Boutons "Appeler maintenant"

2. **Cliquez sur un numéro** ou sur "📞 Appeler maintenant"

3. **Le navigateur demande** :
   ```
   Ouvrir Zoiper5 ?
   [Toujours autoriser] [Autoriser] [Annuler]
   ```
   → Cliquez "Toujours autoriser"

4. **Zoiper s'ouvre** et compose le numéro ! 🎉

---

## 🧪 Test avec un VRAI Appel Fonctionnel

Pour entendre quelque chose (service d'écho SIP) :

### Option 1 : Modifier un contact existant
```sql
UPDATE contacts 
SET telephone = 'sip:echo@sip.linphone.org' 
WHERE id = 1;
```

### Option 2 : Ajouter un contact spécial
```sql
INSERT INTO contacts (nom, telephone, email, source, campaign_id, status, created_at)
VALUES ('Test Echo SIP', 'sip:echo@sip.linphone.org', 'echo@test.com', 'test', 
        (SELECT id FROM campaigns ORDER BY id DESC LIMIT 1), 'nouveau', NOW());
```

Ensuite :
1. Rafraîchissez la page `/contacts`
2. Cliquez sur le contact "Test Echo SIP"
3. **Vous devriez entendre votre voix en écho !** 🎤

---

## 🎨 Ce que vous verrez dans l'interface :

```
┌──────────────────────────────────────────────────────┐
│  📞 Gestion des Contacts                             │
│  Cliquez sur un numéro de téléphone pour appeler     │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  🟢 Zoiper détecté - Click-to-Call activé           │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  📋 Filtrer par campagne                             │
│  [Test Zoiper ▼]                                     │
└──────────────────────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  🔵 A           │  │  🔵 B           │  │  🔵 C           │
│  Alice Martin   │  │  Bob Dupont     │  │  Claire Bernard │
│  NOUVEAU        │  │  NOUVEAU        │  │  RAPPELE        │
│                 │  │                 │  │                 │
│  📞 Téléphone   │  │  📞 Téléphone   │  │  📞 Téléphone   │
│  +33612345678   │  │  +33623456789   │  │  +33634567890   │
│                 │  │                 │  │                 │
│  📧 Email       │  │  📧 Email       │  │  📧 Email       │
│  alice@...      │  │  bob@...        │  │  claire@...     │
│                 │  │                 │  │                 │
│  🏷️ Source      │  │  🏷️ Source      │  │  🏷️ Source      │
│  manuel         │  │  manuel         │  │  web            │
│                 │  │                 │  │                 │
│ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │
│ │📞 Appeler   │ │  │ │📞 Appeler   │ │  │ │📞 Appeler   │ │
│ │  maintenant │ │  │ │  maintenant │ │  │ │  maintenant │ │
│ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## ✅ Checklist de Validation

Votre simulation fonctionne si :

- [ ] Zoiper affiche "Registered" (point vert)
- [ ] Le serveur Symfony tourne sur `localhost:8000`
- [ ] La page `/contacts` s'affiche
- [ ] Vous voyez des cartes de contacts
- [ ] Un clic sur un numéro ouvre Zoiper
- [ ] Le numéro est composé dans Zoiper

---

## 🐛 Problèmes Courants

### ❌ "Page not found" sur /contacts
```bash
# Vider le cache
cd C:\Users\Rovan\Documents\Zanova_Entreprise\CRM_call_center\crm_call
php bin/console cache:clear
```

### ❌ Zoiper ne s'ouvre pas au clic
**Windows** :
1. Paramètres > Applications > Applications par défaut
2. "Choisir par protocole"
3. Associez `TEL` et `CALLTO` à **Zoiper5**

### ❌ Aucun contact affiché
```sql
-- Vérifier les contacts dans MySQL
SELECT * FROM contacts;

-- Vérifier les campagnes
SELECT * FROM campaigns;
```

### ❌ Erreur "Campaign not found" dans les contacts
```sql
-- Assigner les contacts orphelins à la dernière campagne
UPDATE contacts 
SET campaign_id = (SELECT id FROM campaigns ORDER BY id DESC LIMIT 1)
WHERE campaign_id IS NULL OR campaign_id NOT IN (SELECT id FROM campaigns);
```

---

## 📚 Documentation Complète

Pour plus de détails, consultez :

1. **SIMULATION_GUIDE.md** → Guide complet A-Z
2. **ZOIPER_TEST_CONFIG.md** → Configuration SIP détaillée
3. **ZOIPER_SETUP.md** → Guide général Zoiper

---

## 🎉 Étapes Suivantes (Après validation)

Une fois la simulation validée :

### Pour un vrai Call Center :
1. **Opérateur VoIP** : OVH Telecom, RingOver, Twilio
2. **Numéros réels** : Obtenir des lignes SIP professionnelles
3. **Multi-utilisateurs** : Plusieurs agents Zoiper

### Fonctionnalités avancées :
1. **Historique d'appels** : Logger les appels dans la DB
2. **Notes post-appel** : Formulaire après l'appel
3. **Auto-dialer** : Numérotation automatique
4. **Statistiques** : Durée, nombre d'appels, etc.

---

## 🆘 Besoin d'Aide ?

Si ça ne fonctionne pas :

1. ✅ Vérifiez chaque étape de cette checklist
2. ✅ Consultez `SIMULATION_GUIDE.md` (plus détaillé)
3. ✅ Vérifiez les logs Symfony : `var/log/dev.log`
4. ✅ Testez dans un autre navigateur

---

**Bonne simulation ! 🚀📞**
