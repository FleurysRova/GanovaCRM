/**
 * Gestionnaire centralisé des erreurs
 * Uniformise la gestion des erreurs et fournit une expérience utilisateur cohérente
 */
export class ErrorHandler {
    static errorTypes = {
        NETWORK: 'network',
        AUTHENTICATION: 'authentication',
        VALIDATION: 'validation',
        PERMISSION: 'permission',
        SERVER: 'server',
        CLIENT: 'client',
        UNKNOWN: 'unknown'
    };

    static errorMessages = {
        network: 'Problème de connexion. Vérifiez votre internet et réessayez.',
        authentication: 'Session expirée. Veuillez vous reconnecter.',
        validation: 'Données invalides. Veuillez vérifier les informations saisies.',
        permission: 'Vous n\'avez pas les permissions nécessaires pour cette action.',
        server: 'Erreur serveur. Nos équipes sont informées et travaillent sur une solution.',
        client: 'Une erreur est survenue dans l\'application.',
        unknown: 'Une erreur inattendue est survenue.'
    };

    /**
     * Gère une erreur de manière centralisée
     * @param {Error|Object} error - L'erreur à gérer
     * @param {string} context - Contexte de l'erreur (ex: 'UserService.login')
     * @param {Object} options - Options supplémentaires
     */
    static handle(error, context = '', options = {}) {
        const {
            showNotification = true,
            logToConsole = true,
            logToServer = true,
            customMessage = null,
            severity = 'error'
        } = options;

        const errorInfo = this.parseError(error);
        
        // Logging
        if (logToConsole) {
            this.logToConsole(errorInfo, context);
        }

        if (logToServer) {
            this.logToServer(errorInfo, context);
        }

        // Notification utilisateur
        if (showNotification) {
            const message = customMessage || this.getUserFriendlyMessage(errorInfo);
            this.showUserNotification(message, errorInfo.type, severity);
        }

        // Actions spécifiques selon le type d'erreur
        this.handleSpecificError(errorInfo, context);

        return errorInfo;
    }

    /**
     * Analyse et normalise une erreur
     * @param {Error|Object} error - L'erreur à analyser
     * @returns {Object} Informations normalisées sur l'erreur
     */
    static parseError(error) {
        const errorInfo = {
            type: this.errorTypes.UNKNOWN,
            message: 'Erreur inconnue',
            originalError: error,
            timestamp: new Date().toISOString(),
            stack: null
        };

        if (error instanceof Error) {
            errorInfo.message = error.message;
            errorInfo.stack = error.stack;
        } else if (typeof error === 'string') {
            errorInfo.message = error;
        } else if (error && typeof error === 'object') {
            errorInfo.message = error.message || error.error || 'Erreur objet';
            errorInfo.type = this.detectErrorType(error);
        }

        // Détecter le type d'erreur depuis le message ou le statut HTTP
        if (errorInfo.type === this.errorTypes.UNKNOWN) {
            errorInfo.type = this.detectErrorTypeFromMessage(errorInfo.message);
        }

        return errorInfo;
    }

    /**
     * Détecte le type d'erreur depuis un objet erreur
     * @private
     */
    static detectErrorType(error) {
        // Erreurs HTTP
        if (error.status || error.statusCode) {
            const status = error.status || error.statusCode;
            
            if (status === 401 || status === 403) {
                return this.errorTypes.AUTHENTICATION;
            } else if (status >= 400 && status < 500) {
                return status === 400 ? this.errorTypes.VALIDATION : this.errorTypes.PERMISSION;
            } else if (status >= 500) {
                return this.errorTypes.SERVER;
            }
        }

        // Erreurs réseau
        if (error.name === 'NetworkError' || error.message.includes('fetch')) {
            return this.errorTypes.NETWORK;
        }

        return this.errorTypes.CLIENT;
    }

    /**
     * Détecte le type d'erreur depuis le message
     * @private
     */
    static detectErrorTypeFromMessage(message) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
            return this.errorTypes.NETWORK;
        } else if (lowerMessage.includes('unauthorized') || lowerMessage.includes('token')) {
            return this.errorTypes.AUTHENTICATION;
        } else if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
            return this.errorTypes.VALIDATION;
        } else if (lowerMessage.includes('permission') || lowerMessage.includes('forbidden')) {
            return this.errorTypes.PERMISSION;
        } else if (lowerMessage.includes('server') || lowerMessage.includes('500')) {
            return this.errorTypes.SERVER;
        }

        return this.errorTypes.CLIENT;
    }

    /**
     * Affiche un message convivial à l'utilisateur
     * @returns {string} Message utilisateur
     */
    static getUserFriendlyMessage(errorInfo) {
        const baseMessage = this.errorMessages[errorInfo.type] || this.errorMessages.unknown;
        
        // Ajouter des détails spécifiques si disponible
        if (errorInfo.type === this.errorTypes.VALIDATION && errorInfo.originalError?.details) {
            return `${baseMessage}\n${errorInfo.originalError.details}`;
        }

        return baseMessage;
    }

    /**
     * Affiche une notification à l'utilisateur
     * @private
     */
    static showUserNotification(message, type, severity = 'error') {
        // Créer ou utiliser un système de notification
        const notification = {
            id: Date.now(),
            message,
            type,
            severity,
            timestamp: new Date().toISOString(),
            autoHide: type !== this.errorTypes.AUTHENTICATION // Ne pas auto-cacher les erreurs d'auth
        };

        // Ajouter à l'état global si disponible
        if (window.stateManager) {
            const notifications = window.stateManager.getState('notifications', []);
            window.stateManager.setState('notifications', [...notifications, notification], true);
        }

        // Afficher immédiatement
        this.renderNotification(notification);
    }

    /**
     * Affiche une notification dans le DOM
     * @private
     */
    static renderNotification(notification) {
        // Créer le conteneur de notifications s'il n'existe pas
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        const notificationElement = document.createElement('div');
        notificationElement.className = `notification notification-${notification.severity} notification-${notification.type}`;
        notificationElement.innerHTML = `
            <div class="notification-content">
                <i class="notification-icon fas ${this.getIconForType(notification.type)}"></i>
                <span class="notification-message">${notification.message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        container.appendChild(notificationElement);

        // Auto-suppression
        if (notification.autoHide) {
            setTimeout(() => {
                notificationElement.remove();
            }, 5000);
        }

        // Animation d'entrée
        setTimeout(() => {
            notificationElement.classList.add('show');
        }, 10);
    }

    /**
     * Retourne l'icône appropriée pour un type d'erreur
     * @private
     */
    static getIconForType(type) {
        const icons = {
            [this.errorTypes.NETWORK]: 'fa-wifi',
            [this.errorTypes.AUTHENTICATION]: 'fa-lock',
            [this.errorTypes.VALIDATION]: 'fa-exclamation-triangle',
            [this.errorTypes.PERMISSION]: 'fa-shield-alt',
            [this.errorTypes.SERVER]: 'fa-server',
            [this.errorTypes.CLIENT]: 'fa-bug',
            [this.errorTypes.UNKNOWN]: 'fa-question-circle'
        };

        return icons[type] || icons[this.errorTypes.UNKNOWN];
    }

    /**
     * Gère les actions spécifiques selon le type d'erreur
     * @private
     */
    static handleSpecificError(errorInfo, context) {
        switch (errorInfo.type) {
            case this.errorTypes.AUTHENTICATION:
                // Rediriger vers la page de login
                this.handleAuthenticationError();
                break;
            
            case this.errorTypes.NETWORK:
                // Activer le mode hors ligne si disponible
                this.handleNetworkError();
                break;
            
            case this.errorTypes.SERVER:
                // Afficher un message de maintenance
                this.handleServerError();
                break;
        }
    }

    /**
     * Gère les erreurs d'authentification
     * @private
     */
    static handleAuthenticationError() {
        // Nettoyer le token et rediriger
        if (window.stateManager) {
            window.stateManager.setState('token', null, true);
            window.stateManager.setState('currentUser', null, true);
        }
        
        localStorage.removeItem('zanova_token');
        
        // Rediriger vers l'écran d'authentification
        if (window.app && typeof window.app.showAuthScreen === 'function') {
            window.app.showAuthScreen();
        }
    }

    /**
     * Gère les erreurs réseau
     * @private
     */
    static handleNetworkError() {
        // Activer le mode hors ligne si disponible
        if (window.stateManager) {
            window.stateManager.setState('isOffline', true);
        }
    }

    /**
     * Gère les erreurs serveur
     * @private
     */
    static handleServerError() {
        // Afficher une bannière de maintenance
        const banner = document.createElement('div');
        banner.className = 'server-error-banner';
        banner.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>Difficultés techniques temporaires. Nos équipes travaillent sur une solution.</span>
        `;
        
        const header = document.querySelector('header');
        if (header) {
            header.appendChild(banner);
        }
    }

    /**
     * Log dans la console
     * @private
     */
    static logToConsole(errorInfo, context) {
        console.group(`🚨 Error in ${context}`);
        console.error('Type:', errorInfo.type);
        console.error('Message:', errorInfo.message);
        console.error('Timestamp:', errorInfo.timestamp);
        if (errorInfo.stack) {
            console.error('Stack:', errorInfo.stack);
        }
        console.groupEnd();
    }

    /**
     * Envoie l'erreur au serveur pour monitoring
     * @private
     */
    static logToServer(errorInfo, context) {
        // Envoyer à un service de monitoring externe
        try {
            const errorData = {
                ...errorInfo,
                context,
                userAgent: navigator.userAgent,
                url: window.location.href,
                userId: window.stateManager?.getState('currentUser')?.id || 'anonymous'
            };

            // Utiliser navigator.sendBeacon pour ne pas bloquer
            navigator.sendBeacon('/api/errors', JSON.stringify(errorData));
        } catch (e) {
            console.warn('Failed to send error to server:', e);
        }
    }

    /**
     * Crée un rapport d'erreur détaillé
     */
    static createErrorReport(errorInfo, context) {
        return {
            error: errorInfo,
            context,
            environment: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: new Date().toISOString(),
                state: window.stateManager?.exportState() || null
            }
        };
    }
}

// Export pour utilisation globale
window.ErrorHandler = ErrorHandler;
