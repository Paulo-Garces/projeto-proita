import { useState, useContext, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';
import imageCompression from 'browser-image-compression';
import { Briefcase, MapPin, AlignLeft, CheckCircle, Search, Mic, UploadCloud, Camera, Plus, Trash2, Globe, Video, Sparkles, Loader2, Square, Send, Pause, Play, Lock, X } from 'lucide-react';
import ImageCropperModal from '../components/ImageCropperModal';

const MAX_PORTFOLIO_FILES = 8;
const MAX_PORTFOLIO_MB = 5;

const LISTA_CATEGORIAS = [
  "Alimentação e Gastronomia",
  "Beleza e Estética",
  "Construção e Reformas",
  "Educação e Aulas",
  "Eventos e Produção",
  "Reparos e Assistência Técnica",
  "Serviços Domésticos e Cuidados",
  "Tecnologia e Design",
  "Transporte e Logística",
  "Saúde e Bem-estar",
  "Serviços Rurais e Paisagismo",
  "Moda e Costura",
  "Turismo e Lazer",
  "Serviços Administrativos e Consultoria",
  "Outros Serviços"
];

const NETWORK_TO_PLATFORM = {
  Instagram: 'instagram',
  YouTube: 'youtube',
  Facebook: 'facebook',
  TikTok: 'tiktok',
  Site: 'website',
};

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

const formatTime = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      const base64Content = base64String.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};



