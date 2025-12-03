import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth-context';
import { useNavigation } from '../navigation-context';
import { useLanguage } from '../language-context';
import { useTheme } from '../theme-context';
import { ArrowLeft, Send, Image as ImageIcon, X, Baby, Users, GraduationCap, Handshake } from 'lucide-react';
import { EmojiPicker } from '../ui/EmojiPicker';

const TOPICS = [
  { id: '3-6', icon: Baby, label: { en: 'Ages 3-6', zh: '3-6岁', fr: '3-6 ans', de: '3-6 Jahre' } },
  { id: '6-9', icon: Users, label: { en: 'Ages 6-9', zh: '6-9岁', fr: '6-9 ans', de: '6-9 Jahre' } },
  { id: '10+', icon: GraduationCap, label: { en: 'Ages 10+', zh: '10岁+', fr: '10+ ans', de: '10+ Jahre' } },
  { id: 'partners', icon: Handshake, label: { en: 'Partners', zh: '合作伙伴', fr: 'Partenaires', de: 'Partner' } },
];

export function CreatePost() {
  const { currentUser, isLoggedIn } = useAuth();
  const { navigate } = useNavigation();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('3-6');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Limit max width/height to 800px for better compression
          const maxSize = 800;
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.6 quality for smaller file size
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxImages = 4 - images.length;
    const filesToProcess = Math.min(files.length, maxImages);

    if (filesToProcess === 0) {
      alert(language === 'zh' ? '最多只能上传4张图片' : 'Maximum 4 images allowed');
      e.target.value = '';
      return;
    }

    setIsUploadingImage(true);

    try {
      for (let i = 0; i < filesToProcess; i++) {
        const file = files[i];
        if (file && file.type.startsWith('image/')) {
          // Check file size (max 5MB before compression)
          if (file.size > 5 * 1024 * 1024) {
            alert(language === 'zh' ? '图片太大，请选择小于5MB的图片' : 'Image too large. Please select an image under 5MB.');
            continue;
          }

          const compressedImage = await compressImage(file);
          
          // Check compressed image size (base64 string length)
          // If still too large, skip it
          if (compressedImage.length > 500000) { // ~375KB after base64 encoding
            alert(language === 'zh' ? '压缩后的图片仍然太大，请选择更小的图片' : 'Compressed image is still too large. Please select a smaller image.');
            continue;
          }
          
          setImages(prev => [...prev, compressedImage]);
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert(language === 'zh' ? '图片上传失败，请重试' : 'Failed to upload images. Please try again.');
    } finally {
      setIsUploadingImage(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent(content + emoji);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + emoji + content.substring(end);
    setContent(newContent);

    // Set cursor position after emoji
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn || !currentUser) {
      navigate('login');
      return;
    }

    if (!content.trim()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const newPost = {
      id: `post_${Date.now()}`,
      content: content.trim(),
      authorId: currentUser.id,
      authorName: currentUser.name || currentUser.email,
      authorEmail: currentUser.email,
      createdAt: new Date().toISOString(),
      replyCount: 0,
      likeCount: 0,
      retweetCount: 0,
      images: images.length > 0 ? images : undefined,
      topic: selectedTopic,
    };

    // Save to localStorage with error handling
    try {
      const storedPosts = localStorage.getItem('baseul_community_posts');
      const posts = storedPosts ? JSON.parse(storedPosts) : [];
      posts.unshift(newPost); // Add to beginning
      localStorage.setItem('baseul_community_posts', JSON.stringify(posts));

      // Navigate to the new post
      navigate('post-detail', { postId: newPost.id });
    } catch (storageError: any) {
      if (storageError.name === 'QuotaExceededError') {
        alert(language === 'zh' 
          ? '存储空间不足。请尝试上传更少或更小的图片。' 
          : 'Storage quota exceeded. Please try uploading fewer or smaller images.');
      } else {
        alert(language === 'zh' ? '发布失败，请重试' : 'Failed to post. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  const text: Record<string, any> = {
    en: {
      back: 'Back',
      placeholder: 'What\'s on your mind?',
      addImage: 'Add Image',
      imageUrl: 'Image URL',
      add: 'Add',
      cancel: 'Cancel',
      post: 'Post',
      selectTopic: 'Select Topic',
      characterCount: 'characters',
    },
    zh: {
      back: '返回',
      placeholder: '分享你的想法...',
      addImage: '添加图片',
      imageUrl: '图片链接',
      add: '添加',
      cancel: '取消',
      post: '发布',
      selectTopic: '选择主题',
      characterCount: '字符',
    },
    fr: {
      back: 'Retour',
      placeholder: 'Quoi de neuf?',
      addImage: 'Ajouter une image',
      imageUrl: 'URL de l\'image',
      add: 'Ajouter',
      cancel: 'Annuler',
      post: 'Publier',
      selectTopic: 'Sélectionner un sujet',
      characterCount: 'caractères',
    },
    de: {
      back: 'Zurück',
      placeholder: 'Was gibt\'s Neues?',
      addImage: 'Bild hinzufügen',
      imageUrl: 'Bild-URL',
      add: 'Hinzufügen',
      cancel: 'Abbrechen',
      post: 'Posten',
      selectTopic: 'Thema auswählen',
      characterCount: 'Zeichen',
    },
  };

  const t = text[language] || text.en;

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="text-center">
          <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Please login to create a post
          </p>
          <button
            onClick={() => navigate('login')}
            className="px-6 py-2 bg-[#2B4C7E] text-white rounded-full hover:bg-[#1e3557] transition-all"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-20 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className={`max-w-2xl mx-auto border-x min-h-screen ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        {/* Header */}
        <div className={`sticky top-16 border-b z-10 px-4 py-3 flex items-center gap-4 ${
          theme === 'dark'
            ? 'bg-gray-900 border-gray-700'
            : 'bg-white border-gray-200'
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
          <h1 className={theme === 'dark' ? 'text-blue-400' : 'text-[#2B4C7E]'}>{t.post}</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          {/* User Avatar & Textarea */}
          <div className="flex gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white flex-shrink-0">
              <span className="text-sm">{currentUser.name?.[0] || currentUser.email[0].toUpperCase()}</span>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.placeholder}
              rows={1}
              className={`flex-1 text-lg focus:outline-none resize-none min-h-[150px] max-h-[400px] overflow-y-auto ${
                theme === 'dark'
                  ? 'text-gray-100 bg-transparent placeholder-gray-500'
                  : 'text-gray-900 bg-transparent placeholder-gray-400'
              }`}
              disabled={isSubmitting}
              autoFocus
              required
              style={{ lineHeight: '1.5' }}
            />
          </div>

          {/* Images Preview */}
          {images.length > 0 && (
            <div className={`mb-4 rounded-2xl overflow-hidden border ${
              theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
            } ${images.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'}`}>
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt=""
                    className={`w-full object-cover ${
                      images.length === 1 ? 'max-h-96' : 'h-48'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-gray-900/70 hover:bg-gray-900 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Uploading Indicator */}
          {isUploadingImage && (
            <div className={`mb-4 p-4 border rounded-lg flex items-center gap-3 ${
              theme === 'dark'
                ? 'bg-blue-900/20 border-blue-800'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                {language === 'zh' ? '正在压缩图片...' : 'Compressing images...'}
              </span>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Topic Selection */}
          <div className="mb-4">
            <label className={`block text-sm mb-2 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>{t.selectTopic}</label>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((topic) => {
                const Icon = topic.icon;
                const isSelected = selectedTopic === topic.id;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                      isSelected
                        ? 'bg-[#2B4C7E] text-white'
                        : theme === 'dark'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{topic.label[language as keyof typeof topic.label] || topic.label.en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toolbar */}
          <div className={`flex items-center justify-between pt-4 border-t ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-2">
              {/* Add Image Button */}
              {images.length < 4 && !isUploadingImage && (
                <label
                  htmlFor="image-upload"
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:bg-gray-700 hover:text-blue-400'
                      : 'text-gray-500 hover:bg-blue-50 hover:text-[#2B4C7E]'
                  }`}
                  title={t.addImage}
                >
                  <ImageIcon className="w-5 h-5" />
                </label>
              )}

              {/* Emoji Picker */}
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />

              {/* Character Count */}
              <span className={`text-sm ml-2 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {content.length} {t.characterCount}
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting || isUploadingImage}
              className="px-6 py-2 bg-[#2B4C7E] text-white rounded-full hover:bg-[#1e3557] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '...' : t.post}
            </button>
          </div>
        </form>

        {/* Tips */}
        <div className={`mx-4 mb-4 border rounded-lg p-4 ${
          theme === 'dark'
            ? 'bg-blue-900/20 border-blue-800'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
            {language === 'zh'
              ? '💡 提示：分享有价值的内容，保持友善和尊重。最多可添加4张图片。'
              : '💡 Tip: Share valuable content and be respectful. You can add up to 4 images.'}
          </p>
        </div>
      </div>
    </div>
  );
}
