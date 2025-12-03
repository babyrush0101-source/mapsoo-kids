import React, { createContext, useContext, useState, useEffect } from 'react';

// Type definitions for our editable content
interface EditableContent {
  [key: string]: any;
}

interface AdminContextType {
  isLoggedIn: boolean;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
  content: EditableContent;
  updateContent: (key: string, value: any) => void;
  saveContent: () => void; // In a real app, this would push to DB
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const DEFAULT_CONTENT = {
  // Home - Hero
  'home.hero.title': 'Raising the Future',
  'home.hero.subtitle': 'Smart devices growing with your child',
  'home.hero.cta': 'Explore Products',
  
  // Products - Early (Default values match en.json roughly, but flat)
  'early.title': 'Baseul Early',
  'early.subtitle': 'Age 3-6 · Pre-school',
  'early.price': 199,
  'early.desc': 'Gentle introduction to technology. Screen-free audio, habits, and safety.',
  
  // Products - Growth
  'growth.title': 'Baseul Growth',
  'growth.subtitle': 'Age 7-12 · Primary School',
  'growth.price': 249,
  'growth.desc': 'The perfect companion for primary school students. Balancing focus, safety, and connection.',
  
  // Products - Explore
  'explore.title': 'Baseul Explore',
  'explore.subtitle': 'Age 13+ · Teenager',
  'explore.price': 399,
  'explore.desc': 'Advanced tools for the curious mind. Coding, creativity, and independence.',
  
  // Footer
  'footer.copyright': '© 2025 Baseul Kids. All rights reserved.',
};

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [content, setContent] = useState<EditableContent>(DEFAULT_CONTENT);

  // Load from localStorage on mount to persist across reloads (frontend demo only)
  useEffect(() => {
    const savedAuth = localStorage.getItem('baseul_admin_auth');
    if (savedAuth === 'true') setIsLoggedIn(true);

    const savedContent = localStorage.getItem('baseul_content');
    if (savedContent) {
      try {
        setContent({ ...DEFAULT_CONTENT, ...JSON.parse(savedContent) });
      } catch (e) {
        console.error("Failed to parse saved content", e);
      }
    }
  }, []);

  const login = (user: string, pass: string) => {
    if (user === 'babyrush' && pass === 'k8km8jvc') {
      setIsLoggedIn(true);
      localStorage.setItem('baseul_admin_auth', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('baseul_admin_auth');
  };

  const updateContent = (key: string, value: any) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const saveContent = () => {
    localStorage.setItem('baseul_content', JSON.stringify(content));
    alert('Content saved successfully! (Local Storage)');
  };

  return (
    <AdminContext.Provider value={{ isLoggedIn, login, logout, content, updateContent, saveContent }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
