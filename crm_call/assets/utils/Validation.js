/**
 * Utilitaires de validation des données
 * Fournit des méthodes réutilisables pour valider les entrées utilisateur
 */
export class Validation {
    /**
     * Nettoie une chaîne de caractères pour éviter les attaques XSS
     * @param {string} input - Chaîne à nettoyer
     * @param {Object} options - Options de nettoyage
     * @returns {string} Chaîne nettoyée
     */
    static sanitizeInput(input, options = {}) {
        if (typeof input !== 'string') {
            return '';
        }

        const {
            removeHTML = true,
            maxLength = 1000,
            trim = true,
            lowercase = false
        } = options;

        let cleaned = input;

        // Trim
        if (trim) {
            cleaned = cleaned.trim();
        }

        // Limiter la longueur
        if (maxLength > 0) {
            cleaned = cleaned.substring(0, maxLength);
        }

        // Supprimer le HTML
        if (removeHTML) {
            cleaned = cleaned
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Scripts
                .replace(/<[^>]*>/g, '') // Tags HTML
                .replace(/javascript:/gi, '') // Protocoles JavaScript
                .replace(/on\w+\s*=/gi, ''); // Event handlers
        }

        // Convertir en minuscules
        if (lowercase) {
            cleaned = cleaned.toLowerCase();
        }

        return cleaned;
    }

    /**
     * Valide une adresse email
     * @param {string} email - Email à valider
     * @returns {Object} Résultat de validation
     */
    static validateEmail(email) {
        const result = {
            isValid: false,
            error: null,
            sanitized: null
        };

        if (!email || typeof email !== 'string') {
            result.error = 'L\'email est requis';
            return result;
        }

        const sanitized = this.sanitizeInput(email.trim().toLowerCase());
        result.sanitized = sanitized;

        // Regex pour validation email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(sanitized)) {
            result.error = 'Format d\'email invalide';
            return result;
        }

        // Vérifications supplémentaires
        if (sanitized.length > 254) {
            result.error = 'L\'email est trop long (max 254 caractères)';
            return result;
        }

        const localPart = sanitized.split('@')[0];
        if (localPart.length > 64) {
            result.error = 'La partie locale de l\'email est trop longue';
            return result;
        }

