import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';
import { Briefcase, MapPin, AlignLeft, CheckCircle, Navigation, Search, Mic, UploadCloud, Camera, Plus, Trash2, Globe, Video, Sparkles, Loader2, ChevronDown } from 'lucide-react';

const MOCK_BAIRROS = [
  'Centro', 'Fazendinha', 'Maranhão', 'Boa Vista', 'Cacimbas', 'Cruzeiro', 'Estação', 'Moura Brasil', 'São Francisco', 'Violete'
];

export default function Advertise() {
  const { user, token } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  // Step 1 states
  const [nome, setNome] = useState(user?.nome || '');
  const [sobrenome, setSobrenome] = useState(user?.sobrenome || '');
  const [telefone, setTelefone] = useState(user?.telefone || '');
  const [bairro, setBairro] = useState(user?.bairro || '');
  const [showBairroSuggestions, setShowBairroSuggestions] = useState(false);
  const [showExactAddress, setShowExactAddress] = useState(false);
  const [cep, setCep] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');

  // Step 2 states
  const [atividadePrincipal, setAtividadePrincipal] = useState('');
  const [descricaoTrabalho, setDescricaoTrabalho] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [bioSugerida, setBioSugerida] = useState('');

  // Step 3 states
  const [showSocialNetworks, setShowSocialNetworks] = useState(false);
  const [socialNetworks, setSocialNetworks] = useState([{ network: 'Instagram', link: '' }]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarFileId, setAvatarFileId] = useState(null);

  const addSocialNetwork = () => {
    setSocialNetworks([...socialNetworks, { network: 'Instagram', link: '' }]);
  };

  const removeSocialNetwork = (index) => {
    const newNetworks = [...socialNetworks];
    newNetworks.splice(index, 1);
    setSocialNetworks(newNetworks);
  };

  const updateSocialNetwork = (index, field, value) => {
    const newNetworks = [...socialNetworks];
    newNetworks[index][field] = value;
    setSocialNetworks(newNetworks);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAnalyzeDescription = async () => {
    if (!descricaoTrabalho.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${API_URL}/api/analyze-description`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ description: descricaoTrabalho })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAtividadePrincipal(data.data.subcategory.name);
        setCategoryId(data.data.category.id);
        setBioSugerida(data.data.bioSugerida || '');
      }
    } catch (err) {
      console.error('Erro ao analisar com IA:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) {
      value = `${value.slice(0, 5)}-${value.slice(5)}`;
    }
    setCep(value);
  };

  const handleCepBlur = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setRua(data.logradouro || '');
          setBairro(data.bairro || '');
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let uploadedAvatarUrl = avatarUrl;
      let uploadedAvatarFileId = avatarFileId;

      // Se houver um arquivo selecionado, faz o upload primeiro
      if (avatarFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const uploadRes = await fetch(`${API_URL}/api/upload/avatar`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          alert(uploadData.message || 'Erro ao fazer upload da foto.');
          setIsUploading(false);
          return;
        }
        uploadedAvatarUrl = uploadData.url;
        uploadedAvatarFileId = uploadData.fileId;
        setAvatarUrl(uploadedAvatarUrl);
        setAvatarFileId(uploadedAvatarFileId);
        setIsUploading(false);
      }

      const response = await fetch(`${API_URL}/api/ads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nome,
          sobrenome,
          telefone,
          bairro,
          atividadePrincipal,
          descricaoTrabalho,
          bioSugerida,
          redesSociais: showSocialNetworks ? socialNetworks.filter(n => n.link.trim() !== '') : [],
          avatarUrl: uploadedAvatarUrl || null,
          avatarFileId: uploadedAvatarFileId || null,
          categoryId: categoryId || null,
        })
      });
      const data = await response.json();
      if (response.ok) {
        setStep(4);
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        alert(data.message || 'Erro ao publicar anúncio.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar anúncio.');
    }
  };

  const nextStep = () => {
    if (step === 2) {
      if (!atividadePrincipal.trim() || !descricaoTrabalho.trim()) {
        alert('Por favor, descreva seu trabalho e clique em "Analisar com IA" antes de continuar.');
        return;
      }
    }
    setStep(prev => prev + 1);
  };
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-64px)] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">Crie seu Anúncio Profissional</h1>
          <p className="text-slate-600 mt-2">Destaque-se em Itapipoca em apenas 3 passos simples.</p>
        </div>

        {/* Progress bar */}
        <div className="mb-10 flex justify-between items-center relative before:absolute before:top-1/2 before:-translate-y-1/2 before:w-full before:h-1 before:bg-slate-200 before:-z-10">
          {[1, 2, 3].map(i => (
            <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors relative z-10 ${
              step >= i ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-slate-200 text-slate-500'
            }`}>
              {step > i ? <CheckCircle size={20} /> : i}
            </div>
          ))}
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          
          {/* PASSO 1 */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl"><MapPin size={24} /></div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Confirmação e Localização</h2>
                  <p className="text-sm text-slate-500">Estes dados aparecerão no seu anúncio. Pode alterá-los se desejar.</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                    <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary transition-colors text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sobrenome</label>
                    <input type="text" value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary transition-colors text-slate-800" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
                    <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary transition-colors text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bairro de Atuação Principal</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={bairro} 
                        onChange={(e) => {
                          setBairro(e.target.value);
                          setShowBairroSuggestions(true);
                        }}
                        onFocus={() => setShowBairroSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowBairroSuggestions(false), 200)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary transition-colors text-slate-800" 
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <ChevronDown size={18} />
                      </div>
                      
                      {showBairroSuggestions && MOCK_BAIRROS.filter(b => b.toLowerCase().includes(bairro.toLowerCase())).length > 0 && bairro.length >= 3 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {MOCK_BAIRROS.filter(b => b.toLowerCase().includes(bairro.toLowerCase())).map((b, index) => (
                            <div 
                              key={index}
                              className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0"
                              onClick={() => {
                                setBairro(b);
                                setShowBairroSuggestions(false);
                              }}
                            >
                              {b}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <h4 className="font-medium text-slate-800">Deseja exibir seu endereço exato?</h4>
                      <p className="text-xs text-slate-500 mt-1">Ideal para estabelecimentos físicos e oficinas.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={showExactAddress} onChange={() => setShowExactAddress(!showExactAddress)} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {showExactAddress && (
                    <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-slate-700 mb-1">CEP</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={cep}
                              onChange={handleCepChange}
                              onBlur={handleCepBlur}
                              placeholder="00000-000" 
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary" 
                            />
                            {loadingCep && (
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </div>
                        <button type="button" onClick={handleCepBlur} className="bg-slate-800 text-white px-5 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-700">
                          <Search size={18} /> Buscar
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-primary font-medium text-sm cursor-pointer hover:underline mb-2">
                        <Navigation size={16} /> Usar minha localização atual
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Rua</label>
                        <input type="text" value={rua} onChange={(e) => setRua(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                          <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Complemento</label>
                          <input type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button onClick={nextStep} className="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-primary/20">Continuar para o Passo 2</button>
              </div>
            </div>
          )}

          {/* PASSO 2 */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><Briefcase size={24} /></div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Agora vamos construir seu perfil</h2>
                  <p className="text-sm text-slate-500">Preencha as informações para construirmos o melhor perfil para você.</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-medium text-slate-700">Conte-nos como você trabalha (Ex: horários, se atende a domicílio, tempo de experiência)</label>
                  </div>
                  <div className="mb-2 text-left">
                    <a href="#" className="text-xs text-primary hover:underline font-medium flex items-center justify-start gap-1">
                      Dúvidas do que escrever? Clique aqui e assista ao vídeo de exemplo <Video size={14} />
                    </a>
                  </div>
                  
                  <div className="relative">
                    <textarea 
                      rows={6}
                      value={descricaoTrabalho}
                      onChange={(e) => setDescricaoTrabalho(e.target.value)}
                      onBlur={handleAnalyzeDescription}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary transition-colors resize-none pr-14 text-slate-800 placeholder:text-slate-400"
                      placeholder="Sou encanador há 10 anos, atendo todos os dias da semana até as 18h. Faço reparos em vazamentos, instalação de pias..."
                    ></textarea>
                    
                    <button 
                      onClick={() => setIsRecording(!isRecording)}
                      className={`absolute right-3 bottom-3 p-3 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                      title="Gravar áudio"
                    >
                      <Mic size={20} />
                    </button>
                  </div>
                  
                  <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 gap-3">
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <Sparkles size={16} className="text-primary shrink-0" /> 
                      Escreva em detalhes para nossa IA categorizar seu perfil.
                    </p>
                    <button 
                      type="button"
                      onClick={handleAnalyzeDescription}
                      disabled={isAnalyzing || !descricaoTrabalho.trim()}
                      className="w-full sm:w-auto text-xs font-bold bg-primary text-white hover:bg-primary-hover px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {isAnalyzing ? (
                         <><Loader2 size={14} className="animate-spin" /> Analisando Perfil...</>
                      ) : (
                         <><Sparkles size={14} /> Analisar com IA</>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sua Atividade Principal (Definida pela IA)</label>
                  <input type="text" value={atividadePrincipal} readOnly placeholder="Preenchido automaticamente após a análise..." className="w-full px-4 py-3 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl focus:outline-none focus:ring-0 cursor-not-allowed" />
                </div>
              </div>
              
              <div className="mt-10 flex justify-between">
                <button onClick={prevStep} className="text-slate-500 hover:text-slate-800 font-medium px-6 py-3.5">Voltar</button>
                <button onClick={nextStep} className="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-primary/20">Continuar</button>
              </div>
            </div>
          )}

          {/* PASSO 3 */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><AlignLeft size={24} /></div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Aparência e Portfólio</h2>
                  <p className="text-sm text-slate-500">Revise seu perfil gerado pela IA e adicione fotos.</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Foto de Perfil */}
                <div className="flex flex-col items-center">
                  <label htmlFor="avatar-upload" className="cursor-pointer group">
                    <div className="w-28 h-28 bg-slate-100 rounded-full border-4 border-white shadow-lg flex items-center justify-center relative overflow-hidden group-hover:ring-4 group-hover:ring-primary/30 transition-all">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={32} className="text-slate-400" />
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white" />
                      </div>
                    </div>
                  </label>
                  <input 
                    id="avatar-upload"
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <label htmlFor="avatar-upload" className="text-sm font-medium text-primary mt-3 cursor-pointer hover:underline">
                    {avatarPreview ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'}
                  </label>
                  {avatarPreview && (
                    <button 
                      type="button"
                      onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                      className="text-xs text-red-400 hover:text-red-600 mt-1"
                    >
                      Remover foto
                    </button>
                  )}
                </div>

                {/* Biografia IA */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-medium text-slate-700">Biografia / Apresentação</label>
                  </div>
                  <textarea 
                    rows={6}
                    value={bioSugerida}
                    onChange={(e) => setBioSugerida(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none text-slate-800"
                  ></textarea>
                  <p className="text-xs text-slate-500 mt-1">Essa é a sua biografia aprimorada pela IA. Sinta-se livre para editá-la se desejar.</p>
                </div>

                {/* Redes Sociais */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-slate-800 flex items-center gap-2"><Globe size={18} /> Redes Sociais</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={showSocialNetworks} onChange={() => setShowSocialNetworks(!showSocialNetworks)} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  
                  {showSocialNetworks && (
                    <div className="space-y-4 mt-4 animate-in slide-in-from-top-2 duration-300">
                      <p className="text-sm text-slate-600 mb-2">Deseja adicionar suas redes sociais?</p>
                      {socialNetworks.map((net, index) => (
                        <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                          <select 
                            value={net.network} 
                            onChange={(e) => updateSocialNetwork(index, 'network', e.target.value)}
                            className="w-full sm:w-1/3 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                          >
                            <option value="Instagram">Instagram</option>
                            <option value="YouTube">YouTube</option>
                            <option value="Facebook">Facebook</option>
                            <option value="TikTok">TikTok</option>
                            <option value="Site">Site</option>
                          </select>
                          <div className="flex-1 w-full flex items-center gap-2">
                            <input 
                              type="text" 
                              value={net.link}
                              onChange={(e) => updateSocialNetwork(index, 'link', e.target.value)}
                              placeholder={`Link do seu ${net.network}`} 
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary" 
                            />
                            <button type="button" onClick={() => removeSocialNetwork(index)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={addSocialNetwork} className="text-primary font-medium flex items-center gap-2 hover:underline text-sm mt-2">
                        <Plus size={16} /> Adicionar outra rede
                      </button>
                    </div>
                  )}
                </div>

                {/* Portfolio Drag & Drop */}
                <div>
                  <h4 className="font-medium text-slate-800 mb-2">Portfólio (Fotos do seu trabalho)</h4>
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-primary mb-4">
                      <UploadCloud size={28} />
                    </div>
                    <p className="text-slate-700 font-medium text-base mb-1">Arraste e solte imagens aqui</p>
                    <p className="text-slate-500 text-sm">Adicione até 8 fotos do seu trabalho. Max 2MB por foto.</p>
                    <button type="button" className="mt-4 px-6 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                      Procurar arquivos
                    </button>
                  </div>
                </div>

                {/* Termos */}
                <div className="pt-6 border-t border-slate-100 flex items-start gap-3">
                  <input type="checkbox" required id="terms" className="mt-1 h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary" />
                  <label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed cursor-pointer">
                    Concordo com os <a href="#" className="text-primary hover:underline">Termos de Uso</a> e <a href="#" className="text-primary hover:underline">Política de Privacidade</a> do proITA, e confirmo que as informações fornecidas são verdadeiras.
                  </label>
                </div>

                <div className="mt-8 flex justify-between items-center">
                  <button type="button" onClick={prevStep} className="text-slate-500 hover:text-slate-800 font-medium px-4 py-3">Voltar</button>
                  <button 
                    type="submit" 
                    disabled={isUploading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 md:px-12 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-emerald-500/30 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3"
                  >
                    {isUploading ? (
                      <>
                        <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Enviando foto...
                      </>
                    ) : 'Publicar Meu Anúncio'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-16 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Anúncio Publicado!</h2>
              <p className="text-slate-600 text-lg max-w-md mx-auto">Seu perfil já está visível para milhares de clientes em Itapipoca.</p>
              <p className="text-sm text-slate-400 mt-8 animate-pulse">Redirecionando para seu painel de controle...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
