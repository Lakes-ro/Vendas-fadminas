/**
 * BI.JS v4.2 - GRÁFICOS SEMPRE VISÍVEIS
 * Corrige: Gráfico de produtos ficava branco quando sem dados
 */

const BI = {
    charts: {},
    isSupremo: false,

    async loadDashboard() {
        try {
            log('📊 Carregando BI Dashboard...', 'info');

            if (!window.APP.auth.isSupreme()) {
                log('❌ Acesso negado ao BI', 'error');
                return;
            }

            // Carregar pedidos
            const { data: orders, error } = await _supabase
                .from('orders')
                .select(`
                    id,
                    customer_name,
                    total_amount,
                    status,
                    created_at,
                    order_items (
                        id,
                        product_id,
                        quantity,
                        unit_price,
                        unit_cost
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const allOrders = orders || [];
            
            // Renderizar KPIs
            this.renderKPIs(allOrders);
            
            // Renderizar lista de pedidos
            this.renderOrderList(allOrders);
            
            // Preparar dados dos gráficos
            this.prepareCharts(allOrders);
            
            log('✅ BI dashboard carregado', 'success');

        } catch (err) {
            log(`❌ Erro ao carregar BI: ${err.message}`, 'error');
            this.renderMockCharts();
        }
    },

    renderKPIs(orders) {
        try {
            const total = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
            const lucro = orders.reduce((sum, o) => {
                const itemsCost = (o.order_items || []).reduce((s, i) => s + (i.unit_cost * i.quantity), 0);
                return sum + ((o.total_amount || 0) - itemsCost);
            }, 0);
            const margem = total > 0 ? ((lucro / total) * 100).toFixed(1) : 0;

            const faturamentoEl = document.getElementById('bi-faturamento');
            const lucroEl = document.getElementById('bi-lucro');
            const margemEl = document.getElementById('bi-margem');
            const pedidosEl = document.getElementById('bi-pedidos');

            if (faturamentoEl) faturamentoEl.textContent = `R$ ${total.toFixed(2)}`;
            if (lucroEl) lucroEl.textContent = `R$ ${lucro.toFixed(2)}`;
            if (margemEl) margemEl.textContent = `${margem}%`;
            if (pedidosEl) pedidosEl.textContent = orders.length;

        } catch (err) {
            log(`❌ Erro ao renderizar KPIs: ${err.message}`, 'error');
        }
    },

    renderOrderList(orders) {
        try {
            const list = document.getElementById('bi-orders-detail');
            if (!list) {
                log('⚠️ Elemento bi-orders-detail não encontrado', 'warning');
                return;
            }

            if (orders.length === 0) {
                list.innerHTML = '<div class="text-slate-500 text-sm text-center py-8">Nenhum pedido</div>';
                return;
            }

            list.innerHTML = orders.slice(0, 5).map(order => `
                <div class="flex justify-between items-start bg-white/5 p-4 rounded-xl border border-white/5">
                    <div class="flex-1">
                        <div class="font-bold text-white">Pedido #${order.id.substring(0, 8)}</div>
                        <div class="text-xs text-slate-400 mt-1">${order.customer_name || 'Cliente'}</div>
                        <div class="text-[10px] text-slate-600 mt-1">${new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm font-bold text-green-400">R$ ${(order.total_amount || 0).toFixed(2)}</div>
                        <button onclick="window.APP.bi.deleteOrder('${order.id}')" class="text-red-500 text-xs mt-2 hover:text-red-400">
                            ✕ Deletar
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            log(`❌ Erro ao renderizar pedidos: ${err.message}`, 'error');
        }
    },

    prepareCharts(orders) {
        try {
            // SEMPRE renderizar gráficos, mesmo sem dados
            this.renderRevenueChart(orders);
            this.renderTopProductsChart(orders);
        } catch (err) {
            log(`❌ Erro ao preparar gráficos: ${err.message}`, 'error');
        }
    },

    renderRevenueChart(orders) {
        try {
            const ctx = document.getElementById('chart-revenue');
            if (!ctx) {
                log('⚠️ Canvas chart-revenue não encontrado', 'warning');
                return;
            }

            const last7Days = this.getLast7Days();
            const labels = last7Days.map(d => d.toLocaleDateString('pt-BR', { month: '2-digit', day: '2-digit' }));
            
            const data = last7Days.map(day => {
                const dayOrders = orders.filter(o => {
                    const orderDate = new Date(o.created_at).toLocaleDateString('pt-BR');
                    return orderDate === day.toLocaleDateString('pt-BR');
                });
                return dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
            });

            if (this.charts.revenue) this.charts.revenue.destroy();
            
            this.charts.revenue = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Faturamento (R$)',
                        data,
                        backgroundColor: orders.length === 0 ? 'rgba(16, 185, 129, 0.3)' : '#10b981',
                        borderColor: '#059669',
                        borderWidth: 2,
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            labels: { color: '#cbd5e1', font: { size: 12 } }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#cbd5e1'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: '#94a3b8' },
                            grid: { color: '#334155' }
                        },
                        x: {
                            ticks: { color: '#94a3b8' },
                            grid: { display: false }
                        }
                    }
                }
            });

            log('✅ Gráfico de faturamento renderizado', 'success');
        } catch (err) {
            log(`❌ Erro ao renderizar gráfico de faturamento: ${err.message}`, 'error');
        }
    },

    renderTopProductsChart(orders) {
        try {
            const ctx = document.getElementById('chart-products');
            if (!ctx) {
                log('⚠️ Canvas chart-products não encontrado', 'warning');
                return;
            }

            const productCount = {};
            
            orders.forEach(order => {
                (order.order_items || []).forEach(item => {
                    const key = item.product_id || 'desconhecido';
                    productCount[key] = (productCount[key] || 0) + (item.quantity || 1);
                });
            });

            const sorted = Object.entries(productCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            if (this.charts.products) this.charts.products.destroy();
            
            // ✅ CORRIGIDO: Sempre mostrar dados (mesmo vazio)
            const hasData = sorted.length > 0;
            const chartLabels = hasData 
                ? sorted.map(([id], i) => `Produto ${i + 1}`)
                : ['Aguardando\nvendas'];
            
            const chartData = hasData 
                ? sorted.map(([, count]) => count)
                : [1];

            const chartBgColor = hasData
                ? ['#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6']
                : ['rgba(107, 114, 128, 0.5)'];
            
            this.charts.products = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        data: chartData,
                        backgroundColor: chartBgColor,
                        borderColor: '#1e293b',
                        borderWidth: 2,
                        opacity: hasData ? 1 : 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: '#cbd5e1', font: { size: 12 } },
                            position: 'bottom'
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#cbd5e1',
                            enabled: hasData
                        }
                    }
                }
            });

            log('✅ Gráfico de produtos renderizado', 'success');
        } catch (err) {
            log(`❌ Erro ao renderizar gráfico de produtos: ${err.message}`, 'error');
        }
    },

    getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date);
        }
        return days;
    },

    async deleteOrder(orderId) {
        if (!confirm('Deletar pedido?')) return;

        try {
            await _supabase.from('order_items').delete().eq('order_id', orderId);
            await _supabase.from('orders').delete().eq('id', orderId);
            
            log('Pedido deletado', 'success');
            await this.loadDashboard();
        } catch (err) {
            log(`Erro ao deletar: ${err.message}`, 'error');
            alert(`Erro ao deletar pedido: ${err.message}`);
        }
    }
};