import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, UploadCloud, Loader2, Plus, ChevronLeft, ChevronRight, Crop, RefreshCw, Link2, Trash2, Check, X, Save, FileText } from 'lucide-react';
import ImageCropperModal from './ImageCropperModal';
import { API_URL } from '../config';

export default function SponsorsTab({ token, onSaved }) {
  const [ads, setAds] = useState([]);
  const [selectedAdId, setSelectedAdId] = useState('');
  const [loadingAds, setLoadingAds] = useState(true);

  const [adPartners, setAdPartners] = useState([]);
  const [isUploadingPartner, setIsUploadingPartner] = useState(false);
  const [partnerError, setPartnerError] = useState('');
  const [partnerCropTarget, setPartnerCropTarget] = useState(null); // File or string URL
  const [partnerEditIndex, setPartnerEditIndex] = useState(null); // index of partner being edited
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [editingLinkIndex, setEditingLinkIndex] = useState(null);
  const [tempLinkValue, setTempLinkValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch de anúncios do prestador
  useEffect(() => {
    if (!token) return;
    setLoadingAds(true);
    fetch(`${API_URL}/api/ads/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setAds(d.data || []);
          if (d.data && d.data.length > 0) {
            setSelectedAdId(d.data[0].id);
          }
        } else {
          setErrorMessage(d.message || 'Erro ao carregar anúncios.');
        }
      })
      .catch(err => {
        console.error('[FETCH ADS] Erro:', err);
        setErrorMessage('Erro de conexão ao carregar seus anúncios.');
      })
      .finally(() => setLoadingAds(false));
  }, [token]);

  // Efeito reativo para carregar parceiros do anúncio ativo
  useEffect(() => {
    if (!selectedAdId || ads.length === 0) return;
    const selectedAd = ads.find(a => a.id === selectedAdId);
    if (selectedAd) {
      try {
        const partners = typeof selectedAd.partners === 'string' 
          ? JSON.parse(selectedAd.partners) 
          : (selectedAd.partners || []);
        setAdPartners(partners);
      } catch {
        setAdPartners(selectedAd.partners || []);
      }
      setActiveSlideIndex(0);
      setEditingLinkIndex(null);
      setPartnerCropTarget(null);
      setPartnerEditIndex(null);
    }
  }, [selectedAdId, ads]);

  // Auto-slide effect para o preview local, pausado sob interação ou edição de link
  useEffect(() => {
    if (adPartners.length <= 1 || isHovered || editingLinkIndex !== null) return;
    const interval = setInterval(() => {
      setActiveSlideIndex(prev => (prev + 1) % adPartners.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [adPartners.length, isHovered, editingLinkIndex]);

  const handleSponsorCropComplete = async (blob) => {
    setIsUploadingPartner(true);
    setPartnerError('');
    try {
      const file = new File([blob], 'partner.jpg', { type: 'image/jpeg' });
      const fd = new FormData();
      fd.append('fotoAnuncio', file);

      const res = await fetch(`${API_URL}/api/upload/foto-anuncio`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const originalUrl = typeof partnerCropTarget === 'string' ? partnerCropTarget : URL.createObjectURL(partnerCropTarget);
        if (partnerEditIndex !== null && partnerEditIndex !== undefined && partnerEditIndex >= 0) {
          setAdPartners(prev => prev.map((item, idx) => idx === partnerEditIndex ? {
            ...item,
            imageUrl: data.url,
            fileId: data.fileId,
            originalImageUrl: originalUrl,
          } : item));
        } else {
          setAdPartners(prev => [...prev, {
            imageUrl: data.url,
            fileId: data.fileId,
            originalImageUrl: originalUrl,
            link: '',
          }]);
        }
      } else {
        setPartnerError(data.message || 'Erro ao carregar parceiro.');
      }
    } catch (err) {
      console.error('[PARTNER UPLOAD] Erro:', err);
      setPartnerError('Erro de conexão ao enviar o parceiro.');
    } finally {
      setIsUploadingPartner(false);
      setPartnerCropTarget(null);
      setPartnerEditIndex(null);
    }
  };

  const handleAddPartnerClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setPartnerEditIndex(undefined);
      setPartnerCropTarget(file);
    };
    input.click();
  };

  const handleEditPartnerImage = (index) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setPartnerEditIndex(index);
      setPartnerCropTarget(file);
    };
    input.click();
  };

  const handleSave = async () => {
    if (!selectedAdId) return;
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const res = await fetch(`${API_URL}/api/ads/${selectedAdId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: selectedAdId,
          adId: selectedAdId,
          selectedAdId: selectedAdId,
          partners: adPartners,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage('Patrocinadores salvos com sucesso!');
        
        // Atualiza localmente a lista de anúncios
        setAds(prev => prev.map(item => item.id === data.profile.id ? data.profile : item));
        
        if (onSaved) {
          onSaved(data.profile);
        }
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.message || 'Erro ao salvar patrocinadores.');
      }
    } catch (err) {
      console.error('[SAVE PARTNERS] Erro:', err);
      setErrorMessage('Erro de conexão ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  // State: Loading Ads
  if (loadingAds) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100 shadow-xs">
        <Loader2 size={36} className="text-primary animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Buscando seus anúncios...</p>
      </div>
    );
  }

  // State: Empty State
  if (ads.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-8 max-w-lg mx-auto shadow-xs">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Sparkles size={32} className="text-primary" />
        </div>
        <h3 className="font-bold text-slate-800 text-base mb-2">Sem anúncios profissionais</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
          Você precisa criar um anúncio antes de adicionar patrocinadores. Monetize seu perfil de prestador vendendo espaços publicitários para parceiros locais!
        </p>
        <Link
          to="/dashboard/novo-anuncio"
          className="inline-flex items-center justify-center bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-primary/20 transition-all hover:scale-105 active:scale-95 text-xs cursor-pointer"
        >
          Criar Meu Primeiro Anúncio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SELETOR DE ANÚNCIO (AD SELECTOR) */}
      <div className="bg-slate-50 rounded-2xl border border-slate-150 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Selecionar Anúncio para Monetizar
          </span>
          <span className="text-xs text-slate-500">
            Escolha o anúncio profissional para gerenciar seus patrocinadores dedicados.
          </span>
        </div>

        {ads.length > 1 ? (
          <div className="flex gap-1.5 p-1 bg-slate-200/60 rounded-xl shrink-0 self-start sm:self-center">
            {ads.map((adItem) => (
              <button
                key={adItem.id}
                type="button"
                onClick={() => setSelectedAdId(adItem.id)}
                className={`py-2 px-4 text-xs font-bold rounded-lg transition-all cursor-pointer text-center flex items-center gap-1.5 ${
                  selectedAdId === adItem.id
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText size={14} />
                {adItem.atividadePrincipal || 'Anúncio Profissional'}
              </button>
            ))}
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-150 rounded-xl shadow-2xs self-start sm:self-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-slate-700">
              Anúncio Ativo: {ads[0].atividadePrincipal || 'Profissional'}
            </span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-slate-100 shadow-xs space-y-6">
        <div>
          <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Sparkles className="text-primary animate-pulse" size={20} />
            Espaço Parceiro (Monetize seu Perfil)
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Venda o espaço "Parceiro" de seu perfil para comerciantes ou patrocinadores locais. Adicione até 3 patrocinadores e seus respectivos links. O recorte perfeito vertical (3:4) garante que o carrossel tenha um visual incrível!
          </p>
        </div>

        <div className="space-y-4">
          {adPartners.length === 0 ? (
            /* --- ESTADO VAZIO: Carrossel com Fundo Suave e Botão de Ação --- */
            <div className="flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-2xl md:rounded-3xl transition-colors duration-200 min-h-[300px]">
              <UploadCloud size={40} className="text-slate-400 mb-3 animate-bounce" />
              <h5 className="font-bold text-slate-700 text-sm mb-1">Nenhum patrocinador cadastrado</h5>
              <p className="text-xs text-slate-500 text-center max-w-sm mb-5">
                Seu espaço patrocinador está vazio. Adicione marcas parceiras para gerar renda com seu perfil público!
              </p>
              <button
                type="button"
                onClick={handleAddPartnerClick}
                disabled={isUploadingPartner}
                className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isUploadingPartner ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Processando...
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Adicionar Patrocinador (0/3)
                  </>
                )}
              </button>
            </div>
          ) : (
            /* --- ESTADO PREENCHIDO: Live Preview Carrossel + Painel de Controle --- */
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-center">
              
              {/* Lado Esquerdo: Smartphone Story Mockup Frame */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Visualização em Tempo Real</span>
                
                <div 
                  className="relative w-[280px] h-[373px] rounded-3xl border-4 border-slate-100 bg-slate-900 overflow-hidden shadow-xl group/story select-none flex items-center justify-center shrink-0 transition-transform duration-300"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  {/* Background blur for modern premium aspect ratio framing */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center blur-md opacity-35 scale-110 pointer-events-none"
                    style={{ backgroundImage: `url(${adPartners[activeSlideIndex]?.imageUrl})` }}
                  />

                  {/* Main Portrait Slide Image */}
                  {adPartners[activeSlideIndex]?.imageUrl ? (
                    <img 
                      src={adPartners[activeSlideIndex].imageUrl} 
                      alt={`Mockup Patrocinador ${activeSlideIndex + 1}`} 
                      className="relative z-10 w-full h-full object-cover transition-transform duration-500 rounded-2xl"
                    />
                  ) : (
                    <div className="relative z-10 text-[10px] text-slate-400 font-bold uppercase">Sem imagem</div>
                  )}

                  {/* Manual Arrow Navigation */}
                  {adPartners.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSlideIndex(prev => (prev - 1 + adPartners.length) % adPartners.length);
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-slate-900/60 text-white p-1.5 rounded-full opacity-0 group-hover/story:opacity-100 transition-opacity hover:bg-slate-950 shadow-md cursor-pointer"
                        title="Slide anterior"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSlideIndex(prev => (prev + 1) % adPartners.length);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-slate-900/60 text-white p-1.5 rounded-full opacity-0 group-hover/story:opacity-100 transition-opacity hover:bg-slate-950 shadow-md cursor-pointer"
                        title="Próximo slide"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </>
                  )}

                  {/* Bottom Navigation Dots */}
                  {adPartners.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5 pointer-events-none">
                      {adPartners.map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                            idx === activeSlideIndex 
                              ? 'bg-primary w-3' 
                              : 'bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Action Overlays on Hover */}
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5 z-30 opacity-0 group-hover/story:opacity-100 transition-opacity duration-300">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300 mb-1">
                      Banner {activeSlideIndex + 1} de {adPartners.length}
                    </span>
                    
                    {adPartners[activeSlideIndex]?.originalImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPartnerEditIndex(activeSlideIndex);
                          setPartnerCropTarget(adPartners[activeSlideIndex].originalImageUrl);
                        }}
                        className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded-lg border border-white/25 flex items-center gap-1.5 w-36 justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm animate-in fade-in duration-300"
                      >
                        <Crop size={12} /> Reposicionar
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleEditPartnerImage(activeSlideIndex)}
                      className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded-lg border border-white/25 flex items-center gap-1.5 w-36 justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                    >
                      <RefreshCw size={12} /> Trocar Imagem
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingLinkIndex(activeSlideIndex);
                        setTempLinkValue(adPartners[activeSlideIndex]?.link || '');
                      }}
                      className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded-lg border border-white/25 flex items-center gap-1.5 w-36 justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                    >
                      <Link2 size={12} /> Editar Link
                    </button>
                  </div>

                  {/* Inline Link Editor Overlay */}
                  {editingLinkIndex === activeSlideIndex && (
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 z-40 animate-in fade-in duration-200">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300 mb-2 block text-center">Configurar Link</span>
                      <input
                        type="text"
                        value={tempLinkValue}
                        onChange={(e) => setTempLinkValue(e.target.value)}
                        placeholder="Ex: https://wa.me/55..."
                        className="w-full px-2.5 py-1.5 bg-white/15 border border-white/20 rounded-lg text-xs text-white placeholder-white/35 focus:ring-1 focus:ring-primary focus:outline-none mb-3 text-center"
                      />
                      <div className="flex gap-2 w-full justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setAdPartners(prev => prev.map((item, idx) => idx === activeSlideIndex ? { ...item, link: tempLinkValue } : item));
                            setEditingLinkIndex(null);
                          }}
                          className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer hover:scale-105"
                          title="Salvar link"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingLinkIndex(null)}
                          className="p-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer hover:scale-105"
                          title="Cancelar"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Lado Direito: Listagem com Links Rápidos */}
              <div className="flex-1 w-full space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-sm">
                    Carrossel de Patrocinadores ({adPartners.length}/3)
                  </span>
                  {adPartners.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddPartnerClick}
                      disabled={isUploadingPartner}
                      className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-primary/20 disabled:opacity-50"
                    >
                      <Plus size={12} /> Adicionar
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {adPartners.map((partner, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveSlideIndex(idx)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        idx === activeSlideIndex
                          ? 'border-primary bg-primary/5 shadow-xs'
                          : 'border-slate-150 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      {/* Crop Preview Aspect 9:16 Mini Thumbnail */}
                      <div className="w-12 h-16 bg-slate-200 rounded-lg overflow-hidden border border-slate-200 shrink-0 relative flex items-center justify-center">
                        {partner.imageUrl ? (
                          <img src={partner.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[8px] text-slate-400 uppercase font-bold">Foto</span>
                        )}
                      </div>

                      {/* Info & Link field */}
                      <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[11px] font-bold text-slate-700">Patrocinador {idx + 1}</span>
                          <span className="text-[9px] font-semibold text-slate-400">Enquadramento Banner (3:4)</span>
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            value={partner.link}
                            onChange={(e) => {
                              const updated = [...adPartners];
                              updated[idx].link = e.target.value;
                              setAdPartners(updated);
                            }}
                            placeholder="Link de redirecionamento (ex: https://...)"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const filtered = adPartners.filter((_, i) => i !== idx);
                          setAdPartners(filtered);
                          setActiveSlideIndex(0);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Remover patrocinador"
                      >
                        <Trash2 size={14} />
                      </button>

                    </div>
                  ))}
                </div>

                {partnerError && <p className="text-xs text-red-500 font-medium">{partnerError}</p>}
                
                <p className="text-[11px] text-slate-400 italic">
                  Dica: Toque/selecione um patrocinador na lista para focar sua visualização no preview e editar suas informações.
                </p>
              </div>

            </div>
          )}
        </div>

        {partnerCropTarget && (
          <ImageCropperModal
            imageSrc={partnerCropTarget}
            isOpen={true}
            onClose={() => setPartnerCropTarget(null)}
            onComplete={(croppedBlob) => handleSponsorCropComplete(croppedBlob)}
            aspect={3/4}
          />
        )}

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Save size={16} /> Salvar Patrocinadores
              </>
            )}
          </button>
        </div>

        {successMessage && (
          <div className="p-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
            <Check size={16} className="text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <X size={16} className="text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
