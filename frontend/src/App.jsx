import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PwaProvider } from './context/PwaContext';
import Header from './components/Header';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';

// Pages
import Home from './pages/Home';
import Auth from './pages/Auth';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Advertise from './pages/Advertise';
import Dashboard from './pages/Dashboard';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import About from './pages/About';
import Support from './pages/Support';
import Admin from './pages/Admin';
import Planos from './pages/Planos';
import Dicas from './pages/Dicas';
import Faq from './pages/Faq';
import Denuncias from './pages/Denuncias';
import TermsAndPrivacy from './pages/TermsAndPrivacy';
import Mural from './pages/Mural';
import ScrollToTop from './components/ScrollToTop';

function App() {
  console.log('URL da API atual:', import.meta.env.VITE_API_URL);

  return (
    <AuthProvider>
      <PwaProvider>
        <Router>
          <ScrollToTop /> {/* <-- OLHA O ELEVADOR AQUI! */}
          <div className="flex flex-col min-h-screen bg-slate-50">
            <Header />
            <main className="flex-grow page-fade-in">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/search" element={<Search />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/advertise" element={<Advertise />} />
                <Route path="/dashboard/novo-anuncio" element={<Advertise />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/termos" element={<Terms />} />
                <Route path="/termos-de-uso" element={<Terms />} />
                <Route path="/privacidade" element={<Privacy />} />
                <Route path="/sobre" element={<About />} />
                <Route path="/central-de-ajuda" element={<Support />} />
                <Route path="/planos" element={<Planos />} />
                <Route path="/dicas" element={<Dicas />} />
                <Route path="/faq" element={<Faq />} />
                <Route path="/denuncias" element={<Denuncias />} />
                <Route path="/terms" element={<TermsAndPrivacy />} />
                <Route path="/mural" element={<Mural />} />
              </Routes>
            </main>
            <BottomNav />
            <Footer />
          </div>
        </Router>
      </PwaProvider>
    </AuthProvider>
  );
}

export default App;