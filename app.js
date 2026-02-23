/**
 * APP.JS v3.0 - CORRIGIDO
 * Inicializa APP + Recuperação de Senha + Produtos
 */

const APP = {
    auth: null,
    products: null,
    ads: null,
    bi: null,
    navigation: null,
    storeStatus: null,

    async init() {
        try {
            log('🚀 Inicializando APP v3.0...', 'info');

            // 1. SUPABASE
            if (!window._supabase) {
                throw new Error('Supabase não disponível');
            }

            // 2. AUTH
            window.APP.auth = Auth;
            await window.APP.auth.init();

            // 3. STORE STATUS
            window.APP.storeStatus = StoreStatus;

            // 4. PRODUCTS ✅ AQUI
            window.APP.products = Products;
            await window.APP.products.fetchAll();

            // 5. ADS
            window.APP.ads = Ads;
            window.APP.tenants = Tenants;
            window.APP.admin = Admin;
            await window.APP.ads.init();

            // 6. BI
            window.APP.bi = BI;

            // 7. NAVIGATION
            window.APP.navigation = Navigation;
            window.APP.navigation.showTab('market');

            // 8. CART
            window.APP.cart = Cart;
            window.APP.cart.init();

            // 9. ORDERS
            window.APP.orders = Orders;

            log('✅ APP v3.0 inicializado com sucesso!', 'success');
            console.log('APP:', window.APP);

        } catch (err) {
            log(`❌ Erro ao inicializar APP: ${err.message}`, 'error');
            console.error(err);
        }
    }
};

/**
 * ✅ FUNÇÕES GLOBAIS PARA HTML
 */

function goToTab(tab) {
    window.APP.navigation.showTab(tab);
}

function toggleCart() {
    window.APP.cart.toggleCart();
}

/**
 * ✅ ABRIR MODAL COM RECUPERAÇÃO DE SENHA
 */
function openLogin(tab) {
    window.APP.auth.openAuthModal(tab);
}

function doLogout() {
    window.APP.auth.logout();
}

/**
 * ✅ ABRIR MODAL DE PRODUTO
 */
function openProductModal() {
    if (window.APP?.products?.openModal) {
        window.APP.products.openModal();
    } else {
        alert('❌ Produto módulo não carregado');
    }
}

/**
 * ✅ LOG - Sistema de Logging
 */
function log(message, type = 'info') {
    const prefix = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };

    const style = {
        'success': 'color: #10b981; font-weight: bold;',
        'error': 'color: #ef4444; font-weight: bold;',
        'warning': 'color: #f59e0b; font-weight: bold;',
        'info': 'color: #3b82f6; font-weight: bold;'
    };

    console.log(`${prefix[type]} ${message}`, style[type]);
}

// ✅ INICIALIZAR QUANDO DOM ESTIVER PRONTO
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        APP.init();
    });
} else {
    APP.init();
}

// ✅ EXPOR GLOBALMENTE
window.APP = APP;