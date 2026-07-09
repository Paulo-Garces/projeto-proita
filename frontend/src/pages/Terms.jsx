import React from 'react';
import { ShieldCheck, Scale, FileText, ArrowRight } from 'lucide-react';

export default function Terms() {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - 80;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const sectionsList = [
    { id: 'secao-1', title: '1. Identificação e Aceitação' },
    { id: 'secao-2', title: '2. Definições e Glossário' },
    { id: 'secao-3', title: '3. Perfis e Requisitos' },
    { id: 'secao-4', title: '4. Planos e Contratação' },
    { id: 'secao-5', title: '5. Pagamento e Cancelamento' },
    { id: 'secao-6', title: '6. Funcionalidades' },
    { id: 'secao-7', title: '7. Moderação e Regras' },
    { id: 'secao-8', title: '8. Responsabilidade' },
    { id: 'secao-9', title: '9. Canais de Suporte' },
    { id: 'secao-10', title: '10. Dados e LGPD' },
    { id: 'secao-11', title: '11. Disponibilidade' },
    { id: 'secao-12', title: '12. Propriedade Intelectual' },
    { id: 'secao-13', title: '13. Penalidades' },
    { id: 'secao-14', title: '14. Encerramento' },
    { id: 'secao-15', title: '15. Condutas Vedadas' },
    { id: 'secao-16', title: '16. Proteção de Menores' },
    { id: 'secao-17', title: '17. Disposições Finais' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sm:p-12">
        
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Termos de Uso e Contrato de Assinatura</h1>
          <p className="text-slate-500 text-sm">Versão 2.0  —  Vigente a partir de 17/06/2026</p>
        </div>

        {/* Resumo Legal Design */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mb-10">
          <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="text-blue-600 animate-pulse" size={22} />
            Resumo Prático (O que você precisa saber):
          </h2>
          <ul className="space-y-4">
            <li className="flex gap-3 text-sm text-blue-800 leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-750 rounded-full flex items-center justify-center font-bold text-xs select-none">1</span>
              <p><strong>Portal de Classificados:</strong> Somos um portal de classificados online. Não prestamos os serviços e não participamos das negociações.</p>
            </li>
            <li className="flex gap-3 text-sm text-blue-800 leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-750 rounded-full flex items-center justify-center font-bold text-xs select-none">2</span>
              <p><strong>Plano Grátis:</strong> O Plano Grátis dura 30 dias. Não há cobrança automática após o vencimento.</p>
            </li>
            <li className="flex gap-3 text-sm text-blue-800 leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-750 rounded-full flex items-center justify-center font-bold text-xs select-none">3</span>
              <p><strong>Assinatura Pessoal:</strong> Sua assinatura é pessoal e intransferível. Não a compartilhe.</p>
            </li>
            <li className="flex gap-3 text-sm text-blue-800 leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-750 rounded-full flex items-center justify-center font-bold text-xs select-none">4</span>
              <p><strong>Banner Patrocinador:</strong> O espaço do Banner Patrocinador é de sua responsabilidade exclusiva. Negocie com cautela.</p>
            </li>
            <li className="flex gap-3 text-sm text-blue-800 leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-750 rounded-full flex items-center justify-center font-bold text-xs select-none">5</span>
              <p><strong>Conteúdo Proibido:</strong> É proibido anunciar produtos ilícitos, serviços adultos ou propaganda eleitoral.</p>
            </li>
          </ul>
        </div>

        {/* Navegação Rápida (Table of Contents) */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 mb-10">
          <h2 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider flex items-center gap-2">
            <FileText size={16} className="text-slate-500" />
            Índice de Navegação Rápida
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {sectionsList.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className="flex items-center gap-1.5 text-slate-600 hover:text-primary transition-colors text-left py-1 font-medium cursor-pointer"
              >
                <ArrowRight size={12} className="text-slate-400 shrink-0" />
                {sec.title}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo do Contrato Completo */}
        <div className="prose prose-slate max-w-none text-slate-650 leading-relaxed space-y-8">
          
          {/* SEÇÃO 1 */}
          <section id="secao-1" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
              <Scale size={20} className="text-slate-650" />
              1. IDENTIFICAÇÃO DAS PARTES E ACEITAÇÃO DOS TERMOS
            </h2>
            
            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">1.1 Identificação da Operadora</h3>
            <div className="overflow-x-auto my-4 border border-slate-200 rounded-xl">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">Campo</th>
                    <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">Informação</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-medium text-slate-700">Razão Social</td>
                    <td className="px-6 py-3 text-slate-600">proITA Serviços Digitais Ltda</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-medium text-slate-700">CNPJ</td>
                    <td className="px-6 py-3 text-slate-600">67.140.810/0001-14</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-medium text-slate-700">E-mail principal</td>
                    <td className="px-6 py-3 text-slate-600">contato@proita.com.br</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-medium text-slate-700">Endereço eletrônico</td>
                    <td className="px-6 py-3 text-slate-600">www.proita.com.br</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-medium text-slate-700">Natureza</td>
                    <td className="px-6 py-3 text-slate-600">Plataforma digital — atendimento exclusivamente online</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-medium text-slate-700">Foro</td>
                    <td className="px-6 py-3 text-slate-600">Comarca de Itapipoca — CE</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="text-slate-600 text-sm mb-4">
              O proITA opera exclusivamente de forma digital e não dispõe de endereço físico para atendimento presencial ou visitação. Todo o suporte é prestado pelos canais digitais oficiais descritos nestes Termos.
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">1.2 Natureza Jurídica da Plataforma</h3>
            <p className="text-slate-600 text-sm mb-4">
              O proITA é uma plataforma digital de intermediação de visibilidade que disponibiliza espaço virtual para que prestadores de serviços locais divulguem suas atividades a potenciais clientes. A Operadora atua exclusivamente como intermediária tecnológica, não sendo parte, mandatária, representante, empregadora ou corresponsável em qualquer relação contratual estabelecida entre Anunciantes e Usuários.
            </p>
            <p className="text-slate-600 text-sm mb-4 font-semibold">
              A plataforma não presta, intermedia, garante, supervisa ou responde pela qualidade, legalidade, segurança ou resultado dos serviços anunciados por terceiros em seu ambiente digital.
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">1.3 Aceitação</h3>
            <p className="text-slate-600 text-sm mb-4">
              O acesso, navegação ou utilização da plataforma, ainda que sem cadastro, constitui aceitação integral e irrevogável destes Termos de Uso, da Política de Privacidade e das Diretrizes de Conduta vigentes. O Usuário ou Anunciante que não concordar com qualquer disposição deve abster-se imediatamente de utilizar os serviços.
            </p>
            <p className="text-slate-600 text-sm mb-4">
              Para cadastro de Usuários e contratação de planos por Anunciantes, a aceitação é formalizada por marcação de checkbox específico ("Li e aceito os Termos de Uso e a Política de Privacidade"), com registro automático de data, horário e endereço IP, nos termos do art. 7º, I, da LGPD e do art. 10, §2º, do Marco Civil da Internet.
            </p>
          </section>

          {/* SEÇÃO 2 */}
          <section id="secao-2" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              2. DEFINIÇÕES E GLOSSÁRIO
            </h2>
            <p className="text-slate-600 text-sm mb-4">
              Para os fins destes Termos, aplicam-se as seguintes definições:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
              <li><strong>Plataforma:</strong> o sistema proITA, acessível via navegador ou aplicativo, incluindo todos os seus recursos, funcionalidades e conteúdos.</li>
              <li><strong>Operadora:</strong> proITA Serviços Digitais Ltda, pessoa jurídica responsável pela gestão e operação da plataforma.</li>
              <li><strong>Visitante:</strong> pessoa que acessa e navega na plataforma sem realizar cadastro.</li>
              <li><strong>Usuário Cadastrado:</strong> pessoa física que realizou cadastro gratuito na plataforma com nome, sobrenome, telefone e senha.</li>
              <li><strong>Anunciante:</strong> pessoa física, MEI, autônomo ou microempresa que contrata plano pago ou gratuito para exibir perfil e anúncios de prestação de serviços.</li>
              <li><strong>Perfil:</strong> página pública do Anunciante contendo dados cadastrais, descrição, portfólio, horários e estatísticas.</li>
              <li><strong>Anúncio:</strong> publicação individual de serviço vinculada ao perfil do Anunciante.</li>
              <li><strong>Plano Pro Anual:</strong> contratação por 12 meses ao valor de R$ 44,90, após período de avaliação gratuita.</li>
              <li><strong>Plano Pro Bienal:</strong> contratação por 24 meses ao valor de R$ 74,90, após período de avaliação gratuita.</li>
              <li><strong>Plano Patrocinador Anual:</strong> contratação por 12 meses ao valor de R$ 54,90, com todos os recursos do Plano Pro acrescidos do espaço de banner patrocinado.</li>
              <li><strong>Plano Patrocinador Bienal:</strong> contratação por 24 meses ao valor de R$ 94,90, com todos os recursos do Plano Patrocinador Anual e desconto bienal.</li>
              <li><strong>Período de Avaliação Gratuita:</strong> 30 dias corridos de acesso ao Plano Patrocinador completo, sem custo e sem cobrança automática, contados da criação do perfil.</li>
              <li><strong>Banner Patrocinado:</strong> espaço visual exclusivo disponível nos Planos Patrocinador, dentro do card e micropágina do Anunciante, para veiculação de até 3 imagens de terceiros ou do próprio Anunciante, cujo conteúdo é de responsabilidade exclusiva do Anunciante.</li>
              <li><strong>Micropágina:</strong> página individual do Anunciante com descrição completa, portfólio de até 8 fotos, foto de perfil, capa, horários, redes sociais e catálogo de serviços.</li>
              <li><strong>Selo de Reputação:</strong> indicador automático de níveis Bronze, Prata e Ouro, atribuído por algoritmo com base em critérios objetivos da plataforma e da comunidade, sem constituir verificação, certificação ou garantia da Operadora.</li>
              <li><strong>Conteúdo do Usuário:</strong> toda informação, texto, imagem ou dado inserido por Visitantes, Usuários ou Anunciantes na plataforma.</li>
              <li><strong>Patrocinador do Anunciante:</strong> empresa ou pessoa física que negocia diretamente com o Anunciante a veiculação de imagem no Banner Patrocinado, sem qualquer vínculo com a Operadora.</li>
            </ul>
          </section>

          {/* SEÇÃO 3 */}
          <section id="secao-3" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              3. PERFIS DE ACESSO, CADASTRO E REQUISITOS
            </h2>
            
            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">3.1 Visitante</h3>
            <p className="text-slate-600 text-sm mb-4">
              O Visitante acessa e navega gratuitamente na plataforma sem cadastro, podendo consultar perfis e anúncios públicos dos Anunciantes e visualizar os dados de contato disponibilizados voluntariamente por estes.
            </p>
            <p className="text-slate-650 text-sm mb-4 bg-slate-50 border-l-4 border-slate-400 p-4 rounded-r-xl">
              <strong>Responsabilidade pelo uso de dados de contato públicos:</strong> os dados de contato exibidos no perfil do Anunciante (ex.: número de WhatsApp) são disponibilizados voluntariamente pelo próprio Anunciante. O Visitante que utilizar esses dados para envio de mensagens abusivas, ofensivas, ameaçadoras, criminosas ou para fins de spam responde civil e penalmente por seus próprios atos, independentemente de o contato ter sido iniciado a partir desta plataforma. A Operadora não monitora, controla nem se responsabiliza por comunicações realizadas fora de seu ambiente digital (art. 19 do Marco Civil da Internet — Lei 12.965/2014).
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">3.2 Usuário Cadastrado</h3>
            <p className="text-slate-600 text-sm mb-4">
              O cadastro gratuito requer fornecimento de nome, sobrenome, telefone e senha. O Usuário Cadastrado pode:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 mb-4">
              <li>Salvar listas de favoritos;</li>
              <li>Avaliar e comentar perfis de Anunciantes;</li>
              <li>Utilizar recurso de busca por proximidade geográfica (quando disponível);</li>
              <li>Realizar denúncias de conteúdo ou perfis inadequados.</li>
            </ul>
            <p className="text-slate-600 text-sm mb-4">
              <strong>Requisitos de idade para cadastro de Usuário:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 mb-4">
              <li>Maiores de 18 anos: sem restrições adicionais;</li>
              <li>16 a 17 anos: autorização expressa dos pais ou responsável legal, formalizada no ato do cadastro;</li>
              <li>14 a 15 anos: autorização e assistência dos pais ou responsável legal;</li>
              <li>É vedado o cadastro de menores de 14 anos, conforme art. 14 da LGPD.</li>
            </ul>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">3.3 Anunciante — Requisitos e Faixas Etárias</h3>
            <p className="text-slate-600 text-sm mb-2">
              Podem ser Anunciantes:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 mb-4">
              <li>Pessoas físicas maiores de 18 anos;</li>
              <li>Adolescentes entre 16 e 17 anos não emancipados, mediante autorização expressa e assinatura conjunta do responsável legal, que assume solidariedade pelas obrigações contratuais;</li>
              <li>Adolescentes emancipados a partir de 16 anos, mediante comprovação de emancipação legal (art. 5º, parágrafo único, Código Civil);</li>
              <li>MEIs, MEs e profissionais autônomos legalmente constituídos.</li>
            </ul>
            <p className="text-slate-650 text-sm mb-4 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
              <strong>Adolescentes Anunciantes — ECA e CLT:</strong> em conformidade com a Lei 8.069/1990 (ECA) e o art. 403 da CLT, é vedado o cadastro de Anunciantes menores de 16 anos. Adolescentes entre 16 e 17 anos podem anunciar exclusivamente serviços compatíveis com sua faixa etária, tais como serviços digitais, artísticos, criativos, artesanato, passeio com animais domésticos e similares. São expressamente vedados anúncios de atividades que impliquem trabalho noturno, perigoso, insalubre ou moralmente prejudicial ao desenvolvimento do adolescente, nos termos dos arts. 67 e 69 do ECA. O responsável legal co-signatário responde solidariamente pelo cumprimento destas obrigações.
            </p>
          </section>

          {/* SEÇÃO 4 */}
          <section id="secao-4" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              4. PLANOS, PERÍODO DE AVALIAÇÃO E CONTRATAÇÃO
            </h2>
            
            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">4.1 Período de Avaliação Gratuita</h3>
            <p className="text-slate-600 text-sm mb-4">
              Todo novo Anunciante tem direito a 30 (trinta) dias corridos de uso gratuito do Plano Patrocinador completo, contados da data de criação do perfil. Durante esse período:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 mb-4">
              <li>Não há qualquer cobrança, débito automático ou vinculação a plano pago;</li>
              <li>O perfil fica ativo e visível publicamente com todos os recursos do Plano Patrocinador;</li>
              <li>Ao término, os anúncios são automaticamente suspensos e deixam de aparecer nas buscas;</li>
              <li>O cadastro e os dados permanecem armazenados;</li>
              <li>A reativação ocorre exclusivamente mediante contratação voluntária de plano pago e pagamento confirmado.</li>
            </ul>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">4.2 Planos Disponíveis</h3>
            <div className="overflow-x-auto my-4 border border-slate-200 rounded-xl">
              <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-600">Recurso</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-600">Pro Anual</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-600">Pro Bienal</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-600">Patrocin. Anual</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-600">Patrocin. Bienal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-medium text-slate-700">Valor</td>
                    <td className="px-4 py-2.5 text-slate-600">R$ 44,90</td>
                    <td className="px-4 py-2.5 text-slate-600">R$ 74,90</td>
                    <td className="px-4 py-2.5 text-slate-600">R$ 54,90</td>
                    <td className="px-4 py-2.5 text-slate-600">R$ 94,90</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-medium text-slate-700">Vigência</td>
                    <td className="px-4 py-2.5 text-slate-600">12 meses</td>
                    <td className="px-4 py-2.5 text-slate-600">24 meses</td>
                    <td className="px-4 py-2.5 text-slate-600">12 meses</td>
                    <td className="px-4 py-2.5 text-slate-600">24 meses</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-medium text-slate-700">Anúncios simultâneos</td>
                    <td className="px-4 py-2.5 text-slate-600">2</td>
                    <td className="px-4 py-2.5 text-slate-600">2</td>
                    <td className="px-4 py-2.5 text-slate-600">2</td>
                    <td className="px-4 py-2.5 text-slate-600">2</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-medium text-slate-700">Fotos portfólio</td>
                    <td className="px-4 py-2.5 text-slate-600">8</td>
                    <td className="px-4 py-2.5 text-slate-600">8</td>
                    <td className="px-4 py-2.5 text-slate-600">8</td>
                    <td className="px-4 py-2.5 text-slate-600">8</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-medium text-slate-700">Micropágina completa</td>
                    <td className="px-4 py-2.5 text-slate-600">Sim</td>
                    <td className="px-4 py-2.5 text-slate-600">Sim</td>
                    <td className="px-4 py-2.5 text-slate-600">Sim</td>
                    <td className="px-4 py-2.5 text-slate-600">Sim</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-medium text-slate-700">Estatísticas e funil</td>
                    <td className="px-4 py-2.5 text-slate-600">Sim</td>
                    <td className="px-4 py-2.5 text-slate-600">Sim</td>
                    <td className="px-4 py-2.5 text-slate-600">Sim</td>
                    <td className="px-4 py-2.5 text-slate-600">Sim</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-medium text-slate-700">Banner patrocinado</td>
                    <td className="px-4 py-2.5 text-red-500 font-medium">Não</td>
                    <td className="px-4 py-2.5 text-red-500 font-medium">Não</td>
                    <td className="px-4 py-2.5 text-emerald-600 font-medium">Sim (3 img)</td>
                    <td className="px-4 py-2.5 text-emerald-600 font-medium">Sim (3 img)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-medium text-slate-700">Avaliação (30 dias)</td>
                    <td className="px-4 py-2.5 text-slate-600">Sim</td>
                    <td className="px-4 py-2.5 text-slate-600">Sim</td>
                    <td className="px-4 py-2.5 text-slate-600">Sim</td>
                    <td className="px-4 py-2.5 text-slate-600">Sim</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">4.3 Downgrade de Plano</h3>
            <p className="text-slate-600 text-sm mb-4">
              Se o Anunciante retornar após suspensão optando pelo Plano Pro (sem banner), mantendo anúncios criados durante o Plano Patrocinador, os banners serão automaticamente removidos dos anúncios. Demais conteúdos do perfil são preservados. Não há reembolso pela diferença de planos.
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">4.4 Rebaixamento para Usuário Comum</h3>
            <p className="text-slate-600 text-sm mb-4">
              Caso o Anunciante decida não renovar o plano após o encerramento da vigência, seu cadastro migra automaticamente para o perfil de Usuário Cadastrado, com manutenção dos dados básicos mas sem visibilidade pública do perfil de Anunciante.
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">4.5 Renovação</h3>
            <p className="text-slate-600 text-sm mb-4">
              O proITA poderá enviar lembretes amigáveis de vencimento, porém, a responsabilidade de acompanhar os prazos e efetuar a renovação do plano para evitar a suspensão dos anúncios é inteiramente do Anunciante.
            </p>
          </section>

          {/* SEÇÃO 5 */}
          <section id="secao-5" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              5. PAGAMENTO, NOTA FISCAL E CANCELAMENTO
            </h2>
            
            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">5.1 Meios de Pagamento</h3>
            <p className="text-slate-600 text-sm mb-4">
              Os pagamentos são realizados exclusivamente de forma digital pelos meios disponíveis na plataforma: PIX, cartão de crédito/débito ou boleto bancário. O proITA não dispõe de atendimento presencial nem recebe pagamentos em espécie.
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">5.2 Emissão de Nota Fiscal</h3>
            <p className="text-slate-600 text-sm mb-4">
              O proITA emitirá a Nota Fiscal de Serviços Eletrônica (NFS-e) mediante solicitação expressa do Anunciante através do painel, informando um e-mail válido para envio em até 5 dias úteis.
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">5.3 Direito de Arrependimento — 7 Dias</h3>
            <p className="text-slate-600 text-sm mb-4">
              Nos termos do art. 49 do Código de Defesa do Consumidor (Lei 8.078/1990), o Anunciante que contratar plano pago tem direito ao reembolso integral mediante solicitação realizada em até 7 (sete) dias corridos após a data de contratação, por se tratar de serviço contratado por meio eletrônico, fora do estabelecimento comercial da Operadora.
            </p>
            <p className="text-slate-600 text-sm mb-4">
              A solicitação deve ser feita pelo e-mail <strong>contato@proita.com.br</strong>. O reembolso será processado em até 10 dias úteis pelo meio de pagamento original.
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">5.4 Cancelamento pelo Anunciante após 7 Dias</h3>
            <p className="text-slate-600 text-sm mb-4">
              Após o prazo de 7 dias, o cancelamento pelo Anunciante pode ser solicitado a qualquer tempo. Não há reembolso proporcional ao período não utilizado, salvo em caso de descontinuidade da plataforma pela Operadora (cláusula 14).
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">5.5 Cancelamento por Violação — Sem Reembolso</h3>
            <p className="text-slate-600 text-sm mb-4">
              Em caso de suspensão ou banimento do perfil do Anunciante por violação destes Termos, não haverá reembolso de qualquer valor pago, independentemente do tempo restante do plano.
            </p>
            <p className="text-slate-500 text-xs mb-4">
              Base legal: art. 49 do CDC (7 dias de arrependimento em contratos à distância). Após esse prazo, a não renovação e o cancelamento por violação não geram direito a reembolso, conforme disposições contratuais expressamente aceitas no ato da contratação.
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">5.6 Intransferibilidade da Assinatura</h3>
            <p className="text-slate-600 text-sm mb-4 font-semibold">
              A assinatura de plano é estritamente pessoal e intransferível. O Anunciante não pode ceder, compartilhar, sublicenciar ou transferir sua conta ou plano a terceiros, a qualquer título. O perfil deve refletir a identidade real de quem efetivamente prestará o serviço ao cliente.
            </p>
            <p className="text-slate-600 text-sm mb-4">
              É expressamente vedado anunciar em nome próprio e enviar outra pessoa para prestar o serviço sem prévia e expressa comunicação ao cliente. A violação desta cláusula sujeita o Anunciante à suspensão ou banimento imediato, sem reembolso.
            </p>
          </section>

          {/* SEÇÃO 6 */}
          <section id="secao-6" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              6. FUNCIONALIDADES DA PLATAFORMA
            </h2>
            
            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">6.1 Perfil e Anúncios</h3>
            <p className="text-slate-600 text-sm mb-4">
              Cada assinatura ativa confere direito a até 2 (dois) anúncios simultâneos. Cada anúncio inclui:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 mb-4">
              <li>Nome e telefone de contato exibidos publicamente (conforme escolha do Anunciante);</li>
              <li>Opção de exibir endereço completo ou apenas o bairro;</li>
              <li>Descrição do serviço (com sugestão automática por Inteligência Artificial);</li>
              <li>Identificação de categoria e atividade;</li>
              <li>Micropágina com portfólio de até 8 fotos, foto de perfil, capa, horários de atendimento, redes sociais e catálogo de serviços.</li>
            </ul>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">6.2 Banner Patrocinado — Planos Patrocinador</h3>
            <p className="text-slate-600 text-sm mb-4">
              O Banner Patrocinado é um espaço visual exclusivo disponível nos Planos Patrocinador, dentro do card de exibição e da micropágina do Anunciante. O Anunciante pode veicular até 3 imagens, que podem ser:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 mb-4">
              <li>Sua própria publicidade pessoal ou de seu negócio;</li>
              <li>Publicidade de empresas locais ou terceiros com os quais o Anunciante negocie diretamente;</li>
              <li>Combinação das hipóteses acima.</li>
            </ul>
            <p className="text-slate-650 text-sm mb-4 bg-slate-50 border-l-4 border-slate-400 p-4 rounded-r-xl">
              O Banner Patrocinado é de propriedade e responsabilidade exclusiva do Anunciante. A Operadora não participa, intermedia, regulamenta, aprova ou se responsabiliza pelos acordos comerciais firmados entre o Anunciante e eventuais patrocinadores, nem pelo conteúdo veiculado no banner. Toda relação entre o Anunciante e seus patrocinadores é regida por contrato autônomo entre as partes, sem qualquer vínculo com o proITA.
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">6.3 Denúncia por Patrocinador do Anunciante</h3>
            <p className="text-slate-600 text-sm mb-4">
              Empresas ou pessoas que veiculem publicidade no Banner Patrocinado de determinado Anunciante não têm vínculo contratual com a Operadora. Eventual insatisfação com a relação comercial firmada com o Anunciante deve ser resolvida diretamente entre as partes.
            </p>
            <p className="text-slate-600 text-sm mb-4">
              Caso o patrocinador deseje comunicar à plataforma o uso indevido de sua imagem no banner, poderá fazê-lo pelo canal de denúncias. A Operadora avaliará a denúncia e poderá notificar o Anunciante para remoção do conteúdo, mas não assume qualquer responsabilidade pela relação comercial subjacente.
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">6.4 Selos de Reputação</h3>
            <p className="text-slate-600 text-sm mb-4">
              O Selo de Reputação é atribuído automaticamente por algoritmo da plataforma, sem intervenção humana, em três níveis:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 mb-4">
              <li><strong>Bronze:</strong> critérios básicos de completude de perfil e verificação de e-mail;</li>
              <li><strong>Prata:</strong> critérios intermediários, incluindo tempo de plataforma e avaliações da comunidade;</li>
              <li><strong>Ouro:</strong> critérios avançados de reputação consolidada, tempo e volume de avaliações.</li>
            </ul>
            <p className="text-slate-600 text-sm mb-4 font-semibold">
              O Selo de Reputação NÃO constitui verificação, certificação, endosso ou garantia da Operadora quanto à idoneidade, qualificação, regularidade profissional ou qualidade dos serviços do Anunciante. As informações declaradas no perfil (diplomas, certificados, registros de classe, especialidades) são de responsabilidade exclusiva do Anunciante.
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">6.5 Destaque e Posicionamento</h3>
            <p className="text-slate-600 text-sm mb-4">
              O proITA não adota, a princípio, sistema de impulsionamento pago que privilgie a visibilidade de determinado anúncio em detrimento de outros pelo simples pagamento. O posicionamento dos perfis nas páginas iniciais e resultados de busca é determinado por critérios algorítmicos baseados em avaliações da comunidade, relevância das buscas e completude do perfil, sem favorecimento por categoria ou valor pago.
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">6.6 Estatísticas e Funil de Conversão</h3>
            <p className="text-slate-600 text-sm mb-4">
              O Anunciante tem acesso a painel individual com estatísticas de: impressões do anúncio, visitas ao perfil, cliques no WhatsApp, adições a listas de favoritos e demais métricas disponíveis. Essas informações são de uso exclusivo do Anunciante e são tratadas conforme a Política de Privacidade.
            </p>
          </section>

          {/* SEÇÃO 7 */}
          <section id="secao-7" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              7. CONTEÚDO PERMITIDO, PROIBIDO E MODERAÇÃO
            </h2>
            
            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">7.1 Princípio da Autorresponsabilidade</h3>
            <p className="text-slate-600 text-sm mb-4 font-semibold">
              O proITA não realiza triagem prévia ou aprovação manual dos anúncios publicados. Ao criar ou editar um anúncio, o Anunciante declara, sob pena das sanções previstas nestes Termos e na legislação aplicável, que o conteúdo publicado é lícito e que possui as habilitações legais exigidas para a atividade anunciada.
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">7.2 Conteúdo Expressamente Vedado</h3>
            <p className="text-slate-600 text-sm mb-2">
              É absolutamente proibida a publicação, nos perfis, anúncios ou banners, de:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600 mb-4">
              <li>Conteúdo pornográfico, sexual explícito ou erótico de qualquer natureza, inclusive no banner patrocinado (Lei 11.340/2006, arts. 234 e ss. do Código Penal);</li>
              <li>Anúncios de prostituição, acompanhantes ou serviços sexuais pagos: embora a prostituição em si não seja tipificada como crime, sua intermediação via plataforma digital pode configurar favorecimento à prostituição (arts. 228 a 231-A do Código Penal), razão pela qual estes anúncios são expressamente vedados;</li>
              <li>Anúncios de segurança privada armada sem comprovação de registro ativo na Polícia Federal e habilitação legal nos termos da Lei 7.102/1983 e Decreto 9.847/2019 — MEIs e autônomos não podem prestar este serviço individualmente;</li>
              <li>Oferta, venda, troca ou divulgação de substâncias entorpecentes, drogas ilícitas ou controladas, armas de fogo, munições ou explosivos;</li>
              <li>Conteúdo que configure crime de preconceito de raça, cor, etnia, religião, procedência nacional, gênero, orientação sexual ou deficiência (Lei 7.716/1989, art. 5º, CF/88);</li>
              <li>Propaganda político-eleitoral durante os períodos vedados pela legislação eleitoral (Lei 9.504/1997 e Resoluções do TSE), especialmente nos banners patrocinados — a veiculação de propaganda eleitoral irregular sujeita o Anunciante às sanções da legislação eleitoral, sem qualquer responsabilidade da Operadora;</li>
              <li>Conteúdo que explore sexualmente ou expresse qualquer forma de abuso de crianças e adolescentes (arts. 240 e 241 do ECA — Lei 8.069/1990);</li>
              <li>Serviços de profissões legalmente regulamentadas (medicina, advocacia, engenharia, psicologia, nutrição etc.) sem registro ativo no respectivo Conselho de Classe — o Anunciante declara possuí-lo ao publicar;</li>
              <li>Conteúdo que configure golpe, fraude, estelionato ou qualquer crime contra o patrimônio (art. 171 e ss. do Código Penal).</li>
            </ol>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">7.3 Canal de Denúncia</h3>
            <p className="text-slate-600 text-sm mb-4">
              Qualquer pessoa pode denunciar conteúdo ou perfil que viole estes Termos pelo canal de denúncias disponível na plataforma. Após recebimento, a Operadora analisará a denúncia e poderá:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 mb-4">
              <li>Notificar o Anunciante para adequação do conteúdo em prazo determinado;</li>
              <li>Remover o conteúdo específico;</li>
              <li>Suspender o perfil temporariamente;</li>
              <li>Banir o perfil definitivamente, sem reembolso.</li>
            </ul>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">7.4 Denúncias Falsas ou de Má-Fé</h3>
            <p className="text-slate-650 text-sm mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
              O Usuário que realizar denúncias sabidamente infundadas, com propósito de prejudicar concorrente, vingar-se de Anunciante por motivos pessoais ou de qualquer outra forma de má-fé, responde civil e penalmente por seus atos. A Operadora reserva-se o direito de suspender ou banir o Usuário que abusar do mecanismo de denúncia, e poderá fornecer os dados de identificação do denunciante a autoridades competentes ou ao Anunciante prejudicado, nos termos da lei.
            </p>
            <p className="text-slate-500 text-xs mb-4">
              Base legal: arts. 186 e 187 do Código Civil (ato ilícito e abuso de direito); art. 139 e 140 do Código Penal (difamação e injúria); art. 19, §1º, do Marco Civil da Internet (responsabilidade por conteúdo de terceiros).
            </p>
          </section>

          {/* SEÇÃO 8 */}
          <section id="secao-8" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              8. RESPONSABILIDADE DA OPERADORA E LIMITAÇÕES
            </h2>
            
            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">8.1 Intermediária de Visibilidade</h3>
            <p className="text-slate-600 text-sm mb-4">
              O proITA atua exclusivamente como plataforma de intermediação tecnológica de visibilidade. Nos termos do art. 19 da Lei 12.965/2014 (Marco Civil da Internet), a Operadora não é responsável por danos decorrentes de Conteúdo do Usuário, salvo quando, após notificação judicial específica, deixar de tomar as providências necessárias para tornar o conteúdo indisponível.
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">8.2 Isenções Específicas</h3>
            <p className="text-slate-600 text-sm mb-2">
              A Operadora NÃO se responsabiliza por:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-600 mb-4">
              <li>A qualidade, pontualidade, legalidade, segurança ou resultado dos serviços prestados por Anunciantes a seus clientes;</li>
              <li>Danos materiais, morais, físicos ou de qualquer natureza sofridos por clientes decorrentes de serviços contratados com Anunciantes;</li>
              <li>Conteúdo falso, enganoso, ofensivo ou ilícito publicado por Anunciantes ou Usuários;</li>
              <li>Comunicações realizadas fora da plataforma, inclusive mensagens enviadas via WhatsApp, telefone ou outros meios a partir de dados de contato públicos do perfil;</li>
              <li>Crimes ou ilícitos praticados por Anunciantes nas residências, estabelecimentos ou em qualquer local de atendimento a clientes;</li>
              <li>Acordos comerciais firmados entre Anunciantes e seus patrocinadores de banner;</li>
              <li>Indisponibilidade temporária por manutenção, falhas técnicas, ataques cibernéticos ou causas de força maior;</li>
              <li>Informações profissionais falsas (diplomas, certificados, registros) declaradas pelo Anunciante em seu perfil.</li>
            </ol>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">8.3 Responsabilidade do Anunciante perante o Consumidor</h3>
            <p className="text-slate-600 text-sm mb-4">
              O Anunciante, ao prestar serviço a cliente captado pela plataforma, é o único e exclusivo fornecedor para fins do Código de Defesa do Consumidor (Lei 8.078/1990) e do Código Civil, respondendo integralmente pelos vícios, defeitos, danos, descumprimentos e eventuais crimes decorrentes da relação estabelecida.
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">8.4 Responsabilidade dos Usuários por Avaliações</h3>
            <p className="text-slate-600 text-sm mb-4">
              Avaliações, comentários e denúncias publicados por Usuários são de responsabilidade exclusiva de seus autores. Avaliações com conteúdo sabidamente falso podem configurar difamação (art. 139 do CP) e dar ensejo a indenização cível, devendo o Usuário responder individualmente perante o Anunciante prejudicado.
            </p>
          </section>

          {/* SEÇÃO 9 */}
          <section id="secao-9" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              9. CANAIS DE SUPORTE E ATENDIMENTO
            </h2>
            
            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">9.1 Canais Disponíveis</h3>
            <p className="text-slate-600 text-sm mb-4">
              O proITA opera exclusivamente de forma digital. Os canais de suporte disponíveis são:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 mb-4">
              <li>E-mail principal: <strong>contato@proita.com.br</strong> (respostas em até 3 dias úteis);</li>
              <li>Canal de suporte interno da plataforma (formulário/chat disponível na área logada);</li>
              <li>WhatsApp automatizado: quando disponível, conforme comunicado na plataforma.</li>
            </ul>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">9.2 Recuperação de Senha</h3>
            <p className="text-slate-600 text-sm mb-4">
              A recuperação de senha é realizada por e-mail cadastrado. Usuários que não cadastrarem e-mail deverão entrar em contato pelo canal de suporte para verificação de identidade e redefinição manual. A Operadora recomenda fortemente o cadastro de e-mail para facilitar a recuperação de acesso.
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">9.3 Notificações Judiciais e Extrajudiciais</h3>
            <p className="text-slate-600 text-sm mb-4">
              Notificações, intimações judiciais e comunicações extrajudiciais formais devem ser encaminhadas exclusivamente ao e-mail <strong>contato@proita.com.br</strong> ou pelo endereço de sede conforme dados do CNPJ. Comunicações enviadas por outros canais não constituem notificação formal para fins legais.
            </p>
            <p className="text-slate-600 text-sm mb-4">
              Conforme art. 10, §3º, e art. 15 do Marco Civil da Internet, a Operadora manterá registros de conexão e acesso à plataforma pelo prazo mínimo legalmente exigido, podendo fornecê-los mediante ordem judicial.
            </p>
          </section>

          {/* SEÇÃO 10 */}
          <section id="secao-10" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              10. PROTEÇÃO DE DADOS PESSOAIS — LGPD
            </h2>
            <p className="text-slate-600 text-sm mb-4">
              O tratamento de dados pessoais realizado pelo proITA obedece às disposições da Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD), ao Marco Civil da Internet (Lei 12.965/2014) e às diretrizes da Autoridade Nacional de Proteção de Dados (ANPD).
            </p>
            <p className="text-slate-600 text-sm mb-4">
              As bases legais aplicáveis ao tratamento são: execução de contrato (art. 7º, V), cumprimento de obrigação legal (art. 7º, II), legítimo interesse (art. 7º, IX) e consentimento (art. 7º, I), conforme especificado na Política de Privacidade disponível na plataforma.
            </p>
            
            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">10.1 Dados Coletados por Perfil</h3>
            <div className="overflow-x-auto my-4 border border-slate-200 rounded-xl">
              <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-semibold text-slate-600">Perfil</th>
                    <th scope="col" className="px-6 py-3 font-semibold text-slate-600">Dados Coletados</th>
                    <th scope="col" className="px-6 py-3 font-semibold text-slate-600">Base Legal LGPD</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-medium text-slate-700">Visitante</td>
                    <td className="px-6 py-3 text-slate-600">IP, dados de navegação</td>
                    <td className="px-6 py-3 text-slate-600">Legítimo interesse (art. 7º, IX)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-medium text-slate-700">Usuário Cadastrado</td>
                    <td className="px-6 py-3 text-slate-600">Nome, telefone, senha (hash), foto (opt.), localização (futura)</td>
                    <td className="px-6 py-3 text-slate-600">Execução de contrato / Consentimento</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-medium text-slate-700">Anunciante</td>
                    <td className="px-6 py-3 text-slate-600">Nome/Razão Social, CPF/CNPJ, telefone, endereço/bairro, e-mail, fotos, dados de pagamento</td>
                    <td className="px-6 py-3 text-slate-600">Execução de contrato / Obrigação legal</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">10.2 Direitos dos Titulares</h3>
            <p className="text-slate-600 text-sm mb-4">
              Nos termos do art. 18 da LGPD, os titulares podem solicitar: confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação, informação sobre compartilhamento e revogação do consentimento, pelo e-mail <strong>contato@proita.com.br</strong>. Resposta em até 15 dias úteis.
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">10.3 Dados de Menores</h3>
            <p className="text-slate-600 text-sm mb-4">
              Em conformidade com o art. 14 da LGPD e o ECA, o proITA não coleta dados de menores de 14 anos. Para adolescentes de 14 a 17 anos, exige-se consentimento do responsável legal, conforme descrito na cláusula 3.
            </p>
          </section>

          {/* SEÇÃO 11 */}
          <section id="secao-11" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              11. DISPONIBILIDADE, MANUTENÇÃO E SLA
            </h2>
            <p className="text-slate-600 text-sm mb-4">
              A Operadora compromete-se a envidar esforços razoáveis para manter a plataforma disponível 24 (vinte e quatro) horas por dia, 7 (sete) dias por semana, em todos os dias do ano.
            </p>
            <p className="text-slate-600 text-sm mb-2">
              Não constitui inadimplemento contratual a indisponibilidade decorrente de:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 mb-4">
              <li>Manutenções programadas, comunicadas com antecedência mínima de 12 horas;</li>
              <li>Falhas em serviços de terceiros (servidores, CDN, provedores de internet);</li>
              <li>Ataques cibernéticos (DDoS, ransomware ou similares);</li>
              <li>Casos fortuitos ou de força maior (art. 393 do Código Civil);</li>
              <li>Determinações judiciais ou administrativas.</li>
            </ul>
            <p className="text-slate-600 text-sm mb-4">
              Interrupções não programadas serão comunicadas pelos canais da plataforma assim que possível, com previsão de restabelecimento.
            </p>
          </section>

          {/* SEÇÃO 12 */}
          <section id="secao-12" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              12. PROPRIEDADE INTELECTUAL
            </h2>
            <p className="text-slate-600 text-sm mb-4">
              A marca "proITA", o logotipo, o design, o código-fonte, o layout, os textos institucionais e demais elementos da plataforma são de titularidade da Operadora, protegidos pela Lei 9.279/1996 (Lei de Propriedade Industrial), Lei 9.609/1998 (Lei de Software) e Lei 9.610/1998 (Lei de Direitos Autorais).
            </p>
            <p className="text-slate-600 text-sm mb-4">
              O Conteúdo do Usuário (fotos, textos, descrições) postado pelos Anunciantes permanece de titularidade do respectivo Anunciante. Ao publicar, o Anunciante concede à Operadora licença não exclusiva, gratuita e revogável para exibir, reproduzir e distribuir o conteúdo na plataforma e em materiais promocionais, enquanto o perfil estiver ativo.
            </p>
            <p className="text-slate-600 text-sm mb-4 font-semibold">
              É vedada a reprodução, cópia, extração automatizada (scraping), engenharia reversa ou redistribuição de qualquer conteúdo ou funcionalidade da plataforma sem autorização prévia e expressa da Operadora.
            </p>
          </section>

          {/* SEÇÃO 13 */}
          <section id="secao-13" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              13. PENALIDADES E SANÇÕES
            </h2>
            <p className="text-slate-600 text-sm mb-4">
              A violação de qualquer disposição destes Termos sujeita o infrator, conforme a gravidade da conduta e a critério da Operadora:
            </p>
            
            <div className="overflow-x-auto my-4 border border-slate-200 rounded-xl">
              <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-semibold text-slate-600">Sanção</th>
                    <th scope="col" className="px-6 py-3 font-semibold text-slate-600">Situações Aplicáveis</th>
                    <th scope="col" className="px-6 py-3 font-semibold text-slate-600">Reembolso</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-medium text-slate-700">Advertência</td>
                    <td className="px-6 py-3 text-slate-600">Primeira infração leve, conteúdo inadequado pontual</td>
                    <td className="px-6 py-3 text-slate-600">N/A</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-medium text-slate-700">Remoção de conteúdo</td>
                    <td className="px-6 py-3 text-slate-600">Conteúdo vedado isolado</td>
                    <td className="px-6 py-3 text-slate-600">Não</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-medium text-slate-700">Suspensão temporária</td>
                    <td className="px-6 py-3 text-slate-600">Reincidência, infração moderada, denúncia em análise</td>
                    <td className="px-6 py-3 text-slate-600">Não</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-medium text-slate-700">Banimento definitivo</td>
                    <td className="px-6 py-3 text-slate-600">Infração grave, crime, reincidência grave, golpe confirmado</td>
                    <td className="px-6 py-3 text-slate-600">Não</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-slate-600 text-sm mb-4">
              Em infrações que configurem crime (aplicáveis tipificações do Código Penal, ECA, Lei de Drogas, Lei de Armas, entre outras), a Operadora reserva-se o direito de comunicar as autoridades competentes (Polícia Civil, Ministério Público) e fornecer os dados cadastrais e registros de acesso disponíveis, mediante requisição legal ou por iniciativa própria quando a gravidade exigir.
            </p>
            <p className="text-slate-650 text-sm mb-4 bg-slate-50 border-l-4 border-slate-400 p-4 rounded-r-xl">
              <strong>Boletim de Ocorrência como elemento de denúncia:</strong> em casos de crimes praticados por Anunciante nas dependências do cliente (furto, lesão corporal, etc.), a apresentação de Boletim de Ocorrência pelo cliente ao canal de denúncias da plataforma será considerada como elemento de prova para análise de suspensão ou banimento do perfil.
            </p>
          </section>

          {/* SEÇÃO 14 */}
          <section id="secao-14" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              14. ENCERRAMENTO E DESCONTINUIDADE DA PLATAFORMA
            </h2>
            <p className="text-slate-600 text-sm mb-4">
              A Operadora reserva-se o direito de encerrar, suspender ou descontinuar a plataforma a qualquer tempo, por decisão empresarial, determinação legal ou força maior, observando as seguintes condições:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-600 mb-4">
              <li>Os Anunciantes com planos pagos e vigentes serão notificados com antecedência mínima de 30 (trinta) dias corridos por e-mail cadastrado;</li>
              <li>Será concedido reembolso proporcional ao período não utilizado do plano vigente, calculado pro rata die a partir da data de comunicação do encerramento;</li>
              <li>Os dados pessoais dos usuários serão tratados conforme a Política de Privacidade, com prazo para portabilidade ou exclusão;</li>
              <li>A Operadora não responde por danos indiretos, lucros cessantes ou perdas de oportunidade decorrentes do encerramento da plataforma.</li>
            </ol>
            <p className="text-slate-600 text-sm mb-4 font-semibold">
              Em caso de encerramento da plataforma, os dados pessoais e arquivos de portfólio serão excluídos. É responsabilidade do Anunciante manter cópias de segurança (backup) de suas fotos e textos.
            </p>
            <p className="text-slate-500 text-xs mb-4">
              Base legal: arts. 473 e 474 do Código Civil (resilição unilateral com pré-aviso); art. 51, IV, do CDC (vedação de cláusula que resulte em ônus excessivo ao consumidor); princípio da boa-fé objetiva (art. 422 do CC).
            </p>
          </section>

          {/* SEÇÃO 15 */}
          <section id="secao-15" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              15. CONDUTAS VEDADAS E REGRAS DE COMUNIDADE
            </h2>
            <p className="text-slate-600 text-sm mb-2">
              É vedado a qualquer pessoa que utilize a plataforma, independentemente de perfil:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-600 mb-4">
              <li>Praticar qualquer forma de assédio, bullying, discriminação ou discurso de ódio contra outros usuários, Anunciantes ou a Operadora;</li>
              <li>Utilizar a plataforma para fins fraudulentos, incluindo falsidade ideológica, clonagem de perfis ou representação enganosa de qualificações profissionais;</li>
              <li>Tentar acessar áreas restritas, manipular funcionalidades ou realizar ataques ao sistema;</li>
              <li>Coletar sistematicamente dados de outros usuários ou Anunciantes sem autorização;</li>
              <li>Publicar spam, correntes ou conteúdo publicitário não autorizado nos campos de comentário ou avaliação;</li>
              <li>Usar a plataforma para cometer ou facilitar crimes de qualquer natureza.</li>
            </ol>
          </section>

          {/* SEÇÃO 16 */}
          <section id="secao-16" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              16. PROTEÇÃO DA CRIANÇA E DO ADOLESCENTE
            </h2>
            <p className="text-slate-650 text-sm mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
              Em conformidade com a Lei 8.069/1990 (Estatuto da Criança e do Adolescente — ECA) e a Lei 13.709/2018 (LGPD, art. 14):
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-600 mb-4">
              <li>É expressamente vedado o acesso ou cadastro de crianças (menores de 12 anos) em qualquer perfil da plataforma;</li>
              <li>O cadastro de adolescentes entre 12 e 13 anos é vedado;</li>
              <li>Adolescentes entre 14 e 15 anos podem cadastrar-se como Usuários com autorização e assistência do responsável legal;</li>
              <li>Adolescentes entre 16 e 17 anos podem cadastrar-se como Usuários com autorização do responsável;</li>
              <li>Para perfis de Anunciante, aplica-se a cláusula 3.3 com restrições de atividades por faixa etária;</li>
              <li>Todo e qualquer conteúdo sexualizado, violento, discriminatório ou inadequado para menores é absolutamente vedado na plataforma;</li>
              <li>A Operadora colaborará integralmente com autoridades competentes em casos de suspeita de exploração ou abuso de crianças e adolescentes identificados na plataforma.</li>
            </ol>
            <p className="text-slate-600 text-sm mb-4 font-semibold">
              A plataforma se compromete a remover imediatamente qualquer conteúdo que configure exploração sexual de criança ou adolescente (arts. 240 e 241 do ECA), independentemente de ordem judicial, e a comunicar o fato à autoridade policial competente.
            </p>
          </section>

          {/* SEÇÃO 17 */}
          <section id="secao-17" className="scroll-mt-24 pb-8">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              17. DISPOSIÇÕES FINAIS
            </h2>
            
            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">17.1 Vigência e Alterações</h3>
            <p className="text-slate-600 text-sm mb-4">
              Estes Termos entram em vigor na data indicada na capa e vigoram por prazo indeterminado. A Operadora reserva-se o direito de alterá-los a qualquer tempo, com notificação aos usuários com antecedência mínima de 15 dias por e-mail ou notificação na plataforma. O uso continuado após a notificação implica aceitação das novas condições.
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">17.2 Legislação Aplicável</h3>
            <p className="text-slate-600 text-sm mb-2">
              Estes Termos são regidos pelas leis da República Federativa do Brasil, em especial:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 list-disc pl-5 text-sm text-slate-600 mb-4">
              <li>Constituição Federal de 1988 (arts. 1º, 5º e 170);</li>
              <li>Código Civil (Lei 10.406/2002);</li>
              <li>Código de Defesa do Consumidor (Lei 8.078/1990);</li>
              <li>Marco Civil da Internet (Lei 12.965/2014);</li>
              <li>Lei Geral de Proteção de Dados — LGPD (Lei 13.709/2018);</li>
              <li>Estatuto da Criança e do Adolescente — ECA (Lei 8.069/1990);</li>
              <li>Código Penal (Decreto-Lei 2.848/1940) e legislação penal especial;</li>
              <li>Lei de Propriedade Industrial (Lei 9.279/1996);</li>
              <li>Lei Eleitoral (Lei 9.504/1997) e Resoluções TSE;</li>
              <li>Consolidação das Leis do Trabalho — CLT (arts. 403 e ss.);</li>
              <li>Código de Processo Civil (Lei 13.105/2015).</li>
            </ul>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">17.3 Foro</h3>
            <p className="text-slate-600 text-sm mb-4 font-semibold">
              Para dirimir quaisquer controvérsias decorrentes destes Termos, fica eleito o Foro da Comarca de Itapipoca, Estado do Ceará, com renúncia a qualquer outro, por mais privilegiado que seja (art. 63 do CPC).
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">17.4 Nulidade Parcial</h3>
            <p className="text-slate-600 text-sm mb-4">
              A eventual invalidade ou inaplicabilidade de qualquer disposição destes Termos não afeta a validade das demais cláusulas, que permanecerão em pleno vigor.
            </p>

            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">17.5 Contato</h3>
            <p className="text-slate-600 text-sm mb-4">
              Dúvidas, solicitações ou notificações: <strong>contato@proita.com.br</strong>
            </p>
          </section>

        </div>

        {/* Rodapé Interno do Contrato */}
        <div className="border-t border-slate-100 pt-6 mt-8 text-center text-xs text-slate-400">
          <p>proITA Serviços Digitais Ltda — Conectando Itapipoca</p>
          <p className="mt-1">Versão 2.0 | CNPJ: 67.140.810/0001-14 | Itapipoca/CE — Brasil</p>
        </div>

      </div>
    </div>
  );
}