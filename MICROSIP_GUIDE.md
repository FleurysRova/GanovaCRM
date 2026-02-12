# 🚀 Guide Click-to-Call : MicroSIP Edition

MicroSIP est maintenant votre plateforme téléphonique pour le CRM. C'est plus rapide, plus léger et plus fiable que Zoiper.

## 1. Installation 📥
1. Téléchargez MicroSIP : [https://www.microsip.org/downloads](https://www.microsip.org/downloads)
2. Installez-le avec les options par défaut.

## 2. Configuration Windows (Crucial) ⚙️
Pour que le clic dans le CRM ouvre MicroSIP :
1. Ouvrez une invite de commande ou PowerShell.
2. Allez dans le dossier du projet :
   ```cmd
   cd "C:\Users\Rovan\Documents\Zanova_Entreprise\CRM_call_center"
   ```
3. Lancez le script de configuration :
   ```cmd
   powershell -ExecutionPolicy Bypass -File configure_microsip.ps1
   ```
4. Allez dans **Paramètres Windows** > **Applications** > **Applications par défaut**.
5. Cherchez **"tel"** et sélectionnez **MicroSIP**.

## 3. Configuration du compte SIP dans MicroSIP 📞
1. Ouvrez MicroSIP.
2. Cliquez sur la petite flèche en haut à droite (ou Menu) -> **Add Account**.
3. Remplissez les champs avec vos identifiants (ceux fournis par votre opérateur VoIP) :
   - **Account Name** : CRM
   - **SIP Server** : (ex: sip.ovh.fr)
   - **User** : Votre identifiant
   - **Domain** : (souvent le même que SIP Server)
   - **Password** : Votre mot de passe SIP
4. Cliquez sur **Save**. Le statut en bas à gauche doit devenir **"Online"** (vert).

## 4. Test dans le CRM 🧪
1. Connectez-vous à votre CRM : [http://localhost:8000/contacts](http://localhost:8000/contacts)
2. Cliquez sur le bouton **"Appeler maintenant"** d'un contact.
3. MicroSIP doit s'ouvrir et lancer l'appel **instantanément**.

---

## ❓ Pourquoi MicroSIP est mieux ?
- **Auto-Dial** : Il compose le numéro tout de suite sans demander confirmation.
- **Légèreté** : Il ne consomme presque rien en batterie et en RAM.
- **Fiabilité** : Il ne "perd" pas les numéros envoyés par le navigateur.

---
*Note : Si vous avez besoin de retourner sur Zoiper, le script `configure_zoiper.ps1` est toujours disponible, mais nous recommandons vivement MicroSIP pour cette intégration.*
