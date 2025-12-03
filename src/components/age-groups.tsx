import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, Brain, CheckCircle2, Sun, Moon } from 'lucide-react';
import { useLanguage } from './language-context';
import { useNavigation } from './navigation-context';
import { useTheme } from './theme-context';

import imgEarly from 'figma:asset/1255130083c44e8ed92aad9eb57a1162f1aec017.png';
import imgGrowth from 'figma:asset/b938785a8b1ccaf5970791a2fb524ad5041aefc6.png';
import imgGrowthDark from 'figma:asset/4b6290ceaa5e9db680d9d5b480fc259266ca79d0.png';
import imgExplore from 'figma:asset/60526b5d8fb1fd0cd5213b63473e42d5a9018092.png';
import imgHub from 'figma:asset/66aa11e16d17e713ec8525c9d3239a6e543e7f8a.png';
import imgScenario from 'figma:asset/16c660e3695c905d2b6311d4f9b377ad85f93cbd.png';
import imgEarlyProduct from 'figma:asset/5880af9c8591f0077537c38fdd981ed4c4030d77.png';
import imgExploreProduct from 'figma:asset/4eab635088fa96b3b4c760608745ce34378feb72.png';
import imgExploreDark from 'figma:asset/cfab305c00da2820d9fb08a9c3e8e68cf1a6c3e4.png';
import imgGrowthProduct from 'figma:asset/c1ef110b17775eaf4ea29b17356432dadabf93ff.png';
import imgEarlyDark from 'figma:asset/c4b5c1d65ef0de6f999df230c885be4c210103a0.png';
import imgMemoryHero from 'figma:asset/d63d94e538aa40b38f3d348626c30181fc361a36.png';
import imgMemoryProduct from 'figma:asset/038d9102d450d609519b6cddcf5db96a9e06945c.png';

