import { createContext, useState, useEffect } from 'react';

export const PwaContext = createContext();

export function PwaProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Impede que o prompt automático do navegador apareça
      e.preventDefault();
      // Salva o evento para uso posterior
      setDeferredPrompt(e);
      // Torna o botão visível
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      // Esconde o botão após a instalação com sucesso
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('PWA instalado com sucesso!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    // Dispara o prompt de instalação nativo
    deferredPrompt.prompt();

    // Aguarda a resposta do usuário
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Resposta do usuário para a instalação: ${outcome}`);

    // Limpa o prompt para que não possa ser usado novamente
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <PwaContext.Provider value={{ isInstallable, installApp }}>
      {children}
    </PwaContext.Provider>
  );
}
