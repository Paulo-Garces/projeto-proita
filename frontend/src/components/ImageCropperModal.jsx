import React, { useState, useEffect, useRef } from 'react';
import Cropper from 'react-cropper';
import { Loader2 } from 'lucide-react';
import 'cropperjs/dist/cropper.css';

/**
 * ImageCropperModal — Modal de alta fidelidade para recorte preciso de imagens com alças de dimensionamento.
 */
export default function ImageCropperModal({ 
  imageSrc, 
  aspect = 1, 
  cropShape = 'rect', 
  onCropComplete, 
  onComplete, // Suporte a onComplete além de onCropComplete
  onClose,
  isOpen = true
}) {
  const cropperRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [srcUrl, setSrcUrl] = useState(null);
  const [zoomValue, setZoomValue] = useState(0);

  // Converter imageSrc se for File/Blob e limpar no desmonte
  useEffect(() => {
    if (!imageSrc) return;

    let url = '';
    let isCreated = false;

    if (typeof imageSrc === 'string') {
      url = imageSrc;
    } else {
      try {
        url = URL.createObjectURL(imageSrc);
        isCreated = true;
      } catch (e) {
        console.error('[CROP] Erro ao gerar ObjectURL local:', e);
      }
    }

    setSrcUrl(url);

    return () => {
      if (isCreated && url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [imageSrc]);

  // Bloquear o scroll do body e html enquanto o modal estiver aberto
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  const handleRotateLeft = () => {
    cropperRef.current?.cropper?.rotate(-90);
  };

  const handleRotateRight = () => {
    cropperRef.current?.cropper?.rotate(90);
  };

  const handleConfirm = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const cropperInstance = cropperRef.current?.cropper;
      if (cropperInstance) {
        // Obter o canvas recortado preenchendo espaços extras com branco sólido
        const croppedCanvas = cropperInstance.getCroppedCanvas({
          fillColor: '#ffffff', // Garante que o fundo letterbox seja branco sólido para logotipos
          imageSmoothingEnabled: true,
          imageSmoothingQuality: 'high'
        });

        if (!croppedCanvas) {
          throw new Error('Falha ao obter canvas recortado');
        }

        croppedCanvas.toBlob((blob) => {
          if (blob) {
            if (onCropComplete) onCropComplete(blob);
            if (onComplete) onComplete(blob);
          } else {
            alert('Falha ao gerar o arquivo recortado.');
          }
          setIsProcessing(false);
        }, 'image/jpeg', 0.95);
      }
    } catch (e) {
      console.error('[CROP] Erro ao recortar imagem:', e);
      alert('Ocorreu um erro ao processar o recorte da imagem.');
      setIsProcessing(false);
    }
  };



  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 overflow-hidden p-4 pt-24 sm:pt-28 overscroll-contain touch-none">
      {/* Estilos locais para visualização circular do crop do avatar */}
      {cropShape === 'round' && (
        <style>{`
          .cropper-round .cropper-view-box,
          .cropper-round .cropper-face {
            border-radius: 50% !important;
          }
        `}</style>
      )}

      {/* CAIXA BRANCA FORÇADA */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden text-slate-900 mx-4 max-h-[85vh] overscroll-none" onWheel={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="p-4 border-b flex justify-between items-center bg-white shrink-0">
          <h3 className="text-lg font-bold">Recortar Imagem</h3>
          <button onClick={onClose} className="text-red-500 font-bold p-2 cursor-pointer">X</button>
        </div>

        {/* ÁREA DO CROPPER (Altura Fixa Obrigatória com maxHeight e contenção) */}
        <div className="w-full h-[400px] max-h-[60vh] bg-slate-100 flex items-center justify-center relative overflow-hidden flex-1">
          {!srcUrl ? (
             <div className="flex flex-col items-center gap-2">
               <Loader2 className="animate-spin text-blue-600" size={24} />
               <p className="text-slate-600 font-semibold">Processando imagem...</p>
             </div>
          ) : (
             <Cropper
               ref={cropperRef}
               src={srcUrl}
               style={{ height: '400px', width: '100%', maxHeight: '60vh' }}
               aspectRatio={aspect || 1}
               initialAspectRatio={aspect || 1}
               guides={true}
               zoomable={true}
               zoomOnWheel={false}
               zoomOnTouch={true}
               zoom={(e) => setZoomValue(e.detail.ratio)}
               cropBoxResizable={false}
               cropBoxMovable={false}
               background={true}
               dragMode="move"
               toggleDragModeOnDblclick={false}
               viewMode={0}
               autoCropArea={1}
               responsive={true}
               minCropBoxHeight={100}
               minCropBoxWidth={100}
               className={cropShape === 'round' ? 'cropper-round' : ''}
             />
          )}
        </div>

        {/* SLIDER DE ZOOM */}
        <div className="px-6 py-3 flex items-center gap-4 bg-white border-t border-slate-100">
          <span className="text-slate-500 text-sm font-bold">Zoom:</span>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={zoomValue || 1}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setZoomValue(val);
              cropperRef.current?.cropper?.zoomTo(val);
            }}
            className="flex-1 accent-blue-600"
          />
        </div>

        {/* FOOTER - BOTÕES */}
        <div className="p-4 border-t flex justify-end gap-3 bg-white">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded font-bold cursor-pointer">Cancelar</button>
          <button onClick={handleConfirm} disabled={isProcessing} className="px-4 py-2 bg-blue-600 text-white rounded font-bold cursor-pointer">
            {isProcessing ? 'Processando...' : 'Aplicar Recorte'}
          </button>
        </div>

      </div>
    </div>
  );
}
