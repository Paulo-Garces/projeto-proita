import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, UploadCloud, Loader2, Plus, ChevronLeft, ChevronRight, Crop, RefreshCw, Link2, Trash2, Check, X, Save, FileText } from 'lucide-react';
import ImageCropperModal from './ImageCropperModal';
import imageCompression from 'browser-image-compression';
import { API_URL } from '../config';



// ── SUBCOMPONENTE INDEPENDENTE DE GERENCIAMENTO DE PATROCINADORES ──────
function AdSponsorsManager({ ad, token, onSaved }) {
  const [adPartners, setAdPartners] = useState([]);
  const [isUploadingPartner, setIsUploadingPartner] = useState(false);
  const [partnerError, setPartnerError] = useState('');
  const [partnerCropTarget, setPartnerCropTarget] = useState(null); // File base64 or string URL
  const [partnerEditIndex, setPartnerEditIndex] = useState(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [editingLinkIndex, setEditingLinkIndex] = useState(null);
  const [tempLinkValue, setTempLinkValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

  // Efeito reativo para carregar parceiros do anúncio ativo
  useEffect(() => {
    if (ad) {
      try {
        const partners = typeof ad.partners === 'string' 
          ? JSON.parse(ad.partners) 
          : (ad.partners || []);
        setAdPartners(partners);
      } catch {
        setAdPartners(ad.partners || []);
      }
      setActiveSlideIndex(0);
      setEditingLinkIndex(null);
      setPartnerCropTarget(null);
      setPartnerEditIndex(null);
    }
  }, [ad]);

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

    const targetIndex = partnerEditIndex;
    const activeIdx = (targetIndex !== null && targetIndex !== undefined && targetIndex >= 0)
      ? targetIndex 
      : adPartners.length;

    try {
      // Compress the cropped image in the background
      let uploadBlob = blob;
      try {
        const options = {
          maxSizeMB: 1.0,
          maxWidthOrHeight: 1200,
          useWebWorker: false,
          fileType: 'image/jpeg'
        };
        uploadBlob = await imageCompression(blob, options);
      } catch (compressErr) {
        console.warn('[PARTNER COMPRESSION] Falha na compressão do crop, enviando original:', compressErr);
        uploadBlob = blob;
      }

      const fd = new FormData();
      fd.append('fotoAnuncio', uploadBlob, 'partner.jpg');

      const res = await fetch(`${API_URL}/api/upload/foto-anuncio`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const originalUrl = partnerCropTarget?.imageSrc || partnerCropTarget;
        if (targetIndex !== null && targetIndex !== undefined && targetIndex >= 0) {
          setAdPartners(prev => prev.map((item, idx) => idx === targetIndex ? {
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
            name: '',
            partnerAddress: '',
            partnerPhone: '',
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

  const handleImageSelect = async (file, index) => {
    if (!file) return;
    setPartnerError('');
    setIsUploadingPartner(true);

    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif'];
    const fileExt = file.name ? file.name.split('.').pop().toLowerCase() : '';
    const isHEIC = fileExt === 'heic' || fileExt === 'heif' || file.type.includes('heic') || file.type.includes('heif');
    const isImage = file.type.startsWith('image/') || isHEIC;

    if (!isImage && !validExtensions.includes(fileExt)) {
      setPartnerError('Por favor, selecione um arquivo de imagem válido.');
      setIsUploadingPartner(false);
      return;
    }

    // Direct FileReader without pre-compression to avoid mobile silent failures
    const reader = new FileReader();
    reader.onload = () => {
      setPartnerEditIndex(index);
      setPartnerCropTarget({ index, imageSrc: reader.result });
      setIsUploadingPartner(false);
    };
    reader.onerror = (err) => {
      console.error('[CROPPER MOBILE] Erro no FileReader:', err);
      setPartnerError('Falha ao ler o arquivo de imagem.');
      setIsUploadingPartner(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAddPartnerClick = () => {
    if (adPartners.length >= 3) return;
    setAdPartners(prev => [...prev, {
      imageUrl: null,
      fileId: null,
      originalImageUrl: null,
      link: '',
      name: '',
      partnerAddress: '',
      partnerPhone: '',
    }]);
    setActiveSlideIndex(adPartners.length); // Focus on the newly added partner
  };

  const handleEditPartnerImage = (index) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onclick = (e) => { e.target.value = null; };
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      handleImageSelect(file, index);
    };
    input.click();
  };

  const handleSave = async () => {
    if (!ad.id) return;
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    // Filter before sending: remove empty sponsors and format fields
    const cleanedPartners = adPartners
      .filter(partner => {
        // A partner is valid if they have a non-empty imageUrl that is not a local blob URL
        const hasImage = partner.imageUrl && typeof partner.imageUrl === 'string' && partner.imageUrl.trim() !== '' && !partner.imageUrl.startsWith('blob:');
        return hasImage;
      })
      .map(partner => ({
        imageUrl: partner.imageUrl.trim(),
        fileId: partner.fileId || null,
        originalImageUrl: partner.originalImageUrl || null,
        link: partner.link ? partner.link.trim() : '',
        name: partner.name ? partner.name.trim() : '',
        partnerAddress: partner.partnerAddress ? partner.partnerAddress.trim() : '',
        partnerPhone: partner.partnerPhone ? partner.partnerPhone.trim() : '',
      }));

    try {
      const res = await fetch(`${API_URL}/api/ads/${ad.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: ad.id,
          adId: ad.id,
          selectedAdId: ad.id,
          partners: cleanedPartners,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage('Patrocinadores salvos com sucesso!');
        // Update local state with the cleaned array to ensure no blob URLs or empty items are left in UI state
        setAdPartners(cleanedPartners);
        if (onSaved) {
          onSaved(data.profile);
        }
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.message || 'Erro ao salvar patrocinadores.');
      }
    } catch (err) {
      console.error('[SAVE PARTNERS] Erro:', err);
      setErrorMessage(`Erro de conexão ao salvar: ${err.message || 'Erro de conexão/servidor'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-slate-200/85 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
          <Sparkles className="text-primary animate-pulse hidden md:inline-block" size={20} />
          {ad.atividadePrincipal || ad.activityName || 'Anúncio Profissional'}
        </h2>
        
        {/* Descrição - Oculta no mobile */}
        <div className="hidden md:block">
          <p className="text-xs text-slate-500 mt-1">
            Venda o espaço "Parceiro" de seu perfil para comerciantes ou patrocinadores locais. Adicione até 3 patrocinadores e seus respectivos links. O recorte perfeito vertical (3:4) garante que o carrossel tenha um visual incrível!
          </p>
        </div>
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
            
            {/* Lado Esquerdo: Smartphone Story Mockup Frame (Oculto no Mobile) */}
            <div className="hidden md:flex flex-col items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Visualização em Tempo Real</span>
              
              <div 
                className="relative w-[280px] h-[373px] rounded-3xl border-4 border-slate-100 bg-slate-900 overflow-hidden shadow-xl group/story select-none flex items-center justify-center shrink-0 transition-transform duration-300"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {/* Background blur */}
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-md opacity-35 scale-110 pointer-events-none"
                  style={{ backgroundImage: `url(${adPartners[activeSlideIndex]?.imageUrl})` }}
                />

                {/* Main Portrait Slide Image */}
                {isUploadingPartner && activeSlideIndex === partnerEditIndex ? (
                  <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center">
                    <Loader2 className="text-primary animate-spin mb-2" size={28} />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enviando imagem...</span>
                  </div>
                ) : adPartners[activeSlideIndex]?.imageUrl ? (
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
                    <RefreshCw size={12} /> {adPartners[activeSlideIndex]?.imageUrl ? 'Trocar Imagem' : 'Subir Imagem'}
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
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="font-bold text-slate-700 text-sm">
                  Patrocinadores ({adPartners.length}/3)
                </span>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                  {adPartners.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsMobilePreviewOpen(true)}
                      className="flex-1 sm:flex-none justify-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-slate-200 md:hidden"
                    >
                      Visualizar Preview
                    </button>
                  )}
                  {adPartners.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddPartnerClick}
                      disabled={isUploadingPartner}
                      className="flex-1 sm:flex-none justify-center px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-primary/20 disabled:opacity-50"
                    >
                      <Plus size={12} /> Adicionar
                    </button>
                  )}
                </div>
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
                    {/* Crop Preview Mini Thumbnail */}
                    {/* Crop Preview Mini Thumbnail */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPartnerImage(idx);
                      }}
                      className="w-12 h-16 bg-slate-200 rounded-lg overflow-hidden border border-slate-200 shrink-0 relative flex items-center justify-center cursor-pointer hover:bg-slate-350 transition-colors group"
                      title="Clique para selecionar imagem"
                    >
                      {isUploadingPartner && idx === partnerEditIndex ? (
                        <div className="flex flex-col items-center text-primary p-1">
                          <Loader2 size={16} className="animate-spin" />
                          <span className="text-[7px] uppercase font-bold mt-0.5 text-center leading-tight">Enviando</span>
                        </div>
                      ) : partner.imageUrl ? (
                        <>
                          <img src={partner.imageUrl} alt="" className="w-full h-full object-cover animate-in fade-in duration-200" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <UploadCloud size={14} />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-slate-500">
                          <UploadCloud size={14} className="animate-pulse" />
                          <span className="text-[8px] uppercase font-bold mt-0.5">Subir</span>
                        </div>
                      )}
                    </div>
 
                    {/* Info & Link field */}
                    <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[11px] font-bold text-slate-700">Patrocinador {idx + 1}</span>
                        <span className="text-[9px] font-semibold text-slate-400 hidden md:inline">Enquadramento Banner (3:4)</span>
                      </div>
 
                      <div className="space-y-1.5">
                        {/* Nome do Patrocinador */}
                        <input
                          type="text"
                          value={partner.name || ''}
                          onChange={(e) => {
                            const updated = [...adPartners];
                            updated[idx].name = e.target.value;
                            setAdPartners(updated);
                          }}
                          placeholder="Nome do Patrocinador"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800 placeholder-slate-450 focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                        {/* Endereço & Telefone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          <input
                            type="text"
                            value={partner.partnerAddress || ''}
                            onChange={(e) => {
                              const updated = [...adPartners];
                              updated[idx].partnerAddress = e.target.value;
                              setAdPartners(updated);
                            }}
                            placeholder="Endereço do parceiro"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800 placeholder-slate-450 focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                          <input
                            type="text"
                            value={partner.partnerPhone || ''}
                            onChange={(e) => {
                              const updated = [...adPartners];
                              updated[idx].partnerPhone = e.target.value;
                              setAdPartners(updated);
                            }}
                            placeholder="Telefone do parceiro"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800 placeholder-slate-450 focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>
                        {/* Link de redirecionamento */}
                        <input
                          type="text"
                          value={partner.link || ''}
                          onChange={(e) => {
                            const updated = [...adPartners];
                            updated[idx].link = e.target.value;
                            setAdPartners(updated);
                          }}
                          placeholder="Link de redirecionamento (opcional, ex: https://...)"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800 placeholder-slate-450 focus:ring-1 focus:ring-primary focus:outline-none"
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
          imageSrc={partnerCropTarget.imageSrc || partnerCropTarget}
          isOpen={true}
          onClose={() => setPartnerCropTarget(null)}
          onComplete={(croppedBlob) => handleSponsorCropComplete(croppedBlob)}
          aspect={3/4}
        />
      )}

      {isMobilePreviewOpen && adPartners.length > 0 && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-4 w-full max-w-sm flex flex-col items-center relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsMobilePreviewOpen(false)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-2 rounded-full cursor-pointer w-8 h-8 flex items-center justify-center"
            >
              X
            </button>
            
            <h3 className="font-bold text-slate-800 text-base mb-4 mt-2">Preview do Banner</h3>
            
            <div className="relative w-[280px] h-[373px] rounded-3xl border-4 border-slate-100 bg-slate-900 overflow-hidden shadow-xl select-none flex items-center justify-center shrink-0">
              <div 
                className="absolute inset-0 bg-cover bg-center blur-md opacity-35 scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${adPartners[activeSlideIndex]?.imageUrl})` }}
              />
              
              {adPartners[activeSlideIndex]?.imageUrl ? (
                <img 
                  src={adPartners[activeSlideIndex].imageUrl} 
                  alt={`Preview Patrocinador ${activeSlideIndex + 1}`} 
                  className="relative z-10 w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <div className="relative z-10 text-[10px] text-slate-400 font-bold uppercase">Sem imagem</div>
              )}
              
              {/* Manual Navigation */}
              {adPartners.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSlideIndex(prev => (prev - 1 + adPartners.length) % adPartners.length);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-slate-900/60 text-white p-1.5 rounded-full hover:bg-slate-950 shadow-md cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSlideIndex(prev => (prev + 1) % adPartners.length);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-slate-900/60 text-white p-1.5 rounded-full hover:bg-slate-950 shadow-md cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </>
              )}
              
              {/* Navigation Dots */}
              {adPartners.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5 pointer-events-none">
                  {adPartners.map((_, idx) => (
                    <span
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        idx === activeSlideIndex ? 'bg-primary w-3' : 'bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-4 w-full text-center">
              <span className="text-xs text-slate-500 font-medium">
                Patrocinador {activeSlideIndex + 1} de {adPartners.length}
              </span>
              {adPartners[activeSlideIndex]?.name && (
                <p className="text-sm font-bold text-slate-800 mt-1">
                  {adPartners[activeSlideIndex].name}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer animate-in fade-in duration-350"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin text-white" /> Salvando...
            </>
          ) : (
            <>
              <Save size={16} /> Salvar Patrocinadores
            </>
          )}
        </button>
      </div>

      {successMessage && (
        <div className="p-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 animate-in slide-in-from-bottom duration-300">
          <Check size={16} className="text-emerald-600 animate-bounce" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 animate-in slide-in-from-bottom duration-300">
          <X size={16} className="text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

// ── COMPONENTE PRINCIPAL QUE RENDERIZA CADA ANÚNCIO COMO UM BLOCO INDEPENDENTE ──────
export default function SponsorsTab({ token, onSaved }) {
  const [ads, setAds] = useState([]);
  const [loadingAds, setLoadingAds] = useState(true);
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

  // Carregando anúncios
  if (loadingAds) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100 shadow-xs">
        <Loader2 size={36} className="text-primary animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Buscando seus anúncios...</p>
      </div>
    );
  }

  // Estado Vazio
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
    <div className="space-y-12">
      {errorMessage && (
        <div className="p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <X size={16} className="text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {ads.map((adItem) => (
        <AdSponsorsManager
          key={adItem.id}
          ad={adItem}
          token={token}
          onSaved={(updatedAd) => {
            // Atualizar o anúncio correspondente na lista local
            setAds(prev => prev.map(item => item.id === updatedAd.id ? updatedAd : item));
            if (onSaved) {
              onSaved(updatedAd);
            }
          }}
        />
      ))}
    </div>
  );
}
