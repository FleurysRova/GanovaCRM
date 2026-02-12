import './stimulus_bootstrap.js';
import './styles/app.css';

console.log('Zanova CRM App Initialized');

const App = {
    token: localStorage.getItem('zanova_token'),
    theme: localStorage.getItem('zanova_theme') || 'dark',
    isSidebarCollapsed: localStorage.getItem('sidebar_collapsed') === 'true',
    userData: null,

    init() {
        this.applyTheme();
        this.applySidebarState();
        this.bindEvents();
        if (this.token) this.bootApp();
    },

    bindEvents() {
        const loginBtn = document.getElementById('btn-login');
        if (loginBtn) loginBtn.addEventListener('click', (e) => { e.preventDefault(); this.login(); });

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());

        const sbToggle = document.getElementById('sidebar-toggle');
        if (sbToggle) sbToggle.addEventListener('click', () => this.toggleSidebar());

        const mobileToggle = document.getElementById('mobile-menu-toggle');
        if (mobileToggle) mobileToggle.addEventListener('click', () => this.toggleMobileSidebar());

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                item.classList.add('active');
                this.switchView(item.dataset.target);
                const sb = document.getElementById('sidebar');
                if (sb) sb.classList.remove('mobile-open');
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
        const sb = document.getElementById('sidebar');
        if (sb) sb.classList.toggle('mobile-open');
    },

    async login() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        this.showLoader(true);
        try {
            const response = await fetch('/api/login_check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                this.token = data.token;
                localStorage.setItem('zanova_token', this.token);
                await this.bootApp();
            } else throw new Error(data.message || "Identifiants invalides");
        } catch (err) {
            const errBox = document.getElementById('auth-error');
            if (errBox) {
                errBox.innerText = err.message;
                errBox.classList.remove('hidden');
            } else {
                alert(err.message);
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

            const authScreen = document.getElementById('auth-screen');
            const mainDash = document.getElementById('main-dashboard');

            if (authScreen) authScreen.classList.add('hidden');
            if (mainDash) mainDash.classList.remove('hidden');

            // Load initial view (dashboard)
            // this.switchView('dashboard'); 
        } catch (err) {
            console.error("Boot error:", err);
            this.logout();
        } finally { this.showLoader(false); }
    },

    renderUI() {
        const userName = document.getElementById('user-name');
        const userRole = document.getElementById('user-role');

        if (userName) userName.innerText = `${this.userData.prenom} ${this.userData.nom}`;
        if (userRole) userRole.innerText = this.userData.role_crm;

        if (this.userData.roles.includes('ROLE_RESPONSABLE')) {
            document.querySelectorAll('.restricted-responsable').forEach(el => el.classList.remove('hidden'));
        }
    },

    switchView(target) {
        const title = document.getElementById('page-title');
        if (title) title.innerText = target.charAt(0).toUpperCase() + target.slice(1);

        // Masquer toutes les vues
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        const activeView = document.getElementById(target + '-view');
        if (activeView) activeView.classList.remove('hidden');

        if (target === 'campaigns') this.loadCampaigns();
        if (target === 'users') this.loadUsers();
        if (target === 'contacts') this.loadGlobalContacts();
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
                        <td>
                            <a href="callto:${c.telephone.replace(/\s/g, '')}" class="phone-link" title="Appeler avec Zoiper">${c.telephone}</a>
                            <br><small>${c.email || '-'}</small>
                        </td>
                        <td><span class="badge badge-neutral">${c.source}</span></td>
                        <td><span class="badge ${c.status === 'nouveau' ? 'badge-primary' : 'badge-success'}">${c.status}</span></td>
                    </tr>
                `).join('') : '<tr><td colspan="4" style="text-align:center; padding:2rem;">Aucun contact dans cette campagne.</td></tr>';
            }
        } catch (err) { alert(err.message); }
        finally { this.showLoader(false); }
    },

    async loadCampaigns() {
        console.log("--- Début rechargement campagnes ---");
        this.showLoader(true);
        try {
            const res = await fetch('/api/management/campaigns?t=' + Date.now(), {
                method: 'GET',
                cache: 'no-store', // Désactive le cache navigateur
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();
            console.log("Données reçues après reload:", data);

            if (!Array.isArray(data)) {
                console.error("Data received is not an array:", data);
                throw new Error(data.message || "Réponse invalide du serveur");
            }

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
        } catch (err) {
            console.error("LoadCampaigns Error:", err);
            // alert("Erreur: " + err.message);
        }
        finally { this.showLoader(false); }
    },

    async loadUsers() {
        this.showLoader(true);
        try {
            const res = await fetch('/api/management/users?t=' + Date.now(), {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();

            if (!Array.isArray(data)) {
                throw new Error(data.message || "Réponse invalide du serveur");
            }

            const tbody = document.getElementById('user-list-body');
            if (tbody) {
                tbody.innerHTML = data.map(u => {
                    const roleClass = u.role === 'responsable' ? 'badge-admin' : (u.role === 'superviseur' ? 'badge-primary' : 'badge-neutral');
                    const statusClass = u.status === 'active' ? 'badge-success' : 'badge-danger';
                    return `
                        <tr>
                            <td><div style="display:flex; align-items:center; gap:12px;">
                                <div class="user-avatar" style="width:32px; height:32px; font-size:0.8rem;">${u.prenom[0]}</div>
                                <strong>${u.prenom} ${u.nom}</strong>
                            </div></td>
                            <td><span style="color:var(--text-dim); font-size:0.9rem;">${u.email}</span></td>
                            <td><span class="badge ${roleClass}">${u.role}</span><br><small style="color:var(--text-dim)">SIP: ${u.sip_extension || '-'}</small></td>
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
        } catch (err) {
            console.error("LoadUsers Error:", err);
            // alert("Erreur: " + err.message);
        }
        finally { this.showLoader(false); }
    },

    showLoader(show) {
        const loader = document.getElementById('global-loader');
        if (loader) loader.classList.toggle('hidden', !show);
    },

    addActivity(msg) {
        const container = document.getElementById('activity-log');
        if (!container) return;

        const empty = container.querySelector('.empty');
        if (empty) empty.remove();

        const item = document.createElement('div');
        item.className = 'activity-item';
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        item.innerHTML = `<span class="time">${timeStr}</span> <p class="msg">${msg}</p>`;
        container.prepend(item);
    },

    logout() {
        localStorage.removeItem('zanova_token');
        location.reload();
    }
};

