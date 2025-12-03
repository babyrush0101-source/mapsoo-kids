import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth-context';
import { useNavigation } from '../navigation-context';
import { useLanguage } from '../language-context';
import { useTheme } from '../theme-context';
import { ArrowLeft, MessageCircle, User as UserIcon, Heart, Repeat2, Share2, Send } from 'lucide-react';
import { EmojiPicker } from '../ui/EmojiPicker';

interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  replyCount: number;
  likeCount: number;
  retweetCount: number;
  images?: string[];
  topic?: string;
}

interface Reply {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  likeCount: number;
}

export function PostDetail({ postId }: { postId: string }) {
  const { currentUser, isLoggedIn } = useAuth();
  const { navigate } = useNavigation();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [likedReplies, setLikedReplies] = useState<string[]>([]);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = replyTextareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [replyContent]);

  // Load post, replies, and user likes
  useEffect(() => {
    try {
      const storedPosts = localStorage.getItem('baseul_community_posts');
      if (storedPosts) {
        const posts = JSON.parse(storedPosts);
        const foundPost = posts.find((p: Post) => p && p.id === postId);
        setPost(foundPost || null);
      }

      const storedReplies = localStorage.getItem('baseul_community_replies');
      if (storedReplies) {
        const allReplies = JSON.parse(storedReplies);
        const validReplies = allReplies.filter((r: Reply) => 
          r && typeof r === 'object' && r.postId === postId
        );
        setReplies(validReplies);
      } else {
        // Initialize with mock replies
        const mockReplies: Reply[] = [
          {
            id: 'reply_1',
            postId: 'post_1',
            content: 'Thanks for creating this space! Excited to connect with other parents. 🎉',
            authorId: 'user_1',
            authorName: 'Emma Johnson',
            authorEmail: 'emma@example.com',
            createdAt: new Date('2025-11-25T12:00:00Z').toISOString(),
            likeCount: 24,
          },
          {
            id: 'reply_2',
            postId: 'post_2',
            content: 'This is amazing! I love how you captured such a special moment. Makes me want to be more intentional about recording milestones.',
            authorId: 'user_2',
            authorName: 'David Chen',
            authorEmail: 'david@example.com',
            createdAt: new Date('2025-11-26T15:00:00Z').toISOString(),
            likeCount: 15,
          },
          {
            id: 'reply_3',
            postId: 'post_3',
            content: 'Great tips! I would add: make it a routine at the same time each day. Consistency has been key for us.',
            authorId: 'user_3',
            authorName: 'Rachel Park',
            authorEmail: 'rachel@example.com',
            createdAt: new Date('2025-11-27T10:00:00Z').toISOString(),
            likeCount: 32,
          },
        ];
        localStorage.setItem('baseul_community_replies', JSON.stringify(mockReplies));
        if (mockReplies.some(r => r.postId === postId)) {
          setReplies(mockReplies.filter((r: Reply) => r.postId === postId));
        }
      }

      // Load user's liked posts and replies
      if (currentUser) {
        const userPostLikes = localStorage.getItem(`baseul_user_likes_posts_${currentUser.id}`);
        if (userPostLikes) {
          setLikedPosts(JSON.parse(userPostLikes));
        }
        const userReplyLikes = localStorage.getItem(`baseul_user_likes_replies_${currentUser.id}`);
        if (userReplyLikes) {
          setLikedReplies(JSON.parse(userReplyLikes));
        }
      }
    } catch (error) {
      console.error('Error loading post/replies:', error);
      setPost(null);
      setReplies([]);
    }
  }, [postId, currentUser]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInMinutes < 1) return language === 'zh' ? '刚刚' : 'now';
    if (diffInMinutes < 60) return language === 'zh' ? `${diffInMinutes}分钟` : `${diffInMinutes}m`;
    if (diffInHours < 24) return language === 'zh' ? `${diffInHours}小时` : `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    if (diffInDays < 7) return language === 'zh' ? `${diffInDays}天` : `${diffInDays}d`;
    
    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleLikePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isLoggedIn) {
      navigate('login');
      return;
    }

    if (!currentUser || !post) return;

    const userLikesKey = `baseul_user_likes_posts_${currentUser.id}`;
    const userLikes = localStorage.getItem(userLikesKey);
    let likes = userLikes ? JSON.parse(userLikes) : [];

    const isLiked = likes.includes(postId);
    
    if (isLiked) {
      likes = likes.filter((id: string) => id !== postId);
    } else {
      likes.push(postId);
    }

    localStorage.setItem(userLikesKey, JSON.stringify(likes));
    setLikedPosts(likes);

    // Update post like count
    const storedPosts = localStorage.getItem('baseul_community_posts');
    if (storedPosts) {
      const posts = JSON.parse(storedPosts);
      const postIndex = posts.findIndex((p: Post) => p.id === postId);
      if (postIndex !== -1) {
        posts[postIndex].likeCount = isLiked 
          ? posts[postIndex].likeCount - 1 
          : posts[postIndex].likeCount + 1;
        localStorage.setItem('baseul_community_posts', JSON.stringify(posts));
        setPost(posts[postIndex]);
      }
    }
  };

  const handleLikeReply = (replyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isLoggedIn) {
      navigate('login');
      return;
    }

    if (!currentUser) return;

    const userLikesKey = `baseul_user_likes_replies_${currentUser.id}`;
    const userLikes = localStorage.getItem(userLikesKey);
    let likes = userLikes ? JSON.parse(userLikes) : [];

    const isLiked = likes.includes(replyId);
    
    if (isLiked) {
      likes = likes.filter((id: string) => id !== replyId);
    } else {
      likes.push(replyId);
    }

    localStorage.setItem(userLikesKey, JSON.stringify(likes));
    setLikedReplies(likes);

    // Update reply like count
    const updatedReplies = replies.map(reply => {
      if (reply.id === replyId) {
        return {
          ...reply,
          likeCount: isLiked ? reply.likeCount - 1 : reply.likeCount + 1,
        };
      }
      return reply;
    });
    setReplies(updatedReplies);

    // Update in localStorage
    const storedReplies = localStorage.getItem('baseul_community_replies');
    if (storedReplies) {
      const allReplies = JSON.parse(storedReplies);
      const replyIndex = allReplies.findIndex((r: Reply) => r.id === replyId);
      if (replyIndex !== -1) {
        allReplies[replyIndex].likeCount = isLiked 
          ? allReplies[replyIndex].likeCount - 1 
          : allReplies[replyIndex].likeCount + 1;
        localStorage.setItem('baseul_community_replies', JSON.stringify(allReplies));
      }
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = replyTextareaRef.current;
    if (!textarea) {
      setReplyContent(replyContent + emoji);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = replyContent.substring(0, start) + emoji + replyContent.substring(end);
    setReplyContent(newContent);

    // Set cursor position after emoji
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      navigate('login');
      return;
    }

    if (!replyContent.trim() || !currentUser) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const newReply: Reply = {
      id: `reply_${Date.now()}`,
      postId: postId,
      content: replyContent.trim(),
      authorId: currentUser.id,
      authorName: currentUser.name || currentUser.email,
      authorEmail: currentUser.email,
      createdAt: new Date().toISOString(),
      likeCount: 0,
    };

    // Save to localStorage
    const storedReplies = localStorage.getItem('baseul_community_replies');
    const allReplies = storedReplies ? JSON.parse(storedReplies) : [];
    allReplies.push(newReply);
    localStorage.setItem('baseul_community_replies', JSON.stringify(allReplies));

    // Update reply count in post
    const storedPosts = localStorage.getItem('baseul_community_posts');
    if (storedPosts) {
      const posts = JSON.parse(storedPosts);
      const postIndex = posts.findIndex((p: Post) => p.id === postId);
      if (postIndex !== -1) {
        posts[postIndex].replyCount += 1;
        localStorage.setItem('baseul_community_posts', JSON.stringify(posts));
        setPost(posts[postIndex]);
      }
    }

    // Update UI
    setReplies([...replies, newReply]);
    setReplyContent('');
    setIsSubmitting(false);
  };

  const text: Record<string, any> = {
    en: {
      back: 'Back',
      replies: 'Replies',
      noReplies: 'No replies yet. Be the first to reply!',
      replyPlaceholder: 'Post your reply...',
      submitReply: 'Reply',
      loginToReply: 'Login to Reply',
      postNotFound: 'Post not found',
    },
    zh: {
      back: '返回',
      replies: '回复',
      noReplies: '暂无回复，成为第一个回复的人！',
      replyPlaceholder: '发布你的回复...',
      submitReply: '回复',
      loginToReply: '登录后回复',
      postNotFound: '帖子未找到',
    },
    fr: {
      back: 'Retour',
      replies: 'Réponses',
      noReplies: 'Aucune réponse pour le moment. Soyez le premier à répondre!',
      replyPlaceholder: 'Publier votre réponse...',
      submitReply: 'Répondre',
      loginToReply: 'Connectez-vous pour répondre',
      postNotFound: 'Message non trouvé',
    },
    de: {
      back: 'Zurück',
      replies: 'Antworten',
      noReplies: 'Noch keine Antworten. Seien Sie der Erste!',
      replyPlaceholder: 'Ihre Antwort posten...',
      submitReply: 'Antworten',
      loginToReply: 'Anmelden zum Antworten',
      postNotFound: 'Beitrag nicht gefunden',
    },
  };

  const t = text[language] || text.en;

  if (!post) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="text-center">
          <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t.postNotFound}</p>
          <button
            onClick={() => navigate('community')}
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

  const isPostLiked = likedPosts.includes(postId);

  return (
    <div className={`min-h-screen pt-20 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className={`max-w-2xl mx-auto border-x min-h-screen ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        {/* Header */}
        <div className={`sticky top-16 backdrop-blur-xl border-b z-10 px-4 py-3 flex items-center gap-4 ${
          theme === 'dark'
            ? 'bg-gray-900/80 border-gray-700'
            : 'bg-white/80 border-gray-200'
        }`}>
          <button
            onClick={() => navigate('community')}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className={`w-5 h-5 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`} />
          </button>
          <h1 className={theme === 'dark' ? 'text-blue-400' : 'text-[#2B4C7E]'}>Post</h1>
        </div>

        {/* Original Post */}
        <article className={`border-b p-4 ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {/* Post Header */}
          <div className="flex gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white flex-shrink-0">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <div className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>
                {post.authorName || 'Anonymous'}
              </div>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                @{post.authorEmail.split('@')[0]}
              </div>
            </div>
          </div>

          {/* Post Content */}
          <p className={`text-lg whitespace-pre-wrap mb-3 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
          }`}>{post.content}</p>

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className={`mb-3 rounded-2xl overflow-hidden border border-gray-200 ${
              post.images.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'
            }`}>
              {post.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt=""
                  className={`w-full object-cover ${
                    post.images!.length === 1 ? 'max-h-96' : 'h-48'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Post Time */}
          <div className={`text-sm mb-4 pb-4 border-b ${
            theme === 'dark' ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'
          }`}>
            {formatDate(post.createdAt)}
          </div>

          {/* Stats */}
          <div className={`flex items-center gap-4 text-sm pb-4 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div>
              <span className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>{post.replyCount}</span>{' '}
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>{t.replies}</span>
            </div>
            <div>
              <span className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>{post.retweetCount}</span>{' '}
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Retweets</span>
            </div>
            <div>
              <span className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>{post.likeCount}</span>{' '}
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Likes</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-around pt-2">
            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </div>
            </button>

            <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-green-50 transition-colors">
                <Repeat2 className="w-5 h-5" />
              </div>
            </button>

            <button
              onClick={handleLikePost}
              className={`flex items-center gap-2 transition-colors group ${
                isPostLiked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'
              }`}
            >
              <div className={`p-2 rounded-full transition-colors ${
                isPostLiked ? 'bg-pink-50' : 'group-hover:bg-pink-50'
              }`}>
                <Heart className={`w-5 h-5 ${isPostLiked ? 'fill-current' : ''}`} />
              </div>
            </button>

            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                <Share2 className="w-5 h-5" />
              </div>
            </button>
          </div>
        </article>

        {/* Reply Form */}
        {isLoggedIn ? (
          <div className={`border-b p-4 ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <form onSubmit={handleSubmitReply}>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white flex-shrink-0">
                  <span className="text-sm">{currentUser?.name?.[0] || currentUser?.email[0].toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <textarea
                    ref={replyTextareaRef}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={t.replyPlaceholder}
                    rows={1}
                    className={`w-full focus:outline-none resize-none mb-3 min-h-[24px] max-h-[200px] overflow-y-auto ${
                      theme === 'dark' 
                        ? 'text-gray-100 bg-transparent placeholder-gray-500' 
                        : 'text-gray-900 bg-transparent placeholder-gray-400'
                    }`}
                    disabled={isSubmitting}
                    style={{ lineHeight: '1.5' }}
                  />
                  <div className="flex items-center justify-between">
                    <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                    <button
                      type="submit"
                      disabled={!replyContent.trim() || isSubmitting}
                      className="px-6 py-2 bg-[#2B4C7E] text-white rounded-full hover:bg-[#1e3557] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? '...' : t.submitReply}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className={`border-b p-8 text-center ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t.loginToReply}</p>
            <button
              onClick={() => navigate('login')}
              className="px-6 py-2 bg-[#2B4C7E] text-white rounded-full hover:bg-[#1e3557] transition-all"
            >
              Login
            </button>
          </div>
        )}

        {/* Replies List */}
        <div>
          {replies.length === 0 ? (
            <div className="p-12 text-center">
              <MessageCircle className={`w-12 h-12 mx-auto mb-4 ${
                theme === 'dark' ? 'text-gray-700' : 'text-gray-300'
              }`} />
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>{t.noReplies}</p>
            </div>
          ) : (
            <div>
              {replies.map((reply) => {
                const isReplyLiked = likedReplies.includes(reply.id);
                return (
                  <article key={reply.id} className={`border-b p-4 transition-colors ${
                    theme === 'dark'
                      ? 'border-gray-700 hover:bg-gray-800'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center text-white flex-shrink-0">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>
                            {reply.authorName}
                          </span>
                          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}>·</span>
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatRelativeDate(reply.createdAt)}
                          </span>
                        </div>
                        <p className={`whitespace-pre-wrap mb-3 ${
                          theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                        }`}>{reply.content}</p>
                        
                        {/* Reply Actions */}
                        <div className="flex items-center gap-6">
                          <button
                            onClick={(e) => handleLikeReply(reply.id, e)}
                            className={`flex items-center gap-1 text-sm transition-colors ${
                              isReplyLiked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isReplyLiked ? 'fill-current' : ''}`} />
                            <span>{reply.likeCount}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
