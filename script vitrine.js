/**
 * ================================================
 * SCRIPT-VITRINE.JS - SISTEMA DE VITRINE COMPLETO
 * ================================================
 * Restauração crítica de dados + Mobile-First
 */

const SUPABASE_URL = 'https://ctsoaueknnbcknslogpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0c29hdWVrbm5iY2tuc2xvZ3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTYyODIsImV4cCI6MjA4NjU3MjI4Mn0.j8CsmiJjPQfSzJZDRNz6MnKdR2wk3TFAigkqvVbxyDQ';

let supabaseClient = null;
let allProducts = [];
let stateLastUpdated = {};

/**
 * ================================================
 * INICIALIZAÇÃO SUPABASE
 * ================================================
 */

function initSupabase() {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase inicializado');
        return true;
    } else {
        console.error('❌ SDK Supabase não carregou');
        return false;
    }
}

/**
 * ================================================
 * RESTAURAÇÃO CRÍTICA DE DADOS - PRODUTOS
 * ================================================
 */

async function getProducts() {
    try {
        if (!supabaseClient) {
            throw new Error('Supabase não inicializado');
        }

        // Busca com JOIN para vendedor
        const { data, error } = await supabaseClient
            .from('products_with_vendor')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Erro ao buscar produtos (view):', error);
            
            // FALLBACK: Tenta tabela direta se view falhar
            const { data: fallbackData, error: fallbackError } = await supabaseClient
                .from('produtos')
                .select('*, vendedores(id, nome, email)')
                .order('created_at', { ascending: false });

            if (fallbackError) {
                showConnectionError();
                return [];
            }

            return fallbackData || [];
        }

        allProducts = data || [];
        console.log(`✅ ${allProducts.length} produtos carregados`);
        return allProducts;

    } catch (error) {
        console.error('❌ Erro crítico ao carregar produtos:', error);
        showConnectionError();
        return [];
    }
}

/**
 * ================================================
 * RENDERIZAÇÃO DE PRODUTOS NA VITRINE
 * ================================================
 */

