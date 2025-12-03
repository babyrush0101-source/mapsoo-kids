import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../language-context';
import { useNavigation } from '../navigation-context';
import { useAuth } from '../auth-context';
import { useTheme } from '../theme-context';
import { ArrowLeft, Calendar, Clock, Heart, MessageSquare, Send, Tag } from 'lucide-react';
import { BlogImage } from '../ui/BlogImage';
import { supabase } from '../../utils/supabase/client';
import { useAuthModal } from '../auth/auth-modal-context';

interface ContentBlock {
  type: 'text' | 'image' | 'video';
  value: string;
  caption?: string;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  contentType: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  featured?: boolean;
  category: string;
  blocks?: ContentBlock[];
  tags?: string[];
  likes?: number;
  commentCount?: number;
}

interface BlogComment {
  id: string;
  blogId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
}

export function BlogDetailPage({ blogId }: { blogId: string }) {
  const { language } = useLanguage();
  const { navigate } = useNavigation();
  const { currentUser, isLoggedIn } = useAuth();
  const { theme } = useTheme();
  const { openAuthModal } = useAuthModal();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize comment textarea
  useEffect(() => {
    const textarea = commentTextareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [commentContent]);

  useEffect(() => {
    const loadBlog = async () => {
      try {
        // Load blog from Supabase
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('id', blogId)
          .eq('published', true)
          .maybeSingle();

        if (error) {
          console.error('Error loading blog from Supabase:', error);
          setBlog(null);
          return;
        }

        if (data) {
          // Map Supabase fields to BlogPost interface
          const mappedBlog: BlogPost = {
            id: data.id,
            title: data.title,
            excerpt: data.excerpt ?? '',
            content: data.content ?? '',
            contentType: data.content_type ?? 'text',
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            published: data.published,
            featured: data.featured ?? false,
            category: data.category ?? '',
            blocks: data.blocks ?? [],
            tags: Array.isArray(data.tags) ? data.tags : [],
            likes: data.likes ?? 0,
            commentCount: data.comment_count ?? 0,
          };
          
          setBlog(mappedBlog);
          setLikeCount(mappedBlog.likes || 0);
        } else {
          setBlog(null);
        }

        // Load comments from localStorage
        const storedComments = localStorage.getItem('baseul_blog_comments');
        if (storedComments) {
          const allComments = JSON.parse(storedComments);
          const blogComments = allComments.filter((c: BlogComment) => c.blogId === blogId);
          setComments(blogComments);
        }

        // Check if user has liked this blog
        if (currentUser) {
          const userLikes = localStorage.getItem(`baseul_user_likes_${currentUser.id}`);
          if (userLikes) {
            const likes = JSON.parse(userLikes);
            setIsLiked(likes.includes(blogId));
          }
        }
      } catch (error) {
        console.error('Error loading blog:', error);
        setBlog(null);
      }
    };

    loadBlog();
  }, [blogId, currentUser]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getReadingTime = (blocks: any[]) => {
    const textContent = blocks
      .filter(block => block.type === 'text')
      .map(block => block.value)
      .join(' ');
    const words = textContent.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return minutes;
  };

  const handleLike = () => {
    if (!isLoggedIn) {
      openAuthModal();
      return;
    }

    if (!currentUser) return;

    const userLikesKey = `baseul_user_likes_${currentUser.id}`;
    const userLikes = localStorage.getItem(userLikesKey);
    let likes = userLikes ? JSON.parse(userLikes) : [];

    if (isLiked) {
      // Unlike
      likes = likes.filter((id: string) => id !== blogId);
      setLikeCount(prev => prev - 1);
      setIsLiked(false);
    } else {
      // Like
      likes.push(blogId);
      setLikeCount(prev => prev + 1);
      setIsLiked(true);
    }

    localStorage.setItem(userLikesKey, JSON.stringify(likes));
    
    // TODO: Update like count in Supabase in future
    // For now, likes are tracked only in localStorage per user
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      openAuthModal();
      return;
    }

    if (!commentContent.trim() || !currentUser) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const newComment: BlogComment = {
      id: `comment_${Date.now()}`,
      blogId: blogId,
      content: commentContent.trim(),
      authorId: currentUser.id,
      authorName: currentUser.name || currentUser.email,
      authorEmail: currentUser.email,
      createdAt: new Date().toISOString(),
    };

    // Save comment to localStorage
    const storedComments = localStorage.getItem('baseul_blog_comments');
    const allComments = storedComments ? JSON.parse(storedComments) : [];
    allComments.push(newComment);
    localStorage.setItem('baseul_blog_comments', JSON.stringify(allComments));

    // Update local state
    setComments([...comments, newComment]);
    
    // Update blog comment count in local state
    if (blog) {
      setBlog({
        ...blog,
        commentCount: (blog.commentCount || 0) + 1
      });
    }
    
    setCommentContent('');
    setIsSubmitting(false);
    
    // TODO: Update comment count in Supabase in future
  };

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInHours < 1) return language === 'zh' ? '刚刚' : 'Just now';
    if (diffInHours < 24) return language === 'zh' ? `${diffInHours} 小时前` : `${diffInHours}h ago`;
    if (diffInDays === 1) return language === 'zh' ? '昨天' : 'Yesterday';
    if (diffInDays < 7) return language === 'zh' ? `${diffInDays} 天前` : `${diffInDays}d ago`;
    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US');
  };

  const text: Record<string, any> = {
    en: {
      back: 'Back to Blog',
      notFound: 'Blog post not found',
      minRead: 'min read',
      likes: 'likes',
      comments: 'comments',
      leaveComment: 'Leave a Comment',
      commentPlaceholder: 'Share your thoughts...',
      postComment: 'Post Comment',
      loginToComment: 'Login to comment',
      noComments: 'No comments yet. Be the first to comment!',
    },
    zh: {
      back: '返回博客',
      notFound: '博客文章未找到',
      minRead: '分钟阅读',
      likes: '点赞',
      comments: '评论',
      leaveComment: '发表评论',
      commentPlaceholder: '分享你的想法...',
      postComment: '发布评论',
      loginToComment: '登录后评论',
      noComments: '暂无评论,成为第一个评论的人!',
    },
    fr: {
      back: 'Retour au blog',
      notFound: 'Article de blog non trouvé',
      minRead: 'min de lecture',
      likes: 'j\'aime',
      comments: 'commentaires',
      leaveComment: 'Laisser un commentaire',
      commentPlaceholder: 'Partagez vos pensées...',
      postComment: 'Publier le commentaire',
      loginToComment: 'Connectez-vous pour commenter',
      noComments: 'Aucun commentaire pour le moment. Soyez le premier à commenter!',
    },
    de: {
      back: 'Zurück zum Blog',
      notFound: 'Blog-Beitrag nicht gefunden',
      minRead: 'Min. Lesezeit',
      likes: 'Gefällt mir',
      comments: 'Kommentare',
      leaveComment: 'Einen Kommentar hinterlassen',
      commentPlaceholder: 'Teilen Sie Ihre Gedanken...',
      postComment: 'Kommentar veröffentlichen',
      loginToComment: 'Anmelden zum Kommentieren',
      noComments: 'Noch keine Kommentare. Seien Sie der Erste, der kommentiert!',
    },
  };

  const t = text[language] || text.en;

  if (!blog) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
      }`}>
        <div className="text-center">
          <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t.notFound}</p>
          <button
            onClick={() => navigate('blog')}
            className={`hover:underline ${
              theme === 'dark' ? 'text-blue-400' : 'text-[#2B4C7E]'
            }`}
          >
            {t.back}
          </button>
        </div>
      </div>
    );
  }

  const readingTime = getReadingTime(blog.blocks || []);

  return (
    <div className={`min-h-screen pt-32 pb-20 transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('blog')}
          className={`flex items-center gap-2 hover:underline mb-8 ${
            theme === 'dark' ? 'text-blue-400' : 'text-[#2B4C7E]'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.back}</span>
        </button>

        {/* Blog Post Card */}
        <article className={`rounded-2xl shadow-lg overflow-hidden ${
          theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}>
          {/* Header with gradient or hero image */}
          {blog.blocks && blog.blocks.length > 0 && blog.blocks[0].type === 'image' ? (
            <div className="h-96 overflow-hidden relative">
              <img 
                src={blog.blocks[0].value} 
                alt={blog.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
                <h1 className="mb-4">{blog.title}</h1>
                <div className="flex items-center gap-4 text-sm text-white/90">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(blog.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{readingTime} {t.minRead}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="h-64 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white rounded-full blur-3xl" />
                </div>
              </div>
              <div className={`p-8 md:p-12 border-b ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h1 className={`mb-4 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-[#2B4C7E]'
                }`}>{blog.title}</h1>
                <div className={`flex items-center gap-4 text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(blog.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{readingTime} {t.minRead}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Content Blocks */}
          <div className="p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              {blog.blocks && blog.blocks.map((block, index) => {
                // Skip first image if it was used as hero
                if (index === 0 && block.type === 'image' && blog.blocks.length > 1) {
                  return null;
                }

                switch (block.type) {
                  case 'text':
                    return (
                      <div key={index} className="mb-8">
                        <div className={`whitespace-pre-wrap leading-relaxed ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {block.value}
                        </div>
                      </div>
                    );
                  
                  case 'image':
                    return (
                      <BlogImage
                        key={index}
                        src={block.value}
                        alt={block.caption || blog.title}
                        caption={block.caption}
                        className="mb-12"
                      />
                    );
                  
                  case 'video':
                    return (
                      <div key={index} className="mb-12">
                        <div className="relative rounded-xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
                          <iframe
                            src={block.value}
                            className="absolute top-0 left-0 w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        {block.caption && (
                          <p className="text-center text-sm text-gray-500 mt-3 italic">
                            {block.caption}
                          </p>
                        )}
                      </div>
                    );
                  
                  default:
                    return null;
                }
              })}

              {/* Fallback for legacy content */}
              {(!blog.blocks || blog.blocks.length === 0) && blog.content && (
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {blog.content}
                </div>
              )}
            </div>

            {/* Tags and Engagement */}
            <div className={`px-8 md:px-12 pb-8 border-t ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="mb-6 pt-6">
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.map(tag => (
                      <span
                        key={tag}
                        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                          theme === 'dark'
                            ? 'bg-blue-900/30 text-blue-300'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Engagement Bar */}
              <div className={`flex items-center gap-6 pt-6 border-t ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
              }`}>
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    isLiked
                      ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likeCount}</span>
                  <span className="hidden sm:inline">{t.likes}</span>
                </button>
                <div className={`flex items-center gap-2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <MessageSquare className="w-5 h-5" />
                  <span>{comments.length}</span>
                  <span className="hidden sm:inline">{t.comments}</span>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div className={`mt-8 rounded-2xl shadow-lg p-8 ${
          theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}>
          <h2 className={`mb-6 ${
            theme === 'dark' ? 'text-blue-400' : 'text-[#2B4C7E]'
          }`}>
            {t.comments} ({comments.length})
          </h2>

          {/* Comment Form */}
          {isLoggedIn ? (
            <form onSubmit={handleSubmitComment} className="mb-8">
              <textarea
                ref={commentTextareaRef}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder={t.commentPlaceholder}
                rows={1}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B4C7E] focus:border-transparent resize-none min-h-[48px] max-h-[200px] overflow-y-auto ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                disabled={isSubmitting}
                style={{ lineHeight: '1.5' }}
              />
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  disabled={!commentContent.trim() || isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 bg-[#2B4C7E] text-white rounded-full hover:bg-[#1e3557] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? '...' : t.postComment}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className={`mb-8 p-6 rounded-lg text-center ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <p className={`mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{t.loginToComment}</p>
              <button
                onClick={() => openAuthModal()}
                className="px-6 py-2 bg-[#2B4C7E] text-white rounded-full hover:bg-[#1e3557] transition-all"
              >
                Login
              </button>
            </div>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <MessageSquare className={`w-12 h-12 mx-auto mb-4 ${
                theme === 'dark' ? 'text-gray-700' : 'text-gray-300'
              }`} />
              <p>{t.noComments}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white flex-shrink-0">
                      <span className="text-sm">{comment.authorName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>
                          {comment.authorName}
                        </span>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatCommentDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className={`whitespace-pre-wrap ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to Blog at bottom */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('blog')}
            className="text-[#2B4C7E] hover:underline inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.back}</span>
          </button>
        </div>
      </div>
    </div>
  );
}