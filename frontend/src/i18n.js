import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import si from './locales/si.json';
import en from './locales/en.json';
import ta from './locales/ta.json';

const saved = localStorage.getItem('lang') || 'si';

i18n.use(initReactI18next).init({
  resources: {
    si: { translation: si },
    en: { translation: en },
    ta: { translation: ta },
  },
  lng: saved,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', lng => {
  localStorage.setItem('lang', lng);
  document.documentElement.lang = lng;
});

export default i18n;