        result.isValid = true;
        return result;
    }

    /**
     * Valide un mot de passe
     * @param {string} password - Mot de passe à valider
     * @param {Object} requirements - Exigences de sécurité
     * @returns {Object} Résultat de validation
     */
    static validatePassword(password, requirements = {}) {
        const {
            minLength = 8,
            requireUppercase = true,
            requireLowercase = true,
            requireNumbers = true,
            requireSpecialChars = true,
            maxLength = 128
        } = requirements;

        const result = {
            isValid: false,
            error: null,
            strength: 0,
            suggestions: []
        };

        if (!password || typeof password !== 'string') {
            result.error = 'Le mot de passe est requis';
            return result;
        }

        if (password.length < minLength) {
            result.error = `Le mot de passe doit contenir au moins ${minLength} caractères`;
            result.suggestions.push(`Ajoutez ${minLength - password.length} caractères`);
            return result;
        }

        if (password.length > maxLength) {
            result.error = `Le mot de passe ne doit pas dépasser ${maxLength} caractères`;
            return result;
        }

        let strength = 0;

        // Vérification des exigences
        if (requireUppercase && /[A-Z]/.test(password)) {
            strength += 20;
        } else if (requireUppercase) {
            result.suggestions.push('Ajoutez une majuscule');
        }

        if (requireLowercase && /[a-z]/.test(password)) {
            strength += 20;
        } else if (requireLowercase) {
            result.suggestions.push('Ajoutez une minuscule');
        }

        if (requireNumbers && /\d/.test(password)) {
            strength += 20;
        } else if (requireNumbers) {
            result.suggestions.push('Ajoutez un chiffre');
        }

        if (requireSpecialChars && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            strength += 20;
        } else if (requireSpecialChars) {
            result.suggestions.push('Ajoutez un caractère spécial');
        }

        // Bonus pour la longueur
        if (password.length >= 12) {
            strength += 20;
        }

        result.strength = strength;
        result.isValid = strength >= 80;

        if (!result.isValid && !result.error) {
            result.error = 'Le mot de passe ne respecte pas toutes les exigences de sécurité';
        }

        return result;
    }

    /**
     * Valide un nom ou prénom
     * @param {string} name - Nom à valider
     * @param {Object} options - Options de validation
     * @returns {Object} Résultat de validation
     */
    static validateName(name, options = {}) {
        const {
            minLength = 2,
            maxLength = 50,
            allowNumbers = false,
            allowSpecialChars = false
        } = options;

        const result = {
            isValid: false,
            error: null,
            sanitized: null
        };

        if (!name || typeof name !== 'string') {
            result.error = 'Le nom est requis';
            return result;
        }

        const sanitized = this.sanitizeInput(name, {
            removeHTML: true,
            maxLength,
            trim: true
        });

        result.sanitized = sanitized;

        if (sanitized.length < minLength) {
            result.error = `Le nom doit contenir au moins ${minLength} caractères`;
            return result;
        }

        // Regex pour validation
        let pattern = /^[a-zA-ZÀ-ÿ\s'-]+$/; // Lettres, accents, espaces, apostrophes, tirets
        
        if (allowNumbers) {
            pattern = /^[a-zA-Z0-9À-ÿ\s'-]+$/;
        }

        if (allowSpecialChars) {
            pattern = /^[\wÀ-ÿ\s'.,-]+$/;
        }

        if (!pattern.test(sanitized)) {
            result.error = 'Le nom contient des caractères non valides';
            return result;
        }

        result.isValid = true;
        return result;
    }

    /**
     * Valide un numéro de téléphone
     * @param {string} phone - Numéro à valider
     * @param {string} country - Code pays pour formatage
     * @returns {Object} Résultat de validation
     */
    static validatePhone(phone, country = 'FR') {
        const result = {
            isValid: false,
            error: null,
            sanitized: null,
            formatted: null
        };

        if (!phone || typeof phone !== 'string') {
            result.error = 'Le numéro de téléphone est requis';
            return result;
        }

        // Nettoyer le numéro
        const cleaned = phone.replace(/[^\d+]/g, '');
        result.sanitized = cleaned;

        // Patterns par pays
        const patterns = {
            FR: /^(\+33|0)[1-9]\d{8}$/,
            BE: /^(\+32|0)[1-9]\d{7,8}$/,
            CH: /^(\+41|0)[1-9]\d{8}$/,
            LU: /^(\+352|0)[1-9]\d{7,8}$/
        };

        const pattern = patterns[country] || patterns.FR;

        if (!pattern.test(cleaned)) {
            result.error = 'Format de numéro de téléphone invalide';
            return result;
        }

        // Formater le numéro
        result.formatted = this.formatPhone(cleaned, country);
        result.isValid = true;

        return result;
    }

    /**
     * Formate un numéro de téléphone
     * @private
     */
    static formatPhone(phone, country) {
        switch (country) {
            case 'FR':
                if (phone.startsWith('+33')) {
                    return phone.replace(/(\+33)(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5 $6');
                } else if (phone.startsWith('0')) {
                    return phone.replace(/(0)(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5 $6');
                }
                break;
        }
        return phone;
    }

    /**
     * Valide un objet avec des règles personnalisées
     * @param {Object} data - Données à valider
     * @param {Object} rules - Règles de validation
     * @returns {Object} Résultat de validation
     */
    static validateObject(data, rules) {
        const result = {
            isValid: true,
            errors: {},
            sanitized: {}
        };

        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];
            let fieldResult = { isValid: true, error: null, sanitized: value };

            // Validation requise
            if (rule.required && (!value || value.toString().trim() === '')) {
                fieldResult.isValid = false;
                fieldResult.error = `${rule.label || field} est requis`;
            } else if (value) {
                // Validation selon le type
                switch (rule.type) {
                    case 'email':
                        fieldResult = this.validateEmail(value);
                        break;
                    case 'password':
                        fieldResult = this.validatePassword(value, rule.requirements);
                        break;
                    case 'name':
                        fieldResult = this.validateName(value, rule.options);
                        break;
                    case 'phone':
                        fieldResult = this.validatePhone(value, rule.country);
                        break;
                    case 'text':
                        fieldResult = this.validateText(value, rule.options);
                        break;
                    case 'number':
                        fieldResult = this.validateNumber(value, rule.options);
                        break;
                    case 'date':
                        fieldResult = this.validateDate(value, rule.options);
                        break;
                }
            }

            if (!fieldResult.isValid) {
                result.isValid = false;
                result.errors[field] = fieldResult.error;
            }

            result.sanitized[field] = fieldResult.sanitized || fieldResult.value;
        }

        return result;
    }

    /**
     * Valide un champ texte
     * @private
     */
    static validateText(text, options = {}) {
        const {
            minLength = 0,
            maxLength = 1000,
            pattern = null,
            allowEmpty = false
        } = options;

        const result = {
            isValid: true,
            error: null,
            sanitized: null
        };

        if (!text && !allowEmpty) {
            result.error = 'Ce champ est requis';
            result.isValid = false;
            return result;
        }

        if (!text && allowEmpty) {
            result.sanitized = '';
            return result;
        }

        const sanitized = this.sanitizeInput(text, {
            removeHTML: true,
            maxLength,
            trim: true
        });

        result.sanitized = sanitized;

        if (sanitized.length < minLength) {
            result.error = `Minimum ${minLength} caractères requis`;
            result.isValid = false;
            return result;
        }

        if (pattern && !pattern.test(sanitized)) {
            result.error = 'Format invalide';
            result.isValid = false;
            return result;
        }

        return result;
    }

    /**
     * Valide un nombre
     * @private
     */
    static validateNumber(value, options = {}) {
        const {
            min = null,
            max = null,
            integer = false,
            allowZero = true
        } = options;

        const result = {
            isValid: true,
            error: null,
            sanitized: null
        };

        const num = parseFloat(value);

        if (isNaN(num)) {
            result.error = 'Nombre invalide';
            result.isValid = false;
            return result;
        }

        if (integer && !Number.isInteger(num)) {
            result.error = 'Nombre entier requis';
            result.isValid = false;
            return result;
        }

        if (!allowZero && num === 0) {
            result.error = 'La valeur zéro n\'est pas autorisée';
            result.isValid = false;
            return result;
        }

        if (min !== null && num < min) {
            result.error = `Valeur minimale: ${min}`;
            result.isValid = false;
            return result;
        }

        if (max !== null && num > max) {
            result.error = `Valeur maximale: ${max}`;
            result.isValid = false;
            return result;
        }

        result.sanitized = num;
        return result;
    }

    /**
     * Valide une date
     * @private
     */
    static validateDate(value, options = {}) {
        const {
            minDate = null,
            maxDate = null,
            format = 'YYYY-MM-DD'
        } = options;

        const result = {
            isValid: true,
            error: null,
            sanitized: null
        };

        let date;

        if (value instanceof Date) {
            date = value;
        } else {
            date = new Date(value);
        }

        if (isNaN(date.getTime())) {
            result.error = 'Date invalide';
            result.isValid = false;
            return result;
        }

        if (minDate && date < new Date(minDate)) {
            result.error = `Date minimale: ${minDate}`;
            result.isValid = false;
            return result;
        }

        if (maxDate && date > new Date(maxDate)) {
            result.error = `Date maximale: ${maxDate}`;
            result.isValid = false;
            return result;
        }

        result.sanitized = date;
        return result;
    }

    /**
     * Valide les champs requis d'un formulaire
     * @param {Object} fields - Champs à valider
     * @returns {Object} Champs manquants
     */
    static validateRequired(fields) {
        const missing = Object.entries(fields)
            .filter(([_, value]) => !value || (typeof value === 'string' && value.trim() === ''))
            .map(([key]) => key);

        return {
            isValid: missing.length === 0,
            missingFields: missing
        };
    }
}

// Export pour utilisation globale
window.Validation = Validation;
