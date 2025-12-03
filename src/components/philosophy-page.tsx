import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Brain, Layers, GitMerge } from 'lucide-react';
import { useNavigation } from './navigation-context';
import { useLanguage } from './language-context';
import { useTheme } from './theme-context';

export function PhilosophyPage() {
  const { setView } = useNavigation();
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
    <div className="pt-32 pb-20 relative z-20 min-h-screen">
      <div className="container mx-auto px-4">
        <button 
          onClick={() => setView('home')}
          className={`flex items-center gap-2 transition-colors mb-8 font-bold ${
            theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowLeft className="w-4 h-4" /> Back to System
        </button>

        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <h1 className={`text-5xl md:text-7xl font-black tracking-tight mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Cognitive <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Operating System</span>
            </h1>
            <p className={`text-xl md:text-2xl font-medium max-w-2xl mx-auto ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              We are not building toys. We are building the cognitive infrastructure for the AI generation.
            </p>
          </motion.div>

          {/* Core Concept 1: Habits as Rooms */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`mb-16 p-8 md:p-12 rounded-[2.5rem] border backdrop-blur-2xl ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/10 shadow-2xl shadow-cyan-900/10' 
                : 'bg-white/60 border-white/60 shadow-xl'
            }`}
          >
            <div className="flex items-start gap-6 mb-6">
               <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-100 text-cyan-600'}`}>
                 <Layers className="w-8 h-8" />
               </div>
               <div>
                 <h2 className={`text-3xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Habits as "Rooms"</h2>
                 <p className={`text-lg font-bold ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>Structure over Repetition</p>
               </div>
            </div>
            <div className={`prose lg:prose-xl max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
              <p>
                In traditional education, a habit is often reduced to repetition. At Baseul Kids, we model every habit—whether it's brushing teeth or planning a week—as a cognitive "Room".
              </p>
              <p>
                A Room is a closed loop consisting of:
              </p>
              <ul>
                <li><strong>Entry Trigger:</strong> A contextual cue (time, location, or emotion) that starts the behavior.</li>
                <li><strong>Process Structure:</strong> A guided sequence of actions, not just a single command.</li>
                <li><strong>Exit Feedback:</strong> A distinct closure event (light, sound, or data log) that signals completion.</li>
              </ul>
              <p>
                By visualizing habits as rooms, children learn to "enter" a focus state and "exit" with a sense of accomplishment.
              </p>
            </div>
          </motion.div>

          {/* Core Concept 2: Cognitive Stages */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className={`mb-16 p-8 md:p-12 rounded-[2.5rem] border backdrop-blur-2xl ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/10 shadow-2xl shadow-purple-900/10' 
                : 'bg-white/60 border-white/60 shadow-xl'
            }`}
          >
             <div className="flex items-start gap-6 mb-6">
               <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-purple-900/30 text-purple-400 border border-purple-500/20' : 'bg-purple-100 text-purple-600'}`}>
                 <Brain className="w-8 h-8" />
               </div>
               <div>
                 <h2 className={`text-3xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>The Cognitive Trilogy</h2>
                 <p className={`text-lg font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>From Rhythm to Strategy</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[
                 { title: 'Establishment', age: '3-6', desc: 'Building the internal clock and basic order.' },
                 { title: 'Organization', age: '6-9', desc: 'Learning to sequence tasks and manage focus.' },
                 { title: 'Leadership', age: '9+', desc: 'Mastering self-driven planning and system optimization.' }
               ].map((stage, i) => (
                 <div key={i} className={`p-6 rounded-2xl border ${
                   theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/50 border-slate-200'
                 }`}>
                    <div className="text-sm font-black text-slate-400 mb-2">{stage.age} Years</div>
                    <h3 className={`text-xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{stage.title}</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{stage.desc}</p>
                 </div>
               ))}
            </div>
          </motion.div>

          {/* Core Concept 3: AI Collaboration */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className={`p-8 md:p-12 rounded-[2.5rem] border backdrop-blur-2xl ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/10 shadow-2xl shadow-blue-900/10' 
                : 'bg-white/60 border-white/60 shadow-xl'
            }`}
          >
            <div className="flex items-start gap-6 mb-6">
               <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/20' : 'bg-blue-100 text-blue-600'}`}>
                 <GitMerge className="w-8 h-8" />
               </div>
               <div>
                 <h2 className={`text-3xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>AI as a Co-Pilot</h2>
                 <p className={`text-lg font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Collaboration, Not dependency</p>
               </div>
            </div>
            <div className={`prose lg:prose-xl max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
              <p>
                The greatest danger of AI is dependency—where the human prompts and the machine does the thinking. 
              </p>
              <p>
                Baseul Kids flips this model. Our systems are designed to ask, not just answer. 
              </p>
              <p>
                "How will you plan this?" <br/>
                "What is the first step?" <br/>
                "Why do you think that happened?"
              </p>
              <p>
                We use AI to scaffold the child's thinking process, forcing them to build the cognitive muscles required to lead intelligent systems, rather than be led by them.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