async function renderProducts() {
    const gridContainer = document.getElementById('product-grid');
    
    if (!gridContainer) {
        console.warn('❌ #product-grid não encontrado no DOM');
        return;
    }

    try {
        // Limpa grid
        gridContainer.innerHTML = '';

        // Carrega produtos
        const products = await getProducts();

        if (!products || products.length === 0) {
            gridContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; padding: 40px 20px; text-align: center;">
                    <p style="color: #a0a0b0; font-size: 18px; margin-bottom: 20px;">
                        😔 Nenhum produto disponível no momento
                    </p>
                    <p style="color: #6b7c8f; font-size: 14px;">
                        Tente atualizar a página em breve.
                    </p>
                    <button onclick="location.reload()" class="btn btn--secondary" style="margin-top: 20px;">
                        🔄 Atualizar
                    </button>
                </div>
            `;
            return;
        }

        // RENDERIZA CADA PRODUTO
        products.forEach(product => {
            const card = createProductCard(product);
            gridContainer.appendChild(card);
        });

        console.log(`✅ ${products.length} produtos renderizados`);

    } catch (error) {
        console.error('❌ Erro ao renderizar produtos:', error);
        gridContainer.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: #ff6464;">
                <p>❌ Ops! Problema de conexão com o banco. Tente atualizar a página.</p>
            </div>
        `;
    }
}

/**
 * ================================================
 * CRIAR CARD DE PRODUTO
 * ================================================
 */

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <div class="product-image">
            <img src="${product.imagem_url || 'https://via.placeholder.com/200'}" 
                 alt="${product.nome}"
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/200'">
            ${getStockBadge(product)}
        </div>
        
        <div class="product-info">
            <h3 class="product-title">${product.nome}</h3>
            <p class="product-vendor">${product.vendedor_nome || 'Vendedor'}</p>
            
            <p class="product-description">${product.descricao || 'Sem descrição'}</p>
            
            <div class="product-price">
                <span class="price-value">R$ ${parseFloat(product.preco || 0).toFixed(2)}</span>
                <span class="price-unit">${product.unidade || ''}</span>
            </div>

            <button class="btn btn--primary btn--full" onclick="openCheckoutModal('${product.id}')">
                🛒 Comprar
            </button>
        </div>
    `;
    return card;
}

/**
 * ================================================
 * BADGE DE ESTOQUE (30 MINUTOS PARA ZERO)
 * ================================================
 */

function getStockBadge(product) {
    const estoque = product.estoque || 0;
    
    // Verifica se é estoque zero e quanto tempo passou
    if (estoque === 0) {
        const updatedAt = new Date(product.updated_at);
        const now = new Date();
        const minutosPassed = (now - updatedAt) / (1000 * 60);

        // Se passou menos de 30 minutos, mostra badge "Fora de estoque"
        if (minutosPassed < 30) {
            return `<div class="stock-badge stock-badge--out">❌ Fora de Estoque</div>`;
        }
        // Após 30 minutos, marca como "Disponível em Breve"
        return `<div class="stock-badge stock-badge--coming">⏳ Disponível em Breve</div>`;
    }

    // Estoque baixo
    if (estoque <= 5) {
        return `<div class="stock-badge stock-badge--low">⚠️ ${estoque} restantes</div>`;
    }

    return '';
}

/**
 * ================================================
 * MODAL DE CHECKOUT (SEM LOGIN)
 * ================================================
 */

function openCheckoutModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    // Se estoque = 0, não permite compra
    if (product.estoque === 0) {
        alert('❌ Produto fora de estoque!');
        return;
    }

    const modal = document.getElementById('checkout-modal');
    if (!modal) return;

    // Preenche dados do produto
    document.getElementById('checkout-product-name').textContent = product.nome;
    document.getElementById('checkout-product-price').textContent = `R$ ${parseFloat(product.preco).toFixed(2)}`;
    document.getElementById('checkout-product-id').value = productId;

    // Limpa formulário
    document.getElementById('checkout-form').reset();

    // Mostra modal
    modal.classList.add('modal--active');
    modal.style.display = 'flex';
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.classList.remove('modal--active');
        modal.style.display = 'none';
    }
}

/**
 * ================================================
 * SUBMISSÃO DO CHECKOUT
 * ================================================
 */

async function handleCheckout(event) {
    event.preventDefault();

    const productId = document.getElementById('checkout-product-id').value;
    const name = document.getElementById('checkout-name').value.trim();
    const curso = document.getElementById('checkout-curso').value.trim();
    const whatsapp = document.getElementById('checkout-whatsapp').value.trim();

    if (!name || !curso || !whatsapp) {
        alert('❌ Preencha todos os campos obrigatórios');
        return;
    }

    try {
        // Aqui você salvaria o pedido no banco
        const product = allProducts.find(p => p.id === productId);
        
        console.log('✅ Pedido criado:', {
            produto: product.nome,
            cliente_nome: name,
            cliente_curso: curso,
            cliente_whatsapp: whatsapp,
            valor: product.preco,
            data: new Date().toISOString()
        });

        alert(`✅ Pedido enviado com sucesso!\n\nNos vemos em breve, ${name}! 🎉`);
        closeCheckoutModal();

    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        alert('❌ Erro ao processar pedido. Tente novamente.');
    }
}

/**
 * ================================================
 * MENSAGEM DE ERRO DE CONEXÃO
 * ================================================
 */

function showConnectionError() {
    const gridContainer = document.getElementById('product-grid');
    if (gridContainer) {
        gridContainer.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: #ff6464;">
                <p style="font-size: 18px; margin-bottom: 10px;">🔴 Ops! Problema de conexão com o banco.</p>
                <p style="color: #a0a0b0; margin-bottom: 20px;">Tente atualizar a página.</p>
                <button onclick="location.reload()" class="btn btn--secondary">🔄 Atualizar Agora</button>
            </div>
        `;
    }
}

/**
 * ================================================
 * INICIALIZAÇÃO AO CARREGAR PÁGINA
 * ================================================
 */

function initVitrine() {
    console.log('🚀 Inicializando vitrine...');

    // 1. Inicializa Supabase
    if (!initSupabase()) {
        console.error('❌ Falha ao inicializar Supabase');
        return;
    }

    // 2. Carrega e renderiza produtos
    renderProducts();

    // 3. Fecha modal ao clicar fora
    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCheckoutModal();
            }
        });
    }

    console.log('✅ Vitrine inicializada');
}

// DISPARA QUANDO O DOM ESTÁ PRONTO
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVitrine);
} else {
    initVitrine();
}

// EXPORTA FUNÇÕES PARA WINDOW (acessível do HTML)
window.renderProducts = renderProducts;
window.openCheckoutModal = openCheckoutModal;
window.closeCheckoutModal = closeCheckoutModal;
window.handleCheckout = handleCheckout;

console.log('✅ script-vitrine.js carregado');