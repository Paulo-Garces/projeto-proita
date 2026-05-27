import { useState, useContext, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';
import imageCompression from 'browser-image-compression';
import { Briefcase, MapPin, AlignLeft, CheckCircle, Search, Mic, UploadCloud, Camera, Plus, Trash2, Globe, Video, Sparkles, Loader2, Square, Send } from 'lucide-react';

const MAX_PORTFOLIO_FILES = 8;
const MAX_PORTFOLIO_MB = 2;

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

export default function Advertise() {
  const { user, token, isAuthenticated, loading: authLoading, logout } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [loadingAdCount, setLoadingAdCount] = useState(true);
  const [adCount, setAdCount] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    // 1. Check if user has active plan/trial
    const isTrialExpired = user?.planStatus === 'DEGUSTACAO' && user?.trialEndsAt && new Date(user.trialEndsAt) < new Date();
    const hasActivePlan = isAuthenticated && (user?.planStatus === 'ATIVO' || (user?.planStatus === 'DEGUSTACAO' && !isTrialExpired));

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

  // Step 1 states
  const [nomeExibicao, setNomeExibicao] = useState('');
  const [telefoneComercial, setTelefoneComercial] = useState('');
  const [bairro, setBairro] = useState(user?.bairro || '');
  const [showExactAddress, setShowExactAddress] = useState(false);
  const [exibirEnderecoCompleto, setExibirEnderecoCompleto] = useState(true);
  const [cep, setCep] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');

  // Step 2 states
  const [atividadePrincipal, setAtividadePrincipal] = useState('');
  const [categoriaGeral, setCategoriaGeral] = useState('');
  const [descricaoTrabalho, setDescricaoTrabalho] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingState, setRecordingState] = useState('idle'); // 'idle', 'starting', 'recording'
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [bioSugerida, setBioSugerida] = useState('');
  const [descricaoCurta, setDescricaoCurta] = useState('');
  const [aiFailed, setAiFailed] = useState(false);
  const [aiErrorMsg, setAiErrorMsg] = useState('');

  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const canvasRef = useRef(null);
  const recordingStateRef = useRef('idle');

  const changeRecordingState = (state) => {
    setRecordingState(state);
    recordingStateRef.current = state;
  };

  // Cleanup audio/recording contexts on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
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

  const handleAnalyzeDescription = async () => {
    if (!descricaoTrabalho?.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setAiFailed(false);
    setAiErrorMsg('');
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
      if (response.ok && data?.success && data?.data?.subcategory?.name) {
        setAtividadePrincipal(data.data.subcategory.name || '');
        setCategoryId(data.data.category?.id || '');
        setCategoriaGeral(data.data.category?.name || data.data?.categoriaGeral || '');
        setDescricaoCurta(data.data?.descricaoCurta || '');
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
      console.error('Erro ao analisar com IA:', err);
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
        const x = startX + i * (BAR_WIDTH + SPACING);
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
    setVoiceTranscript('');
    setRecordingTime(0);
    changeRecordingState('starting');
    setIsRecording(true);

    let stream = null;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Este dispositivo ou navegador não suporta gravação de áudio ou a conexão não é segura (requer HTTPS).');
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream; // Define a referência do stream imediatamente!
    } catch (err) {
      console.error('Erro ao acessar o microfone:', err);
      alert(err.message || 'Erro: Permissão de microfone negada ou indisponível.');
      changeRecordingState('idle');
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz. Tente usar o Google Chrome.');
      cleanupAudio();
      changeRecordingState('idle');
      setIsRecording(false);
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      // ── Integração com o MediaRecorder nativo (captura estável em Blob de áudio) ──
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start(1000); // Coleta fatias de áudio de 1 segundo de forma assíncrona

      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript.trim()) {
          setVoiceTranscript(prev => {
            const base = prev.trim();
            const partial = currentTranscript.trim();
            if (base && !base.endsWith(partial)) {
              return base + ' ' + partial;
            }
            return partial;
          });
        }
      };

      recognition.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        if (event.error === 'not-allowed' || event.error === 'audio-capture') {
          cancelRecording();
          if (event.error === 'not-allowed') {
            alert('Permissão de microfone negada. Verifique as configurações do navegador.');
          }
        }
      };

      // Removemos o loop de reinício automático para extinguir o som de bipe periódico no celular
      recognition.onend = () => {
        console.log('Reconhecimento de voz encerrado.');
      };

      recognitionRef.current = recognition;
      recognition.start();

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      changeRecordingState('recording');

      setTimeout(() => {
        startVisualizerLoop();
      }, 50);

    } catch (e) {
      console.error('Erro ao inicializar gravação:', e);
      cleanupAudio();
      changeRecordingState('idle');
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    cleanupAudio();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Erro ao parar SpeechRecognition:', e);
      }
      recognitionRef.current = null;
    }
    setVoiceTranscript('');
    changeRecordingState('idle');
    setIsRecording(false);
  };

  const stopAndSendRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Erro ao parar SpeechRecognition:', e);
      }
      recognitionRef.current = null;
    }
    cleanupAudio();

    if (voiceTranscript.trim()) {
      setDescricaoTrabalho(prev => {
        const trimmed = prev.trim();
        if (trimmed.length > 0) return trimmed + ' ' + voiceTranscript.trim();
        return voiceTranscript.trim();
      });
    }

    setVoiceTranscript('');
    changeRecordingState('idle');
    setIsRecording(false);
  };

  const handleVoiceButtonAction = async () => {
    if (recordingState === 'idle') {
      startRecording();
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
          bairro,
          atividadePrincipal,
          descricaoTrabalho: descricaoFinal,
          descricaoCurta,
          bioSugerida,
          socialLinks: buildSocialLinksPayload(),
          avatarUrl: uploadedAvatarUrl || null,
          avatarFileId: uploadedAvatarFileId || null,
          categoryId: categoryId || null,
          categoriaGeral: categoriaGeral || null,
          endereco: showExactAddress ? [rua, numero, complemento].filter(Boolean).join(', ') : null,
          serviceBairro: bairro || null,
          exibirEnderecoCompleto: showExactAddress ? exibirEnderecoCompleto : false,
        })
      });
      const data = await response.json();
      if (response.ok) {
        const profileId = data.profile?.id;
        if (profileId && portfolioQueue.length > 0) {
          setIsUploading(true);
          try {
            for (const item of portfolioQueue) {
              const options = { maxSizeMB: 1, maxWidthOrHeight: 1280, useWebWorker: true, fileType: 'image/jpeg' };
              const compressed = await imageCompression(item.file, options);
              const fd = new FormData();
              fd.append('portfolioImage', compressed, 'portfolio.jpg');
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
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        alert(data.message || 'Erro ao publicar anúncio.');
      }
    } catch (err) {
      console.error('Falha no salvamento do anúncio:', err);
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
      <div className="bg-slate-50 min-h-[calc(100vh-64px)] py-12 px-4 flex items-center justify-center animate-in fade-in duration-500">
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
    <div className="bg-slate-50 min-h-[calc(100vh-64px)] py-12 px-4">
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
              <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl"><MapPin size={24} /></div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Confirmação e Localização</h2>
                </div>
              </div>

              {/* Banner informativo com destaque */}
              <div className="mb-6 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-start gap-3">
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
                  <p className="text-xs text-slate-500 mt-1">
                    Se deixado em branco, o sistema utilizará o seu nome de cadastro pessoal.
                  </p>
                </div>

                {/* Linha 2: WhatsApp / Telefone Comercial do Anúncio */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp / Telefone Comercial do Anúncio</label>
                  <input
                    type="text"
                    value={telefoneComercial}
                    onChange={(e) => setTelefoneComercial(formatPhone(e.target.value))}
                    placeholder="Ex: (88) 99999-9999"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary transition-colors text-slate-800"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Insira o número de contato profissional do anúncio. O número do seu cadastro continuará privado.
                  </p>
                </div>
              </div>

                {/* Toggle de Endereço */}
                <div className="pt-4 mt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <h4 className="font-medium text-slate-800">Adicionar endereço</h4>
                      <p className="text-xs text-slate-500 mt-1">Escolha o que deseja exibir.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={showExactAddress} onChange={() => setShowExactAddress(!showExactAddress)} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {showExactAddress && (
                    <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">

                      {/* Bairro (texto livre — preenchido automaticamente pelo CEP) */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                        <input
                          type="text"
                          value={bairro}
                          onChange={(e) => setBairro(e.target.value)}
                          placeholder="Digite seu bairro ou preencha o CEP"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* CEP + Buscar */}
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-slate-700 mb-1">CEP <span className="text-slate-400 font-normal">(opcional)</span></label>
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

                      {/* Rua */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Rua</label>
                        <input type="text" value={rua} onChange={(e) => setRua(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary" />
                      </div>

                      {/* Número + Complemento */}
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

                      {/* Radio Buttons — Privacidade */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                        <p className="text-sm font-semibold text-slate-800 mb-3">O que o público poderá ver no seu perfil?</p>
                        <div className="space-y-3">
                          <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            exibirEnderecoCompleto
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}>
                            <input
                              type="radio"
                              name="privacidadeEndereco"
                              checked={exibirEnderecoCompleto === true}
                              onChange={() => setExibirEnderecoCompleto(true)}
                              className="h-4 w-4 text-primary focus:ring-primary border-slate-300"
                            />
                            <div>
                              <span className="text-sm font-medium text-slate-800">Endereço completo</span>
                              <span className="text-xs text-slate-500 block">Rua, Número e Bairro</span>
                            </div>
                          </label>
                          <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            !exibirEnderecoCompleto
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}>
                            <input
                              type="radio"
                              name="privacidadeEndereco"
                              checked={exibirEnderecoCompleto === false}
                              onChange={() => setExibirEnderecoCompleto(false)}
                              className="h-4 w-4 text-primary focus:ring-primary border-slate-300"
                            />
                            <div>
                              <span className="text-sm font-medium text-slate-800">Apenas o Bairro</span>
                              <span className="text-xs text-slate-500 block">Mais privacidade — mostra só o nome do bairro</span>
                            </div>
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
                            {voiceTranscript.trim() ? `"${voiceTranscript}"` : 'Fale agora, estamos ouvindo...'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={stopAndSendRecording}
                          className="p-3 bg-primary hover:bg-primary-hover text-white rounded-full transition-all active:scale-95 shadow-md shadow-primary/20 flex items-center justify-center shrink-0"
                          title="Inserir texto"
                        >
                          <Send size={20} className="fill-white translate-x-[1px]" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <textarea
                        rows={6}
                        value={descricaoTrabalho}
                        onChange={(e) => setDescricaoTrabalho(e.target.value)}
                        onBlur={handleAnalyzeDescription}
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary transition-colors resize-none pr-24 text-slate-800 placeholder:text-slate-400"
                        placeholder="Sou encanador há 10 anos, atendo todos os dias da semana até as 18h. Faço reparos em vazamentos, instalação de pias..."
                      ></textarea>

                      {/* Botão Limpar Descrição */}
                      {descricaoTrabalho?.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            setDescricaoTrabalho('');
                            setAtividadePrincipal('');
                            setBioSugerida('');
                            setDescricaoCurta('');
                            setAiFailed(false);
                            setAiErrorMsg('');
                          }}
                          className="absolute right-14 bottom-3 p-3 rounded-full flex items-center justify-center transition-all bg-slate-200 text-slate-600 hover:bg-red-100 hover:text-red-500"
                          title="Limpar tudo e recomeçar"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}

                      {/* Botão de Controle de Voz */}
                      <button
                        type="button"
                        onClick={handleVoiceButtonAction}
                        className="absolute right-3 bottom-3 p-3 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer bg-slate-200 text-slate-600 hover:bg-slate-300"
                        title="Gravar áudio"
                      >
                        <Mic size={20} />
                      </button>
                    </div>
                  )}

                  <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 gap-3">
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <Sparkles size={16} className="text-primary shrink-0" />
                      Escreva em detalhes para nossa IA categorizar seu perfil.
                    </p>
                    <button
                      type="button"
                      onClick={handleAnalyzeDescription}
                      disabled={isAnalyzing || !descricaoTrabalho?.trim()}
                      className="w-full sm:w-auto text-xs font-bold bg-primary text-white hover:bg-primary-hover px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {isAnalyzing ? (
                        <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> <span>Analisando Perfil...</span></span>
                      ) : (
                        <span className="flex items-center gap-2"><Sparkles size={14} /> <span>Clique aqui antes de continuar</span></span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">

                  {/* Campo da Categoria Geral (somente leitura) */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Sua Categoria Principal
                    </label>
                    <input
                      type="text"
                      value={categoriaGeral || ''}
                      readOnly
                      placeholder="Preenchido automaticamente após a análise..."
                      className="w-full px-4 py-3 border rounded-xl transition-colors bg-slate-100 text-slate-600 border-slate-200 focus:outline-none focus:ring-0 cursor-not-allowed"
                    />
                  </div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sua Atividade Principal {aiFailed ? '(Preencha manualmente)' : '(Definida pela IA)'}
                  </label>
                  <input
                    type="text"
                    value={atividadePrincipal || ''}
                    readOnly={!aiFailed}
                    onChange={aiFailed ? (e) => setAtividadePrincipal(e.target.value) : undefined}
                    placeholder={aiFailed ? 'Ex: Encanador, Eletricista, Cabeleireira...' : 'Preenchido automaticamente após a análise...'}
                    className={`w-full px-4 py-3 border rounded-xl transition-colors ${aiFailed
                        ? 'bg-white text-slate-800 border-amber-400 focus:ring-2 focus:ring-amber-400 cursor-text'
                        : 'bg-slate-100 text-slate-600 border-slate-200 focus:outline-none focus:ring-0 cursor-not-allowed'
                      }`}
                  />
                  {aiFailed && (
                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                      ⚠️ {aiErrorMsg}
                    </p>
                  )}
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

                {/* Descrição Curta (para Cards) */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-medium text-slate-700">Descrição Curta (para o card)</label>
                    <span className={`text-xs ${descricaoCurta?.length > 90 ? 'text-red-500' : 'text-slate-400'}`}>{descricaoCurta?.length || 0}/90</span>
                  </div>
                  <input
                    type="text"
                    value={descricaoCurta || ''}
                    onChange={(e) => setDescricaoCurta(e.target.value.slice(0, 90))}
                    placeholder="Ex: Encanador com 10 anos de experiência. Atendo a domicílio."
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-slate-800"
                  />
                  <p className="text-xs text-slate-500 mt-1">Essa descrição curta aparece nos cards de busca. Máximo 90 caracteres.</p>
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
                  <h4 className="font-medium text-slate-800 mb-2">Portfólio (Fotos do seu trabalho)</h4>
                  <input
                    ref={portfolioInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePortfolioInputChange}
                  />
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
                  {portfolioQueue?.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {portfolioQueue?.map((item) => (
                        <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                          <img src={item.preview} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePortfolioItem(item.id);
                            }}
                            className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow"
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
