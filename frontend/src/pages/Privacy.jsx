import React from 'react';
import { ShieldAlert, ShieldCheck, Info, Eye } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sm:p-12">
        {/* Título */}
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Política de Privacidade</h1>
        <p className="text-slate-500 mb-8 text-sm">Última atualização: Junho de 2026</p>

        {/* Resumo Legal Design */}
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 mb-10">
          <h2 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="text-emerald-600 animate-pulse" size={22} />
            Resumo Prático (Como cuidamos dos seus dados):
          </h2>
          <ul className="space-y-4">
            <li className="flex gap-3 text-sm text-emerald-800 leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-750 rounded-full flex items-center justify-center font-bold text-xs select-none">1</span>
              <p><strong>Não vendemos seus dados:</strong> Suas informações servem apenas para o funcionamento do proITA.</p>
            </li>
            <li className="flex gap-3 text-sm text-emerald-800 leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-750 rounded-full flex items-center justify-center font-bold text-xs select-none">2</span>
              <p><strong>Pagamento Seguro:</strong> Não salvamos o número do seu cartão de crédito. Isso é processado por sistemas bancários blindados (Inter/InfinitePay).</p>
            </li>
            <li className="flex gap-3 text-sm text-emerald-800 leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-750 rounded-full flex items-center justify-center font-bold text-xs select-none">3</span>
              <p><strong>Visibilidade Pública:</strong> Lembre-se de que os dados do seu perfil profissional (telefone, endereço) ficarão visíveis para todos no Google e na plataforma.</p>
            </li>
            <li className="flex gap-3 text-sm text-emerald-800 leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-750 rounded-full flex items-center justify-center font-bold text-xs select-none">4</span>
              <p><strong>Controle Total:</strong> Você pode editar ou solicitar a exclusão definitiva da sua conta a qualquer momento.</p>
            </li>
          </ul>
        </div>

        {/* Texto Completo */}
        <div className="border-t border-slate-100 pt-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Eye className="text-slate-600" size={22} />
            Política de Privacidade Completa
          </h2>
          
          <div className="space-y-6 text-slate-650 leading-relaxed text-sm">
            <p>
              O proITA Serviços Digitais Ltda (CNPJ: 67.140.810/0001-14) valoriza a sua privacidade e está comprometido em proteger os seus dados pessoais. Esta Política de Privacidade explica como coletamos, usamos, compartilhamos e protegemos as informações de Visitantes, Usuários Cadastrados e Anunciantes, em total conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e o Marco Civil da Internet (Lei nº 12.965/2014).
            </p>

            <h3 className="font-bold text-base text-slate-900 mt-6 mb-2">1. DADOS QUE COLETAMOS</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>1.1. Visitantes (Navegação sem cadastro):</strong> Coletamos dados básicos de navegação (endereço IP, tipo de navegador, páginas visitadas e tempo de permanência) através de cookies, essenciais para o funcionamento do site e métricas de acesso (base legal: legítimo interesse).</li>
              <li><strong>1.2. Usuários Cadastrados:</strong> Coletamos Nome, Sobrenome, Telefone e Senha (armazenada de forma criptografada/hash). (base legal: execução de contrato e consentimento).</li>
              <li><strong>1.3. Profissionais Anunciantes:</strong> Além dos dados acima, coletamos CPF ou CNPJ, endereço comercial, fotos para portfólio, links de redes sociais e dados de faturamento. (base legal: execução de contrato e obrigação legal).</li>
            </ul>

            <h3 className="font-bold text-base text-slate-900 mt-6 mb-2">2. COMO UTILIZAMOS SEUS DADOS</h3>
            <p>Utilizamos os dados exclusivamente para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Criar e gerenciar sua conta e seus anúncios na plataforma.</li>
              <li>Facilitar o contato entre clientes e profissionais (exibição pública dos dados de contato do Anunciante).</li>
              <li>Processar pagamentos de assinaturas e emitir Notas Fiscais.</li>
              <li>Melhorar os algoritmos de busca e recomendação do sistema.</li>
              <li>Cumprir obrigações legais, como a guarda de registros de acesso exigida pelo Marco Civil da Internet (6 meses).</li>
            </ul>

            <h3 className="font-bold text-base text-slate-900 mt-6 mb-2">3. COMPARTILHAMENTO DE DADOS (COM QUEM COMPARTILHAMOS)</h3>
            <p>
              O proITA NÃO vende, aluga ou comercializa seus dados pessoais para terceiros. O compartilhamento ocorre estritamente com parceiros operacionais necessários para manter o sistema no ar:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Gateways de Pagamento (Inter, InfinitePay):</strong> Para processar Pix, Boletos e Cartões de Crédito de forma segura. O proITA não armazena os dados sensíveis do seu cartão.</li>
              <li><strong>Infraestrutura em Nuvem (Supabase, Vercel):</strong> Para hospedagem segura do banco de dados e arquivos (fotos).</li>
              <li><strong>Autoridades Judiciais:</strong> Mediante ordem judicial válida ou obrigação legal.</li>
            </ul>

            <h3 className="font-bold text-base text-slate-900 mt-6 mb-2">4. VISIBILIDADE PÚBLICA (ANUNCIANTES)</h3>
            <p>
              Ao criar um perfil de Anunciante, o Profissional compreende que as informações inseridas na sua Micropágina e Card (como telefone, bairro/endereço, fotos, catálogo) são de natureza pública. Elas ficarão visíveis para qualquer visitante da plataforma e poderão ser indexadas por mecanismos de busca como o Google.
            </p>

            <h3 className="font-bold text-base text-slate-900 mt-6 mb-2">5. USO DE COOKIES</h3>
            <p>
              Utilizamos "Cookies" (pequenos arquivos de texto salvos no seu dispositivo) para manter a sua sessão activa (não precisar logar toda hora) e entender como você usa o proITA. Você pode desativar os cookies nas configurações do seu navegador, mas isso pode limitar algumas funcionalidades do site.
            </p>

            <h3 className="font-bold text-base text-slate-900 mt-6 mb-2">6. SEUS DIREITOS (LGPD)</h3>
            <p>Você tem o controle total sobre seus dados. A qualquer momento, você pode solicitar:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>A confirmação de que tratamos seus dados e o acesso a eles.</li>
              <li>A correção de dados incompletos ou desatualizados (feito diretamente no seu Painel).</li>
              <li>A exclusão da sua conta e de todos os dados pessoais associados, ressalvados aqueles que a lei nos obrigue a guardar (como notas fiscais e logs de acesso).</li>
              <li>A portabilidade dos dados ou a revogação do consentimento.</li>
            </ul>
            <p className="mt-4">
              Garantimos também a você o direito de solicitar a revisão por pessoa natural de decisões baseadas em tratamento automatizado de dados, tais como a ordenação algorítmica de perfis nos resultados de busca ou a definição automatizada de níveis e selos de destaque (bronze, prata e ouro), caso considere que tais decisões violaram ou prejudicaram de forma indevida a exposição do seu perfil.
            </p>

            <h3 className="font-bold text-base text-slate-900 mt-6 mb-2">7. CONTATO E ENCARREGADO DE DADOS (DPO)</h3>
            <p>
              Para exercer seus direitos ou tirar dúvidas sobre esta Política, entre em contato conosco pelo e-mail: <a href="mailto:contato@proita.com.br" className="text-primary hover:underline font-medium">contato@proita.com.br</a>. Responderemos no prazo máximo de 15 dias.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}