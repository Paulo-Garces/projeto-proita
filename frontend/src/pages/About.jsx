export default function About() {
  return (
    <div className="bg-slate-50 min-h-[calc(100vh-64px)] py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Sobre o proITA</h1>
        <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
          Conectando a comunidade de Itapipoca aos melhores profissionais da região.
        </p>
        <div className="prose prose-slate max-w-none text-slate-600 text-left space-y-4 mx-auto">
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur sed vestibulum ante. Aliquam lorem est, iaculis eu aliquet vitae, feugiat in sem.</p>
          <p>Phasellus auctor tellus id odio hendrerit, at suscipit dolor interdum. Ut eget dui justo. Morbi vehicula est sit amet velit facilisis, et sodales odio rhoncus.</p>
        </div>
      </div>
    </div>
  );
}
