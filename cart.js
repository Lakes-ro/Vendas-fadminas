/**
 * CART.JS
 * Gerencia carrinho de compras
 */

const Cart = {
    items: [],

    /**
     * Inicializa carrinho com dados salvos
     */
    init() {
        this.items = Storage.loadCart();
        this.updateUI();
    },

    /**
     * Adiciona item ao carrinho
     */
    add(productId, productName, price) {
        // Verifica se loja está aberta
        if (window.StoreStatus && typeof StoreStatus.canAddToCart === 'function') {
            if (!StoreStatus.canAddToCart()) return;
        }

        this.items.push({ id: productId, name: productName, price });
        Storage.saveCart(this.items);
        this.updateUI();
        
        // Abre o drawer do carrinho automaticamente
        this.openDrawer();
        
        log(`Item adicionado: ${productName}`, 'success');
    },

    /**
     * Remove item do carrinho
     */
    remove(index) {
        if (index < 0 || index >= this.items.length) return;
        
        const removed = this.items.splice(index, 1)[0];
        Storage.saveCart(this.items);
        this.updateUI();
        
        log(`Item removido: ${removed.name}`, 'success');
    },

    /**
     * Atualiza UI do carrinho
     */
    updateUI() {
        // Atualizar contador
        document.getElementById('cart-count').innerText = this.items.length;

        // Renderizar itens
        const itemsDiv = document.getElementById('cart-items');
        itemsDiv.innerHTML = this.items.map((item, idx) => `
            <div class="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                <div class="flex flex-col flex-1">
                    <span class="text-white font-bold text-xs">${item.name}</span>
                    <span class="text-blue-500 font-black text-[10px]">R$ ${Number(item.price).toFixed(2)}</span>
                </div>
                <button onclick="window.APP.cart.remove(${idx})" class="text-red-500 hover:text-red-400 ml-2">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        `).join('');

        // Calcular total
        const total = this.items.reduce((acc, item) => acc + Number(item.price), 0);
        document.getElementById('cart-total').innerText = `R$ ${total.toFixed(2)}`;

        lucide.createIcons();
    },

    /**
     * Abre drawer do carrinho
     */
    openDrawer() {
        const drawer = document.getElementById('cart-drawer');
        drawer.classList.remove('translate-x-full');
    },

    /**
     * Fecha drawer do carrinho
     */
    closeDrawer() {
        const drawer = document.getElementById('cart-drawer');
        drawer.classList.add('translate-x-full');
    },

    /**
     * Alterna visibilidade do drawer
     */
    toggleCart() {
        const drawer = document.getElementById('cart-drawer');
        drawer.classList.toggle('translate-x-full');
    },

    /**
     * Retorna total do carrinho
     */
    getTotal() {
        return this.items.reduce((acc, item) => acc + Number(item.price), 0);
    },

    /**
     * Limpa carrinho
     */
    clear() {
        this.items = [];
        Storage.saveCart([]);
        this.updateUI();
        log('Carrinho limpo', 'success');
    },

    /**
     * Retorna quantidade de itens
     */
    getCount() {
        return this.items.length;
    }
};