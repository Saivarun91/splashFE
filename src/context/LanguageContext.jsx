"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '@/lib/api';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  // Initialize language from user profile, localStorage, or default to 'en'
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      // First try to get from user profile
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          if (userData?.preferred_language && (userData.preferred_language === 'en' || userData.preferred_language === 'es')) {
            return userData.preferred_language;
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      // Fallback to localStorage
      const savedLanguage = localStorage.getItem('preferredLanguage');
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
        return savedLanguage;
      }
    }
    return 'en';
  });
  const [translations, setTranslations] = useState({});

  // Load translations immediately on mount
  useEffect(() => {
    const loadInitialTranslations = async () => {
      const initialLang = language;
      try {
        const translationsModule = await import(`@/locales/${initialLang}.json`);
        setTranslations(translationsModule.default);
      } catch (error) {
        console.error('Failed to load initial translations:', error);
        try {
          const enTranslations = await import('@/locales/en.json');
          setTranslations(enTranslations.default);
        } catch (e) {
          console.error('Failed to load English fallback:', e);
        }
      }
    };
    loadInitialTranslations();
  }, []);

  // Listen for changes to user data in localStorage (when user logs in/out or profile updates)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkUserLanguage = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          if (userData?.preferred_language && (userData.preferred_language === 'en' || userData.preferred_language === 'es')) {
            if (userData.preferred_language !== language) {
              setLanguage(userData.preferred_language);
              localStorage.setItem('preferredLanguage', userData.preferred_language);
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    };

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', checkUserLanguage);
    
    // Also check periodically for changes in the same tab (less frequently)
    const interval = setInterval(checkUserLanguage, 2000); // Check every 2 seconds

    return () => {
      window.removeEventListener('storage', checkUserLanguage);
      clearInterval(interval);
    };
  }, [language]);

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const translationsModule = await import(`@/locales/${language}.json`);
        setTranslations(translationsModule.default);
      } catch (error) {
        console.error(`Failed to load translations for ${language}:`, error);
        // Fallback to English if language file doesn't exist
        if (language !== 'en') {
          const enTranslations = await import('@/locales/en.json');
          setTranslations(enTranslations.default);
        }
      }
    };

    loadTranslations();
  }, [language]);

  // Save language preference to backend and localStorage when it changes
  const changeLanguage = async (newLanguage) => {
    if (newLanguage === 'en' || newLanguage === 'es') {
      setLanguage(newLanguage);
      localStorage.setItem('preferredLanguage', newLanguage);
      
      // Save to backend if user is logged in
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (token && savedUser) {
          try {
            const response = await apiService.updateUserProfile({ preferred_language: newLanguage }, token);
            if (response?.success && response?.user) {
              // Update user in localStorage
              try {
                const userData = JSON.parse(savedUser);
                userData.preferred_language = newLanguage;
                localStorage.setItem('user', JSON.stringify(userData));
              } catch (e) {
                console.error('Error updating user in localStorage:', e);
              }
            }
          } catch (error) {
            console.error('Failed to save language preference to backend:', error);
            // Continue anyway - language is saved locally
          }
        }
      }
    }
  };

  // Translation function
  const t = (key) => {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Return the key if translation not found
      }
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
