import React from 'react';
import { motion } from 'motion/react';
import { Brain, Clock, Shield, Zap, Users, Sparkles, ArrowLeft } from 'lucide-react';
import { useTheme } from './theme-context';
import { useLanguage } from './language-context';
import { useNavigation } from './navigation-context';

export function InfoSection() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { setView } = useNavigation();

  const features = [
    {
      icon: Brain,
      title: t('info.feat.1.title'),
      desc: t('info.feat.1.desc'),
      color: "text-purple-500",
      bg: "bg-purple-100",
      darkBg: "bg-purple-900/30",
      darkColor: "text-purple-400"
    },
    {
      icon: Clock,
      title: t('info.feat.2.title'),
      desc: t('info.feat.2.desc'),
      color: "text-cyan-500",
      bg: "bg-cyan-100",
      darkBg: "bg-cyan-900/30",
      darkColor: "text-cyan-400"
    },
    {
      icon: Shield,
      title: t('info.feat.3.title'),
      desc: t('info.feat.3.desc'),
      color: "text-blue-500",
      bg: "bg-blue-100",
      darkBg: "bg-blue-900/30",
      darkColor: "text-blue-400"
    },
    {
      icon: Sparkles,
      title: t('info.feat.4.title'),
      desc: t('info.feat.4.desc'),
      color: "text-yellow-500",
      bg: "bg-yellow-100",
      darkBg: "bg-yellow-900/30",
      darkColor: "text-yellow-400"
    },
    {
      icon: Users,
      title: t('info.feat.5.title'),
      desc: t('info.feat.5.desc'),
      color: "text-pink-500",
      bg: "bg-pink-100",
      darkBg: "bg-pink-900/30",
      darkColor: "text-pink-400"
    },
    {
      icon: Zap,
      title: t('info.feat.6.title'),
      desc: t('info.feat.6.desc'),
      color: "text-orange-500",
      bg: "bg-orange-100",
      darkBg: "bg-orange-900/30",
      darkColor: "text-orange-400"
    }
  ];

  return (
    <section id="philosophy" className="py-20 relative z-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          {/* Text Content */}
          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className={`inline-block py-2 px-4 rounded-full backdrop-blur-md font-bold text-sm mb-4 shadow-sm border ${
                theme === 'dark' 
                  ? 'bg-white/5 text-purple-400 border-white/10' 
                  : 'bg-purple-100/50 text-purple-600 border-purple-100'
              }`}>
                {t('info.manifesto.badge')}
              </span>
              <h2 className={`text-4xl md:text-5xl font-black mb-6 leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t('info.manifesto.title.1')} <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500">{t('info.manifesto.title.2')}</span>
              </h2>
              <p className={`text-lg mb-8 leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                {t('info.manifesto.desc')}
              </p>

              <button 
                onClick={() => setView('philosophy')}
                className={`px-8 py-4 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2 ${
                  theme === 'dark' 
                    ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10' 
                    : 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {t('info.manifesto.button')} <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </motion.div>
          </div>

          {/* Feature Grid */}
          <div className="lg:w-1/2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-3xl border backdrop-blur-xl transition-all hover:scale-[1.02] ${
                    theme === 'dark'
                      ? 'bg-white/5 border-white/5 hover:bg-white/10 shadow-lg'
                      : 'bg-white/60 border-white/60 hover:border-purple-200 shadow-lg shadow-purple-100/50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                    theme === 'dark' ? feature.darkBg : feature.bg
                  }`}>
                    <feature.icon className={`w-6 h-6 ${
                      theme === 'dark' ? feature.darkColor : feature.color
                    }`} />
                  </div>
                  <h3 className={`text-lg font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{feature.title}</h3>
                  <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
