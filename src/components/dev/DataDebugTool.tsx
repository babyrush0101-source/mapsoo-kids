import React, { useState } from 'react';
import { Trash2, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { clearBaseulData } from '../../utils/localStorageHelper';

/**
 * Development tool for debugging localStorage data
 * Only visible in development mode (not shown by default)
 */
export function DataDebugTool() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleClearData = () => {
    try {
      clearBaseulData();
      setMessage({ type: 'success', text: 'All Baseul data cleared successfully' });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to clear data' });
    }
  };

  const checkDataIntegrity = () => {
    const checks = {
      users: { key: 'baseul_users', valid: false, count: 0 },
      posts: { key: 'baseul_community_posts', valid: false, count: 0 },
      replies: { key: 'baseul_community_replies', valid: false, count: 0 },
      blogs: { key: 'baseul_admin_blogs', valid: false, count: 0 },
    };

    try {
      Object.entries(checks).forEach(([name, check]) => {
        const data = localStorage.getItem(check.key);
        if (data) {
          const parsed = JSON.parse(data);
          check.valid = Array.isArray(parsed);
          check.count = check.valid ? parsed.length : 0;
        }
      });

      const allValid = Object.values(checks).every(c => !localStorage.getItem(c.key) || c.valid);
      
      if (allValid) {
        setMessage({ 
          type: 'success', 
          text: `Data looks good! Users: ${checks.users.count}, Posts: ${checks.posts.count}, Replies: ${checks.replies.count}, Blogs: ${checks.blogs.count}` 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Some data might be corrupted. Consider clearing data.' 
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error checking data integrity' });
    }
  };

  // Hidden by default - press Ctrl+Shift+D to toggle
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-4 w-80">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-5 h-5 text-blue-600" />
        <h3 className="font-bold text-gray-900">Data Debug Tool</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="ml-auto text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <button
          onClick={checkDataIntegrity}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Check Data</span>
        </button>

        <button
          onClick={handleClearData}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear All Data</span>
        </button>
      </div>

      {message && (
        <div
          className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
        Press Ctrl+Shift+D to toggle this tool
      </div>
    </div>
  );
}
