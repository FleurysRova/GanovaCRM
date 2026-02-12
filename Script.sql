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

-- 1. Table des Appels
CREATE TABLE calls (
    id SERIAL PRIMARY KEY,
    campaign_id INT NOT NULL,
    agent_id INT NOT NULL,
    contact_id INT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration INT,
    status VARCHAR(50) NOT NULL,
    recording_path VARCHAR(255),
    CONSTRAINT fk_call_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    CONSTRAINT fk_call_agent FOREIGN KEY (agent_id) REFERENCES users(user_id),
    CONSTRAINT fk_call_contact FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

-- 2. Table des Qualifications d'Appels
CREATE TABLE call_qualifications (
    id SERIAL PRIMARY KEY,
    call_id INT NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    qualified_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_qualification_call FOREIGN KEY (call_id) REFERENCES calls(id)
);

-- 3. Table des Champs de Qualification par Campagne
CREATE TABLE qualification_fields (
    id SERIAL PRIMARY KEY,
    campaign_id INT NOT NULL,
    label VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    required BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_field_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- 4. Table des Valeurs saisies pour les Qualifications
CREATE TABLE qualification_values (
    id SERIAL PRIMARY KEY,
    call_id INT NOT NULL,
    field_id INT NOT NULL,
    value TEXT NOT NULL,
    CONSTRAINT fk_value_call FOREIGN KEY (call_id) REFERENCES calls(id),
    CONSTRAINT fk_value_field FOREIGN KEY (field_id) REFERENCES qualification_fields(id)
);

-- 5. Table de Statut Temps Réel des Agents
CREATE TABLE agent_statuses (
    id SERIAL PRIMARY KEY,
    agent_id INT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('EN_APPEL', 'PAUSE', 'DISPONIBLE')),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_status_agent FOREIGN KEY (agent_id) REFERENCES users(user_id)
);

-- Index pour optimiser les performances
CREATE INDEX idx_calls_agent ON calls(agent_id);
CREATE INDEX idx_calls_campaign ON calls(campaign_id);
CREATE INDEX idx_qual_values_call ON qualification_values(call_id);
CREATE INDEX idx_agent_status_lookup ON agent_statuses(agent_id);