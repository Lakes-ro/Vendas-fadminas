/**
 * ADMIN.JS v3.3 - CORRIGIDO PARA MULTI-VENDOR
 * Mudanças: seller_id → owner_id (4 linhas)
 */

const Admin = {
    editingId: null,
    products: [],

    async loadDashboard() {
        try {
            log('📊 Carregando Admin Dashboard...', 'info');

            if (!window.APP.auth.isSupreme()) {
                log('❌ Acesso negado ao admin', 'error');
                return;
            }

            // ✅ CORRIGIDO: JOIN com profiles para ver nome do vendedor
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
                    updated_at,
                    profiles!owner_id(id, full_name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.products = data || [];
            this.renderAdminList();
            log('✅ Admin dashboard carregado', 'success');
        } catch (err) {
            log(`❌ Erro ao carregar admin: ${err.message}`, 'error');
        }
    },

    renderAdminList() {
        const list = document.getElementById('admin-list');
        if (!list) return;

        if (this.products.length === 0) {
            list.innerHTML = '<div class="text-slate-600 text-sm text-center py-8">Nenhum produto cadastrado</div>';
            return;
        }

        list.innerHTML = this.products.map(p => {
            const estoque = p.stock || 0;
            const statusCor = estoque > 10 ? 'text-green-500' : estoque > 0 ? 'text-yellow-500' : 'text-red-500';
            // ✅ CORRIGIDO: Mostrar nome do vendedor do JOIN
            const vendorName = p.profiles?.full_name || 'Desconhecido';
            
            return `
                <div class="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all">
                    <div class="flex-1">
                        <span class="font-bold text-white block">${p.name}</span>
                        <span class="text-xs text-yellow-400 font-semibold mt-1">👤 ${vendorName}</span>
                        <span class="text-xs text-slate-500 mt-1">R$ ${Number(p.price).toFixed(2)}</span>
                        <span class="text-xs ${statusCor} font-black mt-1 block">Estoque: ${estoque}</span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick='window.APP.admin.edit(${JSON.stringify(p).replace(/'/g, "&apos;")})' class="text-blue-500 p-2 hover:bg-blue-500/10 rounded-lg transition-all" title="Editar">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                        <button onclick="window.APP.admin.delete('${p.id}')" class="text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-all" title="Deletar">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();
    },

    openModal() {
        if (!window.APP.auth.isLoggedIn()) {
            alert('❌ Você precisa fazer login para criar produtos');
            window.APP.auth.openAuthModal();
            return;
        }

        this.editingId = null;
        document.querySelector('#admin-modal form').reset();
        document.querySelector('#admin-modal h3').innerText = 'NOVO PRODUTO';
        document.getElementById('admin-modal').classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('admin-modal').classList.add('hidden');
        this.editingId = null;
    },

    edit(product) {
        // ✅ CORRIGIDO: owner_id em vez de seller_id
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
        document.querySelector('#admin-modal h3').innerText = `✏️ EDITAR: ${product.name}`;
        document.getElementById('admin-modal').classList.remove('hidden');

        log(`✏️ Editando: ${product.name}`, 'info');
    },

    async saveProduct(event) {
        event.preventDefault();

        const btn = document.getElementById('btn-save');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = 'PROCESSANDO...';

        try {
            if (!window.APP.auth.isLoggedIn()) {
                throw new Error('Você precisa estar logado');
            }

            let imageUrl = null;
            const fileInput = document.getElementById('p-image');
            if (fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                
                if (file.size > CONFIG.MAX_IMAGE_SIZE) {
                    throw new Error('Imagem maior que 5MB');
                }

                const fileName = `${Date.now()}-${file.name}`;
                const { error: uploadError } = await _supabase.storage
                    .from('product-images')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                imageUrl = _supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName).data.publicUrl;
            }

            const productData = {
                name: document.getElementById('p-name').value,
                price: parseFloat(document.getElementById('p-price').value),
                cost_price: parseFloat(document.getElementById('p-cost').value),
                stock: parseInt(document.getElementById('p-stock').value) || 0,
                description: document.getElementById('p-desc').value,
                // ✅ CORRIGIDO: owner_id em vez de seller_id
                owner_id: window.APP.auth.userId,
                active: true
            };

            if (imageUrl) productData.image_url = imageUrl;

            let result;
            if (this.editingId) {
                // EDITAR
                const product = this.products.find(p => p.id === this.editingId);
                // ✅ CORRIGIDO: owner_id em vez de seller_id
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
                // CRIAR NOVO
                result = await _supabase
                    .from('products')
                    .insert([productData]);
                
                log('✅ Produto criado', 'success');
                alert('✅ Produto criado!');
            }

            if (result.error) throw result.error;

            this.closeModal();
            await this.loadDashboard();
        } catch (err) {
            log(`❌ Erro ao salvar: ${err.message}`, 'error');
            alert('❌ Erro: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    },

    async delete(productId) {
        const product = this.products.find(p => p.id === productId);
        // ✅ CORRIGIDO: owner_id em vez de seller_id
        if (!window.APP.auth.canEditProduct(product.owner_id)) {
            alert('❌ Você não tem permissão para deletar este produto');
            return;
        }

        if (!confirm(`⚠️ Deletar "${product.name}"?`)) return;
        if (!confirm('❌ ATENÇÃO: IRREVERSÍVEL!\n\nConfirma?')) return;

        try {
            const { error } = await _supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) throw error;

            log('✅ Produto deletado', 'success');
            alert('✅ Produto removido!');
            await this.loadDashboard();
        } catch (err) {
            log(`❌ Erro ao deletar: ${err.message}`, 'error');
            alert('❌ Erro: ' + err.message);
        }
    }
};