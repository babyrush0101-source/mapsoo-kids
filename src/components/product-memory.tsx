import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Check, HardDrive, Shield, Database, Cloud, Clock, Share2, Brain, Lock, Layers, Mic, Smartphone, Cpu, Lightbulb, Wifi, Zap, MessageCircle, ArrowRight } from 'lucide-react';
import { useNavigation } from './navigation-context';
import { useLanguage } from './language-context';
import { useTheme } from './theme-context';
import { useAuth } from './auth-context';

// Product Images
import imgGrowth from 'figma:asset/e18a92ced248d352c4c7d105a2ffe6847f6886fe.png';
import imgEarly from 'figma:asset/1fdd8db60df5d8c90ef4e37af7b3111e14c172bb.png';
import imgMemory from 'figma:asset/3d1e625e1158e8a0c194b80170fc6f75c5bc139f.png';
import imgMemoryNew from 'figma:asset/038d9102d450d609519b6cddcf5db96a9e06945c.png';
import imgMemoryHero from 'figma:asset/d63d94e538aa40b38f3d348626c30181fc361a36.png';
import imgMemorySc1 from 'figma:asset/dc84d32c89e49116ce100fbab39d53f18f597b2e.png';
import imgMemorySc2 from 'figma:asset/6a551c6583676f4cf98576d06de813cad2527f79.png';
import imgMemorySc3 from 'figma:asset/3cdcb784f042859af9a3167a8ca244ffd7b40e3e.png';
import imgMemorySc4 from 'figma:asset/e146389eafcd82244de04fb96f619f94ce3cbfb8.png';
import imgMemorySc5 from 'figma:asset/319b3d65fcd85cfa7015d9d22a95dd72577dbeee.png';
import imgMemorySc6 from 'figma:asset/03316eb5f13ff9efc823e664a193a73f9558125f.png';

interface BundleOption {
  id: string;
  name: string;
  price: number;
  image: string;
  desc: string;
}