export function AgeGroups() {
  const { t } = useLanguage();
  const { setView } = useNavigation();
  const { theme, toggleTheme } = useTheme();
  const [activeId, setActiveId] = useState('product-early');

  const products = [
    {
      id: 'product-early',
      nameKey: 'trilogy.card1.name',
      titleKey: t('trilogy.card1.title'),
      benefitKey: t('trilogy.card1.benefit'),
      aiDescription: t('trilogy.card1.desc'),
      descKey: 'trilogy.card1.desc',
      subKey: 'trilogy.card1.sub',
      ctaKey: 'trilogy.card1.cta',
      badgeKey: 'trilogy.card1.badge',
      image: imgEarlyProduct,
      scenarioImage: imgEarly,
      darkScenarioImage: imgEarlyDark,
      accent: "text-orange-500",
      bgAccent: "bg-orange-500",
      hoverAccent: "hover:bg-orange-500 hover:border-orange-500",
      shadowColor: "shadow-orange-500/20",
      bgGradient: "from-orange-50 via-white to-orange-100/50",
      darkBgGradient: "from-orange-950/40 to-slate-900",
      boxBg: "bg-orange-50/80 border-orange-100",
      boxIconBg: "bg-orange-100",
      darkBoxBg: "bg-white/5 border-white/10",
      darkBoxIconBg: "bg-orange-900/30",
      age: t('trilogy.card1.badge')
    },
    {
      id: 'product-growth',
      nameKey: 'trilogy.card2.name',
      titleKey: t('trilogy.card2.title'),
      benefitKey: t('trilogy.card2.benefit'),
      aiDescription: t('trilogy.card2.desc'),
      descKey: 'trilogy.card2.desc',
      subKey: 'trilogy.card2.sub',
      ctaKey: 'trilogy.card2.cta',
      badgeKey: 'trilogy.card2.badge',
      image: imgGrowthProduct,
      scenarioImage: imgGrowth,
      darkScenarioImage: imgGrowthDark,
      accent: "text-cyan-600",
      bgAccent: "bg-cyan-600",
      hoverAccent: "hover:bg-cyan-600 hover:border-cyan-600",
      shadowColor: "shadow-cyan-500/20",
      bgGradient: "from-cyan-50 via-white to-cyan-100/50",
      darkBgGradient: "from-cyan-950/40 to-slate-900",
      boxBg: "bg-cyan-50/80 border-cyan-100",
      boxIconBg: "bg-cyan-100",
      darkBoxBg: "bg-white/5 border-white/10",
      darkBoxIconBg: "bg-cyan-900/30",
      age: t('trilogy.card2.badge')
    },
    {
      id: 'product-explore',
      nameKey: 'trilogy.card3.name',
      titleKey: t('trilogy.card3.title'),
      benefitKey: t('trilogy.card3.benefit'),
      aiDescription: t('trilogy.card3.desc'),
      descKey: 'trilogy.card3.desc',
      subKey: 'trilogy.card3.sub',
      ctaKey: 'trilogy.card3.cta',
      badgeKey: 'trilogy.card3.badge',
      image: imgExploreProduct,
      scenarioImage: imgExplore,
      darkScenarioImage: imgExploreDark,
      accent: "text-indigo-600",
      bgAccent: "bg-indigo-600",
      hoverAccent: "hover:bg-indigo-600 hover:border-indigo-600",
      shadowColor: "shadow-indigo-500/20",
      bgGradient: "from-indigo-50 via-white to-indigo-100/50",
      darkBgGradient: "from-indigo-950/40 to-slate-900",
      boxBg: "bg-indigo-50/80 border-indigo-100",
      boxIconBg: "bg-indigo-100",
      darkBoxBg: "bg-white/5 border-white/10",
      darkBoxIconBg: "bg-indigo-900/30",
      age: t('trilogy.card3.badge')
    },
    // Special Baseul Memory Card
    {
      id: 'product-memory',
      nameKey: 'trilogy.card4.name',
      titleKey: 'trilogy.card4.title',
      benefitKey: 'trilogy.card4.benefit',
      descKey: 'trilogy.card4.desc',
      subKey: 'trilogy.card4.sub',
      ctaKey: 'trilogy.card4.cta',
      badgeKey: 'trilogy.card4.badge',
      image: imgMemoryProduct,
      bgImage: imgMemoryHero,
      scenarioImage: imgMemoryHero,
      accent: "text-emerald-500",
      bgAccent: "bg-emerald-500",
      shadowColor: "shadow-emerald-500/20",
      bgGradient: "", 
      darkBgGradient: ""
    }
  ];

  const trilogyProducts = products.slice(0, 3);
  const memoryProduct = products[3];

  return (
    <section className="py-20 relative z-10">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-20">
           <span className={`inline-block py-2 px-6 rounded-full backdrop-blur-md font-extrabold text-xs uppercase tracking-widest mb-6 shadow-sm border ${
              theme === 'dark' 
                ? 'bg-white/5 text-cyan-400 border-white/10' 
                : 'bg-white/80 text-cyan-700 border-cyan-100'
            }`}>
              {t('products.badge')}
            </span>
            <h2 className={`text-5xl md:text-7xl font-black mb-8 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t('products.title')}</h2>
            <p className={`max-w-2xl mx-auto text-xl md:text-2xl font-medium leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('products.subtitle')}
            </p>
            
            {/* Theme Toggle Hint */}
            <div className="mt-8 flex justify-center animate-fade-in">
               <button
                 onClick={toggleTheme}
                 className={`flex items-center gap-3 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all transform hover:scale-105 border shadow-lg ${
                   theme === 'dark'
                     ? 'bg-white text-slate-900 border-white hover:bg-slate-200 shadow-white/10'
                     : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800 shadow-slate-900/20'
                 }`}
               >
                 {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                 <span>{theme === 'dark' ? 'View Light Mode Scenarios' : 'View Night Mode Scenarios'}</span>
               </button>
            </div>
        </div>

        {/* 1. Expanding Horizontal Cards (Desktop) */}
        <div className="hidden lg:flex flex-row gap-6 h-[650px]">
          {trilogyProducts.map((product) => {
            const isActive = activeId === product.id;
            
            return (
               <div 
                  key={product.id}
                  onMouseEnter={() => setActiveId(product.id)}
                  onClick={() => setView(product.id as any)}
                  className={`relative rounded-[3rem] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer group shadow-2xl border ${
                      isActive ? 'flex-[4]' : 'flex-[0.8]'
                  } ${
                      theme === 'dark' ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-slate-50'
                  }`}
               >
                  {/* INACTIVE STATE BACKGROUND (Clean Product) */}
                  <div className={`absolute inset-0 transition-opacity duration-700 ${isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                     {/* Clean Background Gradient */}
                     <div className={`absolute inset-0 bg-gradient-to-br ${theme === 'dark' ? product.darkBgGradient : product.bgGradient}`} />
                     
                     {/* Inactive Content (Centered) */}
                     <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10">
                         {/* Product Image */}
                         <div className="relative h-32 w-full mb-6 flex flex-col items-center justify-center">
                            {/* Age Group Label (Collapsed State) - Above Image */}
                            <span className={`mb-2 text-xs font-bold tracking-widest opacity-60 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                {product.age}
                            </span>
                            <img 
                                src={product.image} 
                                alt={product.nameKey} 
                                className="h-full w-auto object-contain drop-shadow-2xl"
                            />
                         </div>
                         
                         {/* Vertical Text */}
                         <div className="flex flex-col items-center text-center gap-2">
                            <h3 className={`text-2xl font-black writing-vertical-rl rotate-180 lg:rotate-0 lg:writing-horizontal-tb ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                {t(product.nameKey)}
                            </h3>
                            <p className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                                {t(product.subKey)}
                            </p>
                         </div>
                     </div>
                  </div>

                  {/* ACTIVE STATE (Full Scenario Background + Left Aligned Content with Embedded Product) */}
                  <div className={`absolute inset-0 transition-opacity duration-500 ${isActive ? 'opacity-100 delay-100' : 'opacity-0'}`}>
                      {/* Background Layer: Scenario Image (Old Product Image acting as BG) */}
                      <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${theme === 'dark' ? product.darkBgGradient : product.bgGradient}`} />
                          <img 
                              src={(theme === 'dark' && (product as any).darkScenarioImage) ? (product as any).darkScenarioImage : product.scenarioImage} 
                              alt="Background Visual" 
                              className={`absolute inset-0 w-full h-full object-cover opacity-100 mix-blend-normal ${
                                theme === 'dark' && product.id === 'product-early' ? 'scale-x-[-1]' : ''
                              }`}
                          />
                          {/* Gradient Overlay adjusted to 1/3 coverage to show more background */}
                          <div className={`absolute inset-0 bg-gradient-to-r ${theme === 'dark' ? 'from-slate-900 from-10% via-slate-900/95 via-35% to-transparent' : 'from-white from-10% via-white/95 via-35% to-transparent'}`} />

                          {/* Age Group Label (Expanded State) - Top Right */}
                          <div className="absolute top-8 right-8 z-20">
                             <div className={`px-4 py-2 rounded-full backdrop-blur-md border shadow-lg ${theme === 'dark' ? 'bg-black/20 border-white/10 text-white' : 'bg-white/20 border-white/20 text-slate-900'}`}>
                                <span className="text-sm font-bold tracking-wide font-mono">{product.age}</span>
                             </div>
                          </div>
                      </div>
                      
                      {/* Content Container (Left Side 55% approx 1:2 ratio) */}
                      <div className="absolute inset-0 flex items-center">
                          <div className="w-full lg:w-[55%] p-10 md:p-12 relative z-20 flex flex-col justify-center h-full">
                            {/* Tag */}
                            <div className={`flex items-center gap-3 mb-4 ${product.accent}`}>
                                <Sparkles size={20} />
                                <span className="font-extrabold text-sm uppercase tracking-[0.2em]">{t(product.subKey)}</span>
                            </div>
                            
                            {/* Title */}
                            <h3 className={`text-3xl xl:text-4xl font-black leading-none tracking-tighter mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                {product.titleKey}
                            </h3>

                            {/* Product Image */}
                            <div className="mb-6 relative w-full flex justify-start">
                                <motion.div
                                    initial={false}
                                    animate={isActive ? { scale: 1, opacity: 1, x: 0 } : { scale: 0.9, opacity: 0, x: -20 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                >
                                    <img 
                                        src={product.image} 
                                        alt="Device" 
                                        className="h-[140px] w-auto object-contain drop-shadow-2xl"
                                    />
                                </motion.div>
                            </div>
                            
                            {/* AI Description Box (New Text) - Smaller Font */}
                            <div className={`p-4 rounded-2xl mb-6 border backdrop-blur-md w-full ${
                                theme === 'dark' ? product.darkBoxBg : product.boxBg
                            }`}>
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-xl mt-1 ${theme === 'dark' ? product.darkBoxIconBg : product.boxIconBg}`}>
                                        <Brain className={`w-4 h-4 flex-shrink-0 ${product.accent}`} />
                                    </div>
                                    <p className={`text-xs font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                        {product.aiDescription}
                                    </p>
                                </div>
                            </div>

                            {/* Benefit/Old Desc */}
                            <p className={`text-base font-medium leading-relaxed mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                {product.benefitKey}
                            </p>

                            {/* CTA */}
                            <div className="mt-auto md:mt-0">
                                <button 
                                    className={`w-fit px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1 group/btn ${
                                        theme === 'dark' 
                                        ? `bg-white text-black hover:bg-gray-200`
                                        : `bg-slate-900 text-white hover:bg-slate-800`
                                    }`}
                                >
                                    {t(product.ctaKey)}
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                          </div>
                      </div>
                  </div>
               </div>
            )
          })}
        </div>

        {/* 2. Mobile Vertical Stack (Fallback) */}
        <div className="flex flex-col gap-6 lg:hidden">
          {trilogyProducts.map((product) => (
             <div 
                key={product.id}
                onClick={() => setView(product.id as any)}
                className={`relative h-[550px] rounded-[2.5rem] overflow-hidden border shadow-xl ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}
             >
                <img src={product.scenarioImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 w-full text-white">
                   <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 uppercase tracking-widest bg-white/20 backdrop-blur-md">{t(product.subKey)}</span>
                   <h3 className="text-4xl font-black mb-2">{t(product.nameKey)}</h3>
                   <p className="text-white/80 font-medium mb-6 line-clamp-2">{t(product.descKey)}</p>
                   <button className="w-full py-3 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2">
                      {t(product.ctaKey)} <ArrowRight size={16} />
                   </button>
                </div>
             </div>
          ))}
        </div>

        {/* 3. Baseul Memory (Sticky Stacked Card Style) */}
        <div className="mt-12 lg:mt-24">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className={`min-h-[60vh] rounded-[3rem] overflow-hidden shadow-2xl border relative group ${
                    theme === 'dark' 
                    ? 'bg-[#111] border-white/10 shadow-black/50' 
                    : 'bg-white border-slate-100 shadow-slate-200/50'
                }`}
            >
                {/* Full Background Scenario Image */}
                <img 
                    src={memoryProduct.bgImage} 
                    alt="Scenario" 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />

                {/* Gradient Mask */}
                <div className={`absolute inset-0 bg-gradient-to-r ${
                    theme === 'dark' 
                    ? 'from-black via-black/90 to-transparent' 
                    : 'from-white via-white/95 to-transparent'
                }`} />

                {/* Content Container (Left Side) */}
                <div className="absolute inset-0 flex items-center">
                        <div className="w-full lg:w-[65%] p-6 md:p-16 relative z-10 flex flex-col justify-center h-full">
                        
                        {/* Tag */}
                        <div className={`flex items-center gap-3 mb-3 md:mb-6 ${memoryProduct.accent}`}>
                            <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-emerald-50'}`}>
                                <Sparkles size={16} />
                            </div>
                            <span className="font-extrabold text-xs md:text-sm uppercase tracking-[0.2em]">{t(memoryProduct.subKey)}</span>
                        </div>

                        {/* Title */}
                        <h3 className={`text-4xl md:text-7xl font-black mb-3 md:mb-6 tracking-tighter leading-none break-words ${
                            theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                            {t(memoryProduct.nameKey)}
                        </h3>

                        {/* Cutout Machine Image */}
                        <div className="mb-4 md:mb-8 relative group-hover:-translate-y-2 transition-transform duration-500">
                            <div className={`absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                            <img 
                                src={memoryProduct.image} 
                                alt="Baseul Memory Device" 
                                className="relative z-10 h-[150px] md:h-[200px] w-auto object-contain drop-shadow-2xl"
                            />
                        </div>

                        {/* Description */}
                        <p className={`text-lg md:text-2xl font-medium leading-relaxed mb-4 md:mb-8 max-w-2xl ${
                            theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                            {t(memoryProduct.descKey)}
                        </p>

                        {/* Benefit Box */}
                        <div className={`p-4 md:p-6 rounded-2xl md:rounded-3xl mb-6 md:mb-10 border backdrop-blur-md w-fit ${
                            theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-emerald-50/50 border-emerald-100'
                        }`}>
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                    <Brain className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                </div>
                                <p className={`text-sm font-bold ${theme === 'dark' ? 'text-emerald-200' : 'text-emerald-900'}`}>
                                    {t(memoryProduct.benefitKey)}
                                </p>
                            </div>
                        </div>

                        {/* CTA */}
                        <div>
                            <button 
                                onClick={() => setView(memoryProduct.id as any)}
                                className={`px-8 py-4 rounded-2xl font-black text-lg transition-all flex items-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1 group/btn ${
                                    theme === 'dark' 
                                    ? 'bg-white/10 text-white border border-white/10 hover:bg-emerald-500 hover:text-white' 
                                    : 'bg-white text-slate-900 border border-emerald-100 hover:bg-emerald-600 hover:text-white'
                                }`}
                            >
                                {t(memoryProduct.ctaKey)}
                                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                        </div>
                </div>
            </motion.div>
        </div>

      </div>
    </section>
  );
}