const UI = {
    async deleteCampaign(id) {
        if (!confirm("⚠️ Êtes-vous sûr de vouloir supprimer cette campagne ? Cette action est irréversible.")) return;
        App.showLoader(true);
        try {
            const res = await fetch(`/api/management/campaigns/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${App.token}` }
            });
            if (res.ok) {
                App.addActivity("Campagne supprimée");
                App.loadCampaigns();
            } else {
                throw new Error("Erreur lors de la suppression");
            }
        } catch (err) { alert(err.message); }
        finally { App.showLoader(false); }
    },

    async editCampaign(id) {
        App.showLoader(true);
        try {
            const res = await fetch('/api/management/campaigns?t=' + Date.now(), {
                headers: { 'Authorization': `Bearer ${App.token}` }
            });
            const campaigns = await res.json();
            const camp = campaigns.find(c => c.id === parseInt(id));

            if (!camp) throw new Error("Campagne introuvable.");
            this.showCampaignModal(camp);
        } catch (err) { alert(err.message); }
        finally { App.showLoader(false); }
    },

    showCampaignModal(existingData = null) {
        const container = document.getElementById('modal-container');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const saveBtn = document.getElementById('modal-save');

        if (!container || !title || !body || !saveBtn) return;

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

        saveBtn.className = "btn-modal-save";
        saveBtn.innerText = existingData ? "Confirmer les modifications" : "Lancer la campagne";
        saveBtn.onclick = () => this.saveCampaign(existingData ? 'PUT' : 'POST');
        container.classList.remove('hidden');
    },

    async saveCampaign(method) {
        const idInput = document.getElementById('m-camp-id');
        const id = idInput ? idInput.value : null;
        const payload = {
            nom: document.getElementById('m-camp-nom').value,
            description: document.getElementById('m-camp-desc').value,
            date_debut: document.getElementById('m-camp-start').value,
            date_fin: document.getElementById('m-camp-end').value
        };

        if (!payload.nom) {
            alert("⚠️ Le titre de la campagne est obligatoire.");
            return;
        }

        const url = method === 'PUT' ? `/api/management/campaigns/${id}` : '/api/management/campaigns';

        App.showLoader(true);
        try {
            const res = await fetch(url + '?t=' + Date.now(), {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${App.token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const responseData = await res.json();

            if (res.ok) {
                this.closeModal();
                App.addActivity(method === 'PUT' ? `Succès: Campagne "${payload.nom}" mise à jour` : `Succès: Campagne "${payload.nom}" créée`);

                // On attend un tout petit peu pour laisser le temps au flush DB de se propager
                setTimeout(async () => {
                    await App.loadCampaigns();
                    console.log("Liste rafraîchie avec succès");
                }, 300);

                // Message de succès temporaire
                const successMsg = document.createElement('div');
                successMsg.className = "alert-box success";
                successMsg.style.position = "fixed"; successMsg.style.top = "20px"; successMsg.style.right = "20px";
                successMsg.innerText = "Données enregistrées avec succès !";
                document.body.appendChild(successMsg);
                setTimeout(() => successMsg.remove(), 3000);
            } else {
                throw new Error(responseData.error || `Erreur serveur (Code: ${res.status})`);
            }
        } catch (err) {
            console.error("Save Error:", err);
            alert("Détails de l'erreur: " + err.message);
        }
        finally { App.showLoader(false); }
    },

    closeModal() {
        const container = document.getElementById('modal-container');
        if (container) container.classList.add('hidden');
    },

    // --- GESTION ÉQUIPE (USERS) ---
    showUserModal(existingData = null) {
        const container = document.getElementById('modal-container');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const saveBtn = document.getElementById('modal-save');

        if (!container) return;

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
                    <div class="input-group">
                        <label>Statut</label>
                        <select id="m-user-status" class="modal-select">
                            <option value="active" ${existingData && existingData.status === 'active' ? 'selected' : ''}>Actif</option>
                            <option value="inactive" ${existingData && existingData.status === 'inactive' ? 'selected' : ''}>Inactif</option>
                        </select>
                    </div>
                </div>
                <div class="input-group">
                    <label>Extension SIP (Zoiper)</label>
                    <input type="text" id="m-user-sip" value="${existingData ? (existingData.sip_extension || '') : ''}" placeholder="Ex: 1001">
                </div>
            </div>
        `;

        saveBtn.className = "btn-modal-save";
        saveBtn.innerText = existingData ? "Enregistrer les modifications" : "Créer le profil";
        saveBtn.onclick = () => this.saveUser(existingData ? 'PUT' : 'POST');
        container.classList.remove('hidden');
    },

    async saveUser(method) {
        const id = document.getElementById('m-user-id').value;
        const payload = {
            prenom: document.getElementById('m-user-prenom').value,
            nom: document.getElementById('m-user-nom').value,
            email: document.getElementById('m-user-email').value,
            role: document.getElementById('m-user-role').value,
            status: document.getElementById('m-user-status').value,
            sip_extension: document.getElementById('m-user-sip').value
        };

        const url = method === 'PUT' ? `/api/management/users/${id}` : '/api/management/users';
        App.showLoader(true);
        try {
            const res = await fetch(url + '?t=' + Date.now(), {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${App.token}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                this.closeModal();
                App.addActivity(`Membre ${payload.prenom} mis à jour`);
                await App.loadUsers();
            } else {
                const data = await res.json();
                throw new Error(data.error || "Erreur lors de la sauvegarde utilisateur");
            }
        } catch (err) { alert(err.message); }
        finally { App.showLoader(false); }
    },

    async editUser(id) {
        App.showLoader(true);
        try {
            const res = await fetch('/api/management/users?t=' + Date.now(), {
                headers: { 'Authorization': `Bearer ${App.token}` }
            });
            const users = await res.json();
            const user = users.find(u => u.id === parseInt(id));
            if (user) this.showUserModal(user);
        } catch (err) { alert(err.message); }
        finally { App.showLoader(false); }
    },

    async manageFields(campaignId) {
        App.showLoader(true);
        try {
            const res = await fetch(`/api/management/campaigns/${campaignId}/fields?t=` + Date.now(), {
                headers: { 'Authorization': `Bearer ${App.token}` }
            });
            const fields = await res.json();

            const container = document.getElementById('modal-container');
            const title = document.getElementById('modal-title');
            const body = document.getElementById('modal-body');
            const saveBtn = document.getElementById('modal-save');

            if (!container) return;

            title.innerText = "Champs du Formulaire";
            body.innerHTML = `
                <div class="animate-fade-in" style="min-width: 500px">
                    <p style="color:var(--text-dim); margin-bottom:1.5rem;">Définissez les questions que l'agent devra remplir lors de l'appel.</p>
                    <div id="fields-list" style="margin-bottom:2rem; display:flex; flex-direction:column; gap:10px;">
                        ${fields.map(f => `
                            <div class="activity-item" style="justify-content:space-between; padding:0.75rem 1rem;">
                                <div>
                                    <strong>${f.label}</strong> 
                                    <span class="badge badge-neutral" style="margin-left:10px">${f.type}</span>
                                </div>
                                <button onclick="UI.deleteField(${f.id}, ${campaignId})" class="btn-action delete" style="padding:4px">🗑️</button>
                            </div>
                        `).join('') || '<p style="text-align:center; padding:1rem; opacity:0.5;">Aucun champ configuré</p>'}
                    </div>
                    
                    <div class="panel" style="background:var(--bg-app); padding:1rem;">
                        <h4 style="margin:0 0 1rem 0; font-family:'Outfit'; font-size:0.9rem;">AJOUTER UN CHAMP</h4>
                        <div class="modal-grid" style="gap:1rem;">
                            <div class="input-group">
                                <label>Nom du champ</label>
                                <input type="text" id="new-field-label" placeholder="ex: Budget Client">
                            </div>
                            <div class="input-group">
                                <label>Type</label>
                                <select id="new-field-type" class="modal-select" style="padding:0.75rem 1rem;">
                                    <option value="text">Texte</option>
                                    <option value="number">Nombre</option>
                                    <option value="date">Date</option>
                                    <option value="textarea">Commentaire Long</option>
                                </select>
                            </div>
                        </div>
                        <button onclick="UI.addField(${campaignId})" class="btn-glow" style="width:100%; margin-top:1rem; justify-content:center;">
                            + Ajouter à la campagne
                        </button>
                    </div>
                </div>
            `;

            saveBtn.innerText = "Fermer";
            saveBtn.onclick = () => this.closeModal();
            container.classList.remove('hidden');
        } catch (err) { alert(err.message); }
        finally { App.showLoader(false); }
    },

    async addField(campaignId) {
        const label = document.getElementById('new-field-label').value;
        const type = document.getElementById('new-field-type').value;
        if (!label) return alert("Le nom est requis");

        App.showLoader(true);
        try {
            const res = await fetch(`/api/management/campaigns/${campaignId}/fields`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${App.token}` },
                body: JSON.stringify({ label, type, required: false })
            });
            if (res.ok) {
                App.addActivity("Nouveau champ ajouté");
                this.manageFields(campaignId);
            }
        } catch (err) { alert("Erreur: " + err.message); }
        finally { App.showLoader(false); }
    },

    async deleteField(fieldId, campaignId) {
        if (!confirm("Supprimer ce champ ?")) return;
        App.showLoader(true);
        try {
            const res = await fetch(`/api/management/fields/${fieldId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${App.token}` }
            });
            if (res.ok) {
                App.addActivity("Champ supprimé");
                this.manageFields(campaignId);
            }
        } catch (err) { alert(err.message); }
        finally { App.showLoader(false); }
    },

    async manageAssignments(campaignId) {
        App.showLoader(true);
        try {
            const resAss = await fetch(`/api/management/campaigns/${campaignId}/users?t=` + Date.now(), {
                headers: { 'Authorization': `Bearer ${App.token}` }
            });
            const assignments = await resAss.json();

            const resAll = await fetch('/api/management/users?t=' + Date.now(), {
                headers: { 'Authorization': `Bearer ${App.token}` }
            });
            const allUsers = await resAll.json();

            const container = document.getElementById('modal-container');
            const title = document.getElementById('modal-title');
            const body = document.getElementById('modal-body');
            const saveBtn = document.getElementById('modal-save');

            if (!container) return;

            title.innerText = "Affectations de l'Équipe";
            body.innerHTML = `
                <div class="animate-fade-in" style="min-width: 500px">
                    <div id="assignment-list" style="margin-bottom:2rem; display:flex; flex-direction:column; gap:10px;">
                        <label style="font-size:0.75rem; font-weight:800; color:var(--text-dim); text-transform:uppercase;">MEMBRES ACTIFS</label>
                        ${assignments.map(a => `
                            <div class="activity-item" style="justify-content:space-between; padding:0.75rem 1rem;">
                                <div>
                                    <strong>${a.nom}</strong> 
                                    <span class="badge ${a.role === 'responsable' ? 'badge-admin' : 'badge-primary'}" style="margin-left:10px">${a.role}</span>
                                </div>
                                <button onclick="UI.unassignUser(${a.id}, ${campaignId})" class="btn-action delete" style="padding:4px">🗑️</button>
                            </div>
                        `).join('') || '<p style="text-align:center; padding:1.5rem; background:var(--glass); border-radius:12px; opacity:0.5;">Aucun personnel affecté</p>'}
                    </div>

                    <div class="panel" style="background:var(--bg-app); padding:1.5rem; border:1px solid var(--primary-glow);">
                        <label style="font-size:0.75rem; font-weight:800; color:var(--primary); text-transform:uppercase; display:block; margin-bottom:1rem;">NOUVELLE AFFECTATION</label>
                        <div style="display:flex; gap:1rem;">
                            <select id="assign-user-select" class="modal-select" style="flex:1;">
                                <option value="">Sélectionner un membre...</option>
                                ${allUsers.filter(u => !assignments.find(a => a.user_id === u.id)).map(u => `
                                    <option value="${u.id}">${u.prenom} ${u.nom} (${u.role})</option>
                                `).join('')}
                            </select>
                            <button onclick="UI.doAssign(${campaignId})" class="btn-glow">Affecter</button>
                        </div>
                    </div>
                </div>
            `;

            saveBtn.innerText = "Terminer";
            saveBtn.onclick = () => this.closeModal();
            container.classList.remove('hidden');
        } catch (err) { alert(err.message); }
        finally { App.showLoader(false); }
    },

    async doAssign(campaignId) {
        const userId = document.getElementById('assign-user-select').value;
        if (!userId) return;
        App.showLoader(true);
        try {
            const res = await fetch(`/api/management/campaigns/${campaignId}/assign/${userId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${App.token}` }
            });
            if (res.ok) {
                App.addActivity("Membre affecté");
                this.manageAssignments(campaignId);
            } else {
                const data = await res.json();
                throw new Error(data.error);
            }
        } catch (err) { alert(err.message); }
        finally { App.showLoader(false); }
    },

    async unassignUser(assignmentId, campaignId) {
        if (!confirm("Retirer ce membre ?")) return;
        App.showLoader(true);
        try {
            const res = await fetch(`/api/management/assignments/${assignmentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${App.token}` }
            });
            if (res.ok) {
                App.addActivity("Membre retiré");
                this.manageAssignments(campaignId);
            }
        } catch (err) { alert(err.message); }
        finally { App.showLoader(false); }
    },

    async deleteUser(id) {
        if (!confirm("⚠️ Supprimer ce membre ?")) return;
        App.showLoader(true);
        try {
            const res = await fetch(`/api/management/users/${id}?t=` + Date.now(), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${App.token}` }
            });
            if (res.ok) {
                App.addActivity("Membre supprimé");
                await App.loadUsers();
            } else {
                const data = await res.json();
                throw new Error(data.error || "Action impossible");
            }
        } catch (err) { alert(err.message); }
        finally { App.showLoader(false); }
    }
};

window.App = App;
window.UI = UI;

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
