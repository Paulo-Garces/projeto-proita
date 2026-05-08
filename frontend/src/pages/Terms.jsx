import { FileText } from 'lucide-react';

export default function Terms() {
  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="bg-primary/10 p-3 rounded-xl text-primary">
              <FileText size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Termos de Uso</h1>
              <p className="text-slate-500 mt-1">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Aceitação dos Termos</h2>
            <p>
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
            </p>
            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. Uso da Plataforma</h2>
            <p>
              Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?
            </p>
            <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Responsabilidades</h2>
            <p>
              Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur? At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
