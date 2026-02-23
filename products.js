/**
 * PRODUCTS.JS v3.1 - FIXADO
 * ❌ PROBLEMA CORRIGIDO: owner_id undefined
 * ✅ Melhor error handling
 * ✅ Validações robustas
 */

// Placeholder SVG local — evita dependência de via.placeholder.com
const PRODUCT_PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='160' viewBox='0 0 200 160'%3E%3Crect width='200' height='160' fill='%231e293b'/%3E%3Crect x='70' y='45' width='60' height='50' rx='6' fill='%23334155'/%3E%3Ccircle cx='100' cy='115' r='8' fill='%23334155'/%3E%3Ctext x='100' y='145' text-anchor='middle' font-size='11' fill='%2364748b' font-family='sans-serif'%3ESem imagem%3C/text%3E%3C/svg%3E`;

const Products = {
    editingId: null,
    products: [],

    async fetchAll() {
        try {
            log('📦 Carregando produtos...', 'info');

            const { data, error } = await _supabase
                .from('products')
                .select(`
                    id,
                    name,
                    price,
                    cost_price,
                    stock,
                    description,
                    image_url,
                    owner_id,
                    active,
                    created_at,
                    profiles!owner_id(id, full_name, email)
                `)
                .eq('active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.products = data || [];
            
            // ✅ SEMPRE renderizar
            this.render();
            
            // ✅ Renderizar seções do usuário logado
            if (window.APP?.auth?.userId) {
                setTimeout(() => {
                    this.renderAdmin();
                    if (window.APP.auth.role === 'seller') {
                        this.renderSeller();
                    }
                }, 300);
            }

            log(`✅ ${this.products.length} produtos carregados`, 'success');
            return this.products;

        } catch (err) {
            log(`❌ Erro ao carregar produtos: ${err.message}`, 'error');
            return [];
        }
    },

    render() {
        try {
            const grid = document.getElementById('product-grid');
            if (!grid) {
                log('⚠️ #product-grid não encontrado', 'warning');
                return;
            }

            if (!this.products || this.products.length === 0) {
                grid.innerHTML = '<div class="col-span-full text-slate-600 text-center py-12">Nenhum produto disponível</div>';
                return;
            }

            grid.innerHTML = this.products.map(p => {
                const estoque = p.stock || 0;
                const disponivel = estoque > 0;
                const vendedor = p.profiles?.full_name || 'Vendedor';

                return `
                    <div class="bg-slate-900/40 p-6 rounded-[32px] border border-white/5 flex flex-col gap-4 hover:border-blue-500/30 transition-all">
                        ${p.image_url 
                            ? `<img src="${p.image_url}" alt="${p.name}" class="w-full h-44 object-cover rounded-2xl" onerror="if(!this.dataset.err){this.dataset.err=1;this.src=PRODUCT_PLACEHOLDER}">`
                            : `<div class="w-full h-44 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600">SEM IMAGEM</div>`
                        }
                        
                        <h3 class="text-xl font-bold text-white">${p.name}</h3>
                        <p class="text-slate-500 text-xs line-clamp-2">${p.description || ''}</p>
                        
                        <div class="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg border border-white/5">
                            <i data-lucide="store" class="w-3 h-3 text-yellow-500"></i>
                            <span class="text-xs text-yellow-300 font-semibold truncate">Vendido por: ${vendedor}</span>
                        </div>

                        <div class="flex justify-between items-center">
                            <div class="text-2xl font-black text-white">R$ ${Number(p.price).toFixed(2)}</div>
                            <div class="text-xs font-black ${disponivel ? 'text-green-500' : 'text-red-500'}">
                                ${disponivel ? `${estoque} em estoque` : 'Fora de estoque'}
                            </div>
                        </div>
                        
                        <button onclick="window.APP.cart.add('${p.id}', '${p.name}', ${p.price})" 
                            class="bg-blue-600 py-4 rounded-2xl font-black text-xs uppercase text-white hover:bg-blue-500 transition-all ${!disponivel ? 'opacity-50 cursor-not-allowed' : ''}"
                            ${!disponivel ? 'disabled' : ''}>
                            Adicionar ao Carrinho
                        </button>
                    </div>
                `;
            }).join('');

            if (window.lucide) lucide.createIcons();
            log('✅ Marketplace renderizado', 'success');

        } catch (err) {
            log(`❌ Erro ao renderizar marketplace: ${err.message}`, 'error');
        }
    },

    renderAdmin() {
        try {
            const list = document.getElementById('admin-list');
            if (!list) return;

            let filtrado = this.products;
            
            // VENDEDOR vê APENAS seus
            if (window.APP?.auth?.role === 'seller') {
                filtrado = this.products.filter(p => p.owner_id === window.APP.auth.userId);
            }
            // SUPREMO vê TODOS (sem filtro)

            if (!filtrado || filtrado.length === 0) {
                list.innerHTML = '<div class="text-slate-600 text-center py-8">Nenhum produto</div>';
                return;
            }

            list.innerHTML = filtrado.map(p => `
                <div class="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all">
                    <div class="flex-1">
                        <span class="font-bold text-white block">${p.name}</span>
                        <span class="text-xs text-yellow-400 font-semibold mt-1">👤 ${p.profiles?.full_name || 'Desconhecido'}</span>
                        <span class="text-xs text-slate-500 mt-1">R$ ${Number(p.price).toFixed(2)}</span>
                        <span class="text-xs ${p.stock > 10 ? 'text-green-500' : p.stock > 0 ? 'text-yellow-500' : 'text-red-500'} font-black mt-1 block">
                            Estoque: ${p.stock}
                        </span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick='window.APP.products.edit(${JSON.stringify(p).replace(/'/g, "&apos;")})' class="text-blue-500 p-2 hover:bg-blue-500/10 rounded-lg transition-all">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                        <button onclick="window.APP.products.delete('${p.id}')" class="text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-all">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            if (window.lucide) lucide.createIcons();
            log('✅ Admin list renderizado', 'success');

        } catch (err) {
            log(`❌ Erro ao renderizar admin: ${err.message}`, 'error');
        }
    },

    renderSeller() {
        try {
            const list = document.getElementById('seller-list');
            if (!list) return;

            if (!window.APP?.auth?.userId) {
                list.innerHTML = '<div class="text-slate-600 text-center py-8">Você precisa estar logado</div>';
                return;
            }

            const meus = this.products.filter(p => p.owner_id === window.APP.auth.userId);
            
            if (!meus || meus.length === 0) {
                list.innerHTML = '<div class="text-slate-600 text-center py-8">Você não tem produtos ainda</div>';
                return;
            }

            list.innerHTML = meus.map(p => `
                <div class="bg-slate-900/40 p-6 rounded-[32px] border border-white/5 flex flex-col gap-4 hover:border-blue-500/30 transition-all">
                    ${p.image_url 
                        ? `<img src="${p.image_url}" alt="${p.name}" class="w-full h-44 object-cover rounded-2xl" onerror="if(!this.dataset.err){this.dataset.err=1;this.src=PRODUCT_PLACEHOLDER}">`
                        : `<div class="w-full h-44 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600">SEM IMAGEM</div>`
                    }
                    
                    <h3 class="text-xl font-bold text-white">${p.name}</h3>
                    <p class="text-slate-500 text-xs line-clamp-2">${p.description || ''}</p>

                    <div class="flex justify-between items-center">
                        <div class="text-2xl font-black text-white">R$ ${Number(p.price).toFixed(2)}</div>
                        <div class="text-xs font-bold text-slate-400">Estoque: ${p.stock}</div>
                    </div>
                    
                    <div class="flex gap-2">
                        <button onclick='window.APP.products.edit(${JSON.stringify(p).replace(/'/g, "&apos;")})' class="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded-2xl font-bold text-xs text-white transition-all">
                            ✏️ EDITAR
                        </button>
                        <button onclick="window.APP.products.delete('${p.id}')" class="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded-2xl font-bold text-xs text-white transition-all">
                            🗑️ DELETAR
                        </button>
                    </div>
                </div>
            `).join('');

            if (window.lucide) lucide.createIcons();
            log('✅ Seller grid renderizado', 'success');

        } catch (err) {
            log(`❌ Erro ao renderizar seller: ${err.message}`, 'error');
        }
    },

    openModal() {
        try {
            // ✅ VALIDAÇÃO 1: Logado?
            if (!window.APP?.auth?.isLoggedIn()) {
                alert('❌ Você precisa fazer login');
                window.APP.auth.openAuthModal();
                return;
            }

            // ✅ VALIDAÇÃO 2: userId definido?
            if (!window.APP.auth.userId) {
                alert('❌ Erro ao identificar usuário. Tente fazer login novamente.');
                log('❌ userId undefined ao abrir modal', 'error');
                return;
            }

            this.editingId = null;
            const form = document.querySelector('#admin-modal form');
            if (form) form.reset();
            
            const title = document.querySelector('#admin-modal h3');
            if (title) title.innerText = 'NOVO PRODUTO';
            
            const modal = document.getElementById('admin-modal');
            if (modal) modal.classList.remove('hidden');

            log('✅ Modal de produto aberto', 'success');

        } catch (err) {
            log(`❌ Erro ao abrir modal: ${err.message}`, 'error');
            alert(`❌ Erro: ${err.message}`);
        }
    },

    closeModal() {
        try {
            const modal = document.getElementById('admin-modal');
            if (modal) modal.classList.add('hidden');
            this.editingId = null;
        } catch (err) {
            log(`❌ Erro ao fechar modal: ${err.message}`, 'error');
        }
    },

    edit(product) {
        try {
            if (!window.APP.auth.canEditProduct(product.owner_id)) {
                alert('❌ Você não tem permissão para editar este produto');
                return;
            }

            this.editingId = product.id;
            
            document.getElementById('p-name').value = product.name || '';
            document.getElementById('p-price').value = product.price || 0;
            document.getElementById('p-cost').value = product.cost_price || 0;
            document.getElementById('p-stock').value = product.stock || 0;
            document.getElementById('p-desc').value = product.description || '';
            
            const title = document.querySelector('#admin-modal h3');
            if (title) title.innerText = `✏️ EDITAR: ${product.name}`;
            
            const modal = document.getElementById('admin-modal');
            if (modal) modal.classList.remove('hidden');

            log(`✏️ Editando: ${product.name}`, 'info');

        } catch (err) {
            log(`❌ Erro ao editar: ${err.message}`, 'error');
        }
    },

    async saveProduct(event) {
        event.preventDefault();

        const btn = event.target.querySelector('button[type="submit"]');
        const originalText = btn?.innerText;

        try {
            if (btn) {
                btn.disabled = true;
                btn.innerText = '⏳ SALVANDO...';
            }

            // ✅ VALIDAÇÃO 1: Logado?
            if (!window.APP.auth.isLoggedIn()) {
                throw new Error('Você precisa estar logado');
            }

            // ✅ VALIDAÇÃO 2: userId existe?
            if (!window.APP.auth.userId) {
                throw new Error('Erro ao identificar usuário');
            }

            // ✅ VALIDAÇÃO 3: Campos obrigatórios
            const name = document.getElementById('p-name').value?.trim();
            const price = parseFloat(document.getElementById('p-price').value);

            if (!name) throw new Error('Nome é obrigatório');
            if (!price || price < 0) throw new Error('Preço deve ser válido');

            let imageUrl = null;
            const fileInput = document.getElementById('p-image');
            
            if (fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error('Imagem maior que 5MB');
                }

                const fileName = `${Date.now()}-${file.name}`;
                
                const { error: uploadError } = await _supabase.storage
                    .from('product-images')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: publicUrl } = _supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName);

                imageUrl = publicUrl.publicUrl;
                log(`📤 Imagem enviada: ${fileName}`, 'success');
            }

            const productData = {
                name: name,
                price: price,
                cost_price: parseFloat(document.getElementById('p-cost').value) || 0,
                stock: parseInt(document.getElementById('p-stock').value) || 0,
                description: document.getElementById('p-desc').value?.trim() || '',
                owner_id: window.APP.auth.userId,  // ✅ GARANTIDO que existe
                active: true
            };

            if (imageUrl) productData.image_url = imageUrl;

            let result;
            if (this.editingId) {
                const product = this.products.find(p => p.id === this.editingId);
                if (!window.APP.auth.canEditProduct(product.owner_id)) {
                    throw new Error('Você não tem permissão para editar este produto');
                }

                result = await _supabase
                    .from('products')
                    .update(productData)
                    .eq('id', this.editingId);
                
                log('✅ Produto atualizado', 'success');
                alert('✅ Produto atualizado!');
            } else {
                result = await _supabase
                    .from('products')
                    .insert([productData]);
                
                log('✅ Produto criado', 'success');
                alert('✅ Produto criado!');
            }

            if (result.error) throw result.error;

            this.closeModal();
            await this.fetchAll();

        } catch (err) {
            log(`❌ Erro ao salvar: ${err.message}`, 'error');
            alert(`❌ Erro: ${err.message}`);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = originalText;
            }
        }
    },

    async delete(productId) {
        try {
            const product = this.products.find(p => p.id === productId);
            
            if (!window.APP.auth.canEditProduct(product.owner_id)) {
                alert('❌ Você não tem permissão para deletar este produto');
                return;
            }

            if (!confirm(`⚠️ Deletar "${product.name}"?`)) return;
            if (!confirm('❌ ATENÇÃO: IRREVERSÍVEL!')) return;

            log(`🗑️ Deletando ${productId}...`, 'info');

            const { error } = await _supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) throw error;

            log('✅ Produto deletado', 'success');
            alert('✅ Produto removido!');
            await this.fetchAll();

        } catch (err) {
            log(`❌ Erro ao deletar: ${err.message}`, 'error');
            alert(`❌ Erro: ${err.message}`);
        }
    }
};/**
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
            <img src="${product.imagem_url || PRODUCT_PLACEHOLDER}" 
                 alt="${product.nome}"
                 loading="lazy"
                 onerror="if(!this.dataset.err){this.dataset.err=1;this.src=PRODUCT_PLACEHOLDER}">
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