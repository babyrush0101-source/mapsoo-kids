import React from 'react';
import { LayoutWrapper } from './components/ui/layout-wrapper';
import { Navbar } from './components/navbar';
import { Hero } from './components/hero';
import { VideoFeature } from './components/video-feature';
import { AgeGroups } from './components/age-groups';
import { InfoSection } from './components/info-section';
import { Testimonials } from './components/testimonials';
import { BlogSection } from './components/blog-section';
import { Footer } from './components/footer';
import { LanguageProvider } from './components/language-context';
import { NavigationProvider, useNavigation } from './components/navigation-context';
import { ThemeProvider } from './components/theme-context';
import { AuthProvider } from './components/auth-context';
import { ProductDetail } from './components/product-detail';
import { ProductMemory } from './components/product-memory';
import { PhilosophyPage } from './components/philosophy-page';
import { BlogPage } from './components/blog-page';
import { PartnerPage } from './components/PartnerPage';
import { LoginPage } from './components/auth/LoginPage';
import { CommunityPage } from './components/community/CommunityPage';
import { PostDetail } from './components/community/PostDetail';
import { CreatePost } from './components/community/CreatePost';
import { BlogListPage } from './components/blog/BlogListPage';
import { BlogDetailPage } from './components/blog/BlogDetailPage';
import { UserProfile } from './components/user/UserProfile';
import { WelcomeToast } from './components/ui/WelcomeToast';
import { DataDebugTool } from './components/dev/DataDebugTool';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminProvider } from './components/admin/admin-context';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminGrowthEditor } from './components/admin/AdminGrowthEditor';
import { AdminHomeEditor } from './components/admin/AdminHomeEditor';
import { AdminBlogEditor } from './components/admin/AdminBlogEditor';
import { AuthModalProvider, useAuthModal } from './components/auth/auth-modal-context';
import { AuthModal } from './components/auth/AuthModal';
import { AuthCallback } from './components/auth/AuthCallback';

function AppContent() {
  const { currentView, viewParams } = useNavigation();
  const { isAuthModalOpen, authModalMode, closeAuthModal } = useAuthModal();

  // Auth Callback View (Google OAuth redirect)
  if (currentView === 'auth-callback') {
    return <AuthCallback />;
  }

  // Auth Views (No Navbar/Footer) - Removed login page, now using modal
  
  // User Profile View
  if (currentView === 'profile') {
    return (
      <>
        <Navbar />
        <UserProfile />
        <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} mode={authModalMode} />
      </>
    );
  }

  // Admin Views (No Navbar/Footer)
  if (currentView === 'admin-login') return <AdminLogin />;
  if (currentView === 'admin-dashboard') return <AdminDashboard />;
  if (currentView === 'admin-edit-growth') return <AdminGrowthEditor />;
  if (currentView === 'admin-home') return <AdminHomeEditor />;
  if (currentView === 'admin-blog') return <AdminBlogEditor />;

  // Community Views (Full Page, but with Navbar)
  if (currentView === 'community') {
    return (
      <>
        <Navbar />
        <CommunityPage />
        <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} mode={authModalMode} />
      </>
    );
  }
  if (currentView === 'post-detail' && viewParams?.postId) {
    return (
      <>
        <Navbar />
        <PostDetail postId={viewParams.postId} />
        <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} mode={authModalMode} />
      </>
    );
  }
  if (currentView === 'create-post') {
    return (
      <>
        <Navbar />
        <CreatePost />
        <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} mode={authModalMode} />
      </>
    );
  }
  
  // Blog Detail View
  if (currentView === 'blog-detail' && viewParams?.blogId) {
    return (
      <>
        <Navbar />
        <BlogDetailPage blogId={viewParams.blogId} />
        <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} mode={authModalMode} />
      </>
    );
  }

  return (
    <LayoutWrapper>
      <Navbar />
      <WelcomeToast />
      <DataDebugTool />
      <main>
        {currentView === 'home' && (
          <>
            <Hero />
            <VideoFeature />
            <AgeGroups />
            <InfoSection />
            <Testimonials />
            <BlogSection />
          </>
        )}
        {currentView === 'product-early' && <ProductDetail type="early" />}
        {currentView === 'product-growth' && <ProductDetail type="growth" />}
        {currentView === 'product-explore' && <ProductDetail type="explore" />}
        {currentView === 'product-memory' && <ProductMemory />}
        {currentView === 'philosophy' && <PhilosophyPage />}
        {currentView === 'blog' && <BlogListPage />}
        {currentView === 'partner' && <PartnerPage />}
      </main>
      <Footer />
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} mode={authModalMode} />
    </LayoutWrapper>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NavigationProvider>
          <LanguageProvider>
            <AuthProvider>
              <AdminProvider>
                <AuthModalProvider>
                  <AppContent />
                </AuthModalProvider>
              </AdminProvider>
            </AuthProvider>
          </LanguageProvider>
        </NavigationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}