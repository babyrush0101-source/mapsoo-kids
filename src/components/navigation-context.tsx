import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type View = 'home' | 'product-early' | 'product-growth' | 'product-explore' | 'product-memory' | 'philosophy' | 'blog' | 'blog-detail' | 'partner' | 'community' | 'post-detail' | 'create-post' | 'profile' | 'login' | 'admin-login' | 'admin-dashboard' | 'admin-edit-growth' | 'admin-home' | 'admin-blog' | 'auth-callback';
export type Region = 'US' | 'CN' | 'CA' | 'FR' | 'DE' | 'ES';

interface NavigationContextType {
  currentView: View;
  viewParams: any;
  currentRegion: Region;
  setView: (view: View, params?: any) => void;
  setRegion: (region: Region) => void;
  navigate: (view: View, params?: any) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<View>('home');
  const [currentRegion, setCurrentRegion] = useState<Region>('CN');
  const [viewParams, setViewParams] = useState<any>(null);

  // Parse URL on mount and popstate
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname;
      const parts = path.split('/').filter(Boolean);
      
// --- Google OAuth callback route ---
// Supports URLs like:
// /auth/callback                 (rarely used)
// /cn/auth/callback              (actual)
// /us/auth/callback
// /fr/auth/callback  etc.
if (
  (parts[0] === 'auth' && parts[1] === 'callback') ||
  (parts[1] === 'auth' && parts[2] === 'callback')
) {
  setCurrentView('auth-callback');
  return;
}
      
      // Default to CN if root
      if (parts.length === 0) {
        window.history.replaceState(null, '', '/cn');
        setCurrentRegion('CN');
        setCurrentView('home');
        return;
      }

      const region = parts[0].toUpperCase() as Region;
      // Validate region, if invalid default to CN
      const validRegions: Region[] = ['US', 'CN', 'CA', 'FR', 'DE', 'ES'];
      const finalRegion = validRegions.includes(region) ? region : 'CN';
      
      if (finalRegion !== region) {
         // Fix URL if region was invalid
         // But maybe the first part was the view? e.g. /partner
         // Let's assume stricter /:region/:view structure
      }

      setCurrentRegion(finalRegion);

      const viewPart = parts[1];
      if (!viewPart) {
        setCurrentView('home');
      } else {
        // Map url slug to View
        // Simple mapping for now: assume viewPart matches View type mostly
        // or custom mapping
        if (viewPart === 'partner') setCurrentView('partner');
        else if (viewPart === 'philosophy') setCurrentView('philosophy');
        else if (viewPart === 'blog') setCurrentView('blog');
        else if (viewPart === 'auth') setCurrentView('auth-callback');
        else if (viewPart.startsWith('product-')) setCurrentView(viewPart as View);
        else setCurrentView('home');
      }
    };

    handleUrlChange();

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const setView = (view: View, params?: any) => {
    setCurrentView(view);
    setViewParams(params || null);
    
    // Update URL
    const regionPrefix = currentRegion.toLowerCase();
    let path = `/${regionPrefix}`;
    
    if (view !== 'home') {
      path += `/${view}`;
    }
    
    window.history.pushState(null, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setRegion = (region: Region) => {
    setCurrentRegion(region);
    
    // Update URL keeping current view
    const regionPrefix = region.toLowerCase();
    let path = `/${regionPrefix}`;
    if (currentView !== 'home') {
      path += `/${currentView}`;
    }
    
    window.history.pushState(null, '', path);
  };

  // Alias for setView to make it clearer in auth/community flows
  const navigate = setView;

  return (
    <NavigationContext.Provider value={{ currentView, viewParams, currentRegion, setView, setRegion, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}