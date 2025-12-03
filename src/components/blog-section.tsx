import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useTheme } from './theme-context';
import { useLanguage } from './language-context';
import { useNavigation } from './navigation-context';

export function BlogSection() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { setView } = useNavigation();

  const posts = [
    {
      title: t('blog.post1.title'),
      category: "Philosophy",
      date: "Oct 12, 2025",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwYWJzdHJhY3QlMjB3aGl0ZXxlbnwxfHx8fDE3NjM3MDYyNDF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      title: t('blog.post2.title'),
      category: "Development",
      date: "Oct 05, 2025",
      image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbG9jayUyMGFydHxlbnwxfHx8fDE3NjM3MDYyNDJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      title: t('blog.post3.title'),
      category: "Technology",
      date: "Sep 28, 2025",
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmdlbCUyMHdpbmclMjBhcnR8ZW58MXx8fHwxNzYzNzA2MjQzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    }
  ];

  return (
    <section id="blog" className="py-20 relative z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className={`text-4xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t('blog.title')}
            </h2>
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
              {t('blog.post1.desc')}
            </p>
          </div>
          <button 
            onClick={() => setView('blog')}
            className={`font-bold flex items-center gap-2 hover:gap-3 transition-all ${
              theme === 'dark' ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'
            }`}
          >
            {/* Temporary fix for corrupted char in language file */}
            {t('blog.viewAll').includes('看') ? (
              <>
                <span className="md:hidden">全部</span>
                <span className="hidden md:inline">查看全部</span>
              </>
            ) : t('blog.viewAll')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setView('blog', { postId: (index + 1).toString() })}
              className={`group rounded-[2rem] overflow-hidden cursor-pointer border backdrop-blur-xl ${
                theme === 'dark' 
                  ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20' 
                  : 'bg-white/60 border-white/60 hover:border-cyan-200 shadow-lg'
              }`}
            >
              <div className="h-48 overflow-hidden relative">
                 <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                 <div className={`absolute top-4 left-4 px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-md uppercase tracking-wider ${
                   theme === 'dark' ? 'bg-black/50 text-white' : 'bg-white/90 text-slate-900'
                 }`}>
                   {post.category}
                 </div>
              </div>
              <div className="p-6">
                <div className={`text-xs font-bold mb-3 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{post.date}</div>
                <h3 className={`text-xl font-black leading-tight mb-4 group-hover:text-cyan-500 transition-colors ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  {post.title}
                </h3>
                <div className={`flex items-center gap-2 text-sm font-bold ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {t('blog.post1.read')} <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
