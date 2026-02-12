# 🚀 Guide Complet : Simulation d'Appel avec Zoiper dans votre CRM

Ce guide vous permet de faire une **démonstration complète** de la fonctionnalité click-to-call dans votre CRM.

---

## 📋 Checklist des Prérequis

Avant de commencer, assurez-vous d'avoir :

- [ ] **Zoiper5 installé** sur votre machine
- [ ] **Un compte SIP configuré** dans Zoiper (voir ZOIPER_TEST_CONFIG.md)
- [ ] **Zoiper en mode "Registered"** (point vert)
- [ ] **Votre serveur Symfony lancé**
- [ ] **Des contacts de test** dans votre base de données

---

## 🎯 Étape 1 : Configuration de Zoiper (Simulation Locale)

### Option A : Compte SIP Gratuit LinPhone (Recommandé)

1. **Créer un compte SIP sur LinPhone** :
   - Allez sur [https://www.linphone.org/freesip/home](https://www.linphone.org/freesip/home)
   - Créez un compte (exemple: `testcrm2026`)
   - Notez vos identifiants

2. **Configurer Zoiper** :
   - Ouvrez Zoiper5
   - Cliquez sur "Add" (bouton vert)
   - Sélectionnez "SIP"
   - Remplissez :
     ```
     Domain: sip.linphone.org
     Username: testcrm2026 (votre username)
     Password: votre_mot_de_passe
     ```
   - Validez

3. **Vérifier** :
   - Le compte doit afficher un **point vert** ✅
   - Status: "Registered"

### Option B : Test Local sans Compte SIP

Si vous voulez juste tester le **mécanisme de click**, sans faire de vrai appel :

1. Dans Zoiper, laissez le compte "test@localhost" (même s'il est rouge)
2. Le click-to-call fonctionnera quand même et **ouvrira Zoiper**
3. L'appel échouera, mais vous verrez le numéro composé dans Zoiper

---

## 🎯 Étape 2 : Préparer votre Base de Données

### A. Vérifier qu'une campagne existe

```bash
# Lancez MySQL ou MariaDB
mysql -u root -p crm_call
```

```sql
-- Afficher les campagnes existantes
SELECT * FROM campaigns;

-- Si aucune campagne, créez-en une
INSERT INTO campaigns (nom, description, responsable_id, created_at)
VALUES ('Test Zoiper 2026', 'Campagne de démonstration', 1, NOW());
```

### B. Insérer des contacts de test

```bash
# Exécutez le script de test
mysql -u root -p crm_call < test_contacts.sql
```

Ou copiez-collez les commandes dans votre client MySQL.

### C. Vérifier les contacts

```sql
SELECT id, nom, telephone, status FROM contacts LIMIT 5;
```

Vous devriez voir :
```
+----+----------------+---------------+---------+
| id | nom            | telephone     | status  |
+----+----------------+---------------+---------+
|  1 | Alice Martin   | +33612345678  | nouveau |
|  2 | Bob Dupont     | +33623456789  | nouveau |
|  3 | Claire Bernard | +33634567890  | rappele |
...
```

---

## 🎯 Étape 3 : Lancer votre CRM

### A. Démarrer le serveur Symfony

```bash
cd C:\Users\Rovan\Documents\Zanova_Entreprise\CRM_call_center\crm_call

# Méthode 1 : avec Symfony CLI
symfony server:start

# Méthode 2 : avec PHP
php -S localhost:8000 -t public
```

### B. Accéder à la page des contacts

Ouvrez votre navigateur et allez à :

```
http://localhost:8000/contacts
```

ou

```
http://127.0.0.1:8000/contacts
```

> 💡 **Note** : Si vous n'êtes pas connecté, vous serez redirigé vers la page de login.
> Connectez-vous d'abord avec vos identifiants.

---

## 🎯 Étape 4 : Test du Click-to-Call

### Ce que vous devriez voir :

1. **Une belle interface** avec :
   - Un header violet avec le titre "📞 Gestion des Contacts"
   - Une barre indiquant "Zoiper détecté - Click-to-Call activé"
   - Des cartes de contacts avec avatars colorés

2. **Pour chaque contact** :
   - Nom
   - Téléphone (cliquable)
   - Email
   - Source
   - Bouton "📞 Appeler maintenant"

### Test du clic :

1. **Cliquez sur le numéro de téléphone** ou sur le bouton "Appeler maintenant"
2. **Votre navigateur** vous demandera peut-être :
   ```
   "Ouvrir Zoiper5?"
   [Toujours autoriser] [Autoriser] [Annuler]
   ```
3. **Cochez "Toujours autoriser"** pour éviter de redemander
4. **Zoiper s'ouvre** et compose le numéro

### Résultat attendu :

#### Avec un compte SIP configuré (LinPhone) :
- Zoiper compose le numéro
- L'appel échouera probablement (numéro fictif)
- Mais vous verrez le numéro dans l'interface Zoiper

#### Test avec un vrai appel SIP :
Pour tester un **vrai appel fonctionnel** :

1. Dans la page contacts, modifiez temporairement un numéro
2. Remplacez-le par : `sip:echo@sip.linphone.org`
3. Cliquez dessus
4. Vous devriez entendre un message de test (écho)

---

## 🎯 Étape 5 : Configuration Windows pour les Protocoles

Si le clic ne fonctionne pas, configurez Windows :

### Windows 10/11 :

1. **Paramètres** > **Applications** > **Applications par défaut**
2. Descendez jusqu'à **"Choisir les applications par protocole"**
3. Cherchez :
   - `CALLTO` → Sélectionnez **Zoiper5**
   - `TEL` → Sélectionnez **Zoiper5**
4. Redémarrez votre navigateur

---

## 📊 Démonstration Complète

Voici le **scénario de démonstration** complet :

### Scénario :

1. ✅ **Zoiper configuré** avec un compte SIP LinPhone
2. ✅ **Base de données** avec 10 contacts de test
3. ✅ **Serveur Symfony** lancé sur `localhost:8000`
4. ✅ **Page contacts** accessible via `/contacts`

### Flux de démonstration :

```
┌─────────────────────────────────────────┐
│ 1. Agent se connecte au CRM            │
│    → Login avec email/password          │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 2. Accède à la liste des contacts      │
│    → Voit 10 contacts magnifiquement    │
│      affichés dans des cartes           │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 3. Filtre par campagne (optionnel)     │
│    → Sélectionne "Test Zoiper 2026"     │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 4. Clique sur un numéro de téléphone   │
│    → Exemple: +33612345678              │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 5. Le navigateur ouvre Zoiper          │
│    → Demande d'autorisation (1ère fois) │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 6. Zoiper lance l'appel                │
│    → Numéro composé: +33612345678       │
│    → (L'appel échouera car fictif)      │
└─────────────────────────────────────────┘
```

---

## 🧪 Tests Avancés

### Test 1 : Appel Echo SIP

Pour tester un **vrai appel fonctionnel** :

1. Ajoutez un contact de test avec ce "numéro" :
   ```sql
   INSERT INTO contacts (nom, telephone, email, source, campaign_id, status, created_at)
   VALUES ('Test Echo', 'sip:echo@sip.linphone.org', 'test@test.com', 'test', 1, 'nouveau', NOW());
   ```

2. Cliquez sur ce contact dans l'interface
3. Zoiper devrait appeler le service d'écho
4. Vous entendrez votre voix répétée

### Test 2 : Appel entre deux comptes Zoiper

Si vous avez deux comptes LinPhone :

1. Compte 1 : `testcrm1@sip.linphone.org`
2. Compte 2 : `testcrm2@sip.linphone.org`

Ajoutez un contact :
```sql
INSERT INTO contacts (nom, telephone, email, source, campaign_id, status, created_at)
VALUES ('Autre Agent', 'sip:testcrm2@sip.linphone.org', 'test@test.com', 'test', 1, 'nouveau', NOW());
```

Les deux comptes Zoiper pourront s'appeler gratuitement !

---

## 🐛 Dépannage

### Problème 1 : "Rien ne se passe au clic"

**Solutions** :
- Vérifiez que Zoiper est **ouvert** et **en cours d'exécution**
- Configurez les protocoles `tel:` et `callto:` dans Windows
- Testez dans un autre navigateur (Chrome, Firefox, Edge)
- Vérifiez la console du navigateur (F12) pour les erreurs

### Problème 2 : "Zoiper ne se connecte pas (rouge)"

**Solutions** :
- Vérifiez vos identifiants SIP
- Vérifiez votre connexion Internet
- Testez avec un autre compte SIP (LinPhone, etc.)
- Vérifiez que le port 5060 n'est pas bloqué par votre firewall

### Problème 3 : "L'appel échoue immédiatement"

**C'est normal !** Les numéros de test sont fictifs.

**Pour un vrai test** :
- Utilisez `sip:echo@sip.linphone.org`
- Ou appelez un autre compte SIP que vous contrôlez

### Problème 4 : "Page 404 ou erreur de route"

**Solutions** :
```bash
# Vider le cache Symfony
php bin/console cache:clear

# Vérifier les routes
php bin/console debug:router | grep contact
```

Vous devriez voir :
```
contacts_list        GET      ANY      /contacts/
contacts_by_campaign GET      ANY      /contacts/campaign/{id}
```

---

## 📝 Résumé des Fichiers Créés

Voici tous les fichiers créés pour cette fonctionnalité :

### Backend :
- ✅ `src/Controller/ContactController.php` - Controller pour afficher les contacts
- ✅ `src/Entity/Contact.php` - Entité Contact (existait déjà)

### Frontend :
- ✅ `templates/contacts/list.html.twig` - Interface de gestion des contacts

### Documentation :
- ✅ `ZOIPER_SETUP.md` - Guide général Zoiper (existait déjà)
- ✅ `ZOIPER_TEST_CONFIG.md` - Configuration SIP de test
- ✅ `SIMULATION_GUIDE.md` - Ce guide (complet)

### Scripts :
- ✅ `test_contacts.sql` - Script pour insérer des contacts de test

---

## 🎉 Prochaines Étapes

Une fois la simulation fonctionnelle, vous pourrez :

### 1. Pour un vrai Call Center :
- Souscrire à un opérateur VoIP professionnel :
  - **OVH Telecom** (découverte ~1€/mois par ligne)
  - **RingOver** ou **Aircall** (solutions complètes)
  - **Twilio** (pour les développeurs)

### 2. Fonctionnalités avancées :
- **Enregistrement des appels** (côté Zoiper Pro ou serveur Asterisk)
- **Historique des appels** (logs dans la base de données)
- **Statistiques d'appels** (durée, statut, etc.)
- **Numérotation automatique** (auto-dialer)

### 3. Intégration avec le CRM :
- **Boutons d'action rapide** (après appel : "Rappeler", "Intéressé", "Non intéressé")
- **Notes d'appel** (formulaire après l'appel)
- **Assignation automatique** (prochain contact à appeler)

---

## ✅ Validation Finale

Votre simulation est réussie si :

- [x] Zoiper affiche "Registered" (ou "Connecting" avec test@localhost)
- [x] La page `/contacts` s'affiche correctement
- [x] Vous voyez une belle interface avec vos contacts
- [x] Un clic sur un numéro **ouvre Zoiper**
- [x] Le numéro est **composé dans Zoiper**

🎊 **Félicitations ! Votre CRM avec Click-to-Call fonctionne !**

---

## 📞 Support

Si vous avez des questions :
1. Vérifiez d'abord la section **Dépannage** ci-dessus
2. Consultez les logs Symfony : `var/log/dev.log`
3. Consultez les logs Zoiper : Menu > Options > Advanced > Logging

Bon test ! 🚀
