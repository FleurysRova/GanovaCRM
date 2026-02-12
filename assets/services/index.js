/**
 * Point d'entrée pour les services
 * Exporte tous les services pour un import facile
 */

export { ApiService, apiService } from './ApiService.js';
export { AuthService, authService } from './AuthService.js';

// Réexport pour compatibilité globale
window.ApiService = ApiService;
window.apiService = ApiService;
window.AuthService = AuthService;
window.authService = authService;
