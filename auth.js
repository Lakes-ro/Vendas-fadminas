/**
 * AUTH.JS v6.0 - COM RECUPERAÇÃO DE SENHA
 * - Login/Signup
 * - Recuperação de Senha (Esqueci Minha Senha)
 * - Roles: supreme, seller, client
 */

const Auth = {
    session: null,
    profile: null,
    role: 'client',
    userId: null,

    SUPREME_ADMINS: [
        'rogeralmeida15000@gmail.com'
    ],

    async init() {
        try {
            if (!window._supabase) {
                log('❌ Supabase não disponível', 'error');
                return;
            }

            const { data: { session }, error } = await _supabase.auth.getSession();
            
            if (error) throw error;

            if (session) {
                this.session = session;
                this.userId = session.user.id;
                await this.loadProfile();
            } else {
                this.role = 'client';
                this.userId = null;
            }

            this.renderUIByRole();
            log('✅ Auth inicializado', 'info');
        } catch (err) {
            log(`❌ Erro auth: ${err.message}`, 'error');
            this.role = 'client';
        }
    },

    async loadProfile() {
        try {
            if (!this.session?.user?.id) return;

            const { data, error } = await _supabase
                .from('profiles')
                .select('*')
                .eq('id', this.session.user.id)
                .single();

            if (error?.code === 'PGRST116') {
                const userEmail = this.session.user.email;
                const isSuperAdmin = this.SUPREME_ADMINS.includes(userEmail);
                
                const { error: insertError } = await _supabase
                    .from('profiles')
                    .insert([{
                        id: this.session.user.id,
                        email: userEmail,
                        full_name: this.session.user.user_metadata?.full_name || 'Usuário',
                        phone: this.session.user.user_metadata?.phone || '',
                        role: isSuperAdmin ? 'supreme' : 'seller',
                        status: 'active'
                    }]);

                if (insertError) throw insertError;

                this.profile = {
                    id: this.session.user.id,
                    email: userEmail,
                    full_name: this.session.user.user_metadata?.full_name || 'Usuário',
                    role: isSuperAdmin ? 'supreme' : 'seller',
                    status: 'active'
                };
                this.role = this.profile.role;
                log(`✅ Perfil criado: ${this.role}`, 'success');
                return;
            }

            if (error) throw error;

            this.profile = data;
            this.role = data?.role || 'client';

            if (data?.status === 'banned') {
                alert('⛔ Sua conta foi banida');
                await this.logout();
                return;
            }

            log(`✅ Perfil carregado: ${data.full_name} (${data.role})`, 'success');
            this.renderUIByRole();
        } catch (err) {
            log(`❌ Erro ao carregar perfil: ${err.message}`, 'error');
            this.profile = null;
        }
    },

    /**
     * RENDERIZAR UI - ANÚNCIOS APENAS PARA SUPREMO!
     */
    renderUIByRole() {
        const biBtn = document.getElementById('bi-nav-btn');
        const adminBtn = document.getElementById('admin-nav-btn');
        const sellerBtn = document.getElementById('seller-nav-btn');
        const adsBtn = document.getElementById('ads-nav-btn');
        const tenantsBtn = document.getElementById('tenants-nav-btn');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (biBtn) biBtn.classList.add('hidden');
        if (adminBtn) adminBtn.classList.add('hidden');
        if (sellerBtn) sellerBtn.classList.add('hidden');
        if (adsBtn) adsBtn.classList.add('hidden');
        if (tenantsBtn) tenantsBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (loginBtn) loginBtn.classList.remove('hidden');

        if (this.role === 'supreme') {
            if (biBtn) biBtn.classList.remove('hidden');
            if (adminBtn) adminBtn.classList.remove('hidden');
            if (adsBtn) adsBtn.classList.remove('hidden');
            if (tenantsBtn) tenantsBtn.classList.remove('hidden');
            if (logoutBtn) logoutBtn.classList.remove('hidden');
            if (loginBtn) loginBtn.classList.add('hidden');
            log('👑 UI: ADMIN SUPREMO', 'success');

        } else if (this.role === 'seller') {
            if (sellerBtn) sellerBtn.classList.remove('hidden');
            if (logoutBtn) logoutBtn.classList.remove('hidden');
            if (loginBtn) loginBtn.classList.add('hidden');
            log('🪪 UI: VENDEDOR', 'success');

        } else if (this.session) {
            if (logoutBtn) logoutBtn.classList.remove('hidden');
            if (loginBtn) loginBtn.classList.add('hidden');
            log('👤 UI: CLIENTE LOGADO', 'success');

        } else {
            if (loginBtn) loginBtn.classList.remove('hidden');
            log('🚫 UI: ANÔNIMO', 'info');
        }
    },

    isSupreme() {
        return this.role === 'supreme';
    },

    isSeller() {
        return this.role === 'seller' || this.role === 'supreme';
    },

    isLoggedIn() {
        return !!this.session;
    },

    canEditProduct(productOwnerId) {
        if (this.role === 'supreme') return true;
        if (this.role === 'seller' && this.userId === productOwnerId) return true;
        return false;
    },

    openAuthModal(tab = 'login') {
        const modal = document.getElementById('auth-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        if (tab === 'signup') this.showSignupTab();
        else if (tab === 'forgot') this.showForgotTab();
        else this.showLoginTab();
    },

    closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.classList.add('hidden');
    },

    showLoginTab() {
        const loginTab = document.getElementById('login-tab');
        const signupTab = document.getElementById('signup-tab');
        const forgotTab = document.getElementById('forgot-tab');
        const loginBtn = document.getElementById('login-tab-btn');
        const signupBtn = document.getElementById('signup-tab-btn');
        const forgotBtn = document.getElementById('forgot-tab-btn');

        if (loginTab) loginTab.classList.remove('hidden');
        if (signupTab) signupTab.classList.add('hidden');
        if (forgotTab) forgotTab.classList.add('hidden');
        
        if (loginBtn) {
            loginBtn.classList.add('bg-blue-600', 'text-white');
            loginBtn.classList.remove('text-slate-400');
        }
        if (signupBtn) {
            signupBtn.classList.remove('bg-blue-600', 'text-white');
            signupBtn.classList.add('text-slate-400');
        }
        if (forgotBtn) {
            forgotBtn.classList.remove('bg-blue-600', 'text-white');
            forgotBtn.classList.add('text-slate-400');
        }
    },

    showSignupTab() {
        const loginTab = document.getElementById('login-tab');
        const signupTab = document.getElementById('signup-tab');
        const forgotTab = document.getElementById('forgot-tab');
        const loginBtn = document.getElementById('login-tab-btn');
        const signupBtn = document.getElementById('signup-tab-btn');
        const forgotBtn = document.getElementById('forgot-tab-btn');

        if (loginTab) loginTab.classList.add('hidden');
        if (signupTab) signupTab.classList.remove('hidden');
        if (forgotTab) forgotTab.classList.add('hidden');
        
        if (loginBtn) {
            loginBtn.classList.remove('bg-blue-600', 'text-white');
            loginBtn.classList.add('text-slate-400');
        }
        if (signupBtn) {
            signupBtn.classList.add('bg-blue-600', 'text-white');
            signupBtn.classList.remove('text-slate-400');
        }
        if (forgotBtn) {
            forgotBtn.classList.remove('bg-blue-600', 'text-white');
            forgotBtn.classList.add('text-slate-400');
        }
    },

    showForgotTab() {
        const loginTab = document.getElementById('login-tab');
        const signupTab = document.getElementById('signup-tab');
        const forgotTab = document.getElementById('forgot-tab');
        const loginBtn = document.getElementById('login-tab-btn');
        const signupBtn = document.getElementById('signup-tab-btn');
        const forgotBtn = document.getElementById('forgot-tab-btn');

        if (loginTab) loginTab.classList.add('hidden');
        if (signupTab) signupTab.classList.add('hidden');
        if (forgotTab) forgotTab.classList.remove('hidden');
        
        if (loginBtn) {
            loginBtn.classList.remove('bg-blue-600', 'text-white');
            loginBtn.classList.add('text-slate-400');
        }
        if (signupBtn) {
            signupBtn.classList.remove('bg-blue-600', 'text-white');
            signupBtn.classList.add('text-slate-400');
        }
        if (forgotBtn) {
            forgotBtn.classList.add('bg-blue-600', 'text-white');
            forgotBtn.classList.remove('text-slate-400');
        }
    },

    async signup(event) {
        event.preventDefault();

        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const fullName = document.getElementById('signup-name').value;
        const phone = document.getElementById('signup-phone').value;

        const btn = event.target.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = '⏳ CRIANDO...';

        try {
            if (!email || !password || !fullName || !phone) {
                throw new Error('Preencha todos os campos');
            }

            if (password.length < 6) {
                throw new Error('Senha deve ter mínimo 6 caracteres');
            }

            const { data: { user }, error: signUpError } = await _supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName, phone: phone }
                }
            });

            if (signUpError) throw signUpError;
            if (!user) throw new Error('Usuário não foi criado');

            log('✅ Cadastro realizado!', 'success');
            alert('✅ Cadastro realizado!\nVerifique seu email para confirmar.');
            
            this.closeAuthModal();
            setTimeout(() => this.showLoginTab(), 500);

        } catch (err) {
            log(`❌ Erro signup: ${err.message}`, 'error');
            alert(`❌ Erro: ${err.message}`);
        } finally {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    },

    async login(event) {
        event.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const btn = event.target.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = '⏳ ENTRANDO...';

        try {
            const { error } = await _supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            await this.init();
            log('✅ Login bem-sucedido!', 'success');
            alert('✅ Bem-vindo!');
            
            this.closeAuthModal();

        } catch (err) {
            log(`❌ Erro login: ${err.message}`, 'error');
            alert('❌ Email ou senha incorretos');
        } finally {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    },

    /**
     * ✅ NOVA FUNÇÃO: Recuperação de Senha
     */
    async resetPassword(event) {
        event.preventDefault();

        const email = document.getElementById('forgot-email').value;

        if (!email) {
            alert('❌ Digite seu email');
            return;
        }

        const btn = event.target.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = '⏳ ENVIANDO...';

        try {
            const { error } = await _supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            log('✅ Email de recuperação enviado!', 'success');
            alert('✅ Email de recuperação enviado!\n\nVerifique sua caixa de entrada (e spam).');
            
            event.target.reset();
            setTimeout(() => this.showLoginTab(), 2000);

        } catch (err) {
            log(`❌ Erro ao enviar email: ${err.message}`, 'error');
            alert(`❌ Erro: ${err.message}`);
        } finally {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    },

    async logout() {
        if (!confirm('Desconectar?')) return;

        try {
            const { error } = await _supabase.auth.signOut();
            if (error) throw error;

            this.session = null;
            this.profile = null;
            this.role = 'client';
            this.userId = null;

            this.renderUIByRole();
            
            if (window.APP?.navigation) {
                window.APP.navigation.showTab('market');
            }

            log('✅ Logout realizado!', 'success');
            alert('✅ Você foi desconectado');

        } catch (err) {
            log(`❌ Erro logout: ${err.message}`, 'error');
        }
    },

    getUsername() {
        return this.profile?.full_name || this.session?.user?.email || 'Anônimo';
    }
};