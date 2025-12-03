import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Send, ThumbsUp, Share2, User } from 'lucide-react';
import { useNavigation } from './navigation-context';
import { useTheme } from './theme-context';

interface Comment {
  id: string;
  user: string;
  text: string;
  date: string;
  likes: number;
}

interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  readTime: string;
  tags: string[];
  image: string;
  content: React.ReactNode;
  comments: Comment[];
}

export function BlogPage() {
  const { setView, viewParams } = useNavigation();
  const { theme } = useTheme();
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (viewParams && viewParams.postId) {
      setSelectedPost(viewParams.postId);
    }
  }, [viewParams]);

  const posts: BlogPost[] = [
    {
      id: '1',
      title: 'The End of "Screen Time"',
      subtitle: 'Why we need to stop counting hours and start measuring cognitive engagement.',
      date: 'Oct 12, 2025',
      readTime: '5 min read',
      tags: ['Cognition', 'Digital Health'],
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwYWJzdHJhY3QlMjB3aGl0ZXxlbnwxfHx8fDE3NjM3MDYyNDF8MA&ixlib=rb-4.1.0&q=80&w=1080",
      content: (
        <>
          <p>For years, parents have been fighting a losing battle against "screen time". We set limits, we install blockers, we snatch iPads away at dinner.</p>
          <p>But in the AI era, the screen is no longer just a consumption window—it's the interface for creation, logic, and command. The problem isn't the screen; it's the <em>passivity</em>.</p>
          <h3>Active vs. Passive Engagement</h3>
          <p>When a child watches YouTube, their cognitive load is near zero. They are absorbing. When a child uses Baseul Explore to plan a project, their cognitive load is high. They are structuring.</p>
          <p>We need to shift our metric from "Time Spent" to "Decisions Made".</p>
        </>
      ),
      comments: [
        { id: 'c1', user: 'Alice M.', text: 'This perspective shifts everything for me. Thank you!', date: '2 hours ago', likes: 12 },
        { id: 'c2', user: 'David K.', text: 'Active engagement is key. My son spends hours coding and he is more alive than 30 mins of TV.', date: '5 hours ago', likes: 8 }
      ]
    },
    {
      id: '2',
      title: 'Why Toys Are Dead',
      subtitle: 'The shift from plastic entertainment to adaptive companions.',
      date: 'Oct 08, 2025',
      readTime: '4 min read',
      tags: ['Industry', 'Future'],
      image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWQlMjBsb29raW5nJTIwYXQlMjBmdXR1cmlzdGljJTIwbGlnaHRzfGVufDF8fHx8MTc2MzcwNjEwMHww&ixlib=rb-4.1.0&q=80&w=1080",
      content: (
        <>
           <p>The toy industry has been stagnant for decades. Plastic molds, simple mechanics. But children today are digital natives.</p>
           <p>They expect their environment to respond. They expect personalization. A static teddy bear is comforting, but an adaptive AI companion is <em>developmental</em>.</p>
        </>
      ),
      comments: []
    },
    {
      id: '3',
      title: 'The Future of Memory',
      subtitle: 'How digital memory augmentation changes human cognition.',
      date: 'Sep 28, 2025',
      readTime: '6 min read',
      tags: ['Technology', 'Memory'],
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmdlbCUyMHdpbmclMjBhcnR8ZW58MXx8fHwxNzYzNzA2MjQzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      content: (
        <>
           <p>Memory is not just storage; it is the foundation of identity. With Baseul Memory, we are not just storing files, we are preserving the context of growth.</p>
           <p>Imagine a system that not only remembers what you did, but understands <em>how</em> you learned it. That is the future we are building.</p>
        </>
      ),
      comments: []
    }
  ];

  const activePost = posts.find(p => p.id === selectedPost);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activePost) return;
    
    // Mock submission
    const newComment: Comment = {
      id: Date.now().toString(),
      user: 'Guest User',
      text: commentText,
      date: 'Just now',
      likes: 0
    };
    
    // In a real app, we'd mutate via API. Here we just alert for demo.
    alert('Comment submitted!');
    setCommentText('');
  };

  return (
    <div className="pt-32 pb-20 relative z-20 min-h-screen">
      <div className="container mx-auto px-4">
        <button 
          onClick={() => selectedPost ? setSelectedPost(null) : setView('home')}
          className={`flex items-center gap-2 transition-colors mb-8 font-bold ${
            theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowLeft className="w-4 h-4" /> {selectedPost ? 'Back to Blog' : 'Back to System'}
        </button>

        {!selectedPost ? (
          /* Post List */
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-5xl font-black mb-12 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
            >
              System Logs
            </motion.h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {posts.map((post) => (
                <motion.div 
                  key={post.id}
                  whileHover={{ y: -5 }}
                  onClick={() => setSelectedPost(post.id)}
                  className={`rounded-[2rem] overflow-hidden cursor-pointer border backdrop-blur-2xl transition-all ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                      : 'bg-white/60 border-white/60 hover:border-cyan-200 shadow-lg'
                  }`}
                >
                  <div className="h-64 overflow-hidden">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                  </div>
                  <div className="p-8">
                    <div className="flex gap-2 mb-4">
                      {post.tags.map(tag => (
                        <span key={tag} className={`text-xs font-bold px-3 py-1 rounded-full ${
                          theme === 'dark' ? 'bg-white/10 text-cyan-300 border border-white/10' : 'bg-slate-100 text-cyan-600'
                        }`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h2 className={`text-2xl font-black mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{post.title}</h2>
                    <p className={`text-sm font-medium mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{post.subtitle}</p>
                    <div className={`flex justify-between text-xs font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                       <span>{post.date}</span>
                       <span>{post.readTime}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          /* Single Post View */
          <div className="max-w-4xl mx-auto">
            {activePost && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="mb-8">
                   <div className="flex gap-2 mb-4">
                      {activePost.tags.map(tag => (
                        <span key={tag} className={`text-xs font-bold px-3 py-1 rounded-full ${
                          theme === 'dark' ? 'bg-white/10 text-cyan-300 border border-white/10' : 'bg-slate-100 text-cyan-600'
                        }`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                   <h1 className={`text-4xl md:text-6xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{activePost.title}</h1>
                   <div className={`flex items-center gap-4 text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                     <span>Baseul Team</span>
                     <span>•</span>
                     <span>{activePost.date}</span>
                     <span>•</span>
                     <span>{activePost.readTime}</span>
                   </div>
                </div>

                <div className="rounded-[2rem] overflow-hidden mb-12 h-[400px] border border-white/10">
                   <img src={activePost.image} alt={activePost.title} className="w-full h-full object-cover" />
                </div>

                <div className={`prose lg:prose-xl max-w-none mb-16 ${theme === 'dark' ? 'prose-invert' : ''}`}>
                   {activePost.content}
                </div>

                <div className={`border-t pt-12 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
                   <div className="flex justify-between items-center mb-8">
                     <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Discussion ({activePost.comments.length})</h3>
                     <div className="flex gap-4">
                       <button className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600'}`}>
                         <ThumbsUp className="w-5 h-5" />
                       </button>
                       <button className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600'}`}>
                         <Share2 className="w-5 h-5" />
                       </button>
                     </div>
                   </div>

                   {/* Comment Form */}
                   <form onSubmit={handleCommentSubmit} className="mb-12 flex gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}>
                        <User className="w-5 h-5 opacity-50" />
                      </div>
                      <div className="flex-1 relative">
                        <input 
                          type="text" 
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Join the discussion..."
                          className={`w-full px-6 py-3 rounded-full pr-12 outline-none transition-all ${
                            theme === 'dark' 
                             ? 'bg-white/5 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 border border-white/10' 
                             : 'bg-slate-100 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-400'
                          }`}
                        />
                        <button type="submit" className="absolute right-2 top-2 p-1.5 bg-cyan-500 text-white rounded-full hover:bg-cyan-400 transition-colors">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                   </form>

                   {/* Comment List */}
                   <div className="space-y-6">
                      {activePost.comments.map(comment => (
                        <div key={comment.id} className="flex gap-4">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black ${
                             theme === 'dark' ? 'bg-purple-900/30 text-purple-300 border border-purple-500/20' : 'bg-purple-100 text-purple-600'
                           }`}>
                             {comment.user.charAt(0)}
                           </div>
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{comment.user}</span>
                                <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{comment.date}</span>
                              </div>
                              <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{comment.text}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
