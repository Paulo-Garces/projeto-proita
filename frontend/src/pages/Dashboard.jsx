import { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Heart, Settings, LayoutDashboard, LogOut, Camera, Loader2, Plus, ArrowLeft, CheckCircle, Trash2, UploadCloud, Edit2, AlertCircle, Shield, KeyRound, CreditCard, Sparkles, Clock, Copy, ChevronLeft, ChevronRight, Check, X, Link2, Crop, RefreshCw } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import AdCard from '../components/AdCard';
import ImageCropperModal from '../components/ImageCropperModal';
import { API_URL } from '../config';
import { getProfileDisplayName, getProfileAvatarNameParam } from '../utils/profileDisplayName';

// ── Auxiliares de Formatação e Máscara de Telefone ───────────────
const formatPhone = (val) => {
  if (!val) return '';
  let value = val.replace(/\D/g, '');
  if (value.length > 11) value = value.slice(0, 11);
  if (value.length > 2) {
    value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
  }
  if (value.length > 10) {
    value = `${value.slice(0, 10)}-${value.slice(10)}`;
  }
  return value;
};

const convertToInternationalPhone = (phone) => {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (!clean) return '';
  if (clean.startsWith('55') && (clean.length === 12 || clean.length === 13)) {
    return `+${clean}`;
  }
  return `+55${clean}`;
};

// ── Sub-componente: Avatar (foto real ou iniciais) ──────────────
function AvatarDisplay({ user, sizeClass = 'w-20 h-20', textClass = 'text-2xl' }) {
  return user?.profileImageUrl ? (
    <img src={user.profileImageUrl} alt={user.nome} className={`${sizeClass} rounded-full object-cover border-4 border-white shadow-md`} />
  ) : (
    <div className={`${sizeClass} ${textClass} bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold uppercase border-4 border-white shadow-md`}>
      {user?.nome?.[0] || 'U'}{user?.sobrenome?.[0] || ''}
    </div>
  );
}

// (AdCard é importado de ../components/AdCard)

/** Converte socialLinks / redesSociais (legado network+link) para o shape do formulário de edição. */
function mapStoredSocialLinksToForm(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const platform = (item.platform ?? item.network ?? 'instagram').toString().toLowerCase().trim();
      const url = (item.url ?? item.link ?? '').toString();
      return { platform: platform || 'instagram', url: url.trim() };
    })
    .filter(Boolean)
    .slice(0, 3);
}

