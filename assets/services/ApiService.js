/**
 * Service API de base
 * Gère toutes les communications HTTP avec le backend
 */
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { stateManager } from '../utils/StateManager.js';

export class ApiService {
    constructor() {
        this.baseUrl = '/api';
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        this.timeout = 30000; // 30 secondes
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    /**
     * Récupère le token d'authentification
     * @private
     */
    getAuthToken() {
        return stateManager.getState('token') || localStorage.getItem('zanova_token');
    }

    /**
     * Prépare les en-têtes pour une requête
     * @private
     */
    prepareHeaders(customHeaders = {}) {
        const headers = { ...this.defaultHeaders, ...customHeaders };
        
        const token = this.getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * Crée une requête avec timeout
     * @private
     */
    createRequestWithTimeout(url, options) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, this.timeout);

            fetch(url, options)
                .then(response => {
                    clearTimeout(timeoutId);
                    resolve(response);
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    reject(error);
                });
        });
    }

    /**
     * Gère les tentatives de retry
     * @private
     */
    async retryRequest(requestFn, attempt = 1) {
        try {
            return await requestFn();
        } catch (error) {
            if (attempt < this.retryAttempts && this.shouldRetry(error)) {
                await this.delay(this.retryDelay * attempt);
                return this.retryRequest(requestFn, attempt + 1);
            }
            throw error;
        }
    }

    /**
     * Détermine si une erreur doit être retentée
     * @private
     */
    shouldRetry(error) {
        // Retenter en cas d'erreur réseau ou timeout
        return error.name === 'NetworkError' || 
               error.message === 'Request timeout' ||
               error.message.includes('fetch');
    }

    /**
     * Délai d'attente
     * @private
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Gère la réponse HTTP
     * @private
     */
    async handleResponse(response, endpoint) {
        // Gérer les réponses vides (204 No Content)
        if (response.status === 204) {
            return null;
        }

        // Essayer de parser le JSON
        let data;
        try {
            data = await response.json();
        } catch (error) {
            throw new Error('Invalid JSON response');
        }

        // Gérer les erreurs HTTP
        if (!response.ok) {
            const error = new Error(data.message || data.error || `HTTP ${response.status}`);
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    }

    /**
     * Requête HTTP générique
     * @param {string} endpoint - Endpoint de l'API
     * @param {Object} options - Options de la requête
     * @returns {Promise} Réponse de l'API
     */
    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            headers = {},
            body = null,
            retries = true,
            context = `ApiService.${method} ${endpoint}`
        } = options;

        const url = `${this.baseUrl}${endpoint}`;
        const requestHeaders = this.prepareHeaders(headers);

        const requestOptions = {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : null
        };

        const requestFn = async () => {
            try {
                const response = await this.createRequestWithTimeout(url, requestOptions);
                return await this.handleResponse(response, endpoint);
            } catch (error) {
                throw ErrorHandler.handle(error, context, {
                    logToServer: true,
                    showNotification: false // Laisser le caller gérer la notification
                });
            }
        };

        if (retries) {
            return this.retryRequest(requestFn);
        } else {
            return requestFn();
        }
    }

    /**
     * Requête GET
     * @param {string} endpoint - Endpoint
     * @param {Object} options - Options
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    /**
     * Requête POST
     * @param {string} endpoint - Endpoint
     * @param {Object} data - Données à envoyer
     * @param {Object} options - Options
     */
    async post(endpoint, data = null, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body: data });
    }

    /**
     * Requête PUT
     * @param {string} endpoint - Endpoint
     * @param {Object} data - Données à envoyer
     * @param {Object} options - Options
     */
    async put(endpoint, data = null, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body: data });
    }

    /**
     * Requête PATCH
     * @param {string} endpoint - Endpoint
     * @param {Object} data - Données à envoyer
     * @param {Object} options - Options
     */
    async patch(endpoint, data = null, options = {}) {
        return this.request(endpoint, { ...options, method: 'PATCH', body: data });
    }

    /**
     * Requête DELETE
     * @param {string} endpoint - Endpoint
     * @param {Object} options - Options
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    /**
     * Upload de fichier
     * @param {string} endpoint - Endpoint
     * @param {FormData} formData - Données du formulaire
     * @param {Object} options - Options
     */
    async upload(endpoint, formData, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = this.prepareHeaders({
            // Ne pas définir Content-Type pour permettre au navigateur de le faire avec boundary
            ...options.headers
        });

        const requestOptions = {
            method: 'POST',
            headers,
            body: formData
        };

        try {
            const response = await this.createRequestWithTimeout(url, requestOptions);
            return await this.handleResponse(response, endpoint);
        } catch (error) {
            throw ErrorHandler.handle(error, `ApiService.upload ${endpoint}`, {
                logToServer: true
            });
        }
    }

    /**
     * Téléchargement de fichier
     * @param {string} endpoint - Endpoint
     * @param {string} filename - Nom du fichier
     * @param {Object} options - Options
     */
    async download(endpoint, filename, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = this.prepareHeaders(options.headers);

        try {
            const response = await this.createRequestWithTimeout(url, { headers });

            if (!response.ok) {
                throw new Error(`Download failed: ${response.status}`);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);

            return true;
        } catch (error) {
            throw ErrorHandler.handle(error, `ApiService.download ${endpoint}`, {
                logToServer: true
            });
        }
    }

    /**
     * Vérifie la connectivité avec le serveur
     * @returns {Promise<boolean} Statut de connexion
     */
    async checkConnectivity() {
        try {
            await this.get('/health', { 
                retries: false, 
                timeout: 5000,
                showNotification: false 
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Met à jour le token d'authentification
     * @param {string} token - Nouveau token
     */
    setAuthToken(token) {
        stateManager.setState('token', token, true);
    }

    /**
     * Supprime le token d'authentification
     */
    clearAuthToken() {
        stateManager.setState('token', null, true);
        localStorage.removeItem('zanova_token');
    }

    /**
     * Vérifie si le token est expiré
     * @returns {boolean} Token expiré
     */
    isTokenExpired() {
        const token = this.getAuthToken();
        if (!token) return true;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return Date.now() >= payload.exp * 1000;
        } catch {
            return true;
        }
    }

    /**
     * Rafraîchit le token d'authentification
     * @returns {Promise<string>} Nouveau token
     */
    async refreshToken() {
        try {
            const response = await this.post('/auth/refresh', {}, { retries: false });
            const newToken = response.token;
            this.setAuthToken(newToken);
            return newToken;
        } catch (error) {
            this.clearAuthToken();
            throw ErrorHandler.handle(error, 'ApiService.refreshToken', {
                customMessage: 'Session expirée. Veuillez vous reconnecter.'
            });
        }
    }

    /**
     * Intercepteur pour les requêtes sortantes
     * @private
     */
    async interceptRequest(request) {
        // Ajouter des logs en développement
        if (process.env.NODE_ENV === 'development') {
            console.log(`🚀 API Request: ${request.method} ${request.url}`);
        }

        // Vérifier l'expiration du token
        if (this.isTokenExpired()) {
            await this.refreshToken();
        }

        return request;
    }

    /**
     * Intercepteur pour les réponses entrantes
     * @private
     */
    async interceptResponse(response, request) {
        // Ajouter des logs en développement
        if (process.env.NODE_ENV === 'development') {
            console.log(`📥 API Response: ${request.method} ${request.url} - ${response.status}`);
        }

        return response;
    }
}

// Instance globale pour l'application
export const apiService = new ApiService();

// Export pour compatibilité globale
window.ApiService = ApiService;
window.apiService = apiService;
