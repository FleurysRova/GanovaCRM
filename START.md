# ⚡ DÉMARRAGE RAPIDE - 3 MINUTES

## 🎯 Objectif
Faire une simulation d'appel dans votre CRM avec Zoiper

---

## ✅ ÉTAPE 1 : Zoiper (30 secondes)

### Créer un compte SIP gratuit :
👉 https://www.linphone.org/freesip/home

- Username : `votreNom2026`
- Password : `votre_mdp`
- Email : votre email

### Configurer Zoiper :
1. Ouvrez **Zoiper5**
2. Cliquez **"Add"**
3. Choisissez **"SIP"**
4. Entrez :
   - Domain : `sip.linphone.org`
   - Username : `votreNom2026`
   - Password : `votre_mdp`
5. **Vérifiez le point VERT** ✅

---

## ✅ ÉTAPE 2 : Contacts (30 secondes)

```bash
# Dans PowerShell ou CMD
cd C:\Users\Rovan\Documents\Zanova_Entreprise\CRM_call_center

# Ajouter les contacts de test
mysql -u root -p crm_call < test_contacts.sql
```

---

## ✅ ÉTAPE 3 : Serveur (30 secondes)

```bash
cd C:\Users\Rovan\Documents\Zanova_Entreprise\CRM_call_center\crm_call

# Lancer le serveur
symfony server:start

# OU
php -S localhost:8000 -t public
```

---

## ✅ ÉTAPE 4 : TEST ! (1 minute)

1. Ouvrez : **http://localhost:8000/contacts**
2. Connectez-vous si demandé
3. **Cliquez sur un numéro de téléphone** 📞
4. Zoiper s'ouvre et compose ! 🎉

---

## 🧪 Test ÉCHO (pour entendre quelque chose)

```sql
-- Ajouter un contact spécial
mysql -u root -p crm_call

INSERT INTO contacts (nom, telephone, email, source, campaign_id, status, created_at)
VALUES ('Test Echo', 'sip:echo@sip.linphone.org', 'test@test.com', 'test', 
        (SELECT id FROM campaigns LIMIT 1), 'nouveau', NOW());
```

Cliquez sur ce contact → Vous entendrez votre voix ! 🎤

---

## 🆘 Problème ?

### Zoiper ne s'ouvre pas ?
**Windows** : Paramètres > Applications > Par protocole > TEL = Zoiper5

### Aucun contact affiché ?
```bash
# Vérifier
mysql -u root -p crm_call -e "SELECT * FROM contacts;"
```

### Page 404 ?
```bash
php bin/console cache:clear
```

---

## 📚 Plus de détails ?

- **RECAP_ZOIPER.md** → Guide visuel complet
- **SIMULATION_GUIDE.md** → Documentation détaillée
- **ZOIPER_TEST_CONFIG.md** → Configuration SIP

---

**C'est parti ! 🚀**
