import { useState, useContext, useRef, useEffect } from 'react';
import { User, Heart, Settings, LayoutDashboard, LogOut, Camera, Loader2, Plus, ArrowLeft, CheckCircle, Trash2, UploadCloud, Edit2, AlertCircle, Shield } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import AdCard from '../components/AdCard';
import { API_URL } from '../config';
import { getProfileDisplayName, getProfileAvatarNameParam } from '../utils/profileDisplayName';

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

// ── Sub-componente: Formulário de edição de anúncio ─────────────
function AdEditForm({ ad, token, user, onSaved, onCancel }) {
  const [form, setForm] = useState({
    atividadePrincipal: ad.atividadePrincipal || '',
    atividadesSecundarias: (ad.atividadesSecundarias || []).join(', '),
    descricaoTrabalho: ad.descricaoTrabalho || '',
    shortDescription: ad.descricaoCurta || ad.shortDescription || '',
    servicePhone: ad.servicePhone || user?.telefone || '',
    serviceBairro: ad.serviceBairro || '',
    endereco: ad.endereco || '',
  });
  const [socialLinks, setSocialLinks] = useState(() =>
    mapStoredSocialLinksToForm(ad.socialLinks ?? ad.redesSociais)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const addSocialLink = () => {
    if (socialLinks.length >= 3) return;
    setSocialLinks(prev => [...prev, { platform: 'instagram', url: '' }]);
  };
  const removeSocialLink = (i) => setSocialLinks(prev => prev.filter((_, idx) => idx !== i));
  const updateSocialLink = (i, field, val) =>
    setSocialLinks(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/ads/${ad.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          atividadesSecundarias: form.atividadesSecundarias.split(',').map(s => s.trim()).filter(Boolean),
          socialLinks: socialLinks
            .map((s) => ({ platform: String(s.platform || '').toLowerCase().trim(), url: String(s.url || '').trim() }))
            .filter((s) => s.url)
            .slice(0, 3),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaved(true);
        setTimeout(() => { setSaved(false); onSaved(data.profile); }, 1500);
      } else {
        setError(data.message || 'Erro ao salvar.');
      }
    } catch {
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

      <section className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
        <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Informações Básicas</h4>
        <div>
          <label className={labelClass}>Atividade Principal</label>
          <input value={form.atividadePrincipal} onChange={set('atividadePrincipal')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Atividades Secundárias <span className="text-slate-400">(separadas por vírgula)</span></label>
          <input value={form.atividadesSecundarias} onChange={set('atividadesSecundarias')} placeholder="Ex: Pintura, Gesso, Drywall" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Descrição Completa</label>
          <textarea rows={4} value={form.descricaoTrabalho} onChange={set('descricaoTrabalho')} className={inputClass + ' resize-none'} />
        </div>
        <div>
          <label className={labelClass}>Descrição Curta <span className="text-slate-400">(aparece no card de busca, máx. 100 caracteres)</span></label>
          <input value={form.shortDescription} onChange={set('shortDescription')} maxLength={100} placeholder="Ex: Encanador com 10 anos de experiência, atendo a domicílio." className={inputClass} />
          <p className="text-xs text-slate-400 mt-1">{form.shortDescription.length}/100</p>
        </div>
      </section>

      <section className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
        <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Localização</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Bairro de Atendimento</label>
            <input value={form.serviceBairro} onChange={set('serviceBairro')} placeholder="Ex: Centro, Aldeota..." className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Endereço completo (opcional)</label>
            <input value={form.endereco} onChange={set('endereco')} placeholder="Deixe em branco se atende a domicílio" className={inputClass} />
          </div>
        </div>
      </section>

      <section className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
        <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Contato e Redes Sociais</h4>
        <div>
          <label className={labelClass}>WhatsApp do Serviço <span className="text-slate-400">(pode ser diferente do cadastro)</span></label>
          <input value={form.servicePhone} onChange={set('servicePhone')} placeholder="Ex: 88999999999" className={inputClass} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
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
        </div>
      </section>

      <PortfolioSection ad={ad} token={token} />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving || saved}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-medium transition-all disabled:opacity-70"
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

  const [myAds, setMyAds] = useState([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [editingAd, setEditingAd] = useState(null);

  const favorites = [];

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [loadingSenha, setLoadingSenha] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');

  const [novoEmail, setNovoEmail] = useState('');
  const [loadingLinkEmail, setLoadingLinkEmail] = useState(false);

  const [novoTelefone, setNovoTelefone] = useState('');
  const [loadingLinkPhone, setLoadingLinkPhone] = useState(false);

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
  }, [token]);

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

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoError('');
    setIsUploadingPhoto(true);
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: 'image/jpeg',
      };
      const compressed = await imageCompression(file, options);
      const fd = new FormData();
      fd.append('profileImage', compressed, 'profile.jpg');

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
      console.error('[UPLOAD] Erro na compressão ou envio:', err);
      setPhotoError('Erro ao processar a imagem. Tente outra foto.');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
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
    } catch (err) {
      console.error(err);
      setSecurityError('Erro de conexão ao alterar a senha.');
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
        body: JSON.stringify({ telefone: novoTelefone })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSecuritySuccess(data.message);
        updateUser({ telefone: novoTelefone.replace(/\D/g, '') });
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleUnlinkGoogle = async () => {
    if (!confirm('Deseja desvincular sua conta Google? Você precisará usar telefone e senha para entrar.')) return;
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

  const tabs = [
    { key: 'profile', label: 'Meus Dados', Icon: User },
    { key: 'favorites', label: 'Favoritos', Icon: Heart },
    { key: 'professional', label: 'Meus Anúncios', Icon: LayoutDashboard },
    { key: 'security', label: 'Segurança', Icon: Settings },
  ];

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-64px)] py-8">
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
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === key ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <Icon size={18} /> {label}
                  </button>
                ))}
              </nav>
              <div className="p-2 border-t border-slate-100 mt-2">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                  <LogOut size={18} /> Sair
                </button>
              </div>
            </div>
          </aside>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

          <main className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-10">

              {activeTab === 'profile' && (
                <div className="animate-in fade-in duration-300">
                  <h2 className="text-2xl font-bold text-slate-900 mb-8">Meus Dados</h2>
                  <div className="flex items-center gap-6 mb-8 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="relative shrink-0">
                      <AvatarDisplay user={user} sizeClass="w-24 h-24" textClass="text-3xl" />
                      <button onClick={() => fileInputRef.current?.click()} disabled={isUploadingPhoto}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-hover transition-colors disabled:opacity-60">
                        {isUploadingPhoto ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
                      </button>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">{user?.nome} {user?.sobrenome}</h3>
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingPhoto}
                        className="text-sm text-primary font-medium hover:underline mt-1 disabled:opacity-60 block">
                        {isUploadingPhoto ? 'Enviando...' : user?.profileImageUrl ? 'Trocar foto' : 'Adicionar foto de perfil'}
                      </button>
                      {photoError && <p className="text-xs text-red-500 mt-1">{photoError}</p>}
                    </div>
                  </div>
                  <form className="space-y-6 max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                        <input type="text" defaultValue={user?.nome || ''} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary" /></div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Sobrenome</label>
                        <input type="text" defaultValue={user?.sobrenome || ''} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
                      <input type="text" defaultValue={user?.telefone || ''} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Bairro Padrão</label>
                      <input type="text" defaultValue={user?.bairro || ''} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary" /></div>
                    <div className="pt-4">
                      <button type="button" className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg font-medium transition-colors">Salvar Alterações</button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'favorites' && (
                <div className="animate-in fade-in duration-300">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Profissionais Favoritos</h2>
                  <div className="text-center py-16 text-slate-400">
                    <Heart size={40} className="mx-auto mb-3 opacity-30" />
                    <p>Você ainda não salvou nenhum profissional.</p>
                  </div>
                </div>
              )}

              {activeTab === 'professional' && (
                <div className="animate-in fade-in duration-300">
                  {editingAd ? (
                    <AdEditForm ad={editingAd} token={token} user={user} onSaved={handleAdSaved} onCancel={() => setEditingAd(null)} />
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Meus Anúncios</h2>
                        <Link to="/advertise" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors">
                          <Plus size={16} /> Novo Anúncio
                        </Link>
                      </div>
                      {adsLoading ? (
                        <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-primary" /></div>
                      ) : myAds.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                          <LayoutDashboard size={40} className="mx-auto mb-3 opacity-30" />
                          <p className="font-medium mb-4">Você ainda não tem nenhum anúncio.</p>
                          <Link to="/advertise" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-hover transition-colors">
                            <Plus size={16} /> Criar meu primeiro anúncio
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {myAds.map(ad => {
                            const cardPro = {
                              id: ad.id,
                              name: getProfileDisplayName(ad, user),
                              category: ad.atividadePrincipal,
                              shortDescription: ad.descricaoCurta || ad.shortDescription || ad.descricaoTrabalho?.substring(0, 90),
                              servicePhone: ad.servicePhone || ad.whatsapp || user?.telefone,
                              serviceBairro: ad.serviceBairro,
                              location: ad.serviceBairro || user?.bairro || 'Itapipoca',
                              avatar: user?.profileImageUrl || ad.avatarUrl || null,
                              socialLinks: mapStoredSocialLinksToForm(ad.socialLinks ?? ad.redesSociais),
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
                      )}
                    </>
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
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">Vinculado</span>
                            ) : (
                              <span className="text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">Não vinculado</span>
                            )}
                          </div>
                          {user?.googleId ? (
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-slate-500">Login rápido com Google ativado.</p>
                              <button type="button" onClick={handleUnlinkGoogle} className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors cursor-pointer">Desvincular Google</button>
                            </div>
                          ) : (
                            <div>
                              <div id="google-link-btn" className="w-full flex justify-center"></div>
                              <p className="text-xs text-slate-500 mt-2 text-center">Ative o login rápido pelo Google.</p>
                            </div>
                          )}
                        </div>

                        {/* ── 2. E-mail Principal ── */}
                        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Shield size={16} className="text-slate-500" />
                              <span className="text-sm font-semibold text-slate-800">E-mail de Recuperação</span>
                            </div>
                            {user?.email ? (
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">Vinculado</span>
                            ) : (
                              <span className="text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">Não vinculado</span>
                            )}
                          </div>
                          {user?.email ? (
                            <p className="text-xs text-slate-500">{user.email}</p>
                          ) : (
                            <form onSubmit={handleLinkEmail} className="flex gap-3">
                              <input
                                type="email"
                                placeholder="seu@email.com"
                                value={novoEmail}
                                onChange={(e) => setNovoEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                                required
                              />
                              <button type="submit" disabled={loadingLinkEmail} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 disabled:opacity-70 cursor-pointer">
                                {loadingLinkEmail ? 'Vinculando...' : 'Vincular'}
                              </button>
                            </form>
                          )}
                        </div>

                        {/* ── 3. Telefone / WhatsApp ── */}
                        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Shield size={16} className="text-slate-500" />
                              <span className="text-sm font-semibold text-slate-800">Telefone / WhatsApp</span>
                            </div>
                            {user?.telefone ? (
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">Vinculado</span>
                            ) : (
                              <span className="text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">Não vinculado</span>
                            )}
                          </div>
                          {user?.telefone ? (
                            <p className="text-xs text-slate-500">{user.telefone}</p>
                          ) : (
                            <form onSubmit={handleLinkPhone} className="flex gap-3">
                              <input
                                type="tel"
                                placeholder="(88) 99999-9999"
                                value={novoTelefone}
                                onChange={(e) => setNovoTelefone(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                                required
                              />
                              <button type="submit" disabled={loadingLinkPhone} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 disabled:opacity-70 cursor-pointer">
                                {loadingLinkPhone ? 'Vinculando...' : 'Vincular'}
                              </button>
                            </form>
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
    </div>
  );
}
