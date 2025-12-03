import React, { useState, useEffect } from 'react';
import { useLanguage } from '../language-context';
import { useNavigation } from '../navigation-context';
import { useAuth } from '../auth-context';
import { useTheme } from '../theme-context';
import { Calendar, Clock, ArrowRight, Image as ImageIcon, Video, FileText, Search, Filter, Heart, MessageSquare, Tag, X, PenSquare } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';

interface ContentBlock {
  type: 'text' | 'image' | 'video';
  value: string;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  contentType: string;
  blocks?: ContentBlock[];
  tags?: string[];
  featured?: boolean;
  likes?: number;
  commentCount?: number;
  created_at: string;
  published: boolean;
}

export function BlogListPage() {
  const { language } = useLanguage();
  const { navigate } = useNavigation();
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  // Search functionality removed - focus on content presentation
  // const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // const [selectedTag, setSelectedTag] = useState<string>('all');
  // const [showFilters, setShowFilters] = useState(false);

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

// Load published blogs from Supabase
useEffect(() => {
  const fetchBlogs = async () => {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading blogs from Supabase:', error);
      setBlogs([]);
    } else {
      setBlogs(data || []);
    }
  };

  fetchBlogs();
}, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getReadingTime = (blocks: any[]) => {
    const textContent = blocks
      .filter(block => block.type === 'text')
      .map(block => block.value)
      .join(' ');
    const words = textContent.split(/\s+/).length;
    const minutes = Math.ceil(words / 200); // Average reading speed
    return minutes;
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'text':
        return <FileText className="w-4 h-4" />;
      case 'image-text':
        return <ImageIcon className="w-4 h-4" />;
      case 'video-text':
        return <Video className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getCoverImage = (blog: BlogPost) => {
    // Find first image block
    const imageBlock = blog.blocks?.find(block => block.type === 'image');
    return imageBlock?.value || null;
  };

  const text: Record<string, {
    title: string;
    subtitle: string;
    readMore: string;
    noPosts: string;
    minRead: string;
  }> = {
    en: {
      title: 'Blog',
      subtitle: 'Insights and updates from the Baseul team',
      readMore: 'Read Article',
      noPosts: 'No blog posts yet. Check back soon!',
      minRead: 'min read',
    },
    zh: {
      title: '博客',
      subtitle: '来自 Baseul 团队的见解和更新',
      readMore: '阅读文章',
      noPosts: '暂无博客文章,敬请期待!',
      minRead: '分钟阅读',
    },
    fr: {
      title: 'Blog',
      subtitle: 'Aperçus et mises à jour de l\'équipe Baseul',
      readMore: 'Lire l\'article',
      noPosts: 'Aucun article de blog pour le moment. Revenez bientôt!',
      minRead: 'min de lecture',
    },
    de: {
      title: 'Blog',
      subtitle: 'Einblicke und Updates vom Baseul-Team',
      readMore: 'Artikel lesen',
      noPosts: 'Noch keine Blog-Beiträge. Schauen Sie bald wieder vorbei!',
      minRead: 'Min. Lesezeit',
    },
  };

  const t = text[language] || text.en;

  // Get unique categories and tags
  const categories = Array.from(new Set(blogs.map(blog => blog.category).filter(Boolean))) as string[];
  // const allTags = Array.from(new Set(blogs.flatMap(blog => blog.tags || []))) as string[];

  // Filter blogs - search functionality removed, only category filtering retained
  const filteredBlogs = blogs.filter(blog => {
    const matchesCategory = selectedCategory === 'all' || blog.category === selectedCategory;
    return matchesCategory;
  });

  // const handleClearFilters = () => {
  //   setSelectedCategory('all');
  // };

  const hasActiveFilters = selectedCategory !== 'all';

  return (
    <div className={`min-h-screen pt-32 pb-20 transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 relative">
          <h1 className={`mb-4 ${theme === 'dark' ? 'text-blue-400' : 'text-[#2B4C7E]'}`}>{t.title}</h1>
          <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{t.subtitle}</p>
          
          {/* Admin Publish Button */}
          {isAdmin && (
            <button
              onClick={() => navigate('admin-blog')}
              className="absolute right-0 top-0 flex items-center gap-2 px-6 py-3 bg-[#2B4C7E] text-white rounded-full hover:bg-[#1e3557] transition-all shadow-lg hover:shadow-xl"
            >
              <PenSquare className="w-5 h-5" />
              <span className="hidden sm:inline">
                {language === 'zh' ? '发布文章' : 'Publish Article'}
              </span>
            </button>
          )}
        </div>

        {/* Category Filter - Search functionality removed */}
        {categories.length > 0 && (
          <div className="mb-8">
            <div className={`rounded-2xl shadow-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white'
            }`}>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-6 py-3 rounded-full transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-[#2B4C7E] text-white shadow-lg'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {language === 'zh' ? '全部' : 'All'}
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-6 py-3 rounded-full transition-all ${
                      selectedCategory === category
                        ? 'bg-[#2B4C7E] text-white shadow-lg'
                        : theme === 'dark'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Count - only show when category filter is active */}
        {hasActiveFilters && (
          <div className={`mb-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'zh' 
              ? `找到 ${filteredBlogs.length} 篇文章` 
              : `Found ${filteredBlogs.length} article${filteredBlogs.length !== 1 ? 's' : ''}`}
          </div>
        )}

        {/* Bento Grid */}
        {filteredBlogs.length === 0 ? (
          <div className={`rounded-2xl shadow-lg p-12 text-center ${
            theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              {hasActiveFilters 
                ? (language === 'zh' ? '未找到匹配的文章' : 'No articles match your filters')
                : t.noPosts}
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => setSelectedCategory('all')}
                className={`mt-4 hover:underline ${
                  theme === 'dark' ? 'text-blue-400' : 'text-[#2B4C7E]'
                }`}
              >
                {language === 'zh' ? '清除筛选' : 'Clear Filters'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">
            {filteredBlogs.filter(blog => blog && blog.id && blog.title).map((blog, index) => {
              const coverImage = getCoverImage(blog);
              const readingTime = getReadingTime(blog.blocks || []);
              
              // Bento grid layout pattern
              // Featured posts take more space
              const isFeatured = blog.featured;
              const gridClass = isFeatured 
                ? 'md:col-span-2 md:row-span-2' 
                : index % 5 === 3 
                  ? 'md:col-span-2' 
                  : 'md:col-span-1';
              
              return (
                <div
                  key={blog.id}
                  className={`${gridClass} group cursor-pointer`}
                  onClick={() => navigate('blog-detail', { blogId: blog.id })}
                >
                  <div className={`rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col ${
                    theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white'
                  }`}>
                    {/* Cover Image or Gradient */}
                    {coverImage ? (
                      <div className={`${isFeatured ? 'h-80' : 'h-48'} overflow-hidden relative bg-gray-200`}>
                        <img 
                          src={coverImage} 
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            // Fallback to gradient if image fails to load
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                    ) : (
                      <div className={`${isFeatured ? 'h-80' : 'h-48'} bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 relative overflow-hidden`}>
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white rounded-full blur-3xl" />
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className={`p-6 flex flex-col flex-grow ${isFeatured ? 'p-8' : ''}`}>
                      {/* Meta Info */}
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <div className={`flex items-center gap-1 text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {getContentTypeIcon(blog.contentType)}
                        </div>
                        <div className={`flex items-center gap-1 text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>{readingTime} {t.minRead}</span>
                        </div>
                        <div className={`flex items-center gap-1 text-xs ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(blog.created_at)}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className={`mb-3 group-hover:text-purple-600 transition-colors line-clamp-2 ${
                        isFeatured ? 'text-2xl' : ''
                      } ${
                        theme === 'dark' ? 'text-blue-400' : 'text-[#2B4C7E]'
                      }`}>
                        {blog.title}
                      </h3>

                      {/* Excerpt */}
                      <p className={`mb-4 ${isFeatured ? 'line-clamp-4 text-lg' : 'line-clamp-2'} ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {blog.excerpt}
                      </p>

                      {/* Tags */}
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {blog.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
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
                      )}

                      {/* Engagement Stats */}
                      <div className={`flex items-center gap-4 mb-4 text-sm border-t pt-3 ${
                        theme === 'dark'
                          ? 'text-gray-400 border-gray-700'
                          : 'text-gray-500 border-gray-100'
                      }`}>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{blog.likes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{blog.commentCount || 0}</span>
                        </div>
                      </div>

                      {/* Read More */}
                      <button className={`flex items-center gap-2 group-hover:gap-3 transition-all ${
                        theme === 'dark' ? 'text-blue-400' : 'text-[#2B4C7E]'
                      }`}>
                        <span>{t.readMore}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}