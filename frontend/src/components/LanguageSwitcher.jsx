import { useTranslation } from 'react-i18next';
import api from '../api';

const LANGS = [
  { code: 'si', label: 'සිංහල' },
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const change = async (code) => {
    i18n.changeLanguage(code);
    if (localStorage.getItem('token')) {
      api.patch('/auth/language', { preferred_lang: code }).catch(() => {});
    }
  };

  return (
    <div className="lang-switcher">
      {LANGS.map((l) => (
        <button
          key={l.code}
          className={i18n.language === l.code ? 'on' : ''}
          onClick={() => change(l.code)}
          aria-label={`Switch to ${l.label}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
