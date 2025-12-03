import React from 'react';
import { useNavigation } from '../navigation-context';
import { useAdmin } from './admin-context';
import { ArrowLeft, Save, Type, Image as ImageIcon, Layout } from 'lucide-react';

export function AdminHomeEditor() {
  const { setView } = useNavigation();
  const { content, updateContent, saveContent } = useAdmin();

  const getVal = (key: string, fallback: string) => content[key] || fallback;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
               onClick={() => setView('admin-dashboard')}
               className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
               <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="font-bold text-slate-900">Home Page Editor</h1>
              <p className="text-xs text-blue-500 font-bold uppercase tracking-widest">CMS Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView('home')}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
            >
              Preview
            </button>
            <button 
              onClick={saveContent}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        
        {/* Hero Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
           <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <Layout className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-900">Hero Section</h3>
           </div>
           <div className="p-8 space-y-6">
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Main Headline</label>
                 <input 
                   type="text" 
                   value={getVal('home.hero.title', 'Raising the Future')}
                   onChange={(e) => updateContent('home.hero.title', e.target.value)}
                   className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                 />
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subtitle</label>
                 <input 
                   type="text" 
                   value={getVal('home.hero.subtitle', 'Smart devices growing with your child')}
                   onChange={(e) => updateContent('home.hero.subtitle', e.target.value)}
                   className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                 />
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">CTA Button Text</label>
                 <input 
                   type="text" 
                   value={getVal('home.hero.cta', 'Explore Products')}
                   onChange={(e) => updateContent('home.hero.cta', e.target.value)}
                   className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                 />
              </div>
           </div>
        </div>

        {/* Footer Section (Global) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
           <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <Type className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-900">Global Footer</h3>
           </div>
           <div className="p-8 space-y-6">
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Copyright Text</label>
                 <input 
                   type="text" 
                   value={getVal('footer.copyright', '© 2025 Baseul Kids. All rights reserved.')}
                   onChange={(e) => updateContent('footer.copyright', e.target.value)}
                   className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                 />
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
