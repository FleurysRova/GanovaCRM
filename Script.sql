create database crm_zanovaa;
 \c crm_zanovaa

-- 1. Table des Utilisateurs
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_users VARCHAR(20) CHECK (role_users IN ('responsable', 'superviseur', 'agent')),
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table des Campagnes
CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    date_debut TIMESTAMP,
    date_fin TIMESTAMP,
    responsable_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table de Liaison Campagnes - Utilisateurs (Agents/Superviseurs assignés)
CREATE TABLE campaign_users (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    role_in_campaign VARCHAR(50), -- ex: 'appelant', 'validateur'
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table des Contacts (Les prospects à appeler)
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    source VARCHAR(100), -- ex: 'Fichier Excel', 'Site Web'
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    autre JSONB, -- Pour stocker des infos spécifiques (adresse, historique, etc.)
    status VARCHAR(50) DEFAULT 'nouveau', -- 'nouveau', 'en_cours', 'termine'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table des Champs de Qualification (Formulaires dynamiques d'appel)
CREATE TABLE campaign_fields (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    options JSONB,
    is_required BOOLEAN DEFAULT FALSE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);