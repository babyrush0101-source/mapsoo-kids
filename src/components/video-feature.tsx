import React from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { useLanguage } from './language-context';
import { useNavigation } from './navigation-context';
import { useTheme } from './theme-context';
import videoImage from 'figma:asset/612df672f18b9b9fe6460f86c1fbc84b6a613c95.png';

export function VideoFeature() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { setView } = useNavigation();

  return (
    <section className="py-20 relative z-10">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className={`relative w-full h-[500px] rounded-[2rem] overflow-hidden group transition-all duration-500 ${
            theme === 'dark' 
              ? 'border-2 border-white/10 shadow-2xl shadow-purple-900/20' 
              : 'border-4 border-white shadow-2xl shadow-purple-100 ring-1 ring-slate-100'
          }`}
        >
          <img 
            src={videoImage} 
            alt="Philosophy Video" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-900/90" />
          
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-8 left-8 w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 mb-auto shadow-lg"
            >
              <Play className="w-8 h-8 fill-current ml-1" />
            </motion.button>

            <div className="max-w-3xl text-white">
              <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
                {t('video.title.line1')} <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">{t('video.title.line2')}</span>
              </h2>
              <p className="text-slate-200 mb-8 text-lg max-w-xl font-medium">
                {t('video.description')}
              </p>
              <button 
                onClick={() => setView('philosophy')}
                className="px-8 py-4 bg-white/80 backdrop-blur-md text-slate-900 rounded-full font-bold hover:bg-white transition-colors shadow-lg"
              >
                {t('video.button')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
