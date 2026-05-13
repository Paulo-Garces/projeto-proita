import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, 
  MessageSquare, 
  Briefcase, 
  AlertTriangle, 
  Lightbulb, 
  FileText 
} from 'lucide-react';

const Support = () => {
  const supportCards = [
    {
      title: 'Dúvidas Frequentes (FAQ)',
      description: 'Encontre respostas rápidas para as dúvidas mais comuns da nossa comunidade.',
      icon: <HelpCircle className="w-8 h-8 text-blue-600" />,
      linkTo: '/faq',
      isExternal: false,
    },
    {
      title: 'Enviar Mensagem',
      description: 'Fale diretamente com nosso suporte técnico para resolver problemas específicos.',
      icon: <MessageSquare className="w-8 h-8 text-blue-600" />,
      linkTo: '/central-de-ajuda',
      isExternal: false,
    },
    {
      title: 'Contato Comercial',
      description: 'Parcerias e planos. Fale conosco através do e-mail: comercial@proita.com.br',
      icon: <Briefcase className="w-8 h-8 text-blue-600" />,
      linkTo: 'mailto:comercial@proita.com.br',
      isExternal: true,
    },
    {
      title: 'Denúncias',
      description: 'Canal seguro para reportar problemas, abusos ou comportamentos inadequados.',
      icon: <AlertTriangle className="w-8 h-8 text-blue-600" />,
      linkTo: '/denuncias',
      isExternal: false,
    },
    {
      title: 'Dicas de Perfil',
      description: 'Aprenda a destacar seu anúncio e atrair mais clientes para o seu negócio.',
      icon: <Lightbulb className="w-8 h-8 text-blue-600" />,
      linkTo: '/dicas',
      isExternal: false,
    },
    {
      title: 'Termos e Privacidade',
      description: 'Leia nossas regras de uso, termos de serviço e política de privacidade.',
      icon: <FileText className="w-8 h-8 text-blue-600" />,
      linkTo: '/terms',
      isExternal: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Como podemos ajudar?
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Escolha uma das opções abaixo para encontrar a resposta ou falar com nossa equipe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {supportCards.map((card, index) => {
            const CardContent = (
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-8 border border-gray-100 h-full flex flex-col items-center text-center group cursor-pointer">
                <div className="mb-6 p-4 bg-blue-50 rounded-full group-hover:scale-110 transition-transform duration-300">
                  {card.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {card.title}
                </h3>
                <p className="text-gray-600">
                  {card.description}
                </p>
              </div>
            );

            return card.isExternal ? (
              <a 
                key={index} 
                href={card.linkTo}
                className="block outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
              >
                {CardContent}
              </a>
            ) : (
              <Link 
                key={index} 
                to={card.linkTo}
                className="block outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
              >
                {CardContent}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Support;
