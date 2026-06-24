import React from 'react';
import AdCardV2 from '../components/AdCardV2';

export default function Sandbox() {
  const mockPauloGarces = {
    id: 'mock-paulo-garces',
    name: 'Paulo Garces',
    category: 'Psicólogo Clínico',
    servicePhone: '(88) 99765-4321',
    serviceBairro: 'Boa Vista',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    verified: true,
    rating: 5.0,
    reviewCount: 42,
    socialLinks: [
      { platform: 'instagram', url: 'instagram.com/paulogarces.psi' },
      { platform: 'facebook', url: 'facebook.com/paulogarces.psi' },
      { platform: 'youtube', url: 'youtube.com/c/paulogarces' }
    ],
    partners: JSON.stringify([
      { imageUrl: 'https://placehold.co/120x60/0284c7/ffffff?text=Vida+Psi', name: 'Vida Psi' }
    ]),
    user: {
      nome: 'Paulo',
      sobrenome: 'Garces',
      telefone: '(88) 99765-4321'
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-50 font-sans">
      <div className="max-w-md w-full mb-8 text-center">
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
          Sandbox proITA
        </span>
        <h1 className="text-2xl font-black text-slate-800 mt-2">
          Teste Visual: AdCardV2
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Página isolada para teste de estrutura e comportamento responsivo do novo card.
        </p>
      </div>

      <div className="max-w-md w-full">
        <AdCardV2 professional={mockPauloGarces} />
      </div>

      {/* Grid container para demonstrar robustez com múltiplos tamanhos */}
      <div className="max-w-5xl w-full mt-12 pt-8 border-t border-slate-200">
        <h2 className="text-lg font-bold text-slate-700 text-center mb-6">
          Demonstração em Grid de Busca (Responsivo)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdCardV2 professional={mockPauloGarces} />
          <AdCardV2 
            professional={{
              ...mockPauloGarces,
              id: 'mock-paulo-garces-no-partners',
              name: 'Paulo Garces (Sem Parceiros)',
              partners: '[]' // Testando fallback do banner de apoio
            }} 
          />
        </div>
      </div>
    </div>
  );
}