function ImageDeleteConfirmModal({ isOpen, onClose, onConfirm, loading }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        style={{ animation: 'modalPop 0.22s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        <div className="px-6 py-5 flex items-center gap-3 border-b border-slate-100">
          <div className="p-2.5 bg-red-50 rounded-xl text-red-600">
            <Trash2 size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Excluir Imagem</h3>
          </div>
          <button onClick={onClose} className="ml-auto p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Tem certeza de que deseja remover esta imagem do seu portfólio?
          </p>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Excluindo...
              </>
            ) : (
              'Excluir'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Advertise() {
  const { user, token, isAuthenticated, loading: authLoading, logout } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [loadingAdCount, setLoadingAdCount] = useState(true);
  const [adCount, setAdCount] = useState(0);
  const [declarationChecked, setDeclarationChecked] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    // 1. Check if user has active plan/trial
    const isTrialExpired = user?.planStatus === 'DEGUSTACAO' && user?.trialEndsAt && new Date(user.trialEndsAt) < new Date();
    const hasActivePlan = isAuthenticated && (user?.planStatus === 'ATIVO' || user?.planStatus === 'BASICO' || (user?.planStatus === 'DEGUSTACAO' && !isTrialExpired));

    if (!hasActivePlan) {
      navigate('/planos');
      return;
    }

    // 2. Fetch the user's ads
    if (token) {
      setLoadingAdCount(true);
      fetch(`${API_URL}/api/ads/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            setAdCount(d.data ? d.data.length : 0);
          }
        })
        .catch(err => {
          console.error('Erro ao buscar anúncios:', err);
        })
        .finally(() => {
          setLoadingAdCount(false);
        });
    } else {
      setLoadingAdCount(false);
    }
  }, [user, isAuthenticated, token, navigate, authLoading]);

  // Rola para o topo ao alcançar a tela de sucesso (step 4)
  useEffect(() => {
    if (step === 4) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  // Step 1 states
  const [nomeExibicao, setNomeExibicao] = useState('');
  const [telefoneComercial, setTelefoneComercial] = useState('');
  const [bairro, setBairro] = useState(user?.bairro || '');
  const [enderecoComercial, setEnderecoComercial] = useState('');
  const [showExactAddress, setShowExactAddress] = useState(false);
  const [exibirEnderecoCompleto, setExibirEnderecoCompleto] = useState(true);
  const [cep, setCep] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');

  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (user) {
      if (!nomeExibicao) {
        const fullCadName = [user.nome, user.sobrenome].filter(Boolean).join(' ').trim();
        setNomeExibicao(fullCadName);
      }
      const verifiedPhones = user.phones?.filter(p => p.isVerified) || [];
      if (!telefoneComercial && verifiedPhones.length > 0) {
        setTelefoneComercial(formatPhone(verifiedPhones[0].numero));
      }
    }
  }, [user, telefoneComercial]);

  // Step 2 states
  const [atividadePrincipal, setAtividadePrincipal] = useState('');
  const [categoriaGeral, setCategoriaGeral] = useState('');
  const [descricaoTrabalho, setDescricaoTrabalho] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingState, setRecordingState] = useState('idle'); // 'idle', 'starting', 'recording'
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioError, setAudioError] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [bioSugerida, setBioSugerida] = useState('');
  const [aiFailed, setAiFailed] = useState(false);
  const [aiErrorMsg, setAiErrorMsg] = useState('');

  const isCancelledRef = useRef(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const canvasRef = useRef(null);
  const recordingStateRef = useRef('idle');
  const maxRecordingTimeoutRef = useRef(null);

  const changeRecordingState = (state) => {
    setRecordingState(state);
    recordingStateRef.current = state;
  };

  // Cleanup audio/recording contexts on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  // Step 3 states
  const [showSocialNetworks, setShowSocialNetworks] = useState(false);
  const [socialNetworks, setSocialNetworks] = useState([{ network: 'Instagram', link: '' }]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarFileId, setAvatarFileId] = useState(null);

  const [portfolioQueue, setPortfolioQueue] = useState([]);
  const portfolioInputRef = useRef(null);
  const [deleteItemId, setDeleteItemId] = useState(null);

  // Estados do Crop e Parceiros (Sponsors)
  const [cropTarget, setCropTarget] = useState(null); // { type: 'avatar' | 'partner', imageSrc: string }
  const [partners, setPartners] = useState([]); // [{ file: File, previewUrl: string, link: string }]

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
    const file = e.target.files?.[0];
    e.target.value = ''; // Previne o bug de 'piscar' e não carregar a mesma foto
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropTarget({
        type: 'avatar',
        imageSrc: reader.result
      });
    };
    reader.onerror = () => {
      alert('Erro ao processar a imagem do seu celular. Tente novamente.');
    };
    reader.readAsDataURL(file);
  };

  const appendPortfolioFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!incoming.length) return;
    setPortfolioQueue((prev) => {
      const next = [...prev];
      for (const file of incoming) {
        if (next.length >= MAX_PORTFOLIO_FILES) break;
        if (file.size > MAX_PORTFOLIO_MB * 1024 * 1024) {
          alert(`Cada foto deve ter no máximo ${MAX_PORTFOLIO_MB}MB. Ignorada: ${file.name}`);
          continue;
        }
        const id = `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        next.push({ id, file, preview: URL.createObjectURL(file) });
      }
      return next;
    });
  }, []);

  const removePortfolioItem = (id) => {
    setPortfolioQueue((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleDeleteItemClick = (id) => {
    setDeleteItemId(id);
  };

  const handlePortfolioDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  };

  const handlePortfolioDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePortfolioDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    appendPortfolioFiles(e.dataTransfer?.files);
  };

  const handlePortfolioInputChange = (e) => {
    appendPortfolioFiles(e.target.files);
    e.target.value = '';
  };

  const buildSocialLinksPayload = () => {
    if (!showSocialNetworks) return [];
    return socialNetworks
      .map((n) => ({
        platform: NETWORK_TO_PLATFORM[n.network] || String(n.network || '').toLowerCase(),
        url: (n.link || '').trim(),
      }))
      .filter((n) => n.url)
      .slice(0, 3);
  };

  const handleAnalyzeDescription = async (textToAnalyze) => {
    const text = typeof textToAnalyze === 'string' ? textToAnalyze : descricaoTrabalho;
    if (!text?.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setAiFailed(false);
    setAiErrorMsg('');
    try {
      const response = await fetch(`${API_URL}/api/analyze-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Gemini-Key': import.meta.env.VITE_GEMINI_API_KEY || ''
        },
        body: JSON.stringify({ description: text })
      });
      const data = await response.json();
      if (response.ok && data?.success && data?.data?.subcategory?.name) {
        setAtividadePrincipal(data.data.subcategory.name || '');
        setCategoryId(data.data.category?.id || '');
        setCategoriaGeral(data.data.category?.name || data.data?.categoriaGeral || '');
        setBioSugerida(data.data?.biografiaCompleta || data.data?.bioSugerida || '');
        setAiFailed(false);
      } else {
        // IA retornou mas sem atividade principal — desbloqueia campo
        setAiFailed(true);
        setAiErrorMsg('A IA não conseguiu identificar sua atividade. Por favor, preencha manualmente.');
        if (data?.data?.biografiaCompleta) setBioSugerida(data.data.biografiaCompleta);
        else if (data?.data?.bioSugerida) setBioSugerida(data.data.bioSugerida);
      }
    } catch (err) {
      console.error("Erro no Gemini: ", err);
      alert('Ocorreu um erro ao analisar a descrição. Por favor, preencha os campos manualmente.');
      setAiFailed(true);
      setAiErrorMsg('Erro de conexão com a IA. Por favor, preencha a atividade principal manualmente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const cleanupAudio = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error('Erro ao parar MediaRecorder:', e);
      }
    }
    mediaRecorderRef.current = null;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (maxRecordingTimeoutRef.current) {
      clearTimeout(maxRecordingTimeoutRef.current);
      maxRecordingTimeoutRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(err => console.error('Erro ao fechar AudioContext:', err));
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    sourceRef.current = null;
  };

  const startVisualizerLoop = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();

    const draw = () => {
      if (recordingStateRef.current !== 'recording') return;
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      const BAR_COUNT = 32;
      const BAR_WIDTH = 4;
      const SPACING = 6;
      const step = Math.floor(dataArray.length / BAR_COUNT);

      const totalWidth = BAR_COUNT * (BAR_WIDTH + SPACING) - SPACING;
      const startX = (width - totalWidth) / 2;

      for (let i = 0; i < BAR_COUNT; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += dataArray[i * step + j] || 0;
        }
        const amplitude = sum / step;

        const rawHeight = (amplitude / 255) * height * 1.5;
        const barHeight = Math.max(4, Math.min(rawHeight, height - 8));
        const x = startX + (BAR_COUNT - 1 - i) * (BAR_WIDTH + SPACING);
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#38bdf8'); // sky-400
        gradient.addColorStop(0.5, '#6366f1'); // indigo-500
        gradient.addColorStop(1, '#ec4899'); // pink-500
        ctx.fillStyle = gradient;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, BAR_WIDTH, barHeight, 2);
        } else {
          ctx.rect(x, y, BAR_WIDTH, barHeight);
        }
        ctx.fill();
      }
    };

    draw();
  };

  const startRecording = async () => {
    isCancelledRef.current = false;
    setRecordingTime(59);
    setAudioError(''); // Limpa erros anteriores
    changeRecordingState('starting');
    setIsRecording(true);

    let stream = null;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Este dispositivo ou navegador não suporta gravação de áudio ou a conexão não é segura (requer HTTPS).');
      }
      
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream; // Define a referência do stream imediatamente!

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      // ── Integração com o MediaRecorder nativo ──
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const type = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type });
        setAudioBlob(blob);

        if (isCancelledRef.current) {
          console.log('Gravação descartada pelo usuário.');
          return;
        }

        try {
          setIsTranscribing(true);
          setAudioError('');

          const base64Content = await blobToBase64(blob);

          const response = await fetch(`${API_URL}/api/transcribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              audioContent: base64Content
            })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData?.error || `Erro no servidor: ${response.status}`);
          }

          const data = await response.json();
          const transcript = data.transcript;

          if (transcript && transcript.trim()) {
            let finalDescription = '';
            setDescricaoTrabalho(prev => {
              const trimmed = prev.trim();
              finalDescription = trimmed.length > 0 ? prev + ' ' + transcript.trim() : transcript.trim();
              return finalDescription;
            });
            setTimeout(() => {
              handleAnalyzeDescription(finalDescription);
            }, 100);
          } else {
            console.warn('Nenhuma transcrição retornada ou áudio silencioso.');
          }
        } catch (err) {
          console.error('Erro na transcrição:', err);
          setAudioError(`Falha na transcrição: ${err.message}`);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start(1000); // Coleta fatias de áudio de 1 segundo de forma assíncrona

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      maxRecordingTimeoutRef.current = setTimeout(() => {
        console.log('Limite de 59 segundos atingido. Parando gravação automaticamente.');
        stopAndSendRecording();
      }, 59000);

      changeRecordingState('recording');

      setTimeout(() => {
        startVisualizerLoop();
      }, 50);

    } catch (e) {
      console.error('Erro geral ao inicializar gravação:', e);
      const errMsg = e.name ? `${e.name}: ${e.message}` : e.message || String(e);
      setAudioError(errMsg);
      cleanupAudio();
      changeRecordingState('idle');
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    isCancelledRef.current = true;
    changeRecordingState('idle');
    setIsRecording(false);
    cleanupAudio();
    setAudioError('');
    setIsPaused(false);
  };

  const stopAndSendRecording = () => {
    isCancelledRef.current = false;
    changeRecordingState('idle');
    setIsRecording(false);
    cleanupAudio();
    setIsPaused(false);
  };

  const togglePauseRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      changeRecordingState('paused');
      setIsPaused(true);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (maxRecordingTimeoutRef.current) {
        clearTimeout(maxRecordingTimeoutRef.current);
        maxRecordingTimeoutRef.current = null;
      }
    } else if (recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      changeRecordingState('recording');
      setIsPaused(false);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const remainingMs = recordingTime * 1000;
      maxRecordingTimeoutRef.current = setTimeout(() => {
        console.log('Limite de 59 segundos atingido após retomar. Parando gravação automaticamente.');
        stopAndSendRecording();
      }, remainingMs);

      setTimeout(() => {
        startVisualizerLoop();
      }, 50);
    }
  };

  const handleVoiceButtonAction = async () => {
    if (recordingState === 'idle') {
      startRecording();
    } else if (recordingState === 'paused') {
      togglePauseRecording();
    }
  };

  const handleVoiceRecording = handleVoiceButtonAction;

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
          // Preenche o bairro automaticamente com o retorno do CEP
          if (data.bairro) {
            setBairro(data.bairro);
          }
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

      // Upload das imagens de parceiros
      const uploadedPartners = [];
      if (partners.length > 0) {
        setIsUploading(true);
        for (const partner of partners) {
          if (partner.file) {
            const formData = new FormData();
            formData.append('fotoAnuncio', partner.file);
            const uploadRes = await fetch(`${API_URL}/api/upload/foto-anuncio`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData,
            });
            const uploadData = await uploadRes.json();
            if (uploadRes.ok && uploadData.success) {
              uploadedPartners.push({
                imageUrl: uploadData.url,
                fileId: uploadData.fileId,
                link: partner.link || '',
              });
            } else {
              console.error('Erro ao fazer upload da imagem de parceiro:', uploadData.message);
            }
          }
        }
        setIsUploading(false);
      }

      const descricaoFinal = (bioSugerida && bioSugerida.trim()) ? bioSugerida.trim() : descricaoTrabalho.trim();

      const response = await fetch(`${API_URL}/api/ads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: nomeExibicao,
          sobrenome: '',
          telefone: telefoneComercial,
          telefoneComercial: telefoneComercial,
          bairro: showExactAddress ? bairro : null,
          atividadePrincipal,
          descricaoTrabalho: descricaoFinal,
          bioSugerida,
          socialLinks: buildSocialLinksPayload(),
          avatarUrl: uploadedAvatarUrl || null,
          avatarFileId: uploadedAvatarFileId || null,
          categoryId: categoryId || null,
          categoriaGeral: categoriaGeral || null,
          endereco: showExactAddress ? [rua, numero, complemento].filter(Boolean).join(', ') : null,
          enderecoComercial: showExactAddress ? [rua, numero, complemento].filter(Boolean).join(', ') : null,
          serviceBairro: showExactAddress ? bairro : null,
          exibirEnderecoCompleto: showExactAddress ? exibirEnderecoCompleto : false,
          partners: uploadedPartners.length > 0 ? uploadedPartners : null,
        })
      });
      const data = await response.json();
      if (response.ok) {
        const profileId = data.profile?.id;
        if (profileId && portfolioQueue.length > 0) {
          setIsUploading(true);
          try {
            for (const item of portfolioQueue) {
              let uploadBlob;
              try {
                const options = { maxSizeMB: 1, maxWidthOrHeight: 1280, useWebWorker: false, fileType: 'image/jpeg' };
                uploadBlob = await imageCompression(item.file, options);
              } catch (err) {
                console.warn('[PORTFOLIO UPLOAD] Falha na compressão, usando arquivo original:', err);
                uploadBlob = item.file;
              }
              const fd = new FormData();
              fd.append('portfolioImage', uploadBlob, 'portfolio.jpg');
              const up = await fetch(`${API_URL}/api/upload/portfolio/${profileId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
              });
              const upData = await up.json();
              if (!up.ok || !upData.success) {
                alert(upData.message || 'Erro ao enviar uma foto do portfólio. Você pode adicionar depois no painel.');
                break;
              }
            }
          } catch (uploadErr) {
            console.error(uploadErr);
            alert('Erro ao enviar o portfólio. Você pode adicionar fotos depois editando o anúncio.');
          } finally {
            setIsUploading(false);
          }
        }
        setStep(4);
      } else {
        alert(data.message || 'Erro ao publicar anúncio.');
      }
    } catch (err) {
      console.error('Falha no salvamento do anúncio:', err);
      alert('Erro de conexão ao salvar anúncio.');
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (showExactAddress) {
        if (!bairro?.trim() || !rua?.trim()) {
          alert('Por favor, preencha o Bairro e Rua do seu endereço comercial.');
          return;
        }
      }
    }
    if (step === 2) {
      if (!atividadePrincipal.trim() || !descricaoTrabalho.trim()) {
        alert('Por favor, descreva seu trabalho e clique em "Analisar com IA" antes de continuar.');
        return;
      }
    }
    setStep(prev => prev + 1);
  };
  const prevStep = () => setStep(prev => prev - 1);

  if (authLoading || loadingAdCount) {
    return (
      <div className="bg-slate-50 min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
          <p className="text-slate-600 font-medium animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  if (adCount >= 2) {
    return (
      <div className="bg-slate-50 min-h-[calc(100vh-64px)] pt-28 pb-12 px-4 flex items-center justify-center animate-in fade-in duration-500">
        <div className="max-w-xl w-full bg-white border border-slate-100 rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-100/50 text-center relative overflow-hidden">
          {/* Subtle glowing backgrounds */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Decorative Alert Icon */}
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-200/50 shadow-inner">
            <Sparkles size={36} className="animate-pulse text-amber-500" />
          </div>

          {/* Typography */}
          <h1 className="text-3xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
            Limite de Anúncios Atingido
          </h1>
          
          <p className="text-slate-600 text-base max-w-md mx-auto mb-10 leading-relaxed">
            Você já atingiu o limite de 2 anúncios simultâneos para esta conta. Para criar um novo, você pode excluir um anúncio antigo no seu painel ou criar uma nova conta usando um e-mail diferente.
          </p>

          {/* Buttons */}
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 text-base flex items-center justify-center gap-2 cursor-pointer"
            >
              Voltar para Meus Anúncios
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-64px)] pt-28 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">Crie seu Anúncio Profissional</h1>
          <p className="text-slate-600 mt-2">Destaque-se em Itapipoca em apenas 3 passos simples.</p>
        </div>

        {/* Progress bar */}
        <div className="mb-10 flex justify-between items-center relative before:absolute before:top-1/2 before:-translate-y-1/2 before:w-full before:h-1 before:bg-slate-200 before:-z-10">
          {[1, 2, 3].map(i => (
            <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors relative z-10 ${step >= i ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-slate-200 text-slate-500'
              }`}>
              {step > i ? <CheckCircle size={20} /> : i}
            </div>
          ))}
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">

          {/* PASSO 1 */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-2 md:mb-6 border-b border-slate-100 pb-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl"><MapPin size={24} /></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900">Informações públicas</h2>
                </div>
              </div>

              {/* Banner informativo com destaque */}
              <div className="mb-6 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 hidden md:flex items-start gap-3">
                <Sparkles size={18} className="text-primary shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-slate-800">Estes dados aparecerão no seu anúncio. Pode alterá-los se desejar.</p>
              </div>
              <div className="space-y-5">
                {/* Linha 1: Nome de Exibição / Nome Fantasia */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome de Exibição / Nome Fantasia</label>
                  <input
                    type="text"
                    value={nomeExibicao}
                    onChange={(e) => setNomeExibicao(e.target.value)}
                    placeholder="Ex: Eletricista Silva, Paula Unhas (Opcional)"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary transition-colors text-slate-800"
                  />
                  <p className="text-xs text-slate-500 mt-1 hidden md:block">
                    <span className="font-semibold text-primary">Estas são as informações públicas do seu anúncio.</span> Se deixado em branco, o sistema utilizará o seu nome de cadastro pessoal.
                  </p>
                </div>

                {/* Linha 2: WhatsApp / Telefone Comercial do Anúncio */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp / Telefone Comercial do Anúncio</label>
                  {user?.phones?.filter(p => p.isVerified).length > 0 ? (
                    <select
                      value={telefoneComercial}
                      onChange={(e) => setTelefoneComercial(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary transition-colors text-slate-800"
                    >
                      {user.phones.filter(p => p.isVerified).map((p) => (
                        <option key={p.id} value={formatPhone(p.numero)}>
                          {formatPhone(p.numero)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold">
                      ⚠️ Você não possui telefones verificados na sua carteira. 
                      Para criar um anúncio, você precisa cadastrar e verificar ao menos um telefone na aba <strong>Segurança</strong> do seu painel.
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center justify-between">
                    <span>
                      <span className="font-semibold text-primary">Estas são as informações públicas do seu anúncio.</span>
                    </span>
                    <Link to="/dashboard?tab=security" className="text-primary hover:underline font-bold shrink-0">
                      + Adicionar novo telefone
                    </Link>
                  </p>
                </div>
              </div>

              {/* Localização e Bairro com Lógica de CEP */}
              <div className="pt-4 mt-6 border-t border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-bold text-slate-800">Deseja adicionar endereço comercial?</label>
                    <p className="text-xs text-slate-500">Ative se você possui um estabelecimento físico para atendimento de clientes (loja, sala comercial, consultório).</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={showExactAddress} 
                      onChange={() => setShowExactAddress(!showExactAddress)} 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {showExactAddress && (
                  <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-650 mb-1">CEP</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cep}
                            onChange={handleCepChange}
                            onBlur={handleCepBlur}
                            placeholder="Ex: 62500-000"
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary text-slate-800"
                          />
                          {loadingCep && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="animate-spin text-slate-400" size={16} />
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-650 mb-1">Bairro <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={bairro}
                          onChange={(e) => setBairro(e.target.value)}
                          required={showExactAddress}
                          placeholder="Ex: Centro"
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-650 mb-1">Rua <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={rua}
                          onChange={(e) => setRua(e.target.value)}
                          required={showExactAddress}
                          placeholder="Ex: Rua Floriano Peixoto"
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-650 mb-1">Número</label>
                        <input
                          type="text"
                          value={numero}
                          onChange={(e) => setNumero(e.target.value)}
                          placeholder="Ex: 123"
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-650 mb-1">Complemento / Ponto de Referência <span className="text-slate-400 font-normal">(Opcional)</span></label>
                      <input
                        type="text"
                        value={complemento}
                        onChange={(e) => setComplemento(e.target.value)}
                        placeholder="Ex: Sala 4, próximo à praça..."
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary text-slate-800"
                      />
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <label className="block text-xs font-bold text-slate-700 mb-2">Opções de Privacidade do Endereço</label>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                          <input
                            type="radio"
                            name="privacidadeEndereco"
                            checked={exibirEnderecoCompleto}
                            onChange={() => setExibirEnderecoCompleto(true)}
                            className="h-4 w-4 text-primary focus:ring-primary border-slate-350"
                          />
                          <span>Exibir endereço completo</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                          <input
                            type="radio"
                            name="privacidadeEndereco"
                            checked={!exibirEnderecoCompleto}
                            onChange={() => setExibirEnderecoCompleto(false)}
                            className="h-4 w-4 text-primary focus:ring-primary border-slate-350"
                          />
                          <span>Exibir somente o bairro</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
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
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl hidden md:block"><Briefcase size={24} /></div>
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-slate-900">Descrição da atividade</h2>
                  <p className="text-sm text-slate-500 hidden md:block">Preencha as informações para construirmos o melhor perfil para você.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2 hidden md:flex">
                    <label className="block text-sm font-medium text-slate-700">Conte-nos como você trabalha (Ex: horários, se atende a domicílio, tempo de experiência)</label>
                  </div>
                  <div className="mb-2 text-left">
                    <a href="#" className="text-xs text-primary hover:underline font-medium flex items-center justify-start gap-1">
                      Dúvidas do que escrever? Clique aqui e assista ao vídeo de exemplo <Video size={14} />
                    </a>
                  </div>

                  {recordingState === 'starting' || recordingState === 'recording' ? (
                    <div className="w-full min-h-[176px] bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col justify-between p-5 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {/* Efeitos de brilho Gemini / Siri */}
                      <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                      <div className="absolute bottom-[-50px] right-[-50px] w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

                      {/* Linha superior: Timer e Indicador */}
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          {recordingState === 'recording' ? (
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                          ) : (
                            <span className="w-2.5 h-2.5 bg-amber-400 rounded-full"></span>
                          )}
                          <span className="font-mono text-lg font-bold text-slate-100">
                            {recordingState === 'starting' ? '00:00' : formatTime(recordingTime)}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                          {recordingState === 'starting' ? 'Iniciando microfone...' : 'Gravando áudio...'}
                        </span>
                      </div>

                      {/* Linha do meio: Visualizador ou Feedback */}
                      <div className="flex-1 flex items-center justify-center relative z-10 my-2">
                        {recordingState === 'starting' ? (
                          <div className="flex items-center justify-center text-sm text-slate-400 italic">
                            <Loader2 className="animate-spin text-primary mr-2" size={18} />
                            Aguardando permissão do microfone...
                          </div>
                        ) : (
                          <canvas
                            ref={canvasRef}
                            className="w-full h-14 bg-slate-950/20 rounded-lg"
                          />
                        )}
                      </div>

                      {/* Linha inferior: Ações e legenda */}
                      <div className="flex items-center justify-between gap-4 relative z-10 pt-2 border-t border-slate-800/60">
                        <button
                          type="button"
                          onClick={cancelRecording}
                          className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full transition-all border border-red-500/20 active:scale-95 flex items-center justify-center shrink-0"
                          title="Descartar gravação"
                        >
                          <Trash2 size={20} />
                        </button>

                        <div className="flex-1 min-w-0 text-center px-2">
                          <p className="text-xs text-slate-400 italic truncate max-w-[280px] md:max-w-[400px] mx-auto">
                            Gravação em andamento... Fale de forma clara.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={stopAndSendRecording}
                          className="p-3 bg-primary hover:bg-primary-hover text-white rounded-full transition-all active:scale-95 shadow-md shadow-primary/20 flex items-center justify-center shrink-0"
                          title="Concluir e transcrever"
                        >
                          <Send size={20} className="fill-white translate-x-[1px]" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      {isTranscribing && (
                        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] rounded-xl flex items-center justify-center z-10 animate-in fade-in duration-200">
                          <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3">
                            <Loader2 className="animate-spin text-primary" size={20} />
                            <span className="text-sm font-semibold text-slate-800">Transcrevendo áudio com IA do Google...</span>
                          </div>
                        </div>
                      )}
                      <textarea
                        rows={4}
                        value={descricaoTrabalho}
                        disabled={isTranscribing}
                        onChange={(e) => setDescricaoTrabalho(e.target.value)}
                        onBlur={handleAnalyzeDescription}
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary transition-colors resize-none pr-24 text-slate-800 placeholder:text-slate-400 overflow-y-auto"
                        placeholder="Sou encanador há 10 anos, atendo todos os dias da semana até as 18h. Faço reparos em vazamentos, instalação de pias..."
                      ></textarea>

                      {/* Botão Limpar Descrição */}
                      {descricaoTrabalho?.trim() && (
                        <button
                          type="button"
                          disabled={isTranscribing}
                          onClick={() => {
                            setDescricaoTrabalho('');
                            setAtividadePrincipal('');
                            setBioSugerida('');
                            setAiFailed(false);
                            setAiErrorMsg('');
                          }}
                          className="absolute right-14 bottom-3 p-3 rounded-full flex items-center justify-center transition-all bg-slate-200 text-slate-600 hover:bg-red-100 hover:text-red-500 disabled:opacity-50"
                          title="Limpar tudo e recomeçar"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}

                      {/* Botão de Controle de Voz */}
                      <button
                        type="button"
                        disabled={isTranscribing}
                        onClick={handleVoiceButtonAction}
                        className="absolute right-3 bottom-3 p-3 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer bg-slate-200 text-slate-600 hover:bg-slate-300 disabled:opacity-50"
                        title="Gravar áudio"
                      >
                        <Mic size={20} />
                      </button>
                    </div>
                  )}

                  {audioError && (
                    <div className="mt-3 bg-red-50 text-red-600 border border-red-200/50 rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0 animate-pulse"></span>
                      Erro na gravação: {audioError}
                    </div>
                  )}

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAnalyzeDescription}
                      disabled={isAnalyzing || !descricaoTrabalho?.trim()}
                      className="w-full sm:w-auto text-xs font-bold bg-primary text-white hover:bg-primary-hover px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {isAnalyzing ? (
                        <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> <span>Analisando Perfil...</span></span>
                      ) : (
                        <span>Clique aqui antes de continuar</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Container de Categorização do Perfil (Sempre Visível) */}
                <div className="mt-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl relative overflow-hidden text-left shadow-sm">
                  {/* Efeito visual de carregamento da IA */}
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-[1.5px] flex flex-col items-center justify-center px-6 z-10 animate-in fade-in duration-200">
                      <Loader2 className="animate-spin text-primary mb-2" size={28} />
                      <span className="text-sm font-bold text-slate-800 animate-pulse text-center break-words max-w-full">Inteligência Artificial categorizando seu perfil...</span>
                      <span className="text-xs text-slate-500 mt-1 text-center">Aguarde um instante.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Campo Categoria Principal */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        Categoria Principal 
                        {categoriaGeral && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-0.5 animate-in zoom-in duration-200">
                            ✓ IA
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        {categoriaGeral ? (
                          <>
                            <input
                              type="text"
                              value={categoriaGeral}
                              disabled
                              className="w-full pl-3 pr-10 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-semibold cursor-not-allowed select-none"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" title="Protegido pelo sistema para manter filtros precisos">
                              <Lock size={16} />
                            </div>
                          </>
                        ) : (
                          <select
                            value={categoriaGeral}
                            onChange={(e) => setCategoriaGeral(e.target.value)}
                            className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary text-slate-700 font-semibold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione uma categoria...</option>
                            {LISTA_CATEGORIAS.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        A categoria define em qual seção do site seu anúncio aparecerá.
                      </p>
                    </div>

                    {/* Campo Atividade Principal */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        Atividade / Especialidade <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={atividadePrincipal || ''}
                        onChange={(e) => setAtividadePrincipal(e.target.value)}
                        placeholder="Ex: Encanador, Eletricista, Cabeleireira..."
                        required
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary text-slate-800 font-bold shadow-sm"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Sua profissão ou especialidade principal, editável para melhor precisão.
                      </p>
                    </div>
                  </div>

                  {aiFailed && (
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 animate-in fade-in duration-300">
                      <span className="text-amber-500 text-sm">⚠️</span>
                      <div className="text-left">
                        <span className="text-xs text-amber-700 font-bold block">Preenchimento Manual</span>
                        <span className="text-xs text-slate-600">
                          {aiErrorMsg || 'Não conseguimos categorizar automaticamente. Por favor, selecione a categoria e digite sua atividade nos campos acima.'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-10 flex justify-between">
                  <button onClick={prevStep} className="text-slate-500 hover:text-slate-800 font-medium px-6 py-3.5">Voltar</button>
                  <button onClick={nextStep} className="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-primary/20">Continuar</button>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 3 */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <form onSubmit={handleSubmit} className="space-y-8">

                {/* Foto de Perfil */}
                <div className="flex flex-col items-center">
                  <label htmlFor="avatar-upload" className="cursor-pointer group">
                    <div className="w-32 h-32 bg-slate-100 rounded-full border-4 border-white shadow-lg flex items-center justify-center relative overflow-hidden group-hover:ring-4 group-hover:ring-primary/30 transition-all">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={36} className="text-slate-400" />
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={28} className="text-white" />
                      </div>
                    </div>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    onClick={(e) => { e.target.value = null; }}
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

                {/* Biografia Completa (para o Perfil) */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-medium text-slate-700">Biografia Completa / Apresentação</label>
                  </div>
                  <textarea
                    rows={6}
                    value={bioSugerida || ''}
                    onChange={(e) => setBioSugerida(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none text-slate-800"
                  ></textarea>
                  <p className="text-xs text-slate-500 mt-1">Essa é a biografia completa aprimorada pela IA. Aparece na sua página de perfil. Sinta-se livre para editá-la.</p>
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
                      {socialNetworks?.map((net, index) => (
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
                  <h4 className="font-medium text-slate-800 mb-2">
                    Portfólio (Fotos do seu trabalho) <span className="text-xs text-slate-500 font-normal">(Máx. 8 fotos - Atual: {portfolioQueue.length}/8)</span>
                  </h4>
                  <input
                    ref={portfolioInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePortfolioInputChange}
                    onClick={(e) => { e.target.value = null; }}
                  />
                  {portfolioQueue.length < 8 ? (
                    <div
                      role="presentation"
                      onClick={() => portfolioInputRef.current?.click()}
                      onDragEnter={handlePortfolioDragEnter}
                      onDragOver={handlePortfolioDragOver}
                      onDrop={handlePortfolioDrop}
                      className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer flex flex-col items-center justify-center"
                    >
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-primary mb-4 pointer-events-none">
                        <UploadCloud size={28} />
                      </div>
                      <p className="text-slate-700 font-medium text-base mb-1 pointer-events-none">Arraste e solte imagens aqui</p>
                      <p className="text-slate-500 text-sm pointer-events-none">Adicione até {MAX_PORTFOLIO_FILES} fotos do seu trabalho. Max {MAX_PORTFOLIO_MB}MB por foto.</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          portfolioInputRef.current?.click();
                        }}
                        className="mt-4 px-6 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        Procurar arquivos
                      </button>
                    </div>
                  ) : (
                    <p className="text-red-500 text-sm mt-2">Portfólio completo. Exclua uma imagem para adicionar outra.</p>
                  )}
                  {portfolioQueue?.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {portfolioQueue?.map((item) => (
                        <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                          <img src={item.preview} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItemClick(item.id);
                            }}
                            className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow"
                            title="Remover"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Termos */}
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" required id="terms" className="mt-1 h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary" />
                    <label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed cursor-pointer">
                      Concordo com os <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Termos de Uso</a> e <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Política de Privacidade</a> do proITA, e confirmo que as informações fornecidas são verdadeiras.
                    </label>
                  </div>

                  <div className="flex items-start gap-3">
                    <input type="checkbox" required id="declaredAge" className="mt-1 h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary" />
                    <label htmlFor="declaredAge" className="text-sm text-slate-600 leading-relaxed cursor-pointer">
                      Declaro sob as penas da lei que sou maior de 18 anos, ou possuo mais de 16 anos e expressa autorização dos meus responsáveis legais.
                    </label>
                  </div>
                </div>

                {adCount >= 1 && (
                  <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-xl flex items-start gap-3 mt-4 text-left">
                    <input 
                      type="checkbox" 
                      id="declaration" 
                      checked={declarationChecked}
                      onChange={(e) => setDeclarationChecked(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-amber-300 text-amber-650 focus:ring-amber-500 shrink-0 cursor-pointer" 
                    />
                    <label htmlFor="declaration" className="text-xs md:text-sm text-slate-700 leading-relaxed cursor-pointer select-none">
                      Declaro que sou o titular e prestador deste serviço/anúncio bem como a veracidade dos dados fornecidos. Compreendo que, conforme os Termos de Uso, a plataforma proITA poderá suspender a assinatura caso identifique a comercialização ou divisão desta conta com terceiros.
                    </label>
                  </div>
                )}

                <div className="mt-8 flex justify-between items-center">
                  <button type="button" onClick={prevStep} className="text-slate-500 hover:text-slate-800 font-medium px-4 py-3">Voltar</button>
                  <button
                    type="submit"
                    disabled={isUploading || (adCount >= 1 && !declarationChecked)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 md:px-12 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-emerald-500/30 hover:scale-105 disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3"
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
            <div className="text-center py-12 animate-in zoom-in duration-500 max-w-md mx-auto">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Anúncio criado com sucesso!</h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Seu perfil já está visível para milhares de clientes em Itapipoca.
              </p>
              <button
                type="button"
                onClick={() => navigate('/dashboard?tab=meus-anuncios')}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-primary hover:bg-primary-hover transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
              >
                Ir para Meus Anúncios
              </button>
            </div>
          )}
        </div>
      </div>

      {cropTarget && (
        <ImageCropperModal
          imageSrc={cropTarget.imageSrc}
          aspect={cropTarget.type === 'avatar' ? 1 : 3/4}
          cropShape={cropTarget.type === 'avatar' ? 'round' : 'rect'}
          onClose={() => setCropTarget(null)}
          onCropComplete={(blob) => {
            const file = new File([blob], cropTarget.type === 'avatar' ? 'avatar.jpg' : 'partner.jpg', { type: 'image/jpeg' });
            const previewUrl = URL.createObjectURL(file);

            if (cropTarget.type === 'avatar') {
              setAvatarFile(file);
              setAvatarPreview(previewUrl);
            } else {
              setPartners(prev => [...prev, { file, previewUrl, link: '' }]);
            }
            setCropTarget(null);
          }}
        />
      )}

      <ImageDeleteConfirmModal
        isOpen={deleteItemId !== null}
        onClose={() => setDeleteItemId(null)}
        onConfirm={() => {
          removePortfolioItem(deleteItemId);
          setDeleteItemId(null);
        }}
      />
    </div>
  );
}
