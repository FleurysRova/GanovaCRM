/**
 * Point d'entrée pour les utilitaires
 * Exporte tous les utilitaires pour un import facile
 */

export { StateManager, stateManager } from './StateManager.js';
export { ErrorHandler } from './ErrorHandler.js';
export { Validation } from './Validation.js';

// Réexport pour compatibilité globale
window.StateManager = StateManager;
window.stateManager = stateManager;
window.ErrorHandler = ErrorHandler;
window.Validation = Validation;
