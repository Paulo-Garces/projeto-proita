import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  CircleDollarSign,
  Settings,
  TrendingUp,
  Activity,
  Briefcase,
  Edit,
  Ban
} from 'lucide-react';

export default function Admin() {
  const { user, token, isAuthenticated, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ totalUsers: 0, totalAds: 0, newUsersThisWeek: 0 });
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    if (user?.role === 'ADMIN' && token) {
      // Busca Estatísticas
      fetch(`${API_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) setStats(data.data);
        })
        .catch(console.error);

      // Busca Usuários
      fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) setUsersList(data.data);
        })
        .catch(console.error);
    }
  }, [user, token]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading || !isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  // Verifica se o usuário é realmente ADMIN, caso contrário, não deixa acessar
  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 shadow-sm max-w-md text-center">
          <ShieldAlert className="mx-auto h-12 w-12 mb-4" />
          <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
          <p>Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'professionals', label: 'Gestão de Profissionais', icon: Briefcase },
    { id: 'moderation', label: 'Central de Moderação', icon: ShieldAlert },
    { id: 'finance', label: 'Financeiro & PIX', icon: CircleDollarSign },
    { id: 'settings', label: 'Configurações Globais', icon: Settings },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col md:flex-row bg-slate-50 pt-16">

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-4 shrink-0">
        <div className="mb-8 px-4 hidden md:block">
          <h2 className="text-lg font-bold text-slate-800">Admin Panel</h2>
          <p className="text-xs text-slate-500">Gestão do proITA</p>
        </div>

        <nav className="space-y-1 flex md:flex-col overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap md:whitespace-normal text-sm font-medium w-full ${isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <Icon size={20} className={isActive ? 'text-primary' : 'text-slate-400'} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">

          <header className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              {navItems.find(i => i.id === activeTab)?.label}
            </h1>
            <p className="text-slate-500 mt-1">Gerencie e monitore a plataforma.</p>
          </header>

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Card 1 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Users size={24} />
                  </div>
                  {stats.newUsersThisWeek > 0 && (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                      <TrendingUp size={12} /> +{stats.newUsersThisWeek}
                    </span>
                  )}
                </div>
                <h3 className="text-slate-500 text-sm font-medium mb-1">Total de Usuários</h3>
                <p className="text-3xl font-bold text-slate-800">{stats.totalUsers}</p>
              </div>

              {/* Card 2 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <Briefcase size={24} />
                  </div>
                </div>
                <h3 className="text-slate-500 text-sm font-medium mb-1">Total de Profissionais</h3>
                <p className="text-3xl font-bold text-slate-800">{stats.totalAds}</p>
              </div>

              {/* Card 3 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Activity size={24} />
                  </div>
                </div>
                <h3 className="text-slate-500 text-sm font-medium mb-1">Acessos Hoje</h3>
                <p className="text-3xl font-bold text-slate-800">-</p>
              </div>

              {/* Card 4 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                    <Activity size={24} />
                  </div>
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-slate-500 text-sm font-medium mb-1">Usuários Online</h3>
                <p className="text-3xl font-bold text-slate-800">0</p>
              </div>

            </div>
          )}

          {activeTab === 'professionals' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-medium">
                      <th className="py-4 px-6">Nome</th>
                      <th className="py-4 px-6">Telefone</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 text-sm font-medium text-slate-800">{u.nome}</td>
                        <td className="py-4 px-6 text-sm text-slate-600">{u.telefone}</td>
                        <td className="py-4 px-6">
                          {u.hasAd ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Profissional
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                              Usuário Comum
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button title="Editar Perfil" className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                            <Edit size={18} />
                          </button>
                          <button title="Suspender Conta" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Ban size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {usersList.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-slate-500">Nenhum usuário encontrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab !== 'dashboard' && activeTab !== 'professionals' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
              <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4 text-slate-400">
                <Settings size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Módulo em Desenvolvimento</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Esta seção do painel administrativo será implementada nas próximas atualizações.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
