import React from 'react';
import { useNavigation } from '../navigation-context';
import { useAdmin } from './admin-context';
import { ArrowLeft, Save, Layout, Type, Image as ImageIcon, DollarSign } from 'lucide-react';

export function AdminGrowthEditor() {
  const { setView } = useNavigation();
  const { content, updateContent, saveContent } = useAdmin();

  // Helper to safely get content with fallback
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
              <h1 className="font-bold text-slate-900">Growth Edition</h1>
              <p className="text-xs text-purple-500 font-bold uppercase tracking-widest">Editor Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView('product-growth')}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
            >
              Preview
            </button>
            <button 
              onClick={saveContent}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg font-bold shadow-lg hover:bg-purple-700 transition-colors"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        
        {/* Section: Hero Text */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
           <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <Type className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-900">Product Details</h3>
           </div>
           <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Product Title</label>
                    <input 
                      type="text" 
                      value={getVal('growth.title', 'Baseul Growth')}
                      onChange={(e) => updateContent('growth.title', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Price ($)</label>
                    <div className="relative">
                       <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <input 
                         type="number" 
                         value={getVal('growth.price', 249)}
                         onChange={(e) => updateContent('growth.price', parseInt(e.target.value))}
                         className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                       />
                    </div>
                 </div>
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subtitle (Age/Target)</label>
                 <input 
                   type="text" 
                   value={getVal('growth.subtitle', 'Age 7-12 · Primary School')}
                   onChange={(e) => updateContent('growth.subtitle', e.target.value)}
                   className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                 />
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
                 <textarea 
                   rows={4}
                   value={getVal('growth.desc', 'The perfect companion for primary school students. Balancing focus, safety, and connection.')}
                   onChange={(e) => updateContent('growth.desc', e.target.value)}
                   className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                 />
              </div>
           </div>
        </div>

        {/* Section: Hero Image */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden opacity-60 pointer-events-none">
           <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <ImageIcon className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-900">Main Images (Coming Soon)</h3>
           </div>
           <div className="p-8 text-center py-12">
              <p className="text-slate-400 font-medium">Image upload functionality requires a cloud storage backend.</p>
           </div>
        </div>

      </div>
    </div>
  );
}
