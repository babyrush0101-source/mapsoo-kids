import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth-context';
import { useNavigation } from '../navigation-context';
import { useLanguage } from '../language-context';
import { useTheme } from '../theme-context';
import { Plus, MessageCircle, User as UserIcon, Heart, Repeat2, Share2, Image as ImageIcon, Baby, Users, GraduationCap, Handshake } from 'lucide-react';

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
  topic?: 'all' | '3-6' | '6-9' | '10+' | 'partners';
  featured?: boolean;
}

const TOPICS = [
  { id: '3-6', icon: Baby, label: { en: 'Ages 3-6', zh: '3-6岁', fr: '3-6 ans', de: '3-6 Jahre' } },
  { id: '6-9', icon: Users, label: { en: 'Ages 6-9', zh: '6-9岁', fr: '6-9 ans', de: '6-9 Jahre' } },
  { id: '10+', icon: GraduationCap, label: { en: 'Ages 10+', zh: '10岁+', fr: '10+ ans', de: '10+ Jahre' } },
  { id: 'partners', icon: Handshake, label: { en: 'Partners', zh: '合作伙伴', fr: 'Partenaires', de: 'Partner' } },
];

export function CommunityPage() {
  const { currentUser, isLoggedIn } = useAuth();
  const { navigate } = useNavigation();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTopic, setActiveTopic] = useState<string>('3-6');
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  // Load posts from localStorage
  useEffect(() => {
    try {
      const storedPosts = localStorage.getItem('baseul_community_posts');
      if (storedPosts) {
        const parsedPosts = JSON.parse(storedPosts);
        const validPosts = parsedPosts.filter((p: Post) => 
          p && 
          typeof p === 'object' && 
          p.id && 
          p.content
        );
        setPosts(validPosts);
      } else {
        // Initialize with Twitter-style mock posts
        const mockPosts: Post[] = [
          {
            id: 'post_1',
            content: '🎉 Welcome to the Baseul Kids Community! This is a space where parents, educators, and caregivers connect, share experiences, and support each other on the journey of early childhood development. Feel free to introduce yourself!',
            authorId: 'admin_1',
            authorName: 'Baseul Team',
            authorEmail: 'team@baseul.com',
            createdAt: new Date('2025-11-25T10:00:00Z').toISOString(),
            replyCount: 24,
            likeCount: 156,
            retweetCount: 42,
            topic: 'partners',
            featured: true,
            images: ['https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800'],
          },
          {
            id: 'post_2',
            content: 'Just captured my daughter\'s first steps on Baseul Memory! 🎥✨ These moments are absolutely priceless. The app made it so easy to record and organize all her milestones. Can\'t wait to look back on these memories together when she\'s older. #ProudParent',
            authorId: 'user_1',
            authorName: 'Sarah Chen',
            authorEmail: 'sarah@example.com',
            createdAt: new Date('2025-11-26T14:30:00Z').toISOString(),
            replyCount: 18,
            likeCount: 203,
            retweetCount: 15,
            topic: '3-6',
            images: ['https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=800', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800'],
          },
          {
            id: 'post_3',
            content: 'My 3-year-old has been using Baseul Memory for two weeks. Here are 3 tips that worked for us:\n\n1. Keep sessions short (10-15 min)\n2. Use it during calm moments, not when tired\n3. Let them choose the activity\n\nWhat strategies have worked for you? 👇',
            authorId: 'user_2',
            authorName: 'Michael Rodriguez',
            authorEmail: 'michael@example.com',
            createdAt: new Date('2025-11-27T09:15:00Z').toISOString(),
            replyCount: 31,
            likeCount: 178,
            retweetCount: 45,
            topic: '3-6',
          },
          {
            id: 'post_4',
            content: 'Question for parents with kids 6-9: How do you balance screen time with physical activities? My 7-year-old loves educational apps but I want to ensure he\'s getting enough outdoor play. 🌳⚽',
            authorId: 'user_3',
            authorName: 'Sofia Martinez',
            authorEmail: 'sofia@example.com',
            createdAt: new Date('2025-11-27T16:45:00Z').toISOString(),
            replyCount: 27,
            likeCount: 134,
            retweetCount: 22,
            topic: '6-9',
          },
          {
            id: 'post_5',
            content: 'My 8-year-old just finished her first coding project using visual programming! So proud of how she problem-solved through the challenges. The critical thinking skills she\'s developing are amazing. 💻✨',
            authorId: 'user_4',
            authorName: 'Emma Thompson',
            authorEmail: 'emma@example.com',
            createdAt: new Date('2025-11-28T11:20:00Z').toISOString(),
            replyCount: 15,
            likeCount: 189,
            retweetCount: 38,
            topic: '6-9',
            images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=800'],
          },
          {
            id: 'post_6',
            content: 'Teenage years are challenging! My 12-year-old is developing such interesting perspectives on the world. Anyone else navigating the pre-teen phase? Would love to share experiences and advice. 🌟',
            authorId: 'user_5',
            authorName: 'David Kim',
            authorEmail: 'david@example.com',
            createdAt: new Date('2025-11-28T19:00:00Z').toISOString(),
            replyCount: 12,
            likeCount: 95,
            retweetCount: 18,
            topic: '10+',
          },
          {
            id: 'post_7',
            content: 'Shout out to @MontessoriSchool for their amazing collaboration with Baseul! The integrated curriculum has been a game-changer for our classroom. 🎓 #EducationPartners',
            authorId: 'user_6',
            authorName: 'Rachel Green',
            authorEmail: 'rachel@example.com',
            createdAt: new Date('2025-11-29T08:30:00Z').toISOString(),
            replyCount: 9,
            likeCount: 112,
            retweetCount: 24,
            topic: 'partners',
            images: ['https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800'],
          },
          {
            id: 'post_8',
            content: 'Today my 5-year-old recognized emotions in photos for the first time! 😊😢😠 We\'ve been working on emotional intelligence using Baseul\'s interactive activities. So proud of this little milestone! #EmotionalDevelopment',
            authorId: 'user_7',
            authorName: 'Lisa Park',
            authorEmail: 'lisa@example.com',
            createdAt: new Date('2025-11-29T13:15:00Z').toISOString(),
            replyCount: 21,
            likeCount: 167,
            retweetCount: 31,
            topic: '3-6',
            images: ['https://images.unsplash.com/photo-1604480132736-44c188fe4d20?w=800'],
          },
        ];
        localStorage.setItem('baseul_community_posts', JSON.stringify(mockPosts));
        setPosts(mockPosts);
      }

      // Load user's liked posts
      if (currentUser) {
        const userLikes = localStorage.getItem(`baseul_user_likes_posts_${currentUser.id}`);
        if (userLikes) {
          setLikedPosts(JSON.parse(userLikes));
        }
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    }
  }, [currentUser]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

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

  const handleCreatePost = () => {
    if (!isLoggedIn) {
      navigate('login');
    } else {
      navigate('create-post');
    }
  };

  const handlePostClick = (postId: string) => {
    navigate('post-detail', { postId });
  };

  const handleLike = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isLoggedIn) {
      navigate('login');
      return;
    }

    if (!currentUser) return;

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
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likeCount: isLiked ? post.likeCount - 1 : post.likeCount + 1,
        };
      }
      return post;
    });
    setPosts(updatedPosts);
    localStorage.setItem('baseul_community_posts', JSON.stringify(updatedPosts));
  };

  const text: Record<string, any> = {
    en: {
      title: 'Community',
      createPost: 'Post',
      noPosts: 'No posts yet. Be the first to share!',
    },
    zh: {
      title: '社区',
      createPost: '发帖',
      noPosts: '暂无帖子，成为第一个分享的人！',
    },
    fr: {
      title: 'Communauté',
      createPost: 'Publier',
      noPosts: 'Aucun message pour le moment. Soyez le premier à partager!',
    },
    de: {
      title: 'Gemeinschaft',
      createPost: 'Posten',
      noPosts: 'Noch keine Beiträge. Seien Sie der Erste!',
    },
  };

  const t = text[language] || text.en;

  // Filter posts by topic
  const filteredPosts = posts.filter(post => post.topic === activeTopic);

  return (
    <div className={`min-h-screen pt-20 pb-20 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className={`max-w-4xl mx-auto border-x min-h-screen ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        {/* Header with Topics */}
        <div className={`sticky top-16 backdrop-blur-xl border-b z-10 ${
          theme === 'dark' 
            ? 'bg-gray-900/80 border-gray-700' 
            : 'bg-white/80 border-gray-200'
        }`}>
          {/* Title Bar */}
          <div className={`px-4 py-3 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h1 className={theme === 'dark' ? 'text-blue-400' : 'text-[#2B4C7E]'}>{t.title}</h1>
          </div>

          {/* Topic Tabs */}
          <div className="flex overflow-x-auto scrollbar-hide">
            {TOPICS.map((topic) => {
              const Icon = topic.icon;
              const isActive = activeTopic === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => setActiveTopic(topic.id)}
                  className={`flex-1 min-w-fit px-6 py-4 flex items-center justify-center gap-2 transition-all relative ${
                    isActive
                      ? theme === 'dark' ? 'text-blue-400' : 'text-[#2B4C7E]'
                      : theme === 'dark' 
                        ? 'text-gray-400 hover:bg-gray-800' 
                        : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm whitespace-nowrap">
                    {topic.label[language as keyof typeof topic.label] || topic.label.en}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#2B4C7E] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Posts Feed */}
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t.noPosts}</p>
          </div>
        ) : (
          <div>
            {filteredPosts.filter(post => post && post.id && post.content).map((post) => {
              const isLiked = likedPosts.includes(post.id);
              
              return (
                <article
                  key={post.id}
                  className={`border-b p-4 transition-colors cursor-pointer ${
                    theme === 'dark'
                      ? 'border-gray-700 hover:bg-gray-800'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handlePostClick(post.id)}
                >
                  {/* Post Header */}
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white flex-shrink-0">
                      <UserIcon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Author Info */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`truncate ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                          {post.authorName || 'Anonymous'}
                        </span>
                        <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}>·</span>
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatDate(post.createdAt)}
                        </span>
                      </div>

                      {/* Post Content */}
                      <p className={`whitespace-pre-wrap mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                        {post.content}
                      </p>

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
                              onClick={(e) => e.stopPropagation()}
                            />
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between max-w-md mt-2">
                        {/* Reply */}
                        <button
                          className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors group"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePostClick(post.id);
                          }}
                        >
                          <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                            <MessageCircle className="w-4 h-4" />
                          </div>
                          <span className="text-sm">{post.replyCount}</span>
                        </button>

                        {/* Retweet */}
                        <button
                          className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="p-2 rounded-full group-hover:bg-green-50 transition-colors">
                            <Repeat2 className="w-4 h-4" />
                          </div>
                          <span className="text-sm">{post.retweetCount}</span>
                        </button>

                        {/* Like */}
                        <button
                          className={`flex items-center gap-2 transition-colors group ${
                            isLiked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'
                          }`}
                          onClick={(e) => handleLike(post.id, e)}
                        >
                          <div className={`p-2 rounded-full transition-colors ${
                            isLiked ? 'bg-pink-50' : 'group-hover:bg-pink-50'
                          }`}>
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                          </div>
                          <span className="text-sm">{post.likeCount}</span>
                        </button>

                        {/* Share */}
                        <button
                          className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                            <Share2 className="w-4 h-4" />
                          </div>
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

      {/* Floating Action Button (Twitter-style) */}
      <button
        onClick={handleCreatePost}
        className="fixed bottom-20 right-6 w-14 h-14 bg-[#2B4C7E] text-white rounded-full shadow-2xl hover:bg-[#1e3557] transition-all hover:scale-110 flex items-center justify-center z-50 md:bottom-8 md:right-8 md:w-16 md:h-16"
        aria-label={t.createPost}
      >
        <Plus className="w-6 h-6 md:w-7 md:h-7" />
      </button>
    </div>
  );
}
