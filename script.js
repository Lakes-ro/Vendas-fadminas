// CONFIGURAÇÃO SUPABASE
const S_URL = "https://dkzbpevakiiwzuimzftz.supabase.co";
const S_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRremJwZXZha2lpd3p1aW16ZnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTc4NDgsImV4cCI6MjA4NDczMzg0OH0.GgDQz3KR2x1vupLWPSd7gU9lLXNCjBAaFXEM6IADYWY";
const _supabase = supabase.createClient(S_URL, S_KEY);

let cart = [];
let editingProductId = null;

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => { 
    fetchData(); 
    lucide.createIcons(); 
});

// BUSCA DE DADOS
async function fetchData() {
    const { data, error } = await _supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error) { 
        renderMarket(data); 
        renderAdminList(data); 
    }
}

// NAVEGAÇÃO DE ABAS
function showTab(tab) {
    const sections = {
        'market': 'market-section',
        'admin': 'admin-section',
        'ads-manager': 'ads-section'
    };
    Object.values(sections).forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById(sections[tab]).classList.remove('hidden');
}

// LOGICA DE ADMIN & UPLOAD
async function saveProduct(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-save');
    btn.disabled = true;
    btn.innerText = "SUBINDO...";

    const file = document.getElementById('p-image').files[0];
    let imageUrl = null;

    if (file) {
        const fileName = `${Date.now()}-${file.name}`;
        const { data: upData } = await _supabase.storage.from('product-images').upload(fileName, file);
        if (upData) {
            const { data: pub } = _supabase.storage.from('product-images').getPublicUrl(fileName);
            imageUrl = pub.publicUrl;
        }
    }

    const pData = {
        name: document.getElementById('p-name').value,
        price: parseFloat(document.getElementById('p-price').value),
        description: document.getElementById('p-desc').value
    };
    if (imageUrl) pData.image_url = imageUrl;

    if (editingProductId) {
        await _supabase.from('products').update(pData).eq('id', editingProductId);
    } else {
        await _supabase.from('products').insert([pData]);
    }

    closeModal();
    fetchData();
    event.target.reset();
    btn.disabled = false;
    btn.innerText = "SALVAR";
}

function renderMarket(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = products.map(p => `
        <div class="bg-slate-900/40 p-6 rounded-[32px] border border-white/5 flex flex-col gap-4 animate-in">
            ${p.image_url ? `<img src="${p.image_url}" class="w-full h-44 object-cover rounded-2xl bg-slate-900 shadow-xl">` : `<div class="w-full h-44 bg-slate-900 rounded-2xl flex items-center justify-center italic text-slate-700 text-[10px] tracking-widest uppercase font-black">Sem Imagem</div>`}
            <div>
                <h3 class="text-xl font-bold text-white tracking-tight">${p.name}</h3>
                <p class="text-slate-500 text-xs mt-1 font-medium">${p.description || ''}</p>
            </div>
            <div class="text-2xl font-black text-white tracking-tighter mt-auto">R$ ${p.price.toFixed(2)}</div>
            <button onclick="addToCart(${p.id}, '${p.name}', ${p.price})" class="bg-blue-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all text-white">Adicionar</button>
        </div>
    `).join('');
    lucide.createIcons();
}

function renderAdminList(products) {
    const list = document.getElementById('admin-list');
    list.innerHTML = products.map(p => `
        <div class="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
            <div class="flex items-center gap-4">
                ${p.image_url ? `<img src="${p.image_url}" class="w-10 h-10 rounded-xl object-cover">` : '<div class="w-10 h-10 bg-slate-800 rounded-xl"></div>'}
                <span class="font-bold text-sm tracking-tight">${p.name}</span>
            </div>
            <div class="flex gap-2">
                <button onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&apos;")})' class="text-blue-500 p-2 hover:bg-blue-500/10 rounded-xl"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                <button onclick="deleteProduct(${p.id})" class="text-red-500 p-2 hover:bg-red-500/10 rounded-xl"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

// LOGICA DE CARRINHO
function addToCart(id, name, price) {
    cart.push({ id, name, price });
    updateCartUI();
    if (document.getElementById('cart-drawer').classList.contains('translate-x-full')) toggleCart();
}

function updateCartUI() {
    document.getElementById('cart-count').innerText = cart.length;
    const itemsDiv = document.getElementById('cart-items');
    itemsDiv.innerHTML = cart.map((i, idx) => `
        <div class="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 animate-in">
            <div class="flex flex-col">
                <span class="text-white font-bold text-xs">${i.name}</span>
                <span class="text-blue-500 font-black text-[10px]">R$ ${i.price.toFixed(2)}</span>
            </div>
            <button onclick="removeFromCart(${idx})" class="text-red-500 p-1 hover:bg-red-500/10 rounded-lg"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
    `).join('');
    const total = cart.reduce((a, b) => a + b.price, 0);
    document.getElementById('cart-total').innerText = `R$ ${total.toFixed(2)}`;
    lucide.createIcons();
}

function removeFromCart(i) { cart.splice(i, 1); updateCartUI(); }

// FINALIZAÇÃO DE PEDIDO
function checkout() { 
    if(cart.length === 0) return alert("Carrinho vazio!");
    document.getElementById('customer-modal').classList.remove('hidden'); 
}
function closeCustomerModal() { document.getElementById('customer-modal').classList.add('hidden'); }

function sendOrder(e) {
    e.preventDefault();
    const name = document.getElementById('cust-name').value;
    const addr = document.getElementById('cust-address').value;
    const pay = document.getElementById('cust-payment').value;
    const total = cart.reduce((a, b) => a + b.price, 0).toFixed(2);
    
    let msg = `*NOVO PEDIDO *%0A`;
    msg += `---------------------------%0A`;
    msg += `*Cliente:* ${name}%0A`;
    msg += `*Local:* ${addr}%0A`;
    msg += `*Pagto:* ${pay}%0A`;
    msg += `---------------------------%0A`;
    msg += `*ITENS:*%0A`;
    cart.forEach(i => msg += `• ${i.name} (R$ ${i.price.toFixed(2)})%0A`);
    msg += `---------------------------%0A`;
    msg += `*TOTAL: R$ ${total}*`;
    
    window.open(`https://wa.me/553591264352?text=${msg}`);
    cart = []; updateCartUI(); closeCustomerModal();
}

// AUXILIARES
function editProduct(p) {
    editingProductId = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-desc').value = p.description || '';
    document.querySelector('#admin-modal h3').innerText = "EDITAR PRODUTO";
    openModal();
}

async function deleteProduct(id) {
    if(confirm("Deseja excluir permanentemente este item?")) { 
        await _supabase.from('products').delete().eq('id', id); 
        fetchData(); 
    }
}

function openModal() { document.getElementById('admin-modal').classList.remove('hidden'); }
function closeModal() { 
    document.getElementById('admin-modal').classList.add('hidden'); 
    editingProductId = null;
    document.querySelector('#admin-modal h3').innerText = "CADASTRAR ITEM";
}
function toggleCart() { document.getElementById('cart-drawer').classList.toggle('translate-x-full'); }

function updateLiveAd() {
    const title = document.getElementById('ad-input-title').value;
    const desc = document.getElementById('ad-input-desc').value;
    if(title) document.getElementById('ad-title').innerText = title;
    if(desc) document.getElementById('ad-desc').innerText = desc;
    alert("Banner de anúncios atualizado!");
    showTab('market');
}