export function ProductMemory() {
  const { setView } = useNavigation();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { currentUser, isLoggedIn } = useAuth();
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const [selectedBundles, setSelectedBundles] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const memoryImages = [
    imgMemoryNew,
    imgMemoryHero,
    imgMemorySc1,
    imgMemorySc2,
    imgMemorySc3
  ];

  const basePrice = 129;
  
  const bundles: BundleOption[] = [
    { id: 'early', name: t('p1.name'), price: 199, image: imgEarly, desc: t('p1.desc') },
    { id: 'growth', name: t('p2.name'), price: 249, image: imgGrowth, desc: t('p2.desc') },
    { id: 'explore', name: t('p3.name'), price: 399, image: "https://images.unsplash.com/photo-1593642532400-2682810df593?auto=format&fit=crop&w=300&q=80", desc: t('p3.desc') }
  ];

  const toggleBundle = (id: string) => {
    setSelectedBundles(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const totalPrice = basePrice + selectedBundles.reduce((sum, id) => {
    const bundle = bundles.find(b => b.id === id);
    return sum + (bundle ? bundle.price : 0);
  }, 0);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    // For logged-in users, use their email; for guests, use the form email
    const userEmail = isLoggedIn ? currentUser?.email : email;
    if(userEmail) {
      setJoined(true);
      // TODO: Save to waitlist with user info
      console.log('User joined waitlist:', { email: userEmail, product: 'memory', bundles: selectedBundles });
    }
  };

  return (
    <div className="pt-32 pb-20 relative z-20">
      <div className="container mx-auto px-4">
        
        {/* Back Button */}
        <button 
          onClick={() => setView('home')}
          className={`flex items-center gap-2 transition-colors mb-8 font-bold ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <ArrowLeft className="w-4 h-4" /> Back to System
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
          
          {/* Left: Images */}
          <div className="space-y-6">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className={`relative rounded-[2.5rem] overflow-hidden shadow-2xl h-[500px] bg-white transition-all duration-300 ${
                 theme === 'dark' ? 'border-4 border-white/5' : 'border-4 border-white'
               }`}
             >
               <motion.img 
                  key={selectedImage || memoryImages[0]}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  src={selectedImage || memoryImages[0]} 
                  alt="Baseul Memory" 
                  className="w-full h-full object-contain p-8" 
               />
               <div className="absolute top-6 left-6 pointer-events-none">
                  <span className={`px-4 py-2 rounded-full backdrop-blur-xl font-black text-sm uppercase tracking-widest shadow-lg ${
                    theme === 'dark' ? 'bg-black/40 text-white border border-white/20' : `bg-white/90 text-emerald-600`
                  }`}>
                    Core System
                  </span>
               </div>
             </motion.div>
             
             <div className="grid grid-cols-5 gap-3">
                {memoryImages.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedImage(img)}
                    className={`rounded-2xl overflow-hidden h-24 border-2 cursor-pointer transition-all duration-300 ${
                      (selectedImage === img || (!selectedImage && idx === 0)) 
                        ? `border-emerald-500 ring-2 ring-emerald-200 scale-95`
                        : theme === 'dark' ? 'border-white/10 hover:border-white/30' : 'border-white/50 hover:border-slate-300'
                    }`}
                  >
                     <img src={img} alt={`Detail ${idx + 1}`} className="w-full h-full object-contain hover:scale-110 transition-transform duration-500 bg-white" />
                  </div>
                ))}
             </div>
          </div>

          {/* Right: Info & Action */}
          <div>
             <motion.h1 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className={`text-4xl md:text-5xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
             >
               {t('p4.title')}
             </motion.h1>
             <p className={`text-xl font-bold text-slate-500 mb-6`}>{t('p4.desc')}</p>
             
             <div className="flex items-end gap-4 mb-8">
                <span className={`text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>${totalPrice}.00</span>
             </div>

             <p className={`text-lg font-medium leading-relaxed mb-8 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
               {t('home.memory.desc')}
             </p>

             {/* Specs Grid */}
             <div className="grid grid-cols-3 gap-4 mb-8">
                 <div className={`p-4 rounded-2xl border text-center backdrop-blur-md ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/50 border-white/60'}`}>
                    <Lock className={`w-6 h-6 mx-auto mb-2 text-cyan-500`} />
                    <p className="text-xs text-slate-400 font-bold uppercase">Privacy</p>
                    <p className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Local Encrypted</p>
                 </div>
                 <div className={`p-4 rounded-2xl border text-center backdrop-blur-md ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/50 border-white/60'}`}>
                    <HardDrive className={`w-6 h-6 mx-auto mb-2 text-purple-500`} />
                    <p className="text-xs text-slate-400 font-bold uppercase">Storage</p>
                    <p className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>4TB Expandable</p>
                 </div>
                 <div className={`p-4 rounded-2xl border text-center backdrop-blur-md ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/50 border-white/60'}`}>
                    <Brain className={`w-6 h-6 mx-auto mb-2 text-blue-500`} />
                    <p className="text-xs text-slate-400 font-bold uppercase">AI Model</p>
                    <p className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Self-Evolving</p>
                 </div>
             </div>

             {/* Bundle Section */}
             <div className="mb-8 space-y-4">
                <h3 className={`font-bold uppercase tracking-wider text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Pair with Terminals
                </h3>
                {bundles.map((bundle) => (
                    <div 
                        key={bundle.id}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            selectedBundles.includes(bundle.id) 
                                ? 'bg-cyan-500/10 border-cyan-500 ring-1 ring-cyan-500' 
                                : theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-white/30' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => toggleBundle(bundle.id)}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                                selectedBundles.includes(bundle.id)
                                    ? 'bg-cyan-500 border-cyan-500' 
                                    : theme === 'dark' ? 'border-white/30' : 'border-slate-300'
                            }`}>
                                {selectedBundles.includes(bundle.id) && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-white p-1 border border-slate-200 flex-shrink-0">
                                <img src={bundle.image} alt={bundle.name} className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{bundle.name}</h4>
                                    <span className="font-bold text-cyan-500">+${bundle.price}</span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-1">{bundle.desc}</p>
                            </div>
                        </div>
                    </div>
                ))}
             </div>

             {/* Waitlist Action */}
             <div className={`p-6 rounded-[2rem] border shadow-xl backdrop-blur-2xl ${
               theme === 'dark' 
                 ? 'bg-white/5 border-white/10 shadow-cyan-900/20' 
                 : 'bg-white/60 border-white/60 shadow-cyan-100/50'
             }`}>
                {!joined ? (
                  <form onSubmit={handleJoin} className="flex flex-col gap-4">
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                        Reserve Baseul Memory {selectedBundles.length > 0 && '+ Bundle'}
                      </label>
                      <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Secure your unit for the next batch release.
                      </p>
                    </div>
                    {isLoggedIn ? (
                      <div className="flex flex-col gap-3">
                        <div className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                          <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                            Joining as: <span className="font-bold">{currentUser?.email}</span>
                          </p>
                        </div>
                        <button 
                          type="submit"
                          className={`w-full px-8 py-3 rounded-xl bg-slate-900 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all`}
                        >
                          Join Waitlist
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-4 md:gap-2">
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email address"
                          className={`flex-1 px-6 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-400 font-medium ${
                            theme === 'dark' 
                              ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500' 
                              : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-300'
                          }`}
                        />
                        <button 
                          type="submit"
                          className={`px-8 py-3 rounded-xl bg-slate-900 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all`}
                        >
                          Join
                        </button>
                      </div>
                    )}
                  </form>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                  >
                    <div className={`w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Check className={`w-8 h-8 text-green-600`} />
                    </div>
                    <h3 className={`text-2xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Reserved!</h3>
                    <p className="text-slate-500 font-medium">We'll notify you when available.</p>
                  </motion.div>
                )}
             </div>
          </div>
        </div>

        {/* Detailed Memory Content */}
        <div className="mb-24 space-y-24">
            
            {/* 2. Value Proposition Cards */}
            <div className="py-12">
              <div className="mb-24 border-b-2 pb-12 border-slate-200 dark:border-white/10">
                 <div className="flex flex-col gap-8">
                   <h3 className={`text-5xl md:text-8xl font-black tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {t('memory.hero.tagline')}
                   </h3>
                   <div className="max-w-4xl pb-2">
                      <div className="h-2 w-24 bg-blue-500 mb-6"></div>
                      <p className={`text-xl md:text-2xl font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        {t('memory.hero.intro')}
                      </p>
                   </div>
                 </div>
              </div>

              <div className="space-y-12 md:space-y-16">
                {[
                  { 
                    id: '01',
                    eng: 'VOICE HISTORY',
                    title: t('memory.sc.1.title'), 
                    desc: t('memory.sc.1.desc'),
                    img: imgMemorySc1
                  },
                  { 
                    id: '02',
                    eng: 'GROWTH PROFILE',
                    title: t('memory.sc.2.title'), 
                    desc: t('memory.sc.2.desc'),
                    img: imgMemorySc2
                  },
                  { 
                    id: '03',
                    eng: 'PARENT LINK',
                    title: t('memory.sc.3.title'), 
                    desc: t('memory.sc.3.desc'),
                    img: imgMemorySc3
                  },
                  { 
                    id: '04',
                    eng: 'AI EVOLUTION',
                    title: t('memory.sc.4.title'), 
                    desc: t('memory.sc.4.desc'),
                    img: imgMemorySc4
                  },
                  { 
                    id: '05',
                    eng: 'GROWTH SUGGESTIONS',
                    title: t('memory.sc.5.title'), 
                    desc: t('memory.sc.5.desc'),
                    img: imgMemorySc5
                  },
                  { 
                    id: '06',
                    eng: 'CORE ARCHITECTURE',
                    title: t('memory.sc.6.title'), 
                    desc: t('memory.sc.6.desc'),
                    img: imgMemorySc6
                  }
                ].map((item, i) => (
                   <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-6 md:gap-8 group`}>
                      
                      {/* Image Side */}
                      <div className="w-full md:w-1/2 md:group-hover:w-[65%] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]">
                         <div className={`relative w-full h-[350px] md:h-[400px] md:group-hover:h-[500px] rounded-[2.5rem] overflow-hidden border-2 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${theme === 'dark' ? 'border-white/10' : 'border-slate-900'}`}>
                            <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                            {/* Tech Badge */}
                            <div className="absolute bottom-8 left-8 px-6 py-3 bg-black/80 backdrop-blur-md text-white text-sm font-bold uppercase tracking-widest rounded-full border border-white/20 z-10">
                               Log. {item.id}
                            </div>
                         </div>
                      </div>

                      {/* Text Side */}
                      <div className="w-full md:w-1/2 md:group-hover:w-[30%] relative transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]">
                         {/* Background Number */}
                         <span className={`absolute -top-20 -left-10 text-[12rem] leading-none font-black opacity-5 select-none pointer-events-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {item.id}
                         </span>
                         
                         <div className={`relative pt-10 pl-4 transition-transform duration-700 md:group-hover:scale-90 ${i % 2 === 0 ? 'origin-left' : 'origin-right'}`}>
                            <div className="flex items-center gap-4 mb-4">
                               <div className="h-1 w-12 bg-blue-500"></div>
                               <h4 className="text-blue-500 font-black uppercase tracking-widest text-lg">{item.eng}</h4>
                            </div>
                            
                            <h3 className={`text-4xl md:text-6xl font-black leading-tight mb-8 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                               {item.title}
                            </h3>
                            
                            <p className={`text-xl font-medium leading-relaxed max-w-md ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                               {item.desc}
                            </p>
                         </div>
                      </div>

                   </div>
                ))}
              </div>
            </div>

            {/* 3. Tech Highlights (Bento Grid) */}
            <div>
              <div className="flex items-baseline justify-between mb-12 border-b pb-6">
                <h3 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  TECHNICAL<br/>HIGHLIGHTS
                </h3>
                <span className="text-sm font-bold uppercase tracking-widest text-blue-500">Server v1.0</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-auto md:h-[600px]">
                
                {/* 1. Local Processing (Big) */}
                <div className={`col-span-1 md:col-span-2 md:row-span-2 rounded-[2rem] p-8 md:p-12 border-2 flex flex-col justify-between group hover:border-blue-400 transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                   <div className="flex justify-between items-start">
                      <div className="p-4 rounded-2xl bg-blue-500 text-white">
                        <HardDrive className="w-10 h-10" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest opacity-50">01</span>
                   </div>
                   <div>
                      <h4 className={`text-3xl md:text-5xl font-black mb-4 leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        LOCAL<br/>CACHE
                      </h4>
                      <p className={`text-lg font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        本地语音缓存 &gt; 生成成长映射，隐私数据不出户
                      </p>
                   </div>
                </div>

                {/* 2. Auto Connect (Small) */}
                <div className={`col-span-1 md:col-span-1 md:row-span-1 rounded-[2rem] p-8 border-2 flex flex-col justify-between group hover:bg-blue-500 hover:border-blue-500 transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                   <Wifi className="w-8 h-8 text-blue-500 group-hover:text-white transition-colors" />
                   <div>
                      <h4 className={`text-xl font-black mb-2 group-hover:text-white ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>全自动连接</h4>
                      <p className={`text-xs font-bold uppercase tracking-wider group-hover:text-white/80 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Auto Sync</p>
                   </div>
                </div>

                {/* 3. Data Export (Small) */}
                <div className={`col-span-1 md:col-span-1 md:row-span-1 rounded-[2rem] p-8 border-2 flex flex-col justify-between group hover:bg-cyan-500 hover:border-cyan-500 transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                   <Share2 className="w-8 h-8 text-cyan-500 group-hover:text-white transition-colors" />
                   <div>
                      <h4 className={`text-xl font-black mb-2 group-hover:text-white ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>数据可导出</h4>
                      <p className={`text-xs font-bold uppercase tracking-wider group-hover:text-white/80 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Exportable</p>
                   </div>
                </div>

                {/* 4. Cloud Sync (Wide) */}
                <div className={`col-span-1 md:col-span-1 md:row-span-1 rounded-[2rem] p-8 border-2 flex flex-col justify-between group hover:bg-indigo-500 hover:border-indigo-500 transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                   <Cloud className="w-8 h-8 text-indigo-500 group-hover:text-white transition-colors" />
                   <div>
                      <h4 className={`text-xl font-black mb-2 group-hover:text-white ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>云端备份</h4>
                      <p className={`text-xs font-bold uppercase tracking-wider group-hover:text-white/80 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Encrypted Cloud</p>
                   </div>
                </div>

                 {/* 5. Multi Device (Wide) */}
                 <div className={`col-span-1 md:col-span-1 md:row-span-1 rounded-[2rem] p-8 border-2 flex flex-col justify-between group hover:bg-purple-500 hover:border-purple-500 transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                   <Layers className="w-8 h-8 text-purple-500 group-hover:text-white transition-colors" />
                   <div>
                      <h4 className={`text-xl font-black mb-2 group-hover:text-white ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>多设备同步</h4>
                      <p className={`text-xs font-bold uppercase tracking-wider group-hover:text-white/80 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Multi-Device</p>
                   </div>
                </div>

              </div>
            </div>

            {/* 5. Bottom CTA (Huge Typography) */}
            <div className={`py-24 md:py-32 border-y-2 ${theme === 'dark' ? 'border-white/10' : 'border-slate-900'}`}>
              <div className="flex flex-col md:flex-row items-end justify-between gap-12">
                 <div>
                    <h2 className={`text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      SAVE<br/>HISTORY
                    </h2>
                    <p className={`text-xl md:text-2xl font-bold max-w-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      从今天开始，保存属于孩子的认知成长史<br/>
                      这是送给未来最好的礼物
                    </p>
                 </div>
                 
                 <div className="flex flex-col w-full md:w-auto gap-4">
                    <button 
                      className={`group relative px-6 py-4 md:px-12 md:py-8 rounded-full flex items-center justify-between gap-4 md:gap-8 text-lg md:text-2xl font-black uppercase tracking-wider transition-all hover:scale-105 ${
                        theme === 'dark' ? 'bg-white text-black hover:bg-blue-400' : 'bg-slate-900 text-white hover:bg-blue-500'
                      }`}
                    >
                       <span>查看技术规格</span>
                       <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                    </button>
                    <button className={`text-sm font-bold uppercase tracking-widest hover:underline ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                       绑定已有设备
                    </button>
                 </div>
              </div>
            </div>

        </div>

      </div>
    </div>
  );
}