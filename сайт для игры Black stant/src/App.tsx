import { useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { AuthModal } from './components/AuthModal';
import { DownloadSection } from './components/DownloadSection';
import { FeaturesSection } from './components/FeaturesSection';
import { Footer } from './components/Footer';
import { Header, type RegisteredUser } from './components/Header';
import { HeroSection } from './components/HeroSection';

const CURRENT_USER_KEY = 'scooter_stunt_current_user';

export default function App() {
  const [user, setUser] = useState<RegisteredUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CURRENT_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as RegisteredUser;
        if (parsed && typeof parsed.nickname === 'string') {
          setUser(parsed);
        }
      }
    } catch {
      // Ignore invalid local storage state
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: RegisteredUser) => {
    setUser(loggedInUser);
    setAuthModalOpen(false);
    try {
      window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(loggedInUser));
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAuthModalOpen(false);
    try {
      window.localStorage.removeItem(CURRENT_USER_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#0B0E14] text-slate-100">
        <Header user={user} onOpenAuth={() => setAuthModalOpen(true)} />
        <main>
          <HeroSection
            onOpenAuth={() => setAuthModalOpen(true)}
            isRegistered={Boolean(user)}
          />
          <FeaturesSection />
          <DownloadSection user={user} onOpenAuth={() => setAuthModalOpen(true)} />
        </main>
        <Footer />
        <AuthModal
          isOpen={authModalOpen}
          user={user}
          onClose={() => setAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
        />
      </div>
    </MotionConfig>
  );
}
