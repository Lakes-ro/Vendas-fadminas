/**
 * ADS.JS v3.0 - CORRIGIDO E FUNCIONAL
 * Sistema completo de anúncios com:
 * - Suporte a imagem e texto
 * - Carrossel automático
 * - Duplicar anúncios
 * - Deletar anúncios
 * - Verificação correta de Supabase
 */

const Ads = {
    ads: [],
    currentAdIndex: 0,
    carouselInterval: null,
    isInstalled: false,
    adType: 'image',
    duplicateData: null,

    /**
     * ✅ INICIALIZAR ADS
     */
    async init() {
        try {
            log('📢 Inicializando Ads...', 'info');
            
            this.detectPWA();
            await this.loadAds();
            this.startCarousel();
            this.renderAdminList();
            
            log('✅ Ads v3.0 inicializado', 'success');
        } catch (err) {
            log(`❌ Erro ao inicializar ads: ${err.message}`, 'error');
        }
    },

    /**
     * ✅ DETECTAR PWA
     */
    detectPWA() {
        this.isInstalled = window.matchMedia('(display-mode: standalone)').matches;
        log(`PWA Instalado: ${this.isInstalled ? 'Sim' : 'Não'}`, 'info');
    },

    /**
     * ✅ CARREGAR ANÚNCIOS DO SUPABASE
     */
    async loadAds() {
        try {
            if (!window._supabase) {
                throw new Error('Supabase não disponível');
            }

            log('📥 Carregando anúncios...', 'info');

            const { data, error } = await _supabase
                .from('ads')
                .select('*')
                .eq('active', true)
                .order('created_at', { ascending: false });

            if (error) {
                log(`⚠️ Erro na query: ${error.message}`, 'warning');
                throw error;
            }

            this.ads = data || [];
            
            log(`✅ ${this.ads.length} anúncio(s) carregado(s)`, 'success');
            
            if (this.ads.length > 0) {
                this.updateBanner();
                this.startCarousel();
            } else {
                this.showFallback();
            }

            this.renderAdminList();

        } catch (err) {
            log(`❌ Erro ao carregar anúncios: ${err.message}`, 'error');
            this.showFallback();
        }
    },

    /**
     * ✅ ATUALIZAR BANNER (VITRINE)
     */
    updateBanner() {
        try {
            // Procurar elementos do banner na vitrine
            const heroSection = document.getElementById('ads-hero');
if (!heroSection) {
    log('⚠️ #ads-hero não encontrado', 'warning');
    return;
}

            if (!heroSection) {
                log('⚠️ Seção de anúncios não encontrada na vitrine', 'warning');
                return;
            }

            // Se não há anúncios, mostrar fallback
            if (this.ads.length === 0) {
                this.showFallback();
                return;
            }

            const currentAd = this.ads[this.currentAdIndex];

            if (!currentAd) {
                log('⚠️ Anúncio atual não encontrado', 'warning');
                return;
            }

            // ANÚNCIO COM IMAGEM
            if (currentAd.image_url) {
                heroSection.innerHTML = `
                    <div onclick="window.APP.ads.clickAd()" class="cursor-pointer hover:opacity-90 transition-opacity">
                        <img src="${currentAd.image_url}" 
                             alt="Anúncio" 
                             class="w-full h-auto rounded-2xl object-cover"
                             onerror="this.src='https://via.placeholder.com/800x300?text=Anúncio'">
                    </div>
                `;
                heroSection.dataset.link = currentAd.link_contact || '';
                log('✅ Banner de imagem renderizado', 'success');
                return;
            }

            // ANÚNCIO COM TEXTO
            if (currentAd.ad_title || currentAd.ad_text) {
                heroSection.innerHTML = `
                    <div onclick="window.APP.ads.clickAd()" class="cursor-pointer hover:scale-105 transition-transform h-64 flex flex-col items-center justify-center bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 rounded-2xl border border-yellow-500/30 p-8">
                        <h2 class="text-4xl font-black text-yellow-400 mb-4 text-center">
                            ${currentAd.ad_title || 'Aviso Importante'}
                        </h2>
                        <p class="text-lg text-slate-300 text-center max-w-md">
                            ${currentAd.ad_text || ''}
                        </p>
                        ${currentAd.link_contact ? `
                            <p class="text-sm text-yellow-500 mt-4">👆 Clique para saber mais</p>
                        ` : ''}
                    </div>
                `;
                heroSection.dataset.link = currentAd.link_contact || '';
                log('✅ Banner de texto renderizado', 'success');
                return;
            }

            this.showFallback();

        } catch (err) {
            log(`❌ Erro ao atualizar banner: ${err.message}`, 'error');
            this.showFallback();
        }
    },

    /**
     * ✅ MOSTRAR FALLBACK
     */
    showFallback() {
        try {
            const heroSection = document.querySelector('[role="banner"]') || 
                               document.querySelector('.hero') ||
                               document.querySelector('[class*="ads"]');

            if (!heroSection) return;

            heroSection.innerHTML = `
                <div class="cursor-pointer hover:scale-105 transition-transform h-64 flex flex-col items-center justify-center bg-gradient-to-r from-blue-900/20 to-blue-800/20 rounded-2xl border border-blue-500/30 p-8">
                    <div class="text-6xl mb-4">📢</div>
                    <h2 class="text-3xl font-black text-white mb-2">Anuncie Aqui</h2>
                    <p class="text-slate-400 text-center">Clique para entrar em contato</p>
                </div>
            `;

            heroSection.dataset.link = 'https://wa.me/35991264352?text=Olá! Gostaria de anunciar';
            log('✅ Fallback renderizado', 'info');

        } catch (err) {
            log(`❌ Erro ao renderizar fallback: ${err.message}`, 'error');
        }
    },

    /**
     * ✅ INICIAR CARROSSEL (muda a cada 8 segundos)
     */
    startCarousel() {
        try {
            clearInterval(this.carouselInterval);

            if (this.ads.length <= 1) {
                log('⚠️ Carrossel desabilitado (1 ou 0 anúncios)', 'info');
                return;
            }

            this.carouselInterval = setInterval(() => {
                this.currentAdIndex = (this.currentAdIndex + 1) % this.ads.length;
                this.updateBanner();
            }, 8000);

            log('✅ Carrossel iniciado (8s)', 'success');

        } catch (err) {
            log(`❌ Erro ao iniciar carrossel: ${err.message}`, 'error');
        }
    },

    /**
     * ✅ CLICAR NO ANÚNCIO
     */
    clickAd() {
        try {
            const currentAd = this.ads[this.currentAdIndex];
            const link = currentAd?.link_contact;

            if (!link) {
                log('⚠️ Link do anúncio não definido', 'warning');
                return;
            }

            if (link === 'install') {
                if (window.deferredPrompt) {
                    window.deferredPrompt.prompt();
                } else {
                    alert('Para instalar o app, use o menu do navegador');
                }
                return;
            }

            // Abrir link em nova aba
            window.open(link, '_blank');
            log(`✅ Anúncio clicado: ${link}`, 'info');

        } catch (err) {
            log(`❌ Erro ao clicar anúncio: ${err.message}`, 'error');
        }
    },

    /**
     * ✅ ALTERNAR TIPO DE ANÚNCIO (IMAGEM / TEXTO)
     */
    toggleAdType(type) {
        try {
            this.adType = type;

            const btnImage = document.getElementById('btn-ad-type-image');
            const btnText = document.getElementById('btn-ad-type-text');
            const formImage = document.getElementById('ad-form-image');
            const formText = document.getElementById('ad-form-text');

            if (type === 'image') {
                // MOSTRAR FORM IMAGEM
                if (btnImage) {
                    btnImage.classList.add('bg-blue-600', 'text-white');
                    btnImage.classList.remove('text-slate-400');
                }
                if (btnText) {
                    btnText.classList.remove('bg-blue-600', 'text-white');
                    btnText.classList.add('text-slate-400');
                }
                if (formImage) formImage.classList.remove('hidden');
                if (formText) formText.classList.add('hidden');

            } else {
                // MOSTRAR FORM TEXTO
                if (btnText) {
                    btnText.classList.add('bg-blue-600', 'text-white');
                    btnText.classList.remove('text-slate-400');
                }
                if (btnImage) {
                    btnImage.classList.remove('bg-blue-600', 'text-white');
                    btnImage.classList.add('text-slate-400');
                }
                if (formText) formText.classList.remove('hidden');
                if (formImage) formImage.classList.add('hidden');
            }

            log(`✅ Tipo de anúncio: ${type}`, 'info');

        } catch (err) {
            log(`❌ Erro ao alternar tipo: ${err.message}`, 'error');
        }
    },

    /**
     * ✅ DUPLICAR ANÚNCIO
     */
    duplicateAd(ad) {
        try {
            this.duplicateData = ad;
            this.adType = ad.image_url ? 'image' : 'text';
            this.toggleAdType(this.adType);

            // PREENCHER FORMULÁRIO
            if (ad.image_url) {
                // Anúncio de imagem
                const linkInput = document.getElementById('ad-link-input');
                if (linkInput) linkInput.value = ad.link_contact || '';

            } else {
                // Anúncio de texto
                const titleInput = document.getElementById('ad-text-title');
                const contentInput = document.getElementById('ad-text-content');
                const linkInput = document.getElementById('ad-text-link');

                if (titleInput) titleInput.value = ad.ad_title || '';
                if (contentInput) contentInput.value = ad.ad_text || '';
                if (linkInput) linkInput.value = ad.link_contact || '';
            }

            // SCROLL PARA FORMULÁRIO
            const adsSection = document.getElementById('ads-section');
            if (adsSection) {
                adsSection.scrollIntoView({ behavior: 'smooth' });
            }

            alert('✅ Anúncio carregado! Faça alterações e publique como novo.');
            log('✅ Anúncio duplicado', 'success');

        } catch (err) {
            log(`❌ Erro ao duplicar: ${err.message}`, 'error');
            alert(`Erro: ${err.message}`);
        }
    },

    /**
     * ✅ SALVAR ANÚNCIO
     */
    async saveAd(event, type) {
        event.preventDefault();

        if (!window._supabase) {
            alert('❌ Supabase não disponível');
            return;
        }

        try {
            log('💾 Salvando anúncio...', 'info');
            
            let adData = { active: true };

            // ANÚNCIO COM IMAGEM
            if (type === 'image') {
                let imageUrl;

                // SE DUPLICANDO, REUSAR IMAGEM
                if (this.duplicateData?.image_url) {
                    imageUrl = this.duplicateData.image_url;
                    log('♻️ Reutilizando imagem do original', 'info');
                } else {
                    // FAZER UPLOAD NOVA IMAGEM
                    const fileInput = document.getElementById('ad-image-input');

                    if (!fileInput || !fileInput.files.length) {
                        alert('❌ Selecione uma imagem');
                        return;
                    }

                    const file = fileInput.files[0];

                    // Validar tamanho (5MB max)
                    if (file.size > 5 * 1024 * 1024) {
                        alert('❌ Imagem maior que 5MB');
                        return;
                    }

                    const fileName = `${Date.now()}-${file.name}`;

                    log(`📤 Enviando imagem: ${fileName}`, 'info');

                    const { error: uploadError } = await _supabase.storage
                        .from('ad-images')
                        .upload(fileName, file);

                    if (uploadError) {
                        log(`❌ Erro ao fazer upload: ${uploadError.message}`, 'error');
                        throw uploadError;
                    }

                    // OBTER URL PÚBLICA
                    const { data: publicUrl } = _supabase.storage
                        .from('ad-images')
                        .getPublicUrl(fileName);

                    imageUrl = publicUrl.publicUrl;
                    log(`✅ Imagem carregada: ${imageUrl}`, 'success');
                }

                adData = {
                    ...adData,
                    image_url: imageUrl,
                    link_contact: document.getElementById('ad-link-input')?.value || '',
                    ad_title: null,
                    ad_text: null
                };

            } else if (type === 'text') {
                // ANÚNCIO COM TEXTO
                const titleInput = document.getElementById('ad-text-title');
                const contentInput = document.getElementById('ad-text-content');
                const linkInput = document.getElementById('ad-text-link');

                const title = titleInput?.value?.trim() || '';
                const content = contentInput?.value?.trim() || '';

                if (!title && !content) {
                    alert('❌ Preencha pelo menos o título ou o conteúdo');
                    return;
                }

                adData = {
                    ...adData,
                    ad_title: title,
                    ad_text: content,
                    link_contact: linkInput?.value?.trim() || '',
                    image_url: null
                };
            }

            // INSERIR NO BANCO
            log('📝 Inserindo na base de dados...', 'info');

            const { error: insertError } = await _supabase
                .from('ads')
                .insert([adData]);

            if (insertError) {
                log(`❌ Erro ao inserir: ${insertError.message}`, 'error');
                throw insertError;
            }

            log('✅ Anúncio publicado com sucesso!', 'success');
            alert('✅ Anúncio publicado com sucesso!');

            // LIMPAR FORMULÁRIO
            event.target.reset();
            this.duplicateData = null;

            // RECARREGAR
            await this.loadAds();

        } catch (err) {
            log(`❌ Erro ao salvar anúncio: ${err.message}`, 'error');
            alert(`❌ Erro: ${err.message}`);
        }
    },

    /**
     * ✅ RENDERIZAR LISTA DE ANÚNCIOS (ADMIN)
     */
    renderAdminList() {
        try {
            const listDiv = document.getElementById('ads-list');
            if (!listDiv) {
                log('⚠️ ads-list não encontrado', 'warning');
                return;
            }

            if (this.ads.length === 0) {
                listDiv.innerHTML = '<div class="text-slate-600 text-sm text-center py-8">Nenhum anúncio ativo</div>';
                return;
            }

            listDiv.innerHTML = this.ads.map((ad) => {
                const isImage = !!ad.image_url;
                const isText = !!ad.ad_title || !!ad.ad_text;
                const typeLabel = isImage ? '🖼️ Imagem' : isText ? '📝 Texto' : '❓ Desconhecido';

                return `
                    <div class="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-yellow-500/20 transition-all">
                        <div class="flex gap-4 flex-1">
                            ${isImage ? `
                                <img src="${ad.image_url}" alt="Anúncio" class="w-16 h-16 object-cover rounded-lg">
                            ` : `
                                <div class="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center text-2xl">📝</div>
                            `}
                            <div class="flex-1 min-w-0">
                                <div class="text-xs text-yellow-400 font-bold mb-1">${typeLabel}</div>
                                ${isText ? `
                                    <div class="text-sm text-white font-bold truncate">${ad.ad_title || '(sem título)'}</div>
                                    <div class="text-xs text-slate-400 truncate">${ad.ad_text ? ad.ad_text.substring(0, 60) + '...' : ''}</div>
                                ` : `
                                    <div class="text-xs text-slate-300 truncate font-bold">Link: ${ad.link_contact || '(sem link)'}</div>
                                `}
                                <div class="text-[10px] text-slate-600 mt-1">📅 ${new Date(ad.created_at).toLocaleDateString('pt-BR')}</div>
                            </div>
                        </div>
                        <div class="flex gap-2 flex-shrink-0 ml-2">
                            <button onclick="window.APP.ads.duplicateAd(${JSON.stringify(ad).replace(/"/g, '&quot;')})" class="text-blue-500 hover:bg-blue-500/10 p-2 rounded-lg transition-all" title="Duplicar">
                                <i data-lucide="copy" class="w-4 h-4"></i>
                            </button>
                            <button onclick="window.APP.ads.deleteAd('${ad.id}')" class="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-all" title="Deletar">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            // RENDERIZAR ICONS
            if (window.lucide) {
                lucide.createIcons();
            }

            log(`✅ ${this.ads.length} anúncio(s) renderizado(s)`, 'success');

        } catch (err) {
            log(`❌ Erro ao renderizar lista: ${err.message}`, 'error');
        }
    },

    /**
     * ✅ DELETAR ANÚNCIO
     */
    async deleteAd(adId) {
        try {
            if (!confirm('❌ Deseja deletar este anúncio?')) {
                return;
            }

            if (!window._supabase) {
                alert('Supabase não disponível');
                return;
            }

            log(`🗑️ Deletando anúncio ${adId}...`, 'info');

            const { error } = await _supabase
                .from('ads')
                .delete()
                .eq('id', adId);

            if (error) {
                log(`❌ Erro ao deletar: ${error.message}`, 'error');
                throw error;
            }

            log('✅ Anúncio deletado', 'success');
            alert('✅ Anúncio deletado com sucesso!');
            
            await this.loadAds();

        } catch (err) {
            log(`❌ Erro ao deletar anúncio: ${err.message}`, 'error');
            alert(`❌ Erro: ${err.message}`);
        }
    }
};