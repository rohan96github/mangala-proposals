import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import ProfileView from './pages/ProfileView';
import ProfileForm from './pages/ProfileForm';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <div className="container">
        <p>© {new Date().getFullYear()} {t('app.title')} · Sri Lanka</p>
        <p style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Built with ❤️ for Sri Lankan families</p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/"                element={<Home />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/search"          element={<Search />} />
          <Route path="/profile/new"     element={<ProfileForm />} />
          <Route path="/profile/edit/:id" element={<ProfileForm />} />
          <Route path="/profile/:id"     element={<ProfileView />} />
          <Route path="/dashboard"       element={<Dashboard />} />
          <Route path="/admin"           element={<Admin />} />
          <Route path="/admin/login"    element={<AdminLogin />} />
          <Route path="*"               element={
            <div className="container" style={{ paddingTop: '5rem', textAlign: 'center' }}>
              <h1>404</h1>
              <p style={{ color: 'var(--text-300)' }}>Page not found.</p>
              <a href="/" className="btn btn-primary mt-3">Go Home</a>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
