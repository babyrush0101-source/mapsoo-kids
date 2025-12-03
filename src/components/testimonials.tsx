import React from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { useTheme } from './theme-context';
import { useLanguage } from './language-context';

export function Testimonials() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Construct testimonials from translation keys
  const testimonialData = [1, 2, 3, 4, 5, 6].map(i => ({
    id: i,
    content: t(`testi.${i}.content`),
    name: t(`testi.${i}.name`),
    role: t(`testi.${i}.role`),
    rating: 5,
    image: [
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces", // Sarah
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces", // Aris
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces", // Michelle
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces", // James
      "https://images.unsplash.com/photo-1554151228-14d9def656ec?w=150&h=150&fit=crop&crop=faces", // Emily
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces"  // David
    ][i-1]
  }));

  const row1 = [...testimonialData.slice(0, 3), ...testimonialData.slice(0, 3), ...testimonialData.slice(0, 3)]; 
  const row2 = [...testimonialData.slice(3, 6), ...testimonialData.slice(3, 6), ...testimonialData.slice(3, 6)];

  const Card = ({ item }: { item: any }) => (
    <div
      className={`w-[350px] md:w-[400px] flex-shrink-0 p-6 rounded-[1.5rem] border backdrop-blur-xl flex flex-col h-full ${
        theme === 'dark' 
          ? 'bg-white/5 border-white/10 shadow-2xl' 
          : 'bg-white/60 border-white/60 shadow-xl shadow-slate-200/50'
      }`}
    >
      <div className="flex gap-1 mb-4">
        {[...Array(item.rating)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      
      <p className={`text-base font-medium mb-6 flex-1 leading-relaxed italic ${
        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
      }`}>
        "{item.content}"
      </p>

      <div className="flex items-center gap-3 mt-auto">
        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/50" />
        <div>
          <div className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.name}</div>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{item.role}</div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-24 relative z-10 overflow-hidden">
      <div className="container mx-auto px-4 mb-12">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className={`text-3xl md:text-4xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {t('testimonials.title')}
          </h2>
          <p className={`text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('testimonials.subtitle')}
          </p>
        </motion.div>
      </div>

      {/* Row 1: Left */}
      <div className="relative w-full overflow-hidden mb-8 py-8 -my-8"> 
        <motion.div 
          className="flex gap-6 w-max px-4"
          animate={{ x: "-33%" }}
          transition={{ 
            duration: 30, 
            ease: "linear", 
            repeat: Infinity,
          }}
          whileHover={{ animationPlayState: "paused" }} 
        >
          {row1.map((item, index) => (
            <Card key={`r1-${index}`} item={item} />
          ))}
        </motion.div>
        {/* Gradients inside the overflow container to mask edges properly */}
        <div className={`absolute inset-y-0 left-0 w-32 bg-gradient-to-r pointer-events-none z-20 ${theme === 'dark' ? 'from-[#050505] to-transparent' : 'from-white via-white/80 to-transparent'}`} />
        <div className={`absolute inset-y-0 right-0 w-32 bg-gradient-to-l pointer-events-none z-20 ${theme === 'dark' ? 'from-[#050505] to-transparent' : 'from-white via-white/80 to-transparent'}`} />
      </div>

      {/* Row 2: Right */}
      <div className="relative w-full overflow-hidden py-8 -my-8">
        <motion.div 
          className="flex gap-6 w-max px-4"
          initial={{ x: "-33%" }}
          animate={{ x: "0%" }}
          transition={{ 
            duration: 35, 
            ease: "linear", 
            repeat: Infinity,
          }}
          whileHover={{ animationPlayState: "paused" }} 
        >
          {row2.map((item, index) => (
            <Card key={`r2-${index}`} item={item} />
          ))}
        </motion.div>
        <div className={`absolute inset-y-0 left-0 w-32 bg-gradient-to-r pointer-events-none z-20 ${theme === 'dark' ? 'from-[#050505] to-transparent' : 'from-white via-white/80 to-transparent'}`} />
        <div className={`absolute inset-y-0 right-0 w-32 bg-gradient-to-l pointer-events-none z-20 ${theme === 'dark' ? 'from-[#050505] to-transparent' : 'from-white via-white/80 to-transparent'}`} />
      </div>
    </section>
  );
}
