import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { ZoomIn, ZoomOut, RotateCw, Check, X, Loader2 } from 'lucide-react';
import { getCroppedImgBlob } from '../utils/cropImage';

/**
 * ImageCropperModal — Modal de alta fidelidade para recorte de imagens.
 * 
 * @param {string} imageSrc - URL local da imagem original (ObjectURL)
 * @param {number} aspect - Proporção de aspecto (ex: 1 para 1:1, 16/9 para 16:9)
 * @param {string} cropShape - Formato do recorte: 'rect' ou 'round'
 * @param {function} onCropComplete - Callback chamado com o arquivo Blob recortado
 * @param {function} onClose - Callback chamado ao cancelar/fechar o modal
 */
export default function ImageCropperModal({ 
  imageSrc, 
  aspect = 1, 
  cropShape = 'rect', 
  onCropComplete, 
  onClose 
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels || isProcessing) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImgBlob(imageSrc, croppedAreaPixels);
      if (croppedBlob) {
        onCropComplete(croppedBlob);
      }
    } catch (e) {
      console.error('[CROP] Erro ao recortar imagem:', e);
      alert('Ocorreu um erro ao processar o recorte da imagem.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 w-full max-w-lg shadow-2xl flex flex-col relative overflow-hidden">
        {/* Efeito de brilho de fundo */}
        <div className="absolute top-[-100px] right-[-100px] w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-4 relative z-10">
          <h3 className="text-lg font-bold text-slate-100">Recortar Imagem</h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 bg-slate-800/40 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Container do Cropper (react-easy-crop precisa de parent com position: relative e altura) */}
        <div className="relative w-full h-80 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/60 shadow-inner">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={true}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
          />
        </div>

        {/* Controles de Ajuste */}
        <div className="space-y-4 my-6 relative z-10">
          {/* Zoom */}
          <div className="flex items-center gap-3">
            <ZoomOut size={16} className="text-slate-400" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <ZoomIn size={16} className="text-slate-400" />
          </div>

          {/* Rotação */}
          <div className="flex items-center justify-between text-sm text-slate-400 bg-slate-800/20 p-3 rounded-xl border border-slate-800/40">
            <span className="font-medium flex items-center gap-1.5">
              <RotateCw size={15} /> Rotação da imagem
            </span>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setRotation(prev => (prev - 90 + 360) % 360)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium cursor-pointer"
              >
                -90°
              </button>
              <button 
                type="button"
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium cursor-pointer"
              >
                +90°
              </button>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 border-t border-slate-800/80 pt-4 relative z-10">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Processando...
              </>
            ) : (
              <>
                <Check size={16} /> Aplicar Recorte
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
