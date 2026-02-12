const App = {
    token: localStorage.getItem('zanova_token'),
    theme: localStorage.getItem('zanova_theme') || 'dark',
    isSidebarCollapsed: localStorage.getItem('sidebar_collapsed') === 'true',
    currentRole: localStorage.getItem('zanova_current_role') || 'admin',
    userData: null,

    init() {
        this.applyTheme();
        this.applySidebarState();
        this.bindEvents();
        if (this.token) {
            this.bootApp();
        }
    },

    bindEvents() {
        console.log("🛠️ Initialisation des événements...");

        const btnLogin = document.getElementById('btn-login');
        if (btnLogin) {
            console.log("🔗 Bouton login détecté");
            // On utilise à la fois onclick dans le HTML et l'écouteur ici pour une compatibilité maximale
            btnLogin.onclick = (e) => {
                e.preventDefault();
                this.login();
            };
        } else {
            console.warn("⚠️ Bouton login NON détecté");
        }

        // Support de la touche "Entrée"
        const loginInputs = ['email', 'password'];
        loginInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        console.log("⌨️ Touche Entrée détectée sur " + id);
                        this.login();
                    }
                });
            }
        });

        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) btnLogout.onclick = () => this.logout();

        const sbToggle = document.getElementById('sidebar-toggle');
        if (sbToggle) sbToggle.addEventListener('click', () => this.toggleSidebar());

        const mmToggle = document.getElementById('mobile-menu-toggle');
        if (mmToggle) mmToggle.addEventListener('click', () => this.toggleMobileSidebar());

        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const target = item.getAttribute('onclick')?.match(/'([^']+)'/)?.[1] || item.dataset.target;
                if (target) {
                    this.switchView(target);
                }
                document.getElementById('sidebar')?.classList.remove('mobile-open');
                document.getElementById('sidebar-overlay')?.classList.remove('active');
            });
        });
    },

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('zanova_theme', this.theme);
        this.applyTheme();
    },

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
    },

    toggleSidebar() {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
        localStorage.setItem('sidebar_collapsed', this.isSidebarCollapsed);
        this.applySidebarState();
    },

    applySidebarState() {
        const sb = document.getElementById('sidebar');
        if (!sb) return;
        if (this.isSidebarCollapsed) sb.classList.add('collapsed');
        else sb.classList.remove('collapsed');
    },

    toggleMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (!sidebar || !overlay) return;

        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('active');

        document.body.style.overflow = sidebar.classList.contains('mobile-open') ? 'hidden' : '';
    },

    async login() {
        console.log("🔑 Tentative de connexion...");
        const emailEl = document.getElementById('email');
        const passwordEl = document.getElementById('password');

        if (!emailEl || !passwordEl) {
            console.error("❌ Champs login introuvables");
            return;
        }

        const email = emailEl.value;
        const password = passwordEl.value;
        console.log("📧 Email:", email);

        this.showLoader(true);
        try {
            const response = await fetch('/api/login_check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                console.log("✅ Connexion réussie, token reçu");
                this.token = data.token;
                localStorage.setItem('zanova_token', this.token);
                await this.bootApp();
            } else {
                console.warn("⚠️ Échec connexion:", data.message);
                throw new Error(data.message || "Identifiants invalides");
            }
        } catch (err) {
            console.error("🔥 Erreur login:", err);
            const errBox = document.getElementById('auth-error');
            if (errBox) {
                errBox.innerText = err.message;
                errBox.classList.remove('hidden');
            }
        } finally { this.showLoader(false); }
    },

    async bootApp() {
        this.showLoader(true);
        try {
            const response = await fetch('/api/profile', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!response.ok) throw new Error("Expulsion");
            const result = await response.json();
            this.userData = result.data;
            this.renderUI();

            document.getElementById('auth-screen')?.classList.add('hidden');
            document.getElementById('main-dashboard')?.classList.remove('hidden');

            this.initializeDashboardData();
        } catch (err) { this.logout(); } finally { this.showLoader(false); }
    },

    renderUI() {
        if (this.userData) {
            const nameEl = document.getElementById('user-name');
            if (nameEl) nameEl.innerText = `${this.userData.prenom} ${this.userData.nom}`;

            const roleEl = document.getElementById('user-role');
            if (roleEl) roleEl.innerText = this.userData.role_crm;
        }

        const btnSwitch = document.getElementById('btn-switch-role');
        if (btnSwitch) btnSwitch.style.display = 'flex';

        this.updateModeIndicator();

        if (this.userData?.roles?.includes('ROLE_RESPONSABLE')) {
            document.querySelectorAll('.restricted-responsable').forEach(el => el.classList.remove('hidden'));
        }

        if (this.currentRole === 'agent') this.applyAgentView();
        else if (this.currentRole === 'supervisor') this.applySupervisorView();
    },

    updateModeIndicator() {
        const modeIndicator = document.getElementById('mode-indicator');
        const modeText = document.getElementById('mode-text');
        if (modeIndicator && modeText) {
            modeIndicator.style.display = 'flex';
            modeIndicator.className = 'mode-indicator ' + (this.currentRole === 'admin' ? 'admin' : (this.currentRole === 'agent' ? 'agent' : 'supervisor'));
            modeText.innerText = this.currentRole === 'admin' ? 'Mode Admin' : (this.currentRole === 'agent' ? 'Mode Agent' : 'Mode Superviseur');
        }
    },

    switchView(target) {
        const titles = {
            'dashboard': this.currentRole === 'agent' ? 'Mon Espace Agent' : (this.currentRole === 'supervisor' ? 'Supervision' : 'Tableau de bord'),
            'statistics': 'Statistiques & Analyse',
            'campaigns': 'Campagnes',
            'users': 'Équipe & Accès',
            'contacts': 'Répertoire Contacts'
        };

        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.innerText = titles[target] || target.charAt(0).toUpperCase() + target.slice(1);

        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));

        const viewMapping = {
            'dashboard': this.currentRole === 'agent' ? 'agent-overview-view' : (this.currentRole === 'supervisor' ? 'supervisor-overview-view' : 'overview-view'),
            'statistics': 'statistics-view',
            'campaigns': 'campaigns-view',
            'users': 'users-view',
            'contacts': 'contacts-view'
        };

        const activeView = document.getElementById(viewMapping[target] || target + '-view');
        if (activeView) {
            activeView.classList.remove('hidden');
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            document.querySelector(`[onclick*="switchView('${target}')"]`)?.classList.add('active');

            if (target === 'dashboard') {
                if (this.currentRole === 'agent') this.initializeAgentDashboard();
                else if (this.currentRole === 'supervisor') this.initializeSupervisorDashboard();
                else this.initializeDashboardData();
            } else if (target === 'statistics') this.initializeStatistics();
            else if (target === 'campaigns') this.loadCampaigns();
            else if (target === 'users') this.loadUsers();
            else if (target === 'contacts') this.loadGlobalContacts();
        }
    },

    showLoader(show) {
        document.getElementById('global-loader')?.classList.toggle('hidden', !show);
    },

    addActivity(msg) {
        const container = document.getElementById('activity-log') || document.getElementById('activity-log-dashboard');
        if (!container) return;

        container.querySelector('.empty')?.remove();
        const item = document.createElement('div');
        item.className = 'activity-item';
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        item.innerHTML = `<span class="time">${timeStr}</span> <p class="msg">${msg}</p>`;
        container.prepend(item);
    },

    logout() {
        localStorage.removeItem('zanova_token');
        localStorage.removeItem('zanova_current_role');
        location.reload();
    },

    async loadGlobalContacts() {
        this.showLoader(true);
        try {
            const res = await fetch('/api/management/campaigns', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const campaigns = await res.json();
            const container = document.getElementById('contact-campaign-selector');
            if (container) {
                container.innerHTML = campaigns.map(c => `
                    <div onclick="App.loadCampaignContacts(${c.id})" class="activity-item" style="cursor:pointer; transition:0.2s;">
                        <strong>${c.nom}</strong>
                    </div>
                `).join('');
            }
        } catch (err) { console.error(err); }
        finally { this.showLoader(false); }
    },

    async loadCampaignContacts(campaignId) {
        this.showLoader(true);
        try {
            const res = await fetch(`/api/management/campaigns/${campaignId}/contacts`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const contacts = await res.json();
            const tbody = document.getElementById('contact-list-body');
            if (tbody) {
                tbody.innerHTML = contacts.length ? contacts.map(c => `
                    <tr>
                        <td><strong>${c.nom}</strong><br><small style="color:var(--text-dim)">ID: ${c.id}</small></td>
                        <td>${c.telephone}<br><small>${c.email || '-'}</small></td>
                        <td><span class="badge badge-neutral">${c.source}</span></td>
                        <td><span class="badge ${c.status === 'nouveau' ? 'badge-primary' : 'badge-success'}">${c.status}</span></td>
                    </tr>
                `).join('') : '<tr><td colspan="4" style="text-align:center; padding:2rem;">Aucun contact dans cette campagne.</td></tr>';
            }
        } catch (err) { alert(err.message); }
        finally { this.showLoader(false); }
    },

    async loadCampaigns() {
        this.showLoader(true);
        try {
            const res = await fetch('/api/management/campaigns?t=' + Date.now(), {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();
            const tbody = document.getElementById('campaign-list-body');
            if (tbody) {
                tbody.innerHTML = data.length ? data.map(c => `
                    <tr>
                        <td><strong>${c.nom}</strong><br><small style="color:var(--text-dim)">ID: ${c.id}</small></td>
                        <td>${c.date_debut || '-'} / ${c.date_fin || '-'}</td>
                        <td>${c.responsable || 'Non assigné'}</td>
                        <td><span class='badge'>${c.contacts_count}</span></td>
                        <td>
                            <div class="action-btns">
                                <button onclick="UI.manageAssignments(${c.id})" class="btn-action" title="Affectations">🤝</button>
                                <button onclick="UI.manageFields(${c.id})" class="btn-action" title="Formulaire">📋</button>
                                <button onclick="UI.editCampaign(${c.id})" class="btn-action">✏️</button>
                                <button onclick="UI.deleteCampaign(${c.id})" class="btn-action delete">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `).join('') : '<tr><td colspan="5" style="text-align:center; padding: 2rem;">Aucune campagne trouvée</td></tr>';
            }
        } catch (err) { alert("Erreur: " + err.message); }
        finally { this.showLoader(false); }
    },

    async loadUsers() {
        this.showLoader(true);
        try {
            const res = await fetch('/api/management/users?t=' + Date.now(), {
                headers: { 'Authorization': `Bearer ${this.token}`, 'Accept': 'application/json' }
            });
            const data = await res.json();
            const tbody = document.getElementById('user-list-body');
            if (tbody) {
                tbody.innerHTML = data.map(u => {
                    const roleClass = u.role === 'responsable' ? 'badge-admin' : (u.role === 'superviseur' ? 'badge-primary' : 'badge-neutral');
                    const statusClass = u.status === 'active' ? 'badge-success' : 'badge-danger';
                    return `
                        <tr>
                            <td><div style="display:flex; align-items:center; gap:12px;">
                                <div class="user-avatar" style="width:32px; height:32px; font-size:0.8rem; background:var(--primary); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center;">${u.prenom[0]}</div>
                                <strong>${u.prenom} ${u.nom}</strong>
                            </div></td>
                            <td><span style="color:var(--text-dim); font-size:0.9rem;">${u.email}</span></td>
                            <td><span class="badge ${roleClass}">${u.role}</span></td>
                            <td><span class="badge ${statusClass}">${u.status}</span></td>
                            <td>
                                <div class="action-btns">
                                    <button onclick="UI.editUser(${u.id})" class="btn-action">✏️</button>
                                    <button onclick="UI.deleteUser(${u.id})" class="btn-action delete">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        } catch (err) { alert("Erreur: " + err.message); }
        finally { this.showLoader(false); }
    },

    // Animations & Simulations
    animateCounter(elementId, target, suffix = '') {
        const element = document.getElementById(elementId);
        if (!element) return;
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current) + suffix;
        }, 30);
    },

    animateProgressBar(elementId, targetWidth) {
        const element = document.getElementById(elementId);
        if (!element) return;
        setTimeout(() => {
            element.style.width = targetWidth + '%';
            element.style.transition = 'width 1.5s ease-out';
        }, 500);
    },

    initializeDashboardData() {
        setTimeout(() => {
            this.animateCounter('stat-campaigns', 3);
            this.animateCounter('stat-agents', 12);
            this.animateCounter('stat-calls', 127);
            this.animateCounter('stat-qualification', 89, '%');

            const prog = document.getElementById('campaigns-progress');
            if (prog) prog.textContent = '51% de progression';

            this.animateProgressBar('campaigns-progress-bar', 51);
            this.animateProgressBar('agents-progress-bar', 67);
            this.animateProgressBar('calls-progress-bar', 85);
            this.animateProgressBar('qualification-progress-bar', 89);
        }, 1000);
        this.simulateAgentRanking('calls');
        this.initializeSupervisionData();
    },

    simulateAgentRanking(criteria) {
        const container = document.getElementById('top-agents') || document.getElementById('supervisor-top-agents');
        if (!container) return;
        // Mock data here...
        container.innerHTML = '<p class="text-center p-4">Chargement du classement...</p>';
    },

    initializeSupervisionData() {
        const container = document.getElementById('supervisor-realtime') || document.getElementById('realtime-supervision');
        if (!container) return;
        // Mock data here...
    },

    initializeStatistics() {
        // Init charts etc.
    }
};

const UI = {
    showCampaignModal(existingData = null) {
        const container = document.getElementById('modal-container');
        if (!container) return;
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const saveBtn = document.getElementById('modal-save');

        title.innerText = existingData ? "Modifier la Campagne" : "Créer une nouvelle Campagne";
        body.innerHTML = `
            <div class="animate-fade-in">
                <input type="hidden" id="m-camp-id" value="${existingData ? existingData.id : ''}">
                <div class="input-group">
                    <label>Titre de la campagne</label>
                    <input type="text" id="m-camp-nom" value="${existingData ? existingData.nom : ''}" placeholder="Ex: Campagne Acquisition Mars 2024">
                </div>
                <div class="input-group">
                    <label>Objectifs & Description</label>
                    <textarea id="m-camp-desc" placeholder="Décrivez ici les spécificités de cette campagne...">${existingData ? (existingData.description || '') : ''}</textarea>
                </div>
                <div class="modal-grid">
                    <div class="input-group">
                        <label>Date de Lancement</label>
                        <input type="date" id="m-camp-start" value="${existingData ? (existingData.date_debut || '') : ''}">
                    </div>
                    <div class="input-group">
                        <label>Échéance (Fin)</label>
                        <input type="date" id="m-camp-end" value="${existingData ? (existingData.date_fin || '') : ''}">
                    </div>
                </div>
            </div>
        `;
        saveBtn.innerText = existingData ? "Confirmer les modifications" : "Lancer la campagne";
        saveBtn.onclick = () => this.saveCampaign(existingData ? 'PUT' : 'POST');
        container.classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('modal-container')?.classList.add('hidden');
    },

    showUserModal(existingData = null) {
        const container = document.getElementById('modal-container');
        if (!container) return;
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const saveBtn = document.getElementById('modal-save');

        title.innerText = existingData ? "Modifier le Membre" : "Ajouter un Membre";
        body.innerHTML = `
            <div class="animate-fade-in">
                <input type="hidden" id="m-user-id" value="${existingData ? existingData.id : ''}">
                <div class="modal-grid">
                    <div class="input-group">
                        <label>Prénom</label>
                        <input type="text" id="m-user-prenom" value="${existingData ? existingData.prenom : ''}" placeholder="Jean">
                    </div>
                    <div class="input-group">
                        <label>Nom</label>
                        <input type="text" id="m-user-nom" value="${existingData ? existingData.nom : ''}" placeholder="Dupont">
                    </div>
                </div>
                <div class="input-group">
                    <label>Email professionnel</label>
                    <input type="email" id="m-user-email" value="${existingData ? existingData.email : ''}" placeholder="jean.dupont@zanova.com">
                </div>
                <div class="modal-grid">
                    <div class="input-group">
                        <label>Rôle Système</label>
                        <select id="m-user-role" class="modal-select">
                            <option value="agent" ${existingData && existingData.role === 'agent' ? 'selected' : ''}>Agent (Appelant)</option>
                            <option value="superviseur" ${existingData && existingData.role === 'superviseur' ? 'selected' : ''}>Superviseur</option>
                            <option value="responsable" ${existingData && existingData.role === 'responsable' ? 'selected' : ''}>Responsable (Admin)</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        saveBtn.innerText = existingData ? "Enregistrer" : "Créer le profil";
        saveBtn.onclick = () => this.saveUser(existingData ? 'PUT' : 'POST');
        container.classList.remove('hidden');
    }
};

// Export App to window to allow inline onclick handlers
window.App = App;

console.log("🚀 Ganova CRM App Engine Loaded");
App.init();
