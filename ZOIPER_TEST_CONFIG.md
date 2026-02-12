# 📞 Configuration Zoiper pour Simulation d'Appel - Guide Pas à Pas

Ce guide vous permet de configurer Zoiper pour **simuler des appels** dans votre CRM sans avoir besoin d'un vrai opérateur VoIP.

## 🎯 Objectif
Configurer un compte SIP de test pour tester la fonctionnalité click-to-call de votre CRM.

---

## Option 1 : Compte SIP Gratuit LinPhone (Recommandé pour test)

### Étape 1 : Créer un compte SIP gratuit

1. Allez sur **[https://www.linphone.org/freesip/home](https://www.linphone.org/freesip/home)**
2. Cliquez sur "**Create a SIP account**"
3. Remplissez le formulaire :
   - **Username** : Choisissez un nom (ex: `testcrm123`)
   - **Password** : Choisissez un mot de passe fort
   - **Email** : Votre email
4. Validez et notez vos identifiants :
   ```
   Username: votre_nom_utilisateur
   Password: votre_mot_de_passe
   Domain: sip.linphone.org
   ```

### Étape 2 : Configurer Zoiper avec ce compte

1. **Ouvrez Zoiper5**
2. Cliquez sur le bouton **"Add"** (vert en bas à gauche)
3. Sélectionnez **"SIP"** comme type de compte
4. Entrez les informations :
   - **Account name** : `LinPhone Test` (nom d'affichage)
   - **Domain** : `sip.linphone.org`
   - **Username** : Votre username créé (ex: `testcrm123`)
   - **Password** : Votre mot de passe
5. Cliquez sur **"Create"** ou **"Next"**
6. Attendez quelques secondes

### Étape 3 : Vérifier la connexion

- Le compte doit afficher un **point vert** ou le statut **"Registered"**
- Si c'est rouge, vérifiez vos identifiants

---

## Option 2 : Configuration Locale avec Asterisk (Plus technique)

Si vous voulez un serveur SIP local complet :

### Installation d'Asterisk (Windows avec WSL ou serveur Linux)

```bash
# Sur Ubuntu/Debian
sudo apt update
sudo apt install asterisk

# Démarrer Asterisk
sudo systemctl start asterisk
```

### Configuration basique

Créez un fichier de test dans `/etc/asterisk/sip.conf` :

```ini
[general]
context=default
bindport=5060
bindaddr=0.0.0.0

[6001]
type=friend
secret=password123
host=dynamic
context=from-internal

[6002]
type=friend
secret=password123
host=dynamic
context=from-internal
```

Puis dans Zoiper, configurez :
- **Domain** : `localhost` ou `192.168.x.x` (IP de votre machine)
- **Username** : `6001`
- **Password** : `password123`

---

## 🧪 Test de la Configuration

### Test 1 : Vérifier que Zoiper est "Registered"

Dans Zoiper, vous devez voir :
- ✅ Un **point vert** à côté de votre compte
- ✅ Status : **"Registered"**

### Test 2 : Faire un appel de test

Si vous utilisez LinPhone :
1. Dans Zoiper, composez : `sip:echo@sip.linphone.org`
2. Cliquez sur **Call**
3. Vous devriez entendre un **message de test** (votre voix en écho)

---

## 🔗 Intégration avec le CRM

Une fois Zoiper configuré et "Registered", votre CRM pourra :

1. **Détecter Zoiper** installé sur votre machine
2. **Cliquer sur un numéro** dans la liste des contacts
3. **Zoiper s'ouvrira automatiquement** et composera le numéro

### Format des numéros

Le CRM va créer des liens comme :
```
tel:+33123456789
callto:0033123456789
```

Zoiper interceptera ces liens et initiera l'appel.

---

## ❗ Dépannage

### Problème : Zoiper ne passe pas au "Registered"
- Vérifiez votre connexion Internet
- Vérifiez les identifiants (username/password)
- Vérifiez que le port **5060** n'est pas bloqué par votre firewall

### Problème : Le clic sur le numéro ne fait rien
- Vérifiez que Zoiper est bien **ouvert** et **en cours d'exécution**
- Configurez Zoiper comme application par défaut pour les protocoles `tel:` et `callto:`
  - **Windows** : Paramètres > Applications par défaut > Choisir par protocole
  
### Problème : L'appel échoue immédiatement
- Avec un compte LinPhone gratuit, vous ne pouvez appeler que d'autres comptes SIP
- Pour appeler de vrais numéros, vous aurez besoin d'un compte VoIP payant (OVH, Twilio, etc.)

---

## 📝 Prochaines Étapes

1. ✅ Créer un compte SIP sur LinPhone.org
2. ✅ Configurer ce compte dans Zoiper
3. ✅ Vérifier que le statut est "Registered"
4. ✅ Tester avec `sip:echo@sip.linphone.org`
5. ✅ Utiliser le click-to-call dans votre CRM

---

## 🎓 Notes Importantes

- **LinPhone gratuit** : Idéal pour tester, mais limité aux appels SIP-vers-SIP
- **Pour de vrais appels** : Vous aurez besoin d'un opérateur VoIP payant
- **Sécurité** : Ne partagez jamais vos identifiants SIP en clair

Bon test ! 🚀
