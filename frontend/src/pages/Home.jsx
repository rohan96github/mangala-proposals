import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import VideoBackground from '../components/VideoBackground';

const FEATURES = [
  { icon: '✅', key: 'f1' },
  { icon: '🔒', key: 'f2' },
  { icon: '🌐', key: 'f3' },
  { icon: '📍', key: 'f4' },
  { icon: '🎁', key: 'f5' },
  { icon: '🛡️', key: 'f6' },
];

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      {/* Hero with background wedding videos */}
      <section className="hero">
        <VideoBackground />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <p className="hero__tagline">{t('app.tagline')}</p>
          <h1>
            <span className="grad-text">{t('home.heroTitle')}</span>
          </h1>
          <p className="hero__sub">{t('home.heroSub')}</p>
          <div className="hero__cta">
            <Link to="/search?gender=female" className="btn btn-primary btn-lg">
              👰 {t('home.browseBrides')}
            </Link>
            <Link to="/search?gender=male" className="btn btn-gold btn-lg">
              🤵 {t('home.browseGrooms')}
            </Link>
            <Link to="/register" className="btn btn-ghost btn-lg">
              {t('home.postProfile')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="container">
          <h2 className="text-center" style={{ marginBottom: '2.5rem' }}>
            {t('home.featuresTitle')}
          </h2>
          <div className="features-grid">
            {FEATURES.map(({ icon, key }) => (
              <div className="feature-card" key={key}>
                <div className="icon">{icon}</div>
                <h3>{t(`home.${key}Title`)}</h3>
                <p>{t(`home.${key}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety */}
      <div className="container" style={{ paddingBottom: '3rem' }}>
        <div className="safety-banner">
          <span>⚠️</span>
          <span>{t('safety')}</span>
        </div>
      </div>
    </>
  );
}
