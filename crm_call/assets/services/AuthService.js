/**
 * Service d'authentification
 * Gère la connexion, déconnexion et la gestion des sessions utilisateur
 */
import { ApiService } from './ApiService.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { Validation } from '../utils/Validation.js';
import { stateManager } from '../utils/StateManager.js';

export class AuthService extends ApiService {
    constructor() {
        super();
        this.currentUser = null;
        this.loginAttempts = 0;
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    }

    /**
     * Connecte un utilisateur
     * @param {Object} credentials - Identifiants de connexion
     * @returns {Promise<Object>} Informations utilisateur et token
     */
    async login(credentials) {
        const { email, password, rememberMe = false } = credentials;

        // Validation des entrées
        const emailValidation = Validation.validateEmail(email);
        if (!emailValidation.isValid) {
            throw new Error(emailValidation.error);
        }

        if (!password || password.length < 1) {
            throw new Error('Le mot de passe est requis');
        }

        // Vérifier si l'utilisateur est bloqué
        if (this.isLockedOut()) {
            throw new Error('Trop de tentatives de connexion. Veuillez réessayer plus tard.');
        }

        try {
            // Appel API pour la connexion
            const response = await this.post('/auth/login', {
                email: emailValidation.sanitized,
                password,
                remember_me: rememberMe
            }, {
                context: 'AuthService.login',
                retries: false // Ne pas retenter en cas d'échec d'auth
            });

            // Traitement de la réponse
            const { user, token, expires_in } = response;

            // Stocker les informations
            this.setAuthData(user, token, rememberMe);
            
            // Réinitialiser les tentatives de connexion
            this.loginAttempts = 0;
            this.clearLockout();

            // Événement de connexion réussie
            this.dispatchAuthEvent('login', user);

            return {
                user: this.sanitizeUserData(user),
                token,
                expiresIn: expires_in
            };

        } catch (error) {
            this.handleLoginFailure();
            throw ErrorHandler.handle(error, 'AuthService.login', {
                customMessage: 'Identifiants invalides. Veuillez vérifier vos informations.'
            });
        }
    }

    /**
     * Déconnecte l'utilisateur courant
     * @param {boolean} showNotification - Afficher une notification
     */
    async logout(showNotification = true) {
        try {
            // Appel API pour la déconnexion (si possible)
            if (this.getAuthToken()) {
                await this.post('/auth/logout', {}, { retries: false });
            }
        } catch (error) {
            // Ignorer les erreurs de déconnexion API
            console.warn('Logout API call failed:', error);
        } finally {
            // Nettoyer les données locales même si l'appel API échoue
            this.clearAuthData();
            
            // Événement de déconnexion
            this.dispatchAuthEvent('logout');

            if (showNotification) {
                // Notification de déconnexion réussie
                const notification = {
                    id: Date.now(),
                    message: 'Vous avez été déconnecté avec succès',
                    type: 'info',
                    severity: 'info',
                    autoHide: true
                };

                const notifications = stateManager.getState('notifications', []);
                stateManager.setState('notifications', [...notifications, notification]);
            }
        }
    }

    /**
     * Enregistre un nouvel utilisateur
     * @param {Object} userData - Données d'inscription
     * @returns {Promise<Object>} Utilisateur créé
     */
    async register(userData) {
        const { email, password, firstName, lastName, phone } = userData;

        // Validation des données
        const validations = [
            Validation.validateEmail(email),
            Validation.validatePassword(password),
            Validation.validateName(firstName, { label: 'Prénom' }),
            Validation.validateName(lastName, { label: 'Nom' })
        ];

        if (phone) {
            validations.push(Validation.validatePhone(phone));
        }

        const errors = validations.filter(v => !v.isValid);
        if (errors.length > 0) {
            throw new Error(errors.map(e => e.error).join(', '));
        }

        try {
            const response = await this.post('/auth/register', {
                email: validations[0].sanitized,
                password,
                first_name: validations[2].sanitized,
                last_name: validations[3].sanitized,
                phone: phone ? validations[4]?.sanitized : null
            }, {
                context: 'AuthService.register',
                retries: false
            });

            // Nettoyer les données utilisateur retournées
            return this.sanitizeUserData(response.user);

        } catch (error) {
            throw ErrorHandler.handle(error, 'AuthService.register');
        }
    }

