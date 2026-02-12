# 🚀 Guide Rapide : Activer Click-to-Call avec Zoiper

## ✅ Ce qui a été fait

Votre interface CRM a déjà **des boutons click-to-call** configurés dans le fichier :
- `crm_call/templates/contacts/list.html.twig`

Chaque contact affiche :
1. ✅ Un **numéro de téléphone cliquable** (ligne 391)
2. ✅ Un **bouton "Appeler maintenant"** (ligne 419)

Ces boutons utilisent maintenant le protocole `callto:` qui est mieux supporté par Zoiper.

---

## 🔧 Configuration nécessaire (À FAIRE)

Pour que Windows sache que Zoiper doit gérer les clics, vous devez :

### Méthode 1 : Script Automatique ⚡ (RECOMMANDÉ)

1. **Ouvrez PowerShell en mode Administrateur**
   - Clic droit sur le menu Démarrer
   - Sélectionnez "Windows PowerShell (Admin)" ou "Terminal (Admin)"

2. **Naviguez vers votre projet**
   ```powershell
   cd "C:\Users\Rovan\Documents\Zanova_Entreprise\CRM_call_center"
   ```

3. **Lancez le script de configuration**
   ```powershell
   .\configure_zoiper.ps1
   ```

Le script va automatiquement :
- 🔍 Détecter Zoiper sur votre machine
- ⚙️ Configurer les protocoles `callto:` et `tel:`
- ✅ Associer Zoiper comme gestionnaire par défaut

---

### Méthode 2 : Configuration Manuelle Windows

Si vous préférez configurer manuellement :

1. Ouvrez **Paramètres Windows** (touche Windows + I)
2. Allez dans **Applications** → **Applications par défaut**
3. Faites défiler jusqu'à **Choisir les applications par défaut selon le protocole**
4. Cherchez dans la liste :
   - **CALLTO** → cliquez et sélectionnez **Zoiper5**
   - **TEL** → cliquez et sélectionnez **Zoiper5**

---

## 🧪 Test de la configuration

Après la configuration, testez immédiatement :

### Option A : Page de test HTML

1. **Ouvrez le fichier dans votre navigateur**
   ```
   test_zoiper.html
   ```

2. **Cliquez sur les différents boutons de test**

3. **Vérifiez que Zoiper s'ouvre** avec le numéro

### Option B : Directement dans le CRM

1. **Lancez votre serveur Symfony** (si ce n'est pas déjà fait)
   ```powershell
   cd crm_call
   symfony serve
   ```

2. **Ouvrez votre CRM** : http://localhost:8000/contacts

3. **Cliquez sur un numéro de téléphone** ou sur le bouton "Appeler maintenant"

4. **Zoiper devrait s'ouvrir** automatiquement avec le numéro

---

## ❓ Dépannage

### Problème : "Rien ne se passe quand je clique"

**Solutions :**
1. ✅ Vérifiez que Zoiper est **installé**
2. ✅ Relancez le script `configure_zoiper.ps1` en mode Administrateur
3. ✅ Redémarrez votre navigateur après la configuration
4. ✅ Dans Zoiper, vérifiez Settings → Automation → "Set as default for callto:"

### Problème : "Zoiper s'ouvre mais l'appel ne démarre pas"

**Cela est NORMAL si :**
- ❌ Vous n'avez pas configuré de compte SIP dans Zoiper
- ❌ Le compte SIP n'est pas "Registered" (pas vert dans Zoiper)

**Solution :**
- 📖 Consultez `ZOIPER_SETUP.md` section 2 pour configurer un compte SIP
- 🆓 Pour tester : créez un compte gratuit sur linphone.org ou iptel.org
- 💼 Pour production : utilisez un vrai opérateur VoIP (OVH, RingOver, Aircall, etc.)

### Problème : "Le navigateur demande toujours 'Ouvrir Zoiper ?'"

**Solution :**
- ✅ Cochez la case **"Toujours autoriser"** ou **"Se souvenir de mon choix"**
- ✅ Cette boîte ne devrait apparaître qu'une seule fois

---

## 📂 Fichiers créés/modifiés

| Fichier | Description |
|---------|-------------|
| `configure_zoiper.ps1` | Script de configuration automatique Windows |
| `test_zoiper.html` | Page de test pour vérifier la configuration |
| `ZOIPER_SETUP.md` | Documentation complète mise à jour |
| `crm_call/templates/contacts/list.html.twig` | Template avec boutons click-to-call |

---

## 🎯 Prochaines étapes

Actuellement, votre CRM peut **déclencher Zoiper** mais :
- ⚠️ **Vous n'avez pas de serveur SIP** configuré
- ⚠️ Les appels resteront en état "Calling..." sans se connecter

**Pour des vrais appels, vous devez :**

1. **Choisir un fournisseur SIP** :
   - 🆓 **Test gratuit** : linphone.org, iptel.org (appels SIP-to-SIP uniquement)
   - 💼 **Production** : OVH Telecom (~1€/mois), RingOver, Aircall, Twilio

2. **Configurer le compte dans Zoiper** :
   - Settings → Add Account → Entrez vos identifiants SIP
   - Vérifiez que le statut est **"Registered" (vert)**

3. **Tester un vrai appel** depuis le CRM

---

## 💡 Résumé

✅ **Interface CRM** : Boutons click-to-call configurés  
⏳ **Configuration Windows** : À faire avec `configure_zoiper.ps1`  
⏳ **Compte SIP** : À configurer dans Zoiper pour passer de vrais appels  

**Prochaine action :** Exécutez le script PowerShell ! 🚀
