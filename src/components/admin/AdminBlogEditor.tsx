import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth-context';
import { useNavigation } from '../navigation-context';
import { ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff, Image as ImageIcon, Video, Type, X } from 'lucide-react';
import { BlogPost, ContentBlock, initializeBlogsIfNeeded } from '../../utils/initialBlogData';

export function AdminBlogEditor() {
  const { isAdmin } = useAuth();
  const { navigate } = useNavigation();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    excerpt: string;
    published: boolean;
    contentType: 'text' | 'image-text' | 'video-text';
    blocks: ContentBlock[];
    featured: boolean;
    category: string;
    tags: string;
  }>({
    title: '',
    excerpt: '',
    published: false,
    contentType: 'text',
    blocks: [{ type: 'text', value: '' }],
    featured: false,
    category: '',
    tags: '',
  });

  // Load blogs from localStorage and initialize if needed
  useEffect(() => {
    try {
      const loadedBlogs = initializeBlogsIfNeeded();
      setBlogs(loadedBlogs);
    } catch (error) {
      console.error('Error loading blogs:', error);
      setBlogs([]);
    }
  }, []);

  // Save blogs to localStorage
  const saveBlogs = (updatedBlogs: BlogPost[]) => {
    localStorage.setItem('baseul_admin_blogs', JSON.stringify(updatedBlogs));
    setBlogs(updatedBlogs);
  };

  const handleCreateNew = () => {
    setIsEditing(true);
    setEditingBlog(null);
    setFormData({
      title: '',
      excerpt: '',
      published: false,
      contentType: 'text',
      blocks: [{ type: 'text', value: '' }],
      featured: false,
    });
  };

  const handleEdit = (blog: BlogPost) => {
    setIsEditing(true);
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      excerpt: blog.excerpt,
      published: blog.published,
      contentType: blog.contentType,
      blocks: blog.blocks.length > 0 ? blog.blocks : [{ type: 'text', value: blog.content }],
      featured: blog.featured || false,
    });
  };

  const handleSave = () => {
    if (!formData.title.trim() || formData.blocks.length === 0) return;

    const now = new Date().toISOString();
    
    // Generate legacy content from blocks for backward compatibility
    const legacyContent = formData.blocks
      .filter(block => block.type === 'text')
      .map(block => block.value)
      .join('\n\n');

    if (editingBlog) {
      // Update existing blog
      const updatedBlogs = blogs.map((blog) =>
        blog.id === editingBlog.id
          ? { 
              ...blog, 
              title: formData.title,
              excerpt: formData.excerpt,
              content: legacyContent,
              published: formData.published,
              contentType: formData.contentType,
              blocks: formData.blocks,
              featured: formData.featured,
              updatedAt: now 
            }
          : blog
      );
      saveBlogs(updatedBlogs);
    } else {
      // Create new blog
      const newBlog: BlogPost = {
        id: `blog_${Date.now()}`,
        title: formData.title,
        excerpt: formData.excerpt,
        content: legacyContent,
        published: formData.published,
        contentType: formData.contentType,
        blocks: formData.blocks,
        featured: formData.featured,
        createdAt: now,
        updatedAt: now,
      };
      saveBlogs([newBlog, ...blogs]);
    }

    setIsEditing(false);
    setEditingBlog(null);
  };

  const handleDelete = (blogId: string) => {
    if (confirm('Are you sure you want to delete this blog post?')) {
      const updatedBlogs = blogs.filter((blog) => blog.id !== blogId);
      saveBlogs(updatedBlogs);
    }
  };

  const handleTogglePublish = (blogId: string) => {
    const updatedBlogs = blogs.map((blog) =>
      blog.id === blogId
        ? { ...blog, published: !blog.published, updatedAt: new Date().toISOString() }
        : blog
    );
    saveBlogs(updatedBlogs);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingBlog(null);
  };

  const addBlock = (type: 'text' | 'image' | 'video') => {
    setFormData({
      ...formData,
      blocks: [...formData.blocks, { type, value: '', caption: '' }],
    });
  };

  const updateBlock = (index: number, field: 'value' | 'caption', newValue: string) => {
    const updatedBlocks = formData.blocks.map((block, i) =>
      i === index ? { ...block, [field]: newValue } : block
    );
    setFormData({ ...formData, blocks: updatedBlocks });
  };

  const removeBlock = (index: number) => {
    if (formData.blocks.length > 1) {
      setFormData({
        ...formData,
        blocks: formData.blocks.filter((_, i) => i !== index),
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Access Denied. Admin only.</p>
          <button
            onClick={() => navigate('home')}
            className="text-[#2B4C7E] hover:underline"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Blog List</span>
          </button>

          <h1 className="text-[#2B4C7E] mb-8">
            {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h1>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm mb-2 text-gray-700">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B4C7E]"
                placeholder="Blog post title"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm mb-2 text-gray-700">Excerpt *</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B4C7E] resize-none"
                placeholder="Short description for blog list"
              />
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-sm mb-2 text-gray-700">Content Type *</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setFormData({ ...formData, contentType: 'text', blocks: [{ type: 'text', value: '' }] })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    formData.contentType === 'text'
                      ? 'border-[#2B4C7E] bg-blue-50 text-[#2B4C7E]'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Type className="w-5 h-5" />
                  <span>Text Only</span>
                </button>
                <button
                  onClick={() => setFormData({ ...formData, contentType: 'image-text' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    formData.contentType === 'image-text'
                      ? 'border-[#2B4C7E] bg-blue-50 text-[#2B4C7E]'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <ImageIcon className="w-5 h-5" />
                  <span>Image + Text</span>
                </button>
                <button
                  onClick={() => setFormData({ ...formData, contentType: 'video-text' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    formData.contentType === 'video-text'
                      ? 'border-[#2B4C7E] bg-blue-50 text-[#2B4C7E]'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Video className="w-5 h-5" />
                  <span>Video + Text</span>
                </button>
              </div>
            </div>

            {/* Content Blocks */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm text-gray-700">Content Blocks *</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => addBlock('text')}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    <Type className="w-4 h-4" />
                    Add Text
                  </button>
                  {formData.contentType !== 'text' && (
                    <>
                      <button
                        onClick={() => addBlock('image')}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        <ImageIcon className="w-4 h-4" />
                        Add Image
                      </button>
                      {formData.contentType === 'video-text' && (
                        <button
                          onClick={() => addBlock('video')}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          <Video className="w-4 h-4" />
                          Add Video
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {formData.blocks.map((block, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {block.type === 'text' && <Type className="w-4 h-4" />}
                        {block.type === 'image' && <ImageIcon className="w-4 h-4" />}
                        {block.type === 'video' && <Video className="w-4 h-4" />}
                        <span className="capitalize">{block.type} Block</span>
                      </div>
                      {formData.blocks.length > 1 && (
                        <button
                          onClick={() => removeBlock(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {block.type === 'text' && (
                      <textarea
                        value={block.value}
                        onChange={(e) => updateBlock(index, 'value', e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#2B4C7E] resize-none"
                        placeholder="Enter text content..."
                      />
                    )}

                    {block.type === 'image' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={block.value}
                          onChange={(e) => updateBlock(index, 'value', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#2B4C7E]"
                          placeholder="Image URL (e.g., from Unsplash)"
                        />
                        <input
                          type="text"
                          value={block.caption || ''}
                          onChange={(e) => updateBlock(index, 'caption', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#2B4C7E]"
                          placeholder="Image caption (optional)"
                        />
                      </div>
                    )}

                    {block.type === 'video' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={block.value}
                          onChange={(e) => updateBlock(index, 'value', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#2B4C7E]"
                          placeholder="YouTube embed URL (e.g., https://www.youtube.com/embed/...)"
                        />
                        <input
                          type="text"
                          value={block.caption || ''}
                          onChange={(e) => updateBlock(index, 'caption', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#2B4C7E]"
                          placeholder="Video caption (optional)"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="w-5 h-5 text-[#2B4C7E] border-gray-300 rounded focus:ring-[#2B4C7E]"
                />
                <label htmlFor="published" className="text-gray-700">
                  Publish immediately
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-5 h-5 text-[#2B4C7E] border-gray-300 rounded focus:ring-[#2B4C7E]"
                />
                <label htmlFor="featured" className="text-gray-700">
                  Feature this post (appears larger in blog list)
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.title.trim() || !formData.excerpt.trim() || formData.blocks.length === 0}
                className="px-6 py-2 bg-[#2B4C7E] text-white rounded-lg hover:bg-[#1e3557] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingBlog ? 'Update Post' : 'Create Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('admin-dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-[#2B4C7E]">Blog Management</h1>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-6 py-2 bg-[#2B4C7E] text-white rounded-lg hover:bg-[#1e3557]"
          >
            <Plus className="w-5 h-5" />
            <span>New Blog Post</span>
          </button>
        </div>

        {/* Blog List */}
        {blogs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 mb-4">No blog posts yet.</p>
            <button
              onClick={handleCreateNew}
              className="text-[#2B4C7E] hover:underline"
            >
              Create your first blog post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-[#2B4C7E]">{blog.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          blog.published
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {blog.published ? 'Published' : 'Draft'}
                      </span>
                      {blog.featured && (
                        <span className="px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                          Featured
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                        {blog.contentType === 'text' && 'Text'}
                        {blog.contentType === 'image-text' && 'Image + Text'}
                        {blog.contentType === 'video-text' && 'Video + Text'}
                      </span>
                    </div>
                    {blog.excerpt && (
                      <p className="text-gray-600 mb-2 line-clamp-2">{blog.excerpt}</p>
                    )}
                    <div className="text-sm text-gray-500">
                      Created: {new Date(blog.createdAt).toLocaleDateString()}
                      {blog.updatedAt !== blog.createdAt && (
                        <> • Updated: {new Date(blog.updatedAt).toLocaleDateString()}</>
                      )}
                      {' • '}{blog.blocks?.length || 0} content blocks
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleTogglePublish(blog.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title={blog.published ? 'Unpublish' : 'Publish'}
                    >
                      {blog.published ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleEdit(blog)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(blog.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