    /**
     * Demande la réinitialisation du mot de passe
     * @param {string} email - Email de l'utilisateur
     * @returns {Promise<boolean>} Succès de la demande
     */
    async requestPasswordReset(email) {
        const emailValidation = Validation.validateEmail(email);
        if (!emailValidation.isValid) {
            throw new Error(emailValidation.error);
        }

        try {
            await this.post('/auth/password/reset-request', {
                email: emailValidation.sanitized
            }, {
                context: 'AuthService.requestPasswordReset',
                retries: false
            });

            return true;

        } catch (error) {
            throw ErrorHandler.handle(error, 'AuthService.requestPasswordReset', {
                customMessage: 'Impossible de traiter la demande. Veuillez réessayer.'
            });
        }
    }

    /**
     * Réinitialise le mot de passe
     * @param {string} token - Token de réinitialisation
     * @param {string} newPassword - Nouveau mot de passe
     * @returns {Promise<boolean>} Succès de la réinitialisation
     */
    async resetPassword(token, newPassword) {
        const passwordValidation = Validation.validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            throw new Error(passwordValidation.error);
        }

        try {
            await this.post('/auth/password/reset', {
                token,
                password: newPassword
            }, {
                context: 'AuthService.resetPassword',
                retries: false
            });

            return true;

        } catch (error) {
            throw ErrorHandler.handle(error, 'AuthService.resetPassword', {
                customMessage: 'Lien de réinitialisation invalide ou expiré.'
            });
        }
    }

    /**
     * Change le mot de passe de l'utilisateur connecté
     * @param {string} currentPassword - Mot de passe actuel
     * @param {string} newPassword - Nouveau mot de passe
     * @returns {Promise<boolean>} Succès du changement
     */
    async changePassword(currentPassword, newPassword) {
        const newPasswordValidation = Validation.validatePassword(newPassword);
        if (!newPasswordValidation.isValid) {
            throw new Error(newPasswordValidation.error);
        }

        try {
            await this.post('/auth/password/change', {
                current_password: currentPassword,
                new_password: newPassword
            }, {
                context: 'AuthService.changePassword'
            });

            return true;

        } catch (error) {
            throw ErrorHandler.handle(error, 'AuthService.changePassword', {
                customMessage: 'Mot de passe actuel incorrect ou nouveau mot de passe invalide.'
            });
        }
    }

    /**
     * Vérifie si l'utilisateur est actuellement authentifié
     * @returns {boolean} Statut d'authentification
     */
    isAuthenticated() {
        const token = this.getAuthToken();
        const user = stateManager.getState('currentUser');
        
        return !!(token && user && !this.isTokenExpired());
    }

    /**
     * Récupère l'utilisateur courant
     * @param {boolean} forceRefresh - Forcer le rafraîchissement depuis l'API
     * @returns {Promise<Object|null>} Utilisateur courant
     */
    async getCurrentUser(forceRefresh = false) {
        if (!this.isAuthenticated()) {
            return null;
        }

        let user = stateManager.getState('currentUser');

        if (!user || forceRefresh) {
            try {
                const response = await this.get('/auth/me', {
                    context: 'AuthService.getCurrentUser'
                });
                
                user = this.sanitizeUserData(response.user);
                stateManager.setState('currentUser', user, true);
                this.currentUser = user;

            } catch (error) {
                // En cas d'erreur, déconnecter l'utilisateur
                await this.logout(false);
                throw ErrorHandler.handle(error, 'AuthService.getCurrentUser');
            }
        }

        return user;
    }

    /**
     * Met à jour le profil utilisateur
     * @param {Object} updates - Données à mettre à jour
     * @returns {Promise<Object>} Utilisateur mis à jour
     */
    async updateProfile(updates) {
        const sanitizedUpdates = {};

        // Validation et nettoyage des champs
        if (updates.firstName) {
            const validation = Validation.validateName(updates.firstName);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }
            sanitizedUpdates.first_name = validation.sanitized;
        }

        if (updates.lastName) {
            const validation = Validation.validateName(updates.lastName);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }
            sanitizedUpdates.last_name = validation.sanitized;
        }

        if (updates.email) {
            const validation = Validation.validateEmail(updates.email);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }
            sanitizedUpdates.email = validation.sanitized;
        }

        if (updates.phone) {
            const validation = Validation.validatePhone(updates.phone);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }
            sanitizedUpdates.phone = validation.sanitized;
        }

        try {
            const response = await this.put('/auth/profile', sanitizedUpdates, {
                context: 'AuthService.updateProfile'
            });

            const updatedUser = this.sanitizeUserData(response.user);
            stateManager.setState('currentUser', updatedUser, true);
            this.currentUser = updatedUser;

            this.dispatchAuthEvent('profile-updated', updatedUser);

            return updatedUser;

        } catch (error) {
            throw ErrorHandler.handle(error, 'AuthService.updateProfile');
        }
    }

    /**
     * Stocke les données d'authentification
     * @private
     */
    setAuthData(user, token, rememberMe = false) {
        const sanitizedUser = this.sanitizeUserData(user);
        
        // Stocker dans l'état global
        stateManager.setState('currentUser', sanitizedUser, true);
        stateManager.setState('token', token, rememberMe);
        
        // Stocker dans le service
        this.currentUser = sanitizedUser;
        this.setAuthToken(token);
    }

    /**
     * Nettoie les données d'authentification
     * @private
     */
    clearAuthData() {
        stateManager.setState('currentUser', null, true);
        stateManager.setState('token', null, true);
        
        this.currentUser = null;
        this.clearAuthToken();
    }

    /**
     * Nettoie les données utilisateur pour éviter les fuites d'informations
     * @private
     */
    sanitizeUserData(user) {
        if (!user) return null;

        const { password, ...sanitizedUser } = user;
        
        // Supprimer d'autres champs sensibles si nécessaire
        delete sanitizedUser.password_reset_token;
        delete sanitizedUser.email_verification_token;

        return sanitizedUser;
    }

    /**
     * Gère les échecs de connexion
     * @private
     */
    handleLoginFailure() {
        this.loginAttempts++;
        
        if (this.loginAttempts >= this.maxLoginAttempts) {
            this.setLockout();
        }
    }

    /**
     * Vérifie si l'utilisateur est bloqué
     * @private
     */
    isLockedOut() {
        const lockoutUntil = localStorage.getItem('auth_lockout_until');
        if (!lockoutUntil) return false;

        return Date.now() < parseInt(lockoutUntil);
    }

    /**
     * Définit le blocage
     * @private
     */
    setLockout() {
        const lockoutUntil = Date.now() + this.lockoutDuration;
        localStorage.setItem('auth_lockout_until', lockoutUntil.toString());
        localStorage.setItem('auth_login_attempts', this.loginAttempts.toString());
    }

    /**
     * Supprime le blocage
     * @private
     */
    clearLockout() {
        localStorage.removeItem('auth_lockout_until');
        localStorage.removeItem('auth_login_attempts');
    }

    /**
     * Dispatch un événement d'authentification
     * @private
     */
    dispatchAuthEvent(eventType, data = null) {
        const event = new CustomEvent('auth', {
            detail: {
                type: eventType,
                data,
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Vérifie les permissions de l'utilisateur
     * @param {string|Array} permissions - Permissions requises
     * @returns {boolean} L'utilisateur a les permissions
     */
    hasPermission(permissions) {
        if (!this.currentUser) return false;

        const userPermissions = this.currentUser.permissions || [];
        const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

        return requiredPermissions.every(permission => 
            userPermissions.includes(permission) || userPermissions.includes('*')
        );
    }

    /**
     * Vérifie si l'utilisateur a un rôle spécifique
     * @param {string|Array} roles - Rôles requis
     * @returns {boolean} L'utilisateur a les rôles
     */
    hasRole(roles) {
        if (!this.currentUser) return false;

        const userRole = this.currentUser.role;
        const requiredRoles = Array.isArray(roles) ? roles : [roles];

        return requiredRoles.includes(userRole);
    }
}

// Instance globale pour l'application
export const authService = new AuthService();

// Export pour compatibilité globale
window.AuthService = AuthService;
window.authService = authService;