// ── Sub-componente: Portfólio com upload real ───────────────────
function PortfolioSection({ ad, token }) {
  const [urls, setUrls] = useState(ad.portfolioUrls || []);
  const urlsRef = useRef(urls);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    urlsRef.current = urls;
  }, [urls]);

  const uploadPortfolioFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (urlsRef.current.length >= 8) {
      setError('Máximo de 8 fotos no portfólio.');
      return;
    }
    setError('');
    setIsUploading(true);
    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1280, useWebWorker: true, fileType: 'image/jpeg' };
      const compressed = await imageCompression(file, options);
      const fd = new FormData();
      fd.append('portfolioImage', compressed, 'portfolio.jpg');
      const res = await fetch(`${API_URL}/api/upload/portfolio/${ad.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUrls(data.portfolioUrls);
        urlsRef.current = data.portfolioUrls;
      } else setError(data.message || 'Erro ao enviar.');
    } catch (err) {
      setError('Erro ao processar imagem.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await uploadPortfolioFile(file);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = [...(e.dataTransfer?.files || [])].filter((f) => f.type.startsWith('image/'));
    for (const file of files) {
      if (urlsRef.current.length >= 8) break;
      await uploadPortfolioFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDelete = async (url) => {
    if (!confirm('Remover esta foto do portfólio?')) return;
    try {
      const res = await fetch(`${API_URL}/api/upload/portfolio/${ad.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUrls(data.portfolioUrls);
        urlsRef.current = data.portfolioUrls;
      }
    } catch { }
  };

  return (
    <section className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Portfólio</h4>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-60"
        >
          {isUploading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
          {isUploading ? 'Enviando...' : 'Adicionar foto'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {urls.length === 0 ? (
        <div
          role="presentation"
          onClick={() => inputRef.current?.click()}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-400 text-sm cursor-pointer hover:border-primary/40 transition-colors"
        >
          <UploadCloud size={28} className="mx-auto mb-2 opacity-40 pointer-events-none" />
          <span className="pointer-events-none">Clique ou arraste imagens para adicionar ao portfólio</span>
        </div>
      ) : (
        <div
          role="presentation"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          {urls.map((url, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200">
              <img src={url} alt={`Portfólio ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleDelete(url)}
                className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                title="Remover foto"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-primary/40 hover:text-primary transition-colors"
          >
            <UploadCloud size={22} />
            <span className="text-xs mt-1">Adicionar</span>
          </button>
        </div>
      )}
    </section>
  );
}

// ── Sub-componente: Catálogo de Serviços ──────────────────────────
function ServiceCatalogSection({ ad, token }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados do formulário
  const [name, setName] = useState('');
  const [priceType, setPriceType] = useState('FIXO'); // Armazenado como FIXO, A_PARTIR, SOB_CONSULTA no Prisma
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar serviços cadastrados
  const fetchServices = async () => {
    if (!ad?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/services/${ad.id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setServices(data.data);
      } else {
        setError(data.message || 'Erro ao carregar catálogo.');
      }
    } catch (err) {
      setError('Erro de conexão ao carregar serviços.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [ad.id]);

  // Adicionar serviço
  const handleAddService = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: name.trim(),
        priceType,
        description: description.trim() || null,
        profileId: ad.id
      };

      if (priceType !== 'SOB_CONSULTA') {
        const floatPrice = parseFloat(price);
        if (isNaN(floatPrice) || floatPrice < 0) {
          setError('Por favor, informe um preço válido maior ou igual a zero.');
          setIsSubmitting(false);
          return;
        }
        payload.price = floatPrice;
      }

      const res = await fetch(`${API_URL}/api/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Serviço adicionado com sucesso!');
        setName('');
        setPrice('');
        setDescription('');
        setPriceType('FIXO');
        // Recarregar a lista
        fetchServices();
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(data.message || 'Erro ao adicionar serviço.');
      }
    } catch (err) {
      setError('Erro de conexão ao salvar serviço.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Excluir serviço
  const handleDeleteService = async (serviceId) => {
    if (!confirm('Tem certeza que deseja remover este serviço do catálogo?')) return;

    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_URL}/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Serviço removido com sucesso!');
        fetchServices();
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(data.message || 'Erro ao remover serviço.');
      }
    } catch (err) {
      setError('Erro de conexão ao excluir serviço.');
    }
  };

  const inputClass = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-slate-800 text-sm bg-slate-50';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <section className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-6">
      <div>
        <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Meu Catálogo de Serviços</h4>
        <p className="text-xs text-slate-500 mt-1">
          Cadastre os principais serviços que você oferece para exibir uma vitrine completa no seu perfil público.
        </p>
      </div>

      {/* Formulário de Adição */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/60 space-y-4">
        <h5 className="font-medium text-slate-800 text-sm flex items-center gap-1.5">
          <Plus size={15} className="text-primary" /> Adicionar Novo Serviço
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>Nome do Serviço <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Instalação de Torneira, Limpeza de Pele..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Tipo de Preço <span className="text-red-500">*</span></label>
            <select
              value={priceType}
              onChange={(e) => setPriceType(e.target.value)}
              className={inputClass}
            >
              <option value="FIXO">Preço Fixo</option>
              <option value="A_PARTIR">A partir de</option>
              <option value="SOB_CONSULTA">Sob Consulta</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {priceType !== 'SOB_CONSULTA' && (
            <div>
              <label className={labelClass}>Preço (R$) <span className="text-red-500">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex: 80.00"
                className={inputClass}
              />
            </div>
          )}

          <div className={priceType === 'SOB_CONSULTA' ? 'md:col-span-3' : 'md:col-span-2'}>
            <label className={labelClass}>Descrição Curta (opcional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Incluso material básico, garantia de 3 meses..."
              className={inputClass + ' resize-none'}
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={13} /> {error}</p>}
        {success && <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle size={13} /> {success}</p>}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAddService}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 text-xs bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Adicionar ao Catálogo
          </button>
        </div>
      </div>

      {/* Lista de Gerenciamento */}
      <div className="space-y-3">
        <h5 className="font-semibold text-slate-700 text-xs uppercase tracking-wide">Serviços Cadastrados ({services.length})</h5>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-xs py-4 justify-center">
            <Loader2 size={16} className="animate-spin" /> Carregando serviços...
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm bg-white rounded-xl border border-slate-200/60">
            Nenhum serviço cadastrado ainda. Use o formulário acima para iniciar seu catálogo!
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Serviço</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Preço</th>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{service.name}</td>
                      <td className="px-4 py-3">
                        {service.priceType === 'FIXO' && <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full text-xs font-semibold">Fixo</span>}
                        {service.priceType === 'A_PARTIR' && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs font-semibold">A partir</span>}
                        {service.priceType === 'SOB_CONSULTA' && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-xs font-semibold">Sob Consulta</span>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {service.priceType === 'SOB_CONSULTA' ? '---' : `R$ ${parseFloat(service.price).toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate" title={service.description}>
                        {service.description || <span className="italic text-slate-300">Sem descrição</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteService(service.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors inline-flex items-center"
                          title="Remover serviço"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


// ── Auxiliares de Horários Semanais Estruturados ────────────────
const DAYS_OF_WEEK = [
  { key: 'segunda', label: 'Segunda-feira' },
  { key: 'terca', label: 'Terça-feira' },
  { key: 'quarta', label: 'Quarta-feira' },
  { key: 'quinta', label: 'Quinta-feira' },
  { key: 'sexta', label: 'Sexta-feira' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' }
];

const parseStoredHorarios = (raw) => {
  const defaultHours = {
    segunda: { isOpen: true, start: '08:00', end: '18:00' },
    terca: { isOpen: true, start: '08:00', end: '18:00' },
    quarta: { isOpen: true, start: '08:00', end: '18:00' },
    quinta: { isOpen: true, start: '08:00', end: '18:00' },
    sexta: { isOpen: true, start: '08:00', end: '18:00' },
    sabado: { isOpen: false, start: '08:00', end: '12:00' },
    domingo: { isOpen: false, start: '08:00', end: '12:00' }
  };

  if (!raw) return defaultHours;

  let parsed = {};
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    parsed = raw;
  } else {
    try {
      const parsedObj = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (typeof parsedObj === 'object' && !Array.isArray(parsedObj)) {
        parsed = parsedObj;
      }
    } catch {
      // Legacy
    }
  }

  const result = { ...defaultHours };

  if (Object.keys(parsed).length > 0) {
    const dayKeys = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
    for (const k of dayKeys) {
      const val = parsed[k] || parsed[k.replace('terca', 'terça').replace('sabado', 'sábado')] || parsed[k.substring(0, 3)];
      if (val) {
        if (val.toLowerCase() === 'fechado' || val.toLowerCase().includes('fech')) {
          result[k] = { isOpen: false, start: '08:00', end: '18:00' };
        } else {
          const match = val.match(/(\d{2}[:h]\d{2}|\d{2})/g);
          if (match && match.length >= 2) {
            const cleanStart = match[0].replace('h', ':').padEnd(5, '0');
            const cleanEnd = match[1].replace('h', ':').padEnd(5, '0');
            result[k] = { isOpen: true, start: cleanStart, end: cleanEnd };
          } else {
            result[k] = { isOpen: true, start: '08:00', end: '18:00' };
          }
        }
      }
    }
    return result;
  }

  if (typeof raw === 'string' && raw.trim() !== '') {
    const lines = raw.split('\n');
    for (const line of lines) {
      const lower = line.toLowerCase();
      const match = line.match(/(\d{2}[:h]\d{2}|\d{2})/g);
      let start = '08:00';
      let end = '18:00';
      let hasTimes = false;
      if (match && match.length >= 2) {
        start = match[0].replace('h', ':').includes(':') ? match[0].replace('h', ':') : `${match[0]}:00`;
        end = match[1].replace('h', ':').includes(':') ? match[1].replace('h', ':') : `${match[1]}:00`;
        hasTimes = true;
      }
      
      const isOpen = !lower.includes('fechado') && (hasTimes || lower.includes('aberto'));

      if (lower.includes('seg') || lower.includes('todos') || lower.includes('diario') || lower.includes('diário')) {
        result.segunda = { isOpen, start, end };
      }
      if (lower.includes('ter') || lower.includes('todos') || lower.includes('diario') || lower.includes('diário')) {
        result.terca = { isOpen, start, end };
      }
      if (lower.includes('qua') || lower.includes('todos') || lower.includes('diario') || lower.includes('diário')) {
        result.quarta = { isOpen, start, end };
      }
      if (lower.includes('qui') || lower.includes('todos') || lower.includes('diario') || lower.includes('diário')) {
        result.quinta = { isOpen, start, end };
      }
      if (lower.includes('sex') || lower.includes('todos') || lower.includes('diario') || lower.includes('diário')) {
        result.sexta = { isOpen, start, end };
      }
      if (lower.includes('sáb') || lower.includes('sab') || lower.includes('todos') || lower.includes('diario') || lower.includes('diário')) {
        result.sabado = { isOpen, start, end };
      }
      if (lower.includes('dom') || lower.includes('todos') || lower.includes('diario') || lower.includes('diário')) {
        result.domingo = { isOpen, start, end };
      }
    }
  }

  return result;
};

const serializeWeeklyHours = (weeklyHours) => {
  const result = {};
  const dayKeys = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
  for (const k of dayKeys) {
    const day = weeklyHours[k];
    if (day.isOpen) {
      result[k] = `${day.start} às ${day.end}`;
    } else {
      result[k] = 'Fechado';
    }
  }
  return result;
};

// ── Sub-componente: Formulário de edição de anúncio ─────────────
function AdEditForm({ ad, token, user, isSecondAd, onSaved, onCancel }) {
  const [declarationChecked, setDeclarationChecked] = useState(false);

  const getLockInfo = () => {
    if (!ad.lastNamePhoneUpdate) return { active: false, days: 0 };
    const diffMs = Date.now() - new Date(ad.lastNamePhoneUpdate).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 15) {
      return { active: true, days: Math.ceil(15 - diffDays) };
    }
    return { active: false, days: 0 };
  };
  const lockInfo = getLockInfo();

  const initialPhone = ad.telefoneComercial 
    ? formatPhone(ad.telefoneComercial.replace(/^\+55/, '')) 
    : ad.servicePhone 
      ? formatPhone(ad.servicePhone.replace(/^\+55/, '')) 
      : ad.whatsapp 
        ? formatPhone(ad.whatsapp.replace(/^\+55/, '')) 
        : '';

  const [form, setForm] = useState({
    nomeExibicao: ad.nomeExibicao || '',
    sobrenomeExibicao: ad.sobrenomeExibicao || '',
    atividadePrincipal: ad.atividadePrincipal || '',
    atividadesSecundarias: (ad.atividadesSecundarias || []).join(', '),
    descricaoTrabalho: ad.descricaoTrabalho || '',
    shortDescription: ad.descricaoCurta || ad.shortDescription || '',
    servicePhone: initialPhone,
    serviceBairro: ad.serviceBairro || '',
    endereco: ad.endereco || '',
    telefoneComercial: initialPhone,
    fotoAnuncioUrl: ad.fotoAnuncioUrl || '',
    fotoAnuncioFileId: ad.fotoAnuncioFileId || '',
    capaUrl: ad.capaUrl || '',
    capaFileId: ad.capaFileId || '',
    enderecoComercial: ad.enderecoComercial || '',
    horariosFuncionamento: typeof ad.horariosFuncionamento === 'string'
      ? ad.horariosFuncionamento
      : ad.horariosFuncionamento
        ? (Array.isArray(ad.horariosFuncionamento)
          ? ad.horariosFuncionamento.join('\n')
          : typeof ad.horariosFuncionamento === 'object'
            ? Object.entries(ad.horariosFuncionamento).map(([k, v]) => `${k}: ${v}`).join('\n')
            : '')
        : '',
  });
  const [socialLinks, setSocialLinks] = useState(() =>
    mapStoredSocialLinksToForm(ad.socialLinks ?? ad.redesSociais)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [weeklyHours, setWeeklyHours] = useState(() => parseStoredHorarios(ad.horariosFuncionamento));

  const replicateMondayHours = () => {
    const monday = weeklyHours.segunda || { isOpen: true, start: '08:00', end: '18:00' };
    const { start, end } = monday;
    setWeeklyHours(prev => ({
      ...prev,
      terca: { isOpen: true, start, end },
      quarta: { isOpen: true, start, end },
      quinta: { isOpen: true, start, end },
      sexta: { isOpen: true, start, end }
    }));
  };

  // Patrocinadores/Parceiros e Crop Local
  const [adPartners, setAdPartners] = useState(() => {
    try {
      return typeof ad.partners === 'string' ? JSON.parse(ad.partners) : (ad.partners || []);
    } catch {
      return ad.partners || [];
    }
  });
  const [isUploadingPartner, setIsUploadingPartner] = useState(false);
  const [partnerError, setPartnerError] = useState('');
  const [cropTarget, setCropTarget] = useState(null); // { imageSrc: string }
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [editingLinkIndex, setEditingLinkIndex] = useState(null);
  const [tempLinkValue, setTempLinkValue] = useState('');

  // Auto-slide effect para o preview local, pausado sob interação ou edição de link
  useEffect(() => {
    if (adPartners.length <= 1 || isHovered || editingLinkIndex !== null) return;
    const interval = setInterval(() => {
      setActiveSlideIndex(prev => (prev + 1) % adPartners.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [adPartners.length, isHovered, editingLinkIndex]);

  const logoInputRef = useRef(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');

  const capaInputRef = useRef(null);
  const [isUploadingCapa, setIsUploadingCapa] = useState(false);
  const [capaError, setCapaError] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('Por favor, selecione um arquivo de imagem.');
      return;
    }

    setLogoError('');
    setIsUploadingLogo(true);

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: 'image/jpeg',
      };
      const compressed = await imageCompression(file, options);
      const fd = new FormData();
      fd.append('fotoAnuncio', compressed, 'fotoAnuncio.jpg');

      const res = await fetch(`${API_URL}/api/upload/foto-anuncio`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setForm(prev => ({
          ...prev,
          fotoAnuncioUrl: data.url,
          fotoAnuncioFileId: data.fileId,
        }));
      } else {
        setLogoError(data.message || 'Erro ao fazer upload da imagem.');
      }
    } catch (err) {
      console.error('[LOGO UPLOAD] Erro:', err);
      setLogoError('Erro de conexão ou processamento da imagem.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCapaUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCapaError('Por favor, selecione um arquivo de imagem.');
      return;
    }

    setCapaError('');
    setIsUploadingCapa(true);

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/jpeg',
      };
      const compressed = await imageCompression(file, options);
      const fd = new FormData();
      fd.append('fotoAnuncio', compressed, 'capaAnuncio.jpg');

      const res = await fetch(`${API_URL}/api/upload/foto-anuncio`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setForm(prev => ({
          ...prev,
          capaUrl: data.url,
          capaFileId: data.fileId,
        }));
      } else {
        setCapaError(data.message || 'Erro ao fazer upload da capa.');
      }
    } catch (err) {
      console.error('[CAPA UPLOAD] Erro:', err);
      setCapaError('Erro de conexão ou processamento da capa.');
    } finally {
      setIsUploadingCapa(false);
    }
  };

  const handleCroppedPartner = async (blob) => {
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
        if (cropTarget && cropTarget.index !== undefined && cropTarget.index >= 0) {
          setAdPartners(prev => prev.map((item, idx) => idx === cropTarget.index ? {
            ...item,
            imageUrl: data.url,
            fileId: data.fileId,
            originalImageUrl: cropTarget.imageSrc, // Preserva a imagem original local em memória
          } : item));
        } else {
          setAdPartners(prev => [...prev, {
            imageUrl: data.url,
            fileId: data.fileId,
            originalImageUrl: cropTarget.imageSrc, // Armazena a imagem original local em memória
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
      setCropTarget(null);
    }
  };

  const handleAddPartnerClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setCropTarget({
        imageSrc: URL.createObjectURL(file),
        index: undefined
      });
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
      setCropTarget({
        imageSrc: URL.createObjectURL(file),
        index: index
      });
    };
    input.click();
  };

  const addSocialLink = () => {
    if (socialLinks.length >= 3) return;
    setSocialLinks(prev => [...prev, { platform: 'instagram', url: '' }]);
  };
  const removeSocialLink = (i) => setSocialLinks(prev => prev.filter((_, idx) => idx !== i));
  const updateSocialLink = (i, field, val) =>
    setSocialLinks(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const handleSave = async () => {
    const hasNameChanged = form.nomeExibicao !== (ad.nomeExibicao || '') || form.sobrenomeExibicao !== (ad.sobrenomeExibicao || '');
    const cleanOrigPhone = ad.telefoneComercial ? formatPhone(ad.telefoneComercial.replace(/^\+55/, '')) : '';
    const hasPhoneChanged = formatPhone(form.telefoneComercial) !== cleanOrigPhone;

    if (hasNameChanged || hasPhoneChanged) {
      const confirmSave = window.confirm("Atenção: Ao salvar esta alteração, os campos Nome e Telefone só poderão ser editados novamente após 15 dias. Deseja continuar?");
      if (!confirmSave) {
        return;
      }
    }

    setIsSaving(true);
    setError('');
    try {
      const mappedSocial = socialLinks
        .map((s) => ({ platform: String(s.platform || '').toLowerCase().trim(), url: String(s.url || '').trim() }))
        .filter((s) => s.url)
        .slice(0, 3);

      const res = await fetch(`${API_URL}/api/ads/${ad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          nome: form.nomeExibicao,
          sobrenome: form.sobrenomeExibicao,
          telefoneComercial: convertToInternationalPhone(form.telefoneComercial),
          servicePhone: convertToInternationalPhone(form.telefoneComercial),
          whatsapp: convertToInternationalPhone(form.telefoneComercial),
          endereco: form.enderecoComercial || null,
          atividadesSecundarias: form.atividadesSecundarias ? form.atividadesSecundarias.split(',').map(s => s.trim()).filter(Boolean) : [],
          socialLinks: mappedSocial,
          redesSociais: mappedSocial,
          partners: adPartners,
          horariosFuncionamento: serializeWeeklyHours(weeklyHours),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaved(true);
        setTimeout(() => { setSaved(false); onSaved(data.profile); }, 1500);
      } else {
        setError(data.message || 'Erro ao salvar.');
      }
    } catch (err) {
      console.error('[SAVE AD] Erro:', err);
      setError('Erro de conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-slate-800 text-sm bg-slate-50';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="space-y-6">
      <button onClick={onCancel} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors font-medium">
        <ArrowLeft size={16} /> Voltar aos meus anúncios
      </button>
      <h3 className="text-xl font-bold text-slate-800">Editando: {ad.atividadePrincipal}</h3>

      {/* ── 1. LOGO E FOTO DE CAPA DO ANÚNCIO (Topo Absoluto) ── */}
      <section className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border-0 shadow-sm space-y-6">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Logo / Foto Comercial do Anúncio</h4>
          <div className="relative">
            {form.fotoAnuncioUrl ? (
              <div className="relative group w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img src={form.fotoAnuncioUrl} alt="Logo comercial" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, fotoAnuncioUrl: '', fotoAnuncioFileId: '' }))}
                    className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                    title="Remover foto"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-32 h-32 bg-slate-50 text-slate-400 rounded-full flex flex-col items-center justify-center font-bold text-xs uppercase border-2 border-dashed border-slate-200 shadow-inner">
                <Camera size={28} className="mb-1 opacity-60" />
                <span>Sem Logo</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center space-y-2">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-all shrink-0 flex items-center gap-2 shadow-md shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isUploadingLogo ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Carregando...
                </>
              ) : (
                <>
                  <UploadCloud size={16} /> Fazer Upload da Foto
                </>
              )}
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            {logoError && <p className="text-xs text-red-500">{logoError}</p>}
            <p className="text-xs text-slate-500 max-w-sm">
              Personalize o anúncio com uma foto profissional ou logo diferente do seu perfil pessoal.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex flex-col items-center justify-center text-center space-y-4">
          <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Foto de Capa do Anúncio (Banner 3:1)</h4>
          <div className="w-full max-w-xl aspect-[3/1] bg-slate-50 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 shadow-inner relative group">
            {form.capaUrl ? (
              <div className="relative w-full h-full">
                <img src={form.capaUrl} alt="Capa comercial" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, capaUrl: '', capaFileId: '' }))}
                    className="bg-red-500 text-white rounded-full p-2.5 shadow-lg hover:bg-red-650 transition-colors"
                    title="Remover capa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-bold text-xs uppercase p-4">
                <Camera size={28} className="mb-1 opacity-65" />
                <span>Sem Foto de Capa</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center space-y-2">
            <button
              type="button"
              onClick={() => capaInputRef.current?.click()}
              disabled={isUploadingCapa}
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-all shrink-0 flex items-center gap-2 shadow-md shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isUploadingCapa ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Carregando...
                </>
              ) : (
                <>
                  <UploadCloud size={16} /> Fazer Upload da Capa
                </>
              )}
            </button>
            <input
              ref={capaInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCapaUpload}
            />
            {capaError && <p className="text-xs text-red-500">{capaError}</p>}
            <p className="text-xs text-slate-500 max-w-sm">
              Escolha uma imagem horizontal elegante para o topo do seu perfil público (proporção sugerida 3:1).
            </p>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO: PARCEIROS / PATROCINADORES (Monetização) ── */}
      <section className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border-0 shadow-sm space-y-6">
        <div>
          <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Sparkles className="text-primary animate-pulse" size={20} />
            Espaço Parceiro (Monetize seu Perfil)
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Venda o espaço "Parceiro" de seu perfil para comerciantes ou patrocinadores locais. Adicione até 3 patrocinadores e seus respectivos links. O recorte perfeito vertical (9:16) garante que o carrossel tenha um visual story incrível!
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
                  className="relative w-[210px] h-[373px] rounded-3xl border-4 border-slate-100 bg-slate-900 overflow-hidden shadow-xl group/story select-none flex items-center justify-center shrink-0 transition-transform duration-300"
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
                        onClick={() => setCropTarget({ imageSrc: adPartners[activeSlideIndex].originalImageUrl, index: activeSlideIndex })}
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
                          className="p-1.5 bg-slate-650 hover:bg-slate-750 text-white rounded-lg transition-colors cursor-pointer hover:scale-105"
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
                      <div className="w-10 h-16 bg-slate-200 rounded-lg overflow-hidden border border-slate-200 shrink-0 relative flex items-center justify-center">
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
                          <span className="text-[9px] font-semibold text-slate-400">Enquadramento Story (9:16)</span>
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

        {cropTarget && (
          <ImageCropperModal
            imageSrc={cropTarget.imageSrc}
            aspect={9/16}
            cropShape="rect"
            onClose={() => setCropTarget(null)}
            onCropComplete={handleCroppedPartner}
          />
        )}
      </section>

      <section className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border-0 shadow-sm space-y-6">
        <h4 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3">Informações Básicas</h4>
        <div>
          <label className={labelClass}>Nome de Exibição / Nome Fantasia</label>
          <input
            value={form.nomeExibicao}
            onChange={(e) => setForm(prev => ({ ...prev, nomeExibicao: e.target.value, sobrenomeExibicao: '' }))}
            placeholder="Ex: Eletricista Silva, Paula Unhas (Opcional)"
            disabled={lockInfo.active}
            className={`${inputClass} ${lockInfo.active ? 'opacity-65 cursor-not-allowed bg-slate-100' : ''}`}
          />
          {lockInfo.active && (
            <span className="text-xs text-amber-600 font-semibold block mt-1">
              Disponível para edição em {lockInfo.days} dia(s)
            </span>
          )}
          <p className="text-xs text-slate-500 mt-1">
            Se deixado em branco, o sistema utilizará o seu nome de cadastro pessoal.
          </p>
        </div>
        <div>
          <label className={labelClass}>Descrição Completa</label>
          <textarea rows={10} value={form.descricaoTrabalho} onChange={set('descricaoTrabalho')} className={inputClass + ' resize-none'} />
        </div>
        <div>
          <label className={labelClass}>Descrição Curta <span className="text-slate-400">(aparece no card de busca, máx. 100 caracteres)</span></label>
          <input value={form.shortDescription} onChange={set('shortDescription')} maxLength={100} placeholder="Ex: Encanador com 10 anos de experiência, atendo a domicílio." className={inputClass} />
          <p className="text-xs text-slate-400 mt-1">{form.shortDescription.length}/100</p>
        </div>
      </section>

      <section className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border-0 shadow-sm space-y-6">
        <h4 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3">Localização</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Bairro de Atendimento</label>
            <input value={form.serviceBairro} onChange={set('serviceBairro')} placeholder="Ex: Centro, Aldeota..." className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Endereço Comercial Dedicado <span className="text-slate-400">(Aparece em destaque no perfil público)</span></label>
            <input value={form.enderecoComercial} onChange={set('enderecoComercial')} placeholder="Ex: Rua Floriano Peixoto, 123 - Centro" className={inputClass} />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border-0 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-xl"><Clock size={20} /></div>
            <div>
              <h4 className="font-bold text-slate-800 text-lg">Horários de Atendimento</h4>
              <p className="text-xs text-slate-500 mt-0.5">Defina os dias e horários em que você está disponível para atender clientes.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={replicateMondayHours}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all duration-200 border border-indigo-100/50 hover:shadow-sm active:scale-95 self-start sm:self-auto shrink-0"
          >
            <Copy size={14} /> Replicar horário para Segunda a Sexta
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {DAYS_OF_WEEK.map(({ key, label }) => {
            const day = weeklyHours[key] || { isOpen: false, start: '08:00', end: '18:00' };
            return (
              <div key={key} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                {/* Day label and Toggle */}
                <div className="flex items-center justify-between sm:justify-start gap-4 flex-1">
                  <span className="font-bold text-slate-800 text-sm w-28 text-left">{label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={day.isOpen}
                      onChange={(e) => {
                        setWeeklyHours(prev => ({
                          ...prev,
                          [key]: { ...prev[key], isOpen: e.target.checked }
                        }));
                      }}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <span className={`text-xs font-bold ${day.isOpen ? 'text-primary' : 'text-slate-400'}`}>
                    {day.isOpen ? 'Aberto' : 'Fechado'}
                  </span>
                </div>

                {/* Time inputs */}
                {day.isOpen && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 shrink-0">
                    <input
                      type="time"
                      value={day.start}
                      onChange={(e) => {
                        setWeeklyHours(prev => ({
                          ...prev,
                          [key]: { ...prev[key], start: e.target.value }
                        }));
                      }}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                    />
                    <span className="text-xs text-slate-400 font-bold">às</span>
                    <input
                      type="time"
                      value={day.end}
                      onChange={(e) => {
                        setWeeklyHours(prev => ({
                          ...prev,
                          [key]: { ...prev[key], end: e.target.value }
                        }));
                      }}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none font-semibold"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border-0 shadow-sm space-y-6">
        <h4 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-3">Contato e Redes Sociais</h4>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className={labelClass}>WhatsApp / Telefone Comercial do Anúncio</label>
            {ad.telefoneComercialVerificado ? (
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-0.5 font-sans">
                <CheckCircle size={10} /> Verificado
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-0.5 font-sans">
                <AlertCircle size={10} /> Não Verificado
              </span>
            )}
          </div>
          <input
            value={form.telefoneComercial}
            onChange={(e) => {
              const formatted = formatPhone(e.target.value);
              setForm(prev => ({ 
                ...prev, 
                telefoneComercial: formatted,
                servicePhone: formatted
              }));
            }}
            placeholder="Ex: (88) 99999-9999"
            disabled={lockInfo.active}
            className={`${inputClass} ${lockInfo.active ? 'opacity-65 cursor-not-allowed bg-slate-100' : ''}`}
          />
          {lockInfo.active && (
            <span className="text-xs text-amber-600 font-semibold block mt-1">
              Disponível para edição em {lockInfo.days} dia(s)
            </span>
          )}
          <p className="text-xs text-slate-500 mt-1">
            Insira o número de contato do anúncio. O número do seu cadastro continuará privado.
          </p>
        </div>
          <div className="flex items-center justify-between mb-3 border-t border-slate-100 pt-4">
            <label className={labelClass + ' mb-0'}>Redes Sociais <span className="text-slate-400">(máx. 3)</span></label>
            {socialLinks.length < 3 && (
              <button type="button" onClick={addSocialLink}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                + Adicionar rede
              </button>
            )}
          </div>
          <div className="space-y-3">
            {socialLinks.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={s.platform}
                  onChange={(e) => updateSocialLink(i, 'platform', e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm text-slate-700 focus:ring-2 focus:ring-primary w-36 shrink-0"
                >
                  <option value="instagram">Instagram</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="facebook">Facebook</option>
                </select>
                <input
                  value={s.url}
                  onChange={(e) => updateSocialLink(i, 'url', e.target.value)}
                  placeholder="Cole o link ou @usuario"
                  className={inputClass + ' flex-1'}
                />
                <button type="button" onClick={() => removeSocialLink(i)}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            {socialLinks.length === 0 && (
              <p className="text-sm text-slate-400">Nenhuma rede adicionada ainda.</p>
            )}
          </div>
      </section>

      <PortfolioSection ad={ad} token={token} />

      <ServiceCatalogSection ad={ad} token={token} />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {isSecondAd && (
        <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-xl flex items-start gap-3 mb-4 text-left">
          <input 
            type="checkbox" 
            id="edit-declaration" 
            checked={declarationChecked}
            onChange={(e) => setDeclarationChecked(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-amber-300 text-amber-650 focus:ring-amber-500 shrink-0 cursor-pointer" 
          />
          <label htmlFor="edit-declaration" className="text-xs md:text-sm text-slate-700 leading-relaxed cursor-pointer select-none">
            Declaro que sou o titular e prestador deste serviço/anúncio bem como a veracidade dos dados fornecidos. Compreendo que, conforme os Termos de Uso, a plataforma proITA poderá suspender a assinatura caso identifique a comercialização ou divisão desta conta com terceiros.
          </label>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving || saved || (isSecondAd && !declarationChecked)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-medium transition-all disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : null}
          {saved ? 'Salvo!' : isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2.5">Cancelar</button>
      </div>
    </div>
  );
}


// ── Componente principal ────────────────────────────────────────
export default function Dashboard() {
  const { user, token, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef(null);

  // Crop de Foto de Perfil Pessoal
  const [cropTarget, setCropTarget] = useState(null); // { type: string, imageSrc: string }

  const [myAds, setMyAds] = useState([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [editingAd, setEditingAd] = useState(null);

  const [favoriteAds, setFavoriteAds] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [novaSenhaCriar, setNovaSenhaCriar] = useState('');
  const [confirmarSenhaCriar, setConfirmarSenhaCriar] = useState('');
  const [loadingSenha, setLoadingSenha] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');

  const [novoEmail, setNovoEmail] = useState('');
  const [loadingLinkEmail, setLoadingLinkEmail] = useState(false);

  const [novoEmailSecundario, setNovoEmailSecundario] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const [novoTelefone, setNovoTelefone] = useState('');
  const [loadingLinkPhone, setLoadingLinkPhone] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);

  const [showVerifyEmailModal, setShowVerifyEmailModal] = useState(false);
  const [codigoVerificacaoEmail, setCodigoVerificacaoEmail] = useState('');
  const [loadingVerificacaoEmail, setLoadingVerificacaoEmail] = useState(false);
  const [loadingRequestVerificacao, setLoadingRequestVerificacao] = useState(false);

  // Estados controlados para o formulário de "Meus Dados"
  const [profileNome, setProfileNome] = useState('');
  const [profileSobrenome, setProfileSobrenome] = useState('');
  const [profileTelefone, setProfileTelefone] = useState('');
  const [profileBairro, setProfileBairro] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Sincroniza os estados locais quando o usuário carregar ou for atualizado
  useEffect(() => {
    if (user) {
      setProfileNome(user.nome || '');
      setProfileSobrenome(user.sobrenome || '');
      setProfileTelefone(user.telefone ? formatPhone(user.telefone.replace(/^\+55/, '')) : '');
      setProfileBairro(user.bairro || '');
    }
  }, [user]);

  const handleGoogleCredentialForLink = async (response) => {
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const res = await fetch(`${API_URL}/api/admin/link-google`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: payload.email, googleId: payload.sub })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSecuritySuccess(data.message);
        setSecurityError('');
        updateUser({ email: payload.email, googleId: payload.sub });
      } else {
        setSecurityError(data.message || 'Erro ao vincular conta Google.');
        setSecuritySuccess('');
      }
    } catch (err) {
      setSecurityError('Erro de conexão ao vincular Google.');
      setSecuritySuccess('');
    }
  };

  useEffect(() => {
    if (!token) return;
    setAdsLoading(true);
    fetch(`${API_URL}/api/ads/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setMyAds(d.data); })
      .catch(console.error)
      .finally(() => setAdsLoading(false));
  }, [token, activeTab]);

  useEffect(() => {
    if (!token || activeTab !== 'favorites') return;
    setFavoritesLoading(true);
    fetch(`${API_URL}/api/ads/favorites`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setFavoriteAds(d.data); })
      .catch(console.error)
      .finally(() => setFavoritesLoading(false));
  }, [token, activeTab]);

  useEffect(() => {
    if (activeTab !== 'security' || user?.googleId) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initGoogle = () => {
      if (typeof google === 'undefined' || !google.accounts) return false;
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialForLink,
        auto_select: false,
      });
      const btn = document.getElementById('google-link-btn');
      if (btn) {
        btn.innerHTML = '';
        google.accounts.id.renderButton(btn, { theme: 'outline', size: 'large' });
      }
      return true;
    };

    if (!initGoogle()) {
      const retryId = setInterval(() => {
        if (initGoogle()) clearInterval(retryId);
      }, 300);
      setTimeout(() => clearInterval(retryId), 5000);
      return () => clearInterval(retryId);
    }
  }, [activeTab, user?.googleId, token]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCropTarget({
      type: 'profile',
      imageSrc: URL.createObjectURL(file)
    });
    e.target.value = '';
  };

  const handleCroppedProfileImage = async (blob) => {
    setPhotoError('');
    setIsUploadingPhoto(true);
    try {
      const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
      const fd = new FormData();
      fd.append('profileImage', file);

      const res = await fetch(`${API_URL}/api/upload/profile-image`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        updateUser({ profileImageUrl: data.profileImageUrl });
      } else {
        setPhotoError(data.message || 'Erro ao enviar a foto.');
      }
    } catch (err) {
      console.error('[UPLOAD] Erro no envio:', err);
      setPhotoError('Erro ao processar a imagem. Tente outra foto.');
    } finally {
      setIsUploadingPhoto(false);
      setCropTarget(null);
    }
  };

  const handleDeleteAd = async (adId) => {
    if (!confirm('Excluir este anúncio?')) return;
    try {
      const res = await fetch(`${API_URL}/api/ads/${adId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) setMyAds(prev => prev.filter(a => a.id !== adId));
    } catch (e) { console.error(e); }
  };

  const handleAdSaved = (updatedProfile) => {
    setMyAds(prev => prev.map(a => a.id === updatedProfile.id ? updatedProfile : a));
    setEditingAd(null);
  };

  const handleMudarSenha = async (e) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (!senhaAtual || !novaSenha) {
      setSecurityError('Por favor, preencha a senha atual e a nova senha.');
      return;
    }
    setLoadingSenha(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ senhaAtual, novaSenha })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSecuritySuccess('Senha alterada com sucesso!');
        setSenhaAtual('');
        setNovaSenha('');
      } else {
        setSecurityError(data.message || 'Erro ao alterar a senha.');
      }
    } finally {
      setLoadingSenha(false);
    }
  };

  const handleCriarSenha = async (e) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (!novaSenhaCriar || !confirmarSenhaCriar) {
      setSecurityError('Por favor, preencha todos os campos de senha.');
      return;
    }

    if (novaSenhaCriar !== confirmarSenhaCriar) {
      setSecurityError('As senhas não coincidem.');
      return;
    }

    const regexNumeros = /^\d{6}$/;
    if (!regexNumeros.test(novaSenhaCriar)) {
      setSecurityError('A senha deve conter exatamente 6 números.');
      return;
    }

    setLoadingSenha(true);
    try {
      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: user.nome,
          sobrenome: user.sobrenome,
          telefone: user.telefone,
          bairro: user.bairro,
          senha: novaSenhaCriar
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSecuritySuccess('Senha de acesso criada com sucesso!');
        updateUser(data.user);
        setNovaSenhaCriar('');
        setConfirmarSenhaCriar('');
      } else {
        setSecurityError(data.message || 'Erro ao criar senha.');
      }
    } catch (err) {
      console.error(err);
      setSecurityError('Erro de conexão ao criar a senha.');
    } finally {
      setLoadingSenha(false);
    }
  };



  const handleLinkEmail = async (e) => {
    e.preventDefault();
    if (!novoEmail) return;
    setSecurityError('');
    setSecuritySuccess('');
    setLoadingLinkEmail(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/link-email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: novoEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSecuritySuccess(data.message);
        updateUser({ email: novoEmail });
        setNovoEmail('');
      } else {
        setSecurityError(data.message || 'Erro ao vincular e-mail.');
      }
    } catch (err) {
      setSecurityError('Erro de conexão ao vincular e-mail.');
    } finally {
      setLoadingLinkEmail(false);
    }
  };

  const handleLinkPhone = async (e) => {
    e.preventDefault();
    if (!novoTelefone) return;
    setSecurityError('');
    setSecuritySuccess('');
    setLoadingLinkPhone(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/link-phone`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ telefone: convertToInternationalPhone(novoTelefone) })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSecuritySuccess(data.message);
        updateUser({ telefone: convertToInternationalPhone(novoTelefone) });
        setNovoTelefone('');
      } else {
        setSecurityError(data.message || 'Erro ao vincular telefone.');
      }
    } catch (err) {
      setSecurityError('Erro de conexão ao vincular telefone.');
    } finally {
      setLoadingLinkPhone(false);
    }
  };

  const handleSaveEmailSecundario = async () => {
    if (!novoEmailSecundario) return;
    setSecurityError('');
    setSecuritySuccess('');
    try {
      const res = await fetch(`${API_URL}/api/user/email-secundario`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id, emailSecundario: novoEmailSecundario })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSecuritySuccess(data.message);
        updateUser({ emailSecundario: novoEmailSecundario });
        setIsEditingEmail(false);
        setNovoEmailSecundario('');
      } else {
        setSecurityError(data.message || 'Erro ao salvar o e-mail alternativo.');
      }
    } catch (err) {
      console.error(err);
      setSecurityError('Erro de conexão ao salvar o e-mail alternativo.');
    }
  };

  const handleDeleteEmailSecundario = async () => {
    if (!confirm('Deseja realmente excluir seu e-mail de recuperação?')) return;
    setSecurityError('');
    setSecuritySuccess('');
    try {
      const res = await fetch(`${API_URL}/api/user/email-secundario`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id, emailSecundario: null })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSecuritySuccess(data.message);
        updateUser({ emailSecundario: null, emailSecundarioVerificado: false });
      } else {
        setSecurityError(data.message || 'Erro ao excluir o e-mail de recuperação.');
      }
    } catch (err) {
      console.error(err);
      setSecurityError('Erro de conexão ao excluir o e-mail de recuperação.');
    }
  };

  const handleVerifyEmailSecundario = async () => {
    setSecurityError('');
    setSecuritySuccess('');
    setLoadingRequestVerificacao(true);
    try {
      const res = await fetch(`${API_URL}/api/user/email-secundario/verify-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSecuritySuccess(data.message);
        setShowVerifyEmailModal(true);
        setCodigoVerificacaoEmail('');
      } else {
        setSecurityError(data.message || 'Erro ao solicitar código de verificação.');
      }
    } catch (err) {
      console.error(err);
      setSecurityError('Erro de conexão ao solicitar código de verificação.');
    } finally {
      setLoadingRequestVerificacao(false);
    }
  };

  const handleConfirmVerifyEmailSecundario = async (e) => {
    e.preventDefault();
    if (!codigoVerificacaoEmail || codigoVerificacaoEmail.length !== 6) {
      setSecurityError('O código de verificação deve conter 6 dígitos.');
      return;
    }
    setSecurityError('');
    setSecuritySuccess('');
    setLoadingVerificacaoEmail(true);
    try {
      const res = await fetch(`${API_URL}/api/user/email-secundario/verify-confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id, code: codigoVerificacaoEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSecuritySuccess(data.message);
        updateUser({ emailSecundarioVerificado: true });
        setShowVerifyEmailModal(false);
        setCodigoVerificacaoEmail('');
      } else {
        setSecurityError(data.message || 'Código inválido ou expirado.');
      }
    } catch (err) {
      console.error(err);
      setSecurityError('Erro de conexão ao confirmar código de verificação.');
    } finally {
      setLoadingVerificacaoEmail(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleUnlinkGoogle = async () => {
    setShowUnlinkModal(false);
    setSecurityError('');
    setSecuritySuccess('');
    try {
      const res = await fetch(`${API_URL}/api/admin/unlink-google`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSecuritySuccess(data.message);
        updateUser({ googleId: null });
      } else {
        setSecurityError(data.message || 'Erro ao desvincular Google.');
      }
    } catch (err) {
      setSecurityError('Erro de conexão ao desvincular Google.');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: profileNome,
          sobrenome: profileSobrenome,
          telefone: convertToInternationalPhone(profileTelefone),
          bairro: profileBairro
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setProfileSuccess('Dados atualizados com sucesso!');
        updateUser(data.user);
        setProfileError('');

        setTimeout(() => {
          setProfileSuccess('');
        }, 4000);
      } else {
        setProfileError(data.message || 'Erro ao atualizar dados do perfil.');
      }
    } catch (err) {
      console.error(err);
      setProfileError('Erro de conexão ao atualizar perfil.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const tabs = [
    { key: 'profile', label: 'Meus Dados', Icon: User },
    { key: 'favorites', label: 'Favoritos', Icon: Heart },
    { key: 'professional', label: 'Meus Anúncios', Icon: LayoutDashboard },
    { key: 'subscription', label: 'Assinatura e Anuidade', Icon: CreditCard },
    { key: 'security', label: 'Segurança', Icon: Settings },
  ];

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-64px)] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">

          <aside className="md:w-64 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-24">
              <div className="p-6 text-center border-b border-slate-100 bg-slate-50/50">
                <div className="relative inline-block mx-auto mb-3">
                  <AvatarDisplay user={user} sizeClass="w-20 h-20" textClass="text-2xl" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-hover transition-colors disabled:opacity-60"
                  >
                    {isUploadingPhoto ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                  </button>
                </div>
                <h2 className="font-bold text-slate-900">{user?.nome} {user?.sobrenome}</h2>
                <p className="text-sm text-slate-500">{myAds.length > 0 ? 'Profissional' : 'Cliente'}</p>
              </div>
              <nav className="p-2">
                {tabs.map(({ key, label, Icon }) => (
                  <button key={key} onClick={() => { setActiveTab(key); setEditingAd(null); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${activeTab === key ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <Icon size={18} /> {label}
                  </button>
                ))}
              </nav>
              <div className="p-2 border-t border-slate-100 mt-2">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                  <LogOut size={18} /> Sair
                </button>
              </div>
            </div>
          </aside>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

          <main className="flex-1">
            <div className={(activeTab === 'professional' && editingAd) ? "space-y-6 animate-in fade-in duration-300" : "bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-10"}>

              {activeTab === 'profile' && (
                <div className="animate-in fade-in duration-300">
                  <h2 className="text-2xl font-bold text-slate-900 mb-8">Meus Dados</h2>
                  <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
                    {profileSuccess && (
                      <div className="p-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-600" />
                        <span>{profileSuccess}</span>
                      </div>
                    )}
                    {profileError && (
                      <div className="p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                        <AlertCircle size={16} className="text-red-600" />
                        <span>{profileError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                        <input
                          type="text"
                          value={profileNome}
                          onChange={(e) => setProfileNome(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sobrenome</label>
                        <input
                          type="text"
                          value={profileSobrenome}
                          onChange={(e) => setProfileSobrenome(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
                      <input
                        type="text"
                        value={profileTelefone}
                        onChange={(e) => setProfileTelefone(formatPhone(e.target.value))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary"
                        placeholder="(88) 99999-9999"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Bairro Padrão</label>
                      <input
                        type="text"
                        value={profileBairro}
                        onChange={(e) => setProfileBairro(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary"
                        placeholder="Ex: Centro"
                      />
                    </div>
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loadingProfile}
                        className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                      >
                        {loadingProfile && <Loader2 size={16} className="animate-spin" />}
                        {loadingProfile ? 'Salvando...' : 'Salvar Alterações'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'favorites' && (
                <div className="animate-in fade-in duration-300">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Profissionais Favoritos</h2>
                  {favoritesLoading ? (
                    <div className="flex justify-center py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : favoriteAds.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 bg-white border border-slate-100 rounded-3xl p-10 shadow-sm max-w-xl">
                      <Heart size={40} className="mx-auto mb-3 opacity-30 text-slate-300 animate-pulse" />
                      <p className="font-semibold text-slate-800 mb-1">Você ainda não salvou nenhum profissional.</p>
                      <p className="text-slate-500 text-xs mb-6">Navegue pelas buscas e clique na bandeirinha para favoritar perfis!</p>
                      <Link to="/search" className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-hover transition-colors text-sm">
                        Explorar Profissionais
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {favoriteAds.map(ad => {
                        const fotoAnuncio = (ad.fotoAnuncioUrl && ad.fotoAnuncioUrl.trim() !== '')
                          ? ad.fotoAnuncioUrl
                          : (ad.user?.profileImageUrl || ad.avatarUrl || null);

                        const telefoneExibicao = (ad.telefoneComercial && ad.telefoneComercial.trim() !== '')
                          ? ad.telefoneComercial
                          : (ad.user?.telefone || ad.servicePhone || ad.whatsapp || '');

                        const cardPro = {
                          id: ad.id,
                          name: getProfileDisplayName(ad, ad.user),
                          category: ad.atividadePrincipal,
                          shortDescription: ad.descricaoCurta || ad.shortDescription || ad.descricaoTrabalho?.substring(0, 90),
                          servicePhone: telefoneExibicao,
                          serviceBairro: ad.serviceBairro,
                          location: ad.serviceBairro || ad.user?.bairro || 'Itapipoca',
                          avatar: fotoAnuncio,
                          socialLinks: mapStoredSocialLinksToForm(ad.socialLinks ?? ad.redesSociais),
                          rating: ad.rating || 0,
                          reviewCount: ad.reviewCount || 0,
                          isFavorited: true
                        };
                        return (
                          <AdCard
                            key={ad.id}
                            professional={cardPro}
                            showEdit={false}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'professional' && (
                <div className="animate-in fade-in duration-300">
                  {editingAd ? (
                    <AdEditForm ad={editingAd} token={token} user={user} isSecondAd={myAds.length >= 2} onSaved={handleAdSaved} onCancel={() => setEditingAd(null)} />
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Meus Anúncios</h2>
                      </div>
                      {user?.planStatus === 'EXPIRADO' && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200/80 text-red-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in slide-in-from-top-4 duration-300">
                          <div className="text-sm font-semibold flex items-start gap-2.5">
                            <span className="shrink-0 text-base leading-none">⚠️</span>
                            <span>Seu plano expirou. Seus anúncios estão ocultos nas buscas. Renove sua assinatura para voltar a aparecer para os clientes.</span>
                          </div>
                          <button
                            onClick={() => setActiveTab('subscription')}
                            className="sm:shrink-0 text-center text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all active:scale-95 shadow-sm shadow-red-600/10 cursor-pointer"
                          >
                            Renovar Assinatura
                          </button>
                        </div>
                      )}
                      {adsLoading ? (
                        <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-primary" /></div>
                      ) : myAds.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                          <LayoutDashboard size={40} className="mx-auto mb-3 opacity-30" />
                          <p className="font-medium mb-4">Você ainda não tem nenhum anúncio.</p>
                          <Link to="/dashboard/novo-anuncio" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-hover transition-colors">
                            <Plus size={16} /> Criar meu primeiro anúncio
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-6 animate-in fade-in duration-300">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {myAds.map(ad => {
                              const fotoAnuncio = (ad.fotoAnuncioUrl && ad.fotoAnuncioUrl.trim() !== '')
                                ? ad.fotoAnuncioUrl
                                : (user?.profileImageUrl || ad.avatarUrl || null);

                              const telefoneExibicao = (ad.telefoneComercial && ad.telefoneComercial.trim() !== '')
                                ? ad.telefoneComercial
                                : (user?.telefone || ad.servicePhone || ad.whatsapp || '');

                              const cardPro = {
                                id: ad.id,
                                name: getProfileDisplayName(ad, user),
                                category: ad.atividadePrincipal,
                                shortDescription: ad.descricaoCurta || ad.shortDescription || ad.descricaoTrabalho?.substring(0, 90),
                                servicePhone: telefoneExibicao,
                                serviceBairro: ad.serviceBairro,
                                location: ad.serviceBairro || user?.bairro || 'Itapipoca',
                                avatar: fotoAnuncio,
                                socialLinks: mapStoredSocialLinksToForm(ad.socialLinks ?? ad.redesSociais),
                                impressions: ad.impressions ?? 0,
                                profileViews: ad.profileViews ?? ad.visitasPerfil ?? 0,
                                whatsappClicks: ad.whatsappClicks ?? ad.cliquesWhatsapp ?? 0,
                                phoneClicks: ad.phoneClicks ?? 0,
                                shares: ad.shares ?? 0,
                                favoritesCount: ad.favoritedBy?.length ?? 0,
                              };
                              return (
                                <AdCard
                                  key={ad.id}
                                  professional={cardPro}
                                  showEdit={true}
                                  onEdit={() => setEditingAd(ad)}
                                  onDelete={() => handleDeleteAd(ad.id)}
                                />
                              );
                            })}
                          </div>
                          {myAds.length === 1 && (
                            <div className="flex justify-center pt-4">
                              <Link to="/dashboard/novo-anuncio" className="inline-flex items-center gap-2 text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm shadow-sm hover:scale-[1.02] active:scale-95 duration-200">
                                <Plus size={16} /> Adicionar outro anúncio (Máx 2)
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'subscription' && (
                <div className="animate-in fade-in duration-300">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Assinatura e Anuidade</h2>

                  {myAds.length === 0 ? (
                    <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center shadow-sm max-w-xl">
                      <CreditCard size={48} className="text-slate-300 mx-auto mb-4 animate-pulse" />
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum perfil profissional cadastrado</h3>
                      <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                        Você atualmente possui uma conta de Cliente. Para ter acesso à gestão de assinatura e selos de reputação, anuncie seus serviços profissionais no proITA!
                      </p>
                      <Link
                        to="/dashboard/novo-anuncio"
                        className="inline-flex items-center justify-center bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-full font-bold shadow-md shadow-primary/10 transition-transform active:scale-95 text-sm"
                      >
                        Criar Meu Anúncio de Profissional
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6 max-w-3xl">
                      {(() => {
                        const status = user?.planStatus || 'DEGUSTACAO';
                        let statusBadgeColor = '';
                        let statusText = '';
                        if (status === 'ATIVO') {
                          statusBadgeColor = 'bg-emerald-50 border-emerald-200 text-emerald-700';
                          statusText = 'Ativo';
                        } else if (status === 'DEGUSTACAO') {
                          statusBadgeColor = 'bg-amber-50 border-amber-200 text-amber-700';
                          statusText = 'Degustação (30 dias grátis)';
                        } else {
                          statusBadgeColor = 'bg-red-50 border-red-200 text-red-700';
                          statusText = 'Expirado';
                        }

                        const handleSimulatePayment = async () => {
                          try {
                            const res = await fetch(`${API_URL}/api/ads/simulate-payment`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              }
                            });
                            const data = await res.json();
                            if (res.ok && data.success) {
                              updateUser(data.user);
                              alert(data.message || 'Pagamento simulado com sucesso!');
                            } else {
                              alert(data.message || 'Erro ao simular pagamento.');
                            }
                          } catch (err) {
                            console.error(err);
                            alert('Erro de conexão ao simular pagamento.');
                          }
                        };

                        const handleReceipt = () => {
                          alert('Recibo estará disponível após o primeiro ciclo.');
                        };

                        const handlePay = () => {
                          alert('A integração real com gateway de pagamento estará disponível em breve!');
                        };

                        const formatDateBR = (dateStr) => {
                          if (!dateStr) return 'Não cadastrada';
                          const d = new Date(dateStr);
                          if (isNaN(d.getTime())) return 'Inválida';
                          return d.toLocaleDateString('pt-BR');
                        };

                        return (
                          <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                              <div>
                                <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">
                                  Plano Profissional proITA - {
                                    status === 'ATIVO' ? 'Patrocinador' :
                                    status === 'BASICO' ? 'Básico' :
                                    status === 'DEGUSTACAO' ? 'Degustação' : 'Expirado'
                                  }
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Assinatura vinculada à conta: {user?.email || user?.telefone}</p>
                              </div>
                              <span className={`px-4 py-1.5 rounded-full border text-xs font-bold ${statusBadgeColor} tracking-wider uppercase inline-block`}>
                                {statusText}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Início da Assinatura / Criação da Conta</span>
                                <span className="font-semibold text-slate-800 text-sm md:text-base">
                                  {formatDateBR(user?.createdAt)}
                                </span>
                              </div>
                              
                              <div className="space-y-1">
                                {status === 'DEGUSTACAO' ? (
                                  <>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fim do Teste Grátis</span>
                                    <span className="font-semibold text-slate-800 text-sm md:text-base text-amber-600">
                                      {formatDateBR(user?.trialEndsAt)}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Próxima Renovação</span>
                                    <span className="font-semibold text-slate-800 text-sm md:text-base">
                                      {formatDateBR(user?.subscriptionEndsAt)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 space-y-2">
                              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Benefícios da Assinatura</h4>
                              <ul className="text-xs text-slate-600 space-y-1.5">
                                <li className="flex items-center gap-2">
                                  <span className="text-emerald-500 font-bold">✓</span> Limite de até 2 anúncios profissionais por conta (Atualmente cadastrados: {myAds.length}/2).
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className="text-emerald-500 font-bold">✓</span> {status === 'ATIVO' || status === 'BASICO' ? (
                                    <span className="text-emerald-600 font-bold">Selos de Reputação ATIVOS e exibidos nos seus anúncios!</span>
                                  ) : (
                                    <span>Ative sua conta para exibir seus Selos de Reputação (Bronze, Prata e Ouro).</span>
                                  )}
                                </li>
                              </ul>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                              <button
                                onClick={handlePay}
                                className="flex-1 flex justify-center items-center bg-primary hover:bg-primary-hover text-white py-3 px-6 rounded-2xl font-bold text-sm transition-all shadow-md shadow-primary/10 active:scale-95 cursor-pointer"
                              >
                                Pagar / Antecipar Anuidade
                              </button>
                              <button
                                onClick={handleReceipt}
                                className="flex-1 flex justify-center items-center bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-6 rounded-2xl font-bold text-sm transition-all active:scale-95 cursor-pointer"
                              >
                                Gerar Recibo
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'security' && (
                <div className="animate-in fade-in duration-300">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Segurança e Senha</h2>

                  {securityError && (
                    <div className="mb-6 max-w-md bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
                      <AlertCircle className="shrink-0 mt-0.5" size={20} />
                      <p className="text-sm font-medium">{securityError}</p>
                    </div>
                  )}

                  {securitySuccess && (
                    <div className="mb-6 max-w-md bg-emerald-50 text-emerald-600 p-4 rounded-xl flex items-start gap-3 border border-emerald-100 animate-in fade-in slide-in-from-top-2">
                      <CheckCircle className="shrink-0 mt-0.5" size={20} />
                      <p className="text-sm font-medium">{securitySuccess}</p>
                    </div>
                  )}

                  {!user?.hasPassword ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-md animate-in fade-in duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                          <KeyRound size={22} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">Criar Senha de Acesso</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Sua conta do Google não possui uma senha de acesso cadastrada. Crie uma senha numérica de 6 dígitos.</p>
                        </div>
                      </div>
                      
                      <form onSubmit={handleCriarSenha} className="space-y-4 mt-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                          <input
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength="6"
                            placeholder="Defina um PIN de 6 números"
                            value={novaSenhaCriar}
                            onChange={(e) => setNovaSenhaCriar(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Senha</label>
                          <input
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength="6"
                            placeholder="Confirme seu PIN de 6 números"
                            value={confirmarSenhaCriar}
                            onChange={(e) => setConfirmarSenhaCriar(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={loadingSenha}
                            className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                          >
                            {loadingSenha ? (
                              <>
                                <Loader2 className="animate-spin" size={18} />
                                Criando...
                              </>
                            ) : (
                              'Criar Senha'
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <form onSubmit={handleMudarSenha} className="space-y-6 max-w-md">

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Senha Atual</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength="6"
                          placeholder="Digite sua senha atual de 6 números"
                          value={senhaAtual}
                          onChange={(e) => setSenhaAtual(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength="6"
                          placeholder="Digite o novo PIN de 6 números"
                          value={novaSenha}
                          onChange={(e) => setNovaSenha(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={loadingSenha}
                          className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-70"
                        >
                          {loadingSenha ? 'Alterando...' : 'Alterar Senha'}
                        </button>
                      </div>

                    </form>
                  )}

                  <div className="mt-12 pt-8 border-t border-slate-200">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Segurança da Conta</h3>

                    <div className="space-y-5 max-w-md">

                      {/* ── 1. Google ── */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield size={16} className="text-slate-500" />
                            <span className="text-sm font-semibold text-slate-800">Conta Google</span>
                          </div>
                          {user?.googleId ? (
                            <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                              <CheckCircle size={14} /> Verificado
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">Não vinculado</span>
                          )}
                        </div>
                        {user?.googleId ? (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-600">{user?.email}</p>
                            <button type="button" onClick={() => setShowUnlinkModal(true)} className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors bg-transparent border-none p-0 cursor-pointer">Desvincular Google</button>
                          </div>
                        ) : (
                          <div>
                            <div id="google-link-btn" className="w-full flex justify-center"></div>
                            <p className="text-xs text-slate-500 mt-2 text-center">Ative o login rápido pelo Google.</p>
                          </div>
                        )}
                      </div>

                      {/* ── 2. Telefone / WhatsApp ── */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield size={16} className="text-slate-500" />
                            <span className="text-sm font-semibold text-slate-800">Telefone / WhatsApp</span>
                          </div>
                          {user?.telefone ? (
                            <span className="text-slate-500 text-xs font-medium">Vinculado</span>
                          ) : (
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">Não vinculado</span>
                          )}
                        </div>
                        {user?.telefone ? (
                          <div className="space-y-1.5">
                            <p className="text-xs text-slate-500">{user.telefone}</p>
                            <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1">
                              <AlertCircle size={14} /> Não verificado
                            </span>
                          </div>
                        ) : (
                          <form onSubmit={handleLinkPhone} className="flex gap-3">
                            <input
                              type="tel"
                              placeholder="(88) 99999-9999"
                              value={novoTelefone}
                              onChange={(e) => setNovoTelefone(formatPhone(e.target.value))}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                              required
                            />
                            <button type="submit" disabled={loadingLinkPhone} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 disabled:opacity-70 cursor-pointer">
                              {loadingLinkPhone ? 'Vinculando...' : 'Vincular'}
                            </button>
                          </form>
                        )}
                      </div>

                      {/* ── 3. E-mail de Recuperação ── */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield size={16} className="text-slate-500" />
                            <span className="text-sm font-semibold text-slate-800">E-mail de Recuperação</span>
                          </div>
                          {!isEditingEmail && (
                            user?.emailSecundario ? (
                              user?.emailSecundarioVerificado ? (
                                <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                                  <CheckCircle size={14} /> Verificado
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">Pendente</span>
                              )
                            ) : (
                              <span className="text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">Não vinculado</span>
                            )
                          )}
                        </div>
                        {isEditingEmail ? (
                          <div className="flex gap-3">
                            <input
                              type="email"
                              placeholder="seu@email.com"
                              value={novoEmailSecundario}
                              onChange={(e) => setNovoEmailSecundario(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                            />
                            <div className="flex items-center gap-2 shrink-0">
                              <button type="button" onClick={handleSaveEmailSecundario} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                                Salvar
                              </button>
                              <button type="button" onClick={() => setIsEditingEmail(false)} className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors bg-transparent border-none p-0 cursor-pointer">
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : user?.emailSecundario ? (
                          <div>
                            <p className="text-sm text-slate-800 font-medium mb-3">{user.emailSecundario}</p>
                            <div className="flex items-center gap-3 text-sm">
                              {!user?.emailSecundarioVerificado && (
                                <>
                                  <button
                                    type="button"
                                    onClick={handleVerifyEmailSecundario}
                                    disabled={loadingRequestVerificacao}
                                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors bg-transparent border-none p-0 cursor-pointer disabled:opacity-50"
                                  >
                                    {loadingRequestVerificacao ? 'Enviando...' : 'Verificar'}
                                  </button>
                                  <span className="text-slate-300">|</span>
                                </>
                              )}
                              <button type="button" onClick={() => setIsEditingEmail(true)} className="text-slate-600 hover:text-slate-800 font-medium transition-colors bg-transparent border-none p-0 cursor-pointer">Alterar</button>
                              <span className="text-slate-300">|</span>
                              <button type="button" onClick={handleDeleteEmailSecundario} className="text-red-600 hover:text-red-800 font-medium transition-colors bg-transparent border-none p-0 cursor-pointer">Excluir</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-500">Nenhum e-mail alternativo.</p>
                            <button type="button" onClick={() => setIsEditingEmail(true)} className="text-slate-600 hover:text-slate-800 text-sm font-medium transition-colors bg-transparent border-none p-0 cursor-pointer">Adicionar e-mail alternativo</button>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              )}

            </div>
          </main>
        </div>
      </div>

      {showUnlinkModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Desvincular Conta Google?</h3>
            <p className="text-sm text-slate-600 mb-6">
              Tem certeza que deseja desvincular sua conta Google? Você precisará usar seu telefone e senha cadastrados para entrar na conta.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowUnlinkModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUnlinkGoogle}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Sim, Desvincular
              </button>
            </div>
          </div>
        </div>
      )}

      {showVerifyEmailModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Verificar E-mail de Recuperação</h3>
            <p className="text-sm text-slate-600 mb-6">
              Enviamos um código de verificação de 6 dígitos para o e-mail <strong>{user?.emailSecundario}</strong>. Por favor, insira-o abaixo para concluir a vinculação.
            </p>
            <form onSubmit={handleConfirmVerifyEmailSecundario} className="space-y-6">
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="6"
                  placeholder="000000"
                  value={codigoVerificacaoEmail}
                  onChange={(e) => setCodigoVerificacaoEmail(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-2xl font-bold tracking-widest px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-slate-800"
                  required
                />
                <p className="text-xs text-slate-400 mt-2 text-center">O código pode levar até 2 minutos para chegar. Verifique a caixa de spam.</p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowVerifyEmailModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingVerificacaoEmail || codigoVerificacaoEmail.length !== 6}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loadingVerificacaoEmail ? 'Confirmando...' : 'Confirmar Código'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cropTarget && cropTarget.type === 'profile' && (
        <ImageCropperModal
          imageSrc={cropTarget.imageSrc}
          aspect={1}
          cropShape="round"
          onClose={() => setCropTarget(null)}
          onCropComplete={handleCroppedProfileImage}
        />
      )}
    </div>
  );
}
