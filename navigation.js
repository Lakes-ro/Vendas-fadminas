/**
 * NAVIGATION.JS v2.0 - FINAL
 * Gerencia navegação entre seções SEM ERROS
 */

const Navigation = {
    sections: ['market', 'bi', 'admin', 'seller', 'ads', 'tenants'],
    activeTab: 'market',

    /**
     * ✅ Mostra a aba selecionada
     */
    showTab: function(tab) {
        try {
            // Validação
            if (!this.sections.includes(tab)) {
                log(`Tab inválida: ${tab}`, 'warning');
                return;
            }

            // Esconder todas as seções
            this.sections.forEach(section => {
                const el = document.getElementById(`${section}-section`);
                if (el) el.classList.add('hidden');
            });

            // Mostrar aba selecionada
            const targetEl = document.getElementById(`${tab}-section`);
            if (targetEl) {
                targetEl.classList.remove('hidden');
                this.activeTab = tab;
                log(`Navegação: ${tab}`, 'success');

                // ✅ CARREGAR DADOS CONFORME NECESSÁRIO
                this.loadDataForTab(tab);
            }

        } catch (err) {
            log(`❌ Erro na navegação: ${err.message}`, 'error');
        }
    },

    /**
     * ✅ Carrega dados para cada aba
     */
    loadDataForTab: function(tab) {
        try {
            // Verificar se APP existe
            if (!window.APP) {
                log('⚠️ APP ainda não inicializado', 'warning');
                return;
            }

            // BI Dashboard
            if (tab === 'bi') {
                if (window.APP?.bi && typeof window.APP.bi.loadDashboard === 'function') {
                    window.APP.bi.loadDashboard();
                    log('📊 BI Dashboard carregado', 'success');
                } else {
                    log('⚠️ BI não disponível', 'warning');
                }
            }
            // Admin Panel
            else if (tab === 'admin') {
                if (window.APP?.products && typeof window.APP.products.renderAdmin === 'function') {
                    window.APP.products.renderAdmin();
                    log('🛡️ Admin Panel renderizado', 'success');
                } else {
                    log('⚠️ Admin não disponível', 'warning');
                }
            }
            // Vendedor Panel
            else if (tab === 'seller') {
                if (window.APP?.products && typeof window.APP.products.renderSeller === 'function') {
                    window.APP.products.renderSeller();
                    log('📦 Seller Panel renderizado', 'success');
                } else {
                    log('⚠️ Seller não disponível', 'warning');
                }
            }
            // ADS Panel
            else if (tab === 'tenants') {
                if (window.APP?.tenants && typeof window.APP.tenants.loadDashboard === 'function') {
                    window.APP.tenants.loadDashboard();
                    log('🏪 Tenants Dashboard carregado', 'success');
                } else {
                    log('⚠️ Tenants não disponível', 'warning');
                }
            }

        } catch (err) {
            log(`❌ Erro ao carregar dados: ${err.message}`, 'error');
        }
    },

    /**
     * ✅ Obtém aba ativa
     */
    getActiveTab: function() {
        return this.activeTab;
    }
};