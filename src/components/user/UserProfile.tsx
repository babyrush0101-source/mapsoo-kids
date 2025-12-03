import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth-context';
import { useNavigation } from '../navigation-context';
import { useLanguage } from '../language-context';
import { ArrowLeft, User as UserIcon, Mail, Calendar, Edit2, Save, MessageCircle } from 'lucide-react';

export function UserProfile() {
  const { currentUser, isLoggedIn, updateProfile, logout } = useAuth();
  const { navigate } = useNavigation();
  const { language } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.user_metadata?.name || '');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userReplies, setUserReplies] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('login');
      return;
    }

    try {
      // Load user's posts
      const storedPosts = localStorage.getItem('baseul_community_posts');
      if (storedPosts && currentUser) {
        const allPosts = JSON.parse(storedPosts);
        const myPosts = allPosts.filter((p: any) => 
          p && typeof p === 'object' && p.authorId === currentUser.id
        );
        setUserPosts(myPosts);
      }

      // Load user's replies
      const storedReplies = localStorage.getItem('baseul_community_replies');
      if (storedReplies && currentUser) {
        const allReplies = JSON.parse(storedReplies);
        const myReplies = allReplies.filter((r: any) => 
          r && typeof r === 'object' && r.authorId === currentUser.id
        );
        setUserReplies(myReplies);
      }
    } catch (error) {
      console.error('Error loading user activity:', error);
      setUserPosts([]);
      setUserReplies([]);
    }
  }, [isLoggedIn, currentUser, navigate]);

  const handleSave = () => {
    if (name.trim()) {
      updateProfile({ name: name.trim() });
      setIsEditing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const text: Record<string, any> = {
    en: {
      title: 'My Profile',
      back: 'Back',
      name: 'Name',
      email: 'Email',
      joined: 'Joined',
      role: 'Role',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      logout: 'Logout',
      myActivity: 'My Activity',
      posts: 'Posts',
      replies: 'Replies',
      noPosts: 'No posts yet',
      noReplies: 'No replies yet',
      admin: 'Admin',
      user: 'User',
    },
    zh: {
      title: '我的资料',
      back: '返回',
      name: '姓名',
      email: '邮箱',
      joined: '加入时间',
      role: '角色',
      edit: '编辑',
      save: '保存',
      cancel: '取消',
      logout: '退出登录',
      myActivity: '我的动态',
      posts: '帖子',
      replies: '回复',
      noPosts: '暂无帖子',
      noReplies: '暂无回复',
      admin: '管理员',
      user: '用户',
    },
    fr: {
      title: 'Mon profil',
      back: 'Retour',
      name: 'Nom',
      email: 'Email',
      joined: 'Inscrit',
      role: 'Rôle',
      edit: 'Modifier',
      save: 'Enregistrer',
      cancel: 'Annuler',
      logout: 'Déconnexion',
      myActivity: 'Mon activité',
      posts: 'Messages',
      replies: 'Réponses',
      noPosts: 'Aucun message pour le moment',
      noReplies: 'Aucune réponse pour le moment',
      admin: 'Administrateur',
      user: 'Utilisateur',
    },
    de: {
      title: 'Mein Profil',
      back: 'Zurück',
      name: 'Name',
      email: 'E-Mail',
      joined: 'Beigetreten',
      role: 'Rolle',
      edit: 'Bearbeiten',
      save: 'Speichern',
      cancel: 'Abbrechen',
      logout: 'Abmelden',
      myActivity: 'Meine Aktivität',
      posts: 'Beiträge',
      replies: 'Antworten',
      noPosts: 'Noch keine Beiträge',
      noReplies: 'Noch keine Antworten',
      admin: 'Administrator',
      user: 'Benutzer',
    },
  };

  const t = text[language] || text.en;

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('home')}
          className="flex items-center gap-2 text-[#2B4C7E] hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.back}</span>
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-2xl">
                {currentUser?.user_metadata?.name?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-[#2B4C7E] mb-1">{t.title}</h1>
                <span className={`px-3 py-1 rounded-full text-xs ${
                  currentUser?.user_metadata?.role === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {currentUser?.user_metadata?.role === 'admin' ? t.admin : t.user}
                </span>
              </div>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-[#2B4C7E] hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>{t.edit}</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setName(currentUser?.user_metadata?.name || '');
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2B4C7E] text-white rounded-lg hover:bg-[#1e3557] transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{t.save}</span>
                </button>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">{t.name}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B4C7E]"
                />
              ) : (
                <p className="text-gray-900">{currentUser?.user_metadata?.name || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">{t.email}</label>
              <p className="text-gray-900">{currentUser?.email}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">{t.joined}</label>
              <p className="text-gray-900">{formatDate(currentUser?.created_at || new Date().toISOString())}</p>
            </div>
          </div>

          {/* Logout Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                logout();
                navigate('home');
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              {t.logout}
            </button>
          </div>
        </div>

        {/* Activity Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-[#2B4C7E] mb-6">{t.myActivity}</h2>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-[#2B4C7E] mb-1">{userPosts.length}</div>
              <div className="text-sm text-gray-600">{t.posts}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">{userReplies.length}</div>
              <div className="text-sm text-gray-600">{t.replies}</div>
            </div>
          </div>

          {/* Recent Posts */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">{t.posts}</h3>
            {userPosts.length === 0 ? (
              <p className="text-gray-500 text-sm">{t.noPosts}</p>
            ) : (
              <div className="space-y-2">
                {userPosts.slice(0, 5).map((post) => (
                  <div
                    key={post.id}
                    onClick={() => navigate('post-detail', { postId: post.id })}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{post.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(post.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Replies */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">{t.replies}</h3>
            {userReplies.length === 0 ? (
              <p className="text-gray-500 text-sm">{t.noReplies}</p>
            ) : (
              <div className="space-y-2">
                {userReplies.slice(0, 5).map((reply) => (
                  <div
                    key={reply.id}
                    onClick={() => navigate('post-detail', { postId: reply.postId })}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <p className="text-sm text-gray-700 line-clamp-2">{reply.content}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(reply.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}