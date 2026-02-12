# Guide d'Installation et Configuration de Zoiper

Ce guide vous explique comment installer Zoiper et configurer votre CRM pour passer des appels en un clic.

## 1. Installation de Zoiper

Zoiper est un logiciel "Softphone" qui doit être installé sur votre ordinateur.

1.  Allez sur le site officiel : [https://www.zoiper.com/en/voip-softphone/download/current](https://www.zoiper.com/en/voip-softphone/download/current)
2.  Téléchargez la version **Gratuite** ou **Pro** selon vos besoins.
3.  Installez le logiciel sur votre machine (Windows/Mac/Linux).

## 2. Configuration du Compte SIP

**Important :** Zoiper est un logiciel vide (comme un téléphone sans carte SIM). Pour l'utiliser, vous devez avoir un **Compte SIP**.

### Option A : Pour un usage professionnel (Recommandé)
Vous devez souscrire un abonnement chez un opérateur VoIP. Vous recevrez alors un **Login**, un **Mot de passe** et un **Serveur (Domain)**.
*   **OVH Telecom** (Ligne SIP découverte ~1€/mois)
*   **RingOver / Aircall** (Solutions complètes Call Center)
*   **Twilio** (Pour les développeurs)

### Option B : Pour tester gratuitement (Sans appels vers mobiles)
Si vous voulez juste vérifier que Zoiper se connecte bien (passe au vert) :
1.  Créez un compte gratuit sur [linphone.org](https://www.linphone.org/free-sip-service) ou [iptel.org](https://www.iptel.org/service).
2.  Utilisez ces identifiants dans Zoiper.
    *   *Note : Vous ne pourrez appeler que d'autres comptes SIP gratuits, pas de vrais téléphones.*

### Configuration dans Zoiper
1.  Ouvrez Zoiper.
2.  Cliquez sur **Settings** (ou l'icône d'engrenage).
3.  Ajoutez un nouveau compte SIP.
4.  Entrez les informations :
    *   **Domain / Server** : (ex: `sip.ovh.fr` ou `sip.linphone.org`)
    *   **Username / Login** : Votr identifiant (ex: `0033123456789` ou `utilisateur_test`)
    *   **Password** : Votre mot de passe SIP.
5.  Validez et attendez que le statut passe au **Vert (Registered)**.

## 3. Configuration Windows (Important!)

Pour que les clics sur les numéros de téléphone ouvrent automatiquement Zoiper, vous devez configurer Windows :

### Option A : Script Automatique (Recommandé) ✅

Un script PowerShell a été créé pour configurer automatiquement Zoiper :

1. **Ouvrez PowerShell en tant qu'Administrateur**
   - Cliquez droit sur le menu Démarrer → Windows PowerShell (Admin)

2. **Naviguez vers le dossier du projet**
   ```powershell
   cd "C:\Users\Rovan\Documents\Zanova_Entreprise\CRM_call_center"
   ```

3. **Exécutez le script**
   ```powershell
   .\configure_zoiper.ps1
   ```

Le script va :
- Détecter automatiquement Zoiper sur votre système
- Configurer les protocoles `callto:` et `tel:` 
- Associer Zoiper comme gestionnaire par défaut

### Option B : Configuration Manuelle

Si le script ne fonctionne pas :

1. Ouvrez **Paramètres Windows** → **Applications**
2. Allez dans **Applications par défaut**
3. Cherchez **Choix des applications par défaut selon le protocole**
4. Trouvez `CALLTO` et `TEL` dans la liste
5. Cliquez sur chaque protocole et sélectionnez **Zoiper5**

## 4. Intégration CRM (Click-to-Call)


Le CRM a été mis à jour pour détecter la présence de Zoiper.

*   Désormais, tous les numéros de téléphone dans la liste des **Contacts** sont cliquables.
*   Lorsque vous cliquez sur un numéro, votre navigateur vous demandera peut-être une confirmation ("Ouvrir Zoiper ?").
*   Cochez "Toujours autoriser..." pour gagner du temps.

## 5. Dépannage

*   **Rien ne se passe au clic ?**
    *   Vérifiez que Zoiper est bien installé.
    *   Vérifiez les paramètres de votre navigateur/OS pour les liens `tel:` et `callto:`.
    *   Sous Windows : Paramètres > Applications > Applications par défaut > Choisir les applications par protocole > Associer `CALLTO` et `TEL` à Zoiper.

*   **L'appel échoue ?**
    *   Vérifiez que Zoiper indique "Registered".
    *   Vérifiez que le format du numéro est correct (International ou local).
