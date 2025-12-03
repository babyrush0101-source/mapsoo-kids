import React from 'react';
import { useNavigation } from '../navigation-context';
import { useAdmin } from './admin-context';
import { Layout, Image, Type, Save, LogOut, ShoppingBag, Home, Shield, ChevronRight, Star, FileText } from 'lucide-react';

export function AdminDashboard() {
  const { setView } = useNavigation();
  const { logout, saveContent } = useAdmin();

  const handleLogout = () => {
    logout();
    setView('home');
  };

  const modules = [
    {
      title: "Home Page",
      desc: "Manage hero section, global footer, and navigation",
      icon: Home,
      color: "blue",
      action: () => setView('admin-home')
    },
    {
      title: "Blog Management",
      desc: "Create and publish blog posts",
      icon: FileText,
      color: "green",
      action: () => setView('admin-blog')
    },
    {
      title: "Growth Edition",
      desc: "Edit product details for Age 7-12",
      icon: ShoppingBag,
      color: "purple",
      action: () => setView('admin-edit-growth')
    },
    {
      title: "Early Edition",
      desc: "Edit product details for Age 3-6",
      icon: ShoppingBag,
      color: "cyan",
      action: () => alert("Early edition uses same editor pattern (Coming in next update)")
    },
    {
      title: "Explore Edition",
      desc: "Edit product details for Age 13+",
      icon: ShoppingBag,
      color: "orange",
      action: () => alert("Explore edition uses same editor pattern (Coming in next update)")
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Baseul CMS</h1>
              <p className="text-xs text-slate-500 font-medium">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('home')} 
              className="text-sm font-bold text-slate-500 hover:text-slate-900"
            >
              View Site
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-12">
           <div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Content Modules</h2>
              <p className="text-slate-500">Select a section to start editing content.</p>
           </div>
           <button 
             onClick={saveContent}
             className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"
           >
             <Save className="w-4 h-4" /> Save All Changes
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod, i) => (
            <div 
              key={i}
              onClick={mod.action} 
              className="group bg-white p-8 rounded-3xl border-2 border-transparent hover:border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
            >
              <div className={`w-14 h-14 rounded-2xl bg-${mod.color}-50 text-${mod.color}-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <mod.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{mod.title}</h3>
              <p className="text-slate-500 font-medium mb-6">{mod.desc}</p>
              <div className="flex items-center text-slate-900 font-bold text-sm group-hover:translate-x-2 transition-transform">
                Edit Content <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
