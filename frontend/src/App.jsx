import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';

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

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-slate-50">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/search" element={<Search />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/advertise" element={<Advertise />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/termos" element={<Terms />} />
              <Route path="/privacidade" element={<Privacy />} />
              <Route path="/sobre" element={<About />} />
              <Route path="/suporte" element={<Support />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
