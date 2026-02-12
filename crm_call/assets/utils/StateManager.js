/**
 * Gestionnaire d'état centralisé avec pattern Observer
 * Permet de gérer l'état global de l'application et de notifier les changements
 */
export class StateManager {
    constructor() {
        this.state = {};
        this.subscribers = new Map();
        this.history = [];
        this.maxHistorySize = 50;
    }

    /**
     * Définit une valeur dans l'état et notifie les abonnés
     * @param {string} key - Clé de l'état
     * @param {*} value - Nouvelle valeur
     * @param {boolean} persist - Si true, sauvegarde dans localStorage
     */
    setState(key, value, persist = false) {
        const oldValue = this.state[key];
        
        // Ajouter à l'historique
        this.addToHistory(key, oldValue, value);
        
        // Mettre à jour l'état
        this.state[key] = value;
        
        // Persistance si demandé
        if (persist) {
            this.persistState(key, value);
        }
        
        // Notifier les abonnés
        this.notifySubscribers(key, value, oldValue);
        
        // Logger pour le debug
        this.debugLog(key, oldValue, value);
    }

    /**
     * Récupère une valeur de l'état
     * @param {string} key - Clé de l'état
     * @param {*} defaultValue - Valeur par défaut si la clé n'existe pas
     * @returns {*} Valeur de l'état
     */
    getState(key, defaultValue = null) {
        return this.state.hasOwnProperty(key) ? this.state[key] : defaultValue;
    }

    /**
     * S'abonne aux changements d'une clé d'état
     * @param {string} key - Clé à surveiller
     * @param {Function} callback - Fonction appelée lors des changements
     * @returns {Function} Fonction de désabonnement
     */
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, []);
        }
        
        const callbacks = this.subscribers.get(key);
        callbacks.push(callback);
        
        // Retourner une fonction de désabonnement
        return () => {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    /**
     * S'abonne à plusieurs clés simultanément
     * @param {string[]} keys - Liste des clés à surveiller
     * @param {Function} callback - Fonction appelée lors des changements
     * @returns {Function} Fonction de désabonnement
     */
    subscribeMultiple(keys, callback) {
        const unsubscribers = keys.map(key => this.subscribe(key, callback));
        
        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }

    /**
     * Notifie tous les abonnés d'une clé
     * @private
     */
    notifySubscribers(key, newValue, oldValue) {
        if (this.subscribers.has(key)) {
            this.subscribers.get(key).forEach(callback => {
                try {
                    callback(newValue, oldValue, key);
                } catch (error) {
                    console.error(`Error in subscriber for key "${key}":`, error);
                }
            });
        }
    }

    /**
     * Ajoute un changement à l'historique
     * @private
     */
    addToHistory(key, oldValue, newValue) {
        this.history.push({
            timestamp: Date.now(),
            key,
            oldValue,
            newValue
        });

        // Limiter la taille de l'historique
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    /**
     * Persiste l'état dans localStorage
     * @private
     */
    persistState(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(`zanova_state_${key}`, serializedValue);
        } catch (error) {
            console.warn(`Failed to persist state for key "${key}":`, error);
        }
    }

    /**
     * Restaure l'état depuis localStorage
     * @param {string} key - Clé à restaurer
     * @returns {*} Valeur restaurée ou null
     */
    restoreState(key) {
        try {
            const stored = localStorage.getItem(`zanova_state_${key}`);
            if (stored) {
                const value = JSON.parse(stored);
                this.setState(key, value);
                return value;
            }
        } catch (error) {
            console.warn(`Failed to restore state for key "${key}":`, error);
        }
        return null;
    }

    /**
     * Supprime une clé de l'état et du localStorage
     * @param {string} key - Clé à supprimer
     */
    clearState(key) {
        delete this.state[key];
        localStorage.removeItem(`zanova_state_${key}`);
        this.subscribers.delete(key);
    }

    /**
     * Vide tout l'état
     */
    clearAllState() {
        this.state = {};
        this.subscribers.clear();
        this.history = [];
        
        // Vider localStorage
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('zanova_state_')) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * Logger pour le développement
     * @private
     */
    debugLog(key, oldValue, newValue) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`State changed: ${key}`, {
                oldValue,
                newValue,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Récupère l'historique des changements
     * @param {string} key - Clé spécifique (optionnel)
     * @returns {Array} Historique des changements
     */
    getHistory(key = null) {
        if (key) {
            return this.history.filter(entry => entry.key === key);
        }
        return [...this.history];
    }

    /**
     * Exporte l'état actuel
     * @returns {Object} État sérialisé
     */
    exportState() {
        return {
            state: { ...this.state },
            timestamp: Date.now()
        };
    }

    /**
     * Importe un état
     * @param {Object} exportedState - État à importer
     */
    importState(exportedState) {
        if (exportedState && exportedState.state) {
            Object.entries(exportedState.state).forEach(([key, value]) => {
                this.setState(key, value);
            });
        }
    }
}

// Instance globale pour l'application
export const stateManager = new StateManager();

// État initial par défaut
const defaultState = {
    currentUser: null,
    theme: localStorage.getItem('zanova_theme') || 'dark',
    token: localStorage.getItem('zanova_token'),
    isLoading: false,
    notifications: [],
    currentView: 'dashboard',
    sidebarCollapsed: false
};

// Initialiser l'état par défaut
Object.entries(defaultState).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
        stateManager.setState(key, value, true);
    }
});

window.stateManager = stateManager; // Pour le debug en développement
