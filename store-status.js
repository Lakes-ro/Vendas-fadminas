/**
 * STORE-STATUS.JS v2.0 - FINAL E FUNCIONAL
 * Sistema de Controle de Expediente + Sabbath Mode
 * COM INTEGRAÇÃO PRONTA NA APP
 */

const StoreStatus = {
    status: 'open',
    lastCheck: null,
    checkInterval: null,

    /**
     * ✅ Verifica status da loja baseado na hora local
     */
    checkStoreStatus() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Dom, 1=Seg, ..., 5=Sex, 6=Sab
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const totalMinutes = hours * 60 + minutes;

        // REGRA 1: SABBATH MODE (Sexta 18:00 - Sábado 18:00)
        if (dayOfWeek === 5 && totalMinutes >= 18 * 60) {
            return 'sabbath_closed';
        }
        if (dayOfWeek === 6 && totalMinutes < 18 * 60) {
            return 'sabbath_closed';
        }

        // REGRA 2: FECHAMENTO NOTURNO (23:30 - 06:00)
        if (totalMinutes >= 23 * 60 + 30) {
            return 'night_closed';
        }
        if (totalMinutes < 6 * 60) {
            return 'night_closed';
        }

        return 'open';
    },

    /**
     * ✅ Obtém mensagem amigável
     */
    getStatusMessage() {
        const messages = {
            night_closed: {
                title: '😴 Nossas lojas estão a descansar',
                subtitle: 'Voltamos às 06:00!',
                emoji: '😴',
                description: 'Nossos horários de funcionamento são de 06:00 às 23:30 todos os dias.'
            },
            sabbath_closed: {
                title: '🌅 Feliz Sábado!',
                subtitle: 'Shalom! 🕊️',
                emoji: '🌅',
                description: 'Em observância aos princípios bíblicos, nossas operações de compra e venda estão pausadas até às 18h00 de sábado. Aproveite o dia para descanso e família.'
            },
            open: {
                title: '✅ Loja Aberta',
                subtitle: 'Bem-vindo!',
                emoji: '✅',
                description: 'Estamos prontos para servi-lo!'
            }
        };

        return messages[this.status] || messages.open;
    },

    /**
     * ✅ Obtém próxima reabertura
     */
    getNextOpenTime() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const totalMinutes = hours * 60 + minutes;

        if (this.status === 'sabbath_closed') {
            const nextOpen = new Date(now);
            nextOpen.setDate(nextOpen.getDate() + (dayOfWeek === 6 ? 0 : 1));
            nextOpen.setHours(18, 0, 0, 0);
            
            if (dayOfWeek === 5 && totalMinutes < 18 * 60) {
                nextOpen.setDate(nextOpen.getDate() - 1);
            }
            
            return nextOpen.toLocaleString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        if (this.status === 'night_closed') {
            const nextOpen = new Date(now);
            nextOpen.setHours(6, 0, 0, 0);
            
            if (totalMinutes >= 23 * 60 + 30) {
                nextOpen.setDate(nextOpen.getDate() + 1);
            }
            
            return nextOpen.toLocaleString('pt-BR', { 
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        return null;
    },

    /**
     * ✅ Inicializa o sistema
     */
    init() {
        try {
            log('🔍 Inicializando StoreStatus...', 'info');

            this.updateStatus();

            // Verificar a cada 1 minuto
            this.checkInterval = setInterval(() => {
                this.updateStatus();
            }, 60000);

            log('✅ StoreStatus inicializado', 'success');
        } catch (err) {
            log(`❌ Erro ao inicializar StoreStatus: ${err.message}`, 'error');
        }
    },

    /**
     * ✅ Atualiza status e renderiza overlay
     */
    updateStatus() {
        const newStatus = this.checkStoreStatus();

        if (newStatus !== this.status) {
            this.status = newStatus;
            log(`📍 Status mudou para: ${this.status}`, 'info');
            this.renderOverlay();
            this.updateButtonStates();
        }

        this.lastCheck = new Date();
    },

    /**
     * ✅ Renderiza overlay de bloqueio
     */
    renderOverlay() {
        let overlay = document.getElementById('store-closed-overlay');

        if (this.status === 'open') {
            if (overlay) overlay.remove();
            return;
        }

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'store-closed-overlay';
            document.body.appendChild(overlay);
        }

        const message = this.getStatusMessage();
        const nextOpen = this.getNextOpenTime();

        overlay.innerHTML = `
            <div class="store-closed-container">
                <div class="store-closed-content">
                    <div class="store-closed-emoji">${message.emoji}</div>
                    <h1 class="store-closed-title">${message.title}</h1>
                    <h2 class="store-closed-subtitle">${message.subtitle}</h2>
                    <p class="store-closed-description">${message.description}</p>
                    
                    ${nextOpen ? `
                        <div class="store-closed-timer">
                            <p class="store-closed-reopens">⏰ Reabrimos em:</p>
                            <p class="store-closed-time">${nextOpen}</p>
                        </div>
                    ` : ''}
                    
                    <div class="store-closed-info">
                        <p>📱 Você pode continuar navegando, mas operações de compra/venda estão desativadas.</p>
                    </div>
                </div>
            </div>
        `;

        overlay.classList.add('active');
    },

    /**
     * ✅ Desativa botões de compra
     */
    updateButtonStates() {
        try {
            const buyButtons = document.querySelectorAll(
                '[onclick*="cart.add"], ' +
                '[onclick*="checkout"], ' +
                '[class*="btn-buy"], ' +
                '[class*="btn-add-cart"]'
            );

            buyButtons.forEach(btn => {
                if (this.status === 'open') {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                } else {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                }
            });

            log(`📦 Botões atualizados: ${this.status}`, 'info');
        } catch (err) {
            log(`⚠️ Erro ao atualizar botões: ${err.message}`, 'warning');
        }
    },

    /**
     * ✅ TRAVA PARA CHECKOUT
     */
    canCheckout() {
        if (this.status !== 'open') {
            const message = this.getStatusMessage();
            alert(`🔒 ${message.title}\n\n${message.description}`);
            return false;
        }
        return true;
    },

    /**
     * ✅ TRAVA PARA ADICIONAR AO CARRINHO
     */
    canAddToCart() {
        if (this.status !== 'open') {
            const message = this.getStatusMessage();
            alert(`🔒 Operação não permitida\n\n${message.description}`);
            return false;
        }
        return true;
    }
};

// ✅ INICIALIZAR QUANDO DOM ESTÁ PRONTO
document.addEventListener('DOMContentLoaded', () => {
    StoreStatus.init();
});

// ✅ EXPOR GLOBALMENTE
window.StoreStatus = StoreStatus;