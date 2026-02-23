/**
 * SW.JS v3.0 - SERVICE WORKER
 * Estratégia: Network First (Tenta rede, usa cache como fallback)
 * Resolve: Cache hell - nunca fica preso em versão bugada
 */

const CACHE_VERSION = 'fadvendas-v3.0';
const CACHE_NAME = `${CACHE_VERSION}`;

// ========================================
// ASSETS PARA CACHEAR
// ========================================
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './config.js',
    './storage.js',
    './navigation.js',
    './auth.js',
    './products.js',
    './cart.js',
    './orders.js',
    './bi.js',
    './ads.js',
    './admin.js',
    './app.js',
    './manifest.json'
];

// ========================================
// INSTALAR - CACHEAR ASSETS
// ========================================
self.addEventListener('install', (event) => {
    console.log(`[SW] Instalando ${CACHE_VERSION}`);
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
                console.warn('[SW] Alguns assets não puderam ser cacheados:', err.message);
                // Continua mesmo se falhar
                return Promise.resolve();
            });
        }).then(() => {
            console.log(`[SW] ${CACHE_VERSION} instalado com sucesso`);
        })
    );
    
    self.skipWaiting();
});

// ========================================
// ATIVAR - LIMPAR CACHES ANTIGOS
// ========================================
self.addEventListener('activate', (event) => {
    console.log(`[SW] Ativando ${CACHE_VERSION}`);
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name.startsWith('fadvendas-'))
                    .map((name) => {
                        console.log(`[SW] Deletando cache antigo: ${name}`);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            console.log(`[SW] Limpeza de caches concluída`);
        })
    );
    
    self.clients.claim();
});

// ========================================
// FETCH - NETWORK FIRST STRATEGY
// ========================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 1. Ignorar requisiçãoes não-HTTP
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // 2. Apenas GET
    if (request.method !== 'GET') {
        return;
    }

    // 3. Network First para TUDO
    event.respondWith(networkFirstStrategy(request));
});

// ========================================
// NETWORK FIRST STRATEGY
// Tenta rede primeiro, usa cache como fallback
// ========================================
function networkFirstStrategy(request) {
    return fetch(request, {
        // Timeout de 5 segundos
        signal: AbortSignal.timeout(5000)
    })
        .then((response) => {
            // Resposta bem-sucedida
            if (response.ok) {
                // Clonar para usar em 2 lugares
                const responseClone = response.clone();
                
                // Cachear em background
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseClone);
                });
            }
            
            return response;
        })
        .catch((err) => {
            // Rede falhou, tentar cache
            console.log(`[SW] Rede falhou para ${request.url}: ${err.message}`);
            
            return caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    console.log(`[SW] Usando cache para ${request.url}`);
                    return cachedResponse;
                }

                // Sem cache, retornar resposta de offline
                return new Response(
                    '⚠️ Você está offline e não há cache disponível.',
                    {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: new Headers({
                            'Content-Type': 'text/plain'
                        })
                    }
                );
            });
        });
}

// ========================================
// MESSAGE - COMUNICAÇÃO COM CLIENTE
// ========================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log(`[SW] Service Worker ${CACHE_VERSION} carregado`);