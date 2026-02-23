/**
 * ORDERS.JS v3.1
 * Sistema de Checkout Simplificado
 * Apenas: Pix e Dinheiro na Entrega
 */

const Orders = {
    /**
     * ABRE MODAL DE CHECKOUT
     */
    checkout() {
        if (window.APP.cart.getCount() === 0) {
            alert('❌ Seu carrinho está vazio!');
            return;
        }

        // Clientes não precisam de conta para comprar — apenas nome e telefone
        const modal = document.getElementById('customer-modal');
        if (modal) modal.classList.remove('hidden');
    },

    /**
     * FECHA MODAL DE CHECKOUT
     */
    closeCustomerModal() {
        const modal = document.getElementById('customer-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.querySelector('#customer-modal form').reset();
        }
    },

    /**
     * PROCESSA A COMPRA
     */
    async sendOrder(event) {
        event.preventDefault();

        const customerName = document.getElementById('cust-name').value;
        const customerPhone = document.getElementById('cust-phone').value;
        const paymentMethod = document.getElementById('cust-payment').value;
        const totalAmount = window.APP.cart.getTotal();
        const items = [...window.APP.cart.items];

        const btn = document.getElementById('btn-finish');
        const originalText = btn.innerText;

        btn.disabled = true;
        btn.innerText = '⏳ PROCESSANDO...';

        try {
            // Validações
            if (!customerName || !customerPhone) {
                throw new Error('Nome e telefone são obrigatórios');
            }

            if (items.length === 0) {
                throw new Error('Carrinho vazio');
            }

            if (!paymentMethod) {
                throw new Error('Escolha uma forma de pagamento');
            }

            log('🚀 Iniciando processamento do pedido...', 'info');

            // ========================================
            // CRIAR PEDIDO
            // ========================================
            const { data: orderData, error: orderError } = await _supabase
                .from('orders')
                .insert([{
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    payment_method: paymentMethod,
                    total_amount: totalAmount,
                    status: 'pending'
                }])
                .select();

            if (orderError) throw orderError;
            if (!orderData || orderData.length === 0) throw new Error('Erro ao criar pedido');

            const orderId = orderData[0].id;
            log('✅ Pedido criado: ' + orderId, 'success');

            // ========================================
            // CRIAR ITENS DO PEDIDO
            // ========================================
            const orderItems = items.map(item => ({
                order_id: orderId,
                product_id: item.id,
                quantity: 1,
                unit_price: item.price,
                unit_cost: 0
            }));

            const { error: itemsError } = await _supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            log('✅ Itens do pedido criados', 'success');

            // ========================================
            // LIMPAR CARRINHO
            // ========================================
            window.APP.cart.clear();

            // ========================================
            // FECHAR MODAL
            // ========================================
            this.closeCustomerModal();

            // ========================================
            // EXIBIR COMPROVANTE
            // ========================================
            await this.showReceipt({
                order_id: orderId,
                customer_name: customerName,
                customer_phone: customerPhone,
                payment_method: paymentMethod,
                total_amount: totalAmount,
                items: items,
                timestamp: new Date()
            });

        } catch (err) {
            log(`❌ Erro no checkout: ${err.message}`, 'error');
            alert(`❌ Erro na compra:\n${err.message}\n\nTente novamente`);
        } finally {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    },

    /**
     * EXIBE COMPROVANTE DE COMPRA
     */
    async showReceipt(orderData) {
        const receiptHTML = `
            <div class="fixed inset-0 z-[5000] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
                <div class="bg-[#161b2c] p-8 rounded-[40px] w-full max-w-md border border-slate-800 max-h-[90vh] overflow-y-auto">
                    
                    <!-- CABEÇALHO -->
                    <div class="text-center border-b border-slate-700 pb-6 mb-6">
                        <div class="text-5xl mb-2">✅</div>
                        <h2 class="text-2xl font-black text-green-500 uppercase">Compra Realizada!</h2>
                        <p class="text-slate-400 text-xs mt-2">Pedido processado com sucesso</p>
                    </div>

                    <!-- NÚMERO DO PEDIDO -->
                    <div class="bg-white/5 p-4 rounded-2xl mb-6 text-center border border-white/10">
                        <div class="text-xs text-slate-500 uppercase mb-1">Número do Pedido</div>
                        <div class="font-black text-white text-lg">#${orderData.order_id.slice(0, 8).toUpperCase()}</div>
                    </div>

                    <!-- DADOS DO CLIENTE -->
                    <div class="mb-6">
                        <div class="text-xs text-slate-500 uppercase font-black mb-3">Dados da Compra</div>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-slate-400">Cliente:</span>
                                <span class="text-white font-bold">${orderData.customer_name}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-400">Telefone:</span>
                                <span class="text-white font-bold">${orderData.customer_phone}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-400">Data/Hora:</span>
                                <span class="text-white font-bold">${orderData.timestamp.toLocaleString('pt-BR')}</span>
                            </div>
                        </div>
                    </div>

                    <!-- ITENS COMPRADOS -->
                    <div class="mb-6">
                        <div class="text-xs text-slate-500 uppercase font-black mb-3">Itens</div>
                        <div class="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                            ${orderData.items.map(item => `
                                <div class="text-xs bg-white/5 p-2 rounded-lg flex justify-between">
                                    <span class="text-slate-300">${item.name}</span>
                                    <span class="text-green-500 font-bold">R$ ${item.price.toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- TOTAL -->
                    <div class="bg-gradient-to-r from-blue-900/50 to-slate-900/50 p-4 rounded-2xl mb-6 border border-blue-500/20">
                        <div class="flex justify-between items-center">
                            <span class="text-slate-300 font-bold">TOTAL</span>
                            <span class="text-3xl font-black text-blue-500">R$ ${orderData.total_amount.toFixed(2)}</span>
                        </div>
                    </div>

                    <!-- INFORMAÇÕES DE PAGAMENTO -->
                    <div class="mb-6 p-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10">
                        <div class="text-xs text-slate-500 uppercase font-black mb-3">Forma de Pagamento</div>
                        
                        ${orderData.payment_method === 'Pix' ? `
                            <!-- PIX -->
                            <div class="space-y-3">
                                <div class="text-sm text-yellow-300">
                                    <strong>💳 Pague via Pix</strong>
                                </div>
                                <div class="bg-white/10 p-3 rounded-xl text-center">
                                    <div class="text-xs text-slate-500 mb-2">Chave Pix (Copia e Cola)</div>
                                    <div class="text-white font-mono text-sm break-all font-bold" id="pix-key">
                                        35991264352
                                    </div>
                                    <button onclick="navigator.clipboard.writeText('35991264352'); this.innerText = '✅ COPIADO!'" class="mt-2 text-xs bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-500 w-full font-bold">
                                        📋 COPIAR CHAVE
                                    </button>
                                </div>
                                <p class="text-xs text-yellow-300 mt-2">
                                    ⏱️ Seu pedido será confirmado assim que recebermos o comprovante.
                                </p>
                            </div>
                        ` : `
                            <!-- DINHEIRO NA ENTREGA -->
                            <div class="space-y-2">
                                <div class="text-sm text-green-300">
                                    <strong>💵 Dinheiro na Entrega</strong>
                                </div>
                                <p class="text-xs text-slate-400 mt-2">
                                    Você pagará quando receber o pedido em sua casa.
                                </p>
                            </div>
                        `}
                    </div>

                    <!-- PRÓXIMOS PASSOS -->
                    <div class="bg-white/5 p-4 rounded-2xl mb-6 border border-white/10">
                        <div class="text-xs text-slate-500 uppercase font-black mb-2">Próximos Passos</div>
                        <ol class="text-xs text-slate-300 space-y-1 list-decimal list-inside">
                            <li>Seu pedido foi registrado no sistema</li>
                            <li>Aguarde confirmação do pagamento</li>
                            <li>Você receberá o produto em breve</li>
                        </ol>
                    </div>

                    <!-- BOTÕES -->
                    <div class="space-y-3">
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-500 transition-all">
                            ✓ FECHAR COMPROVANTE
                        </button>
                        <button onclick="window.print()" class="w-full bg-slate-700 text-white py-2 rounded-2xl font-bold hover:bg-slate-600 transition-all text-sm">
                            🖨️ IMPRIMIR
                        </button>
                    </div>
                </div>
            </div>
        `;

        const container = document.createElement('div');
        container.innerHTML = receiptHTML;
        document.body.appendChild(container);

        if (window.lucide) lucide.createIcons();
    }
};