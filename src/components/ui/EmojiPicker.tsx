import React, { useState } from 'react';
import { Smile } from 'lucide-react';
import { useTheme } from '../theme-context';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EMOJI_CATEGORIES = {
  smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '😏'],
  gestures: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝'],
  emotions: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎'],
  activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷'],
  objects: ['📱', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '🧭'],
  symbols: ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '✨', '💫', '💥', '💢', '💦', '💨', '🔥', '💯', '✔️', '✅', '❌', '❗', '❓', '⚠️', '🚫', '⛔', '🔞', '📵', '🚭'],
};

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full transition-colors ${
          isOpen
            ? theme === 'dark'
              ? 'bg-gray-700 text-blue-400'
              : 'bg-blue-50 text-[#2B4C7E]'
            : theme === 'dark'
              ? 'text-gray-400 hover:bg-gray-700 hover:text-blue-400'
              : 'text-gray-500 hover:bg-blue-50 hover:text-[#2B4C7E]'
        }`}
        title="Add emoji"
      >
        <Smile className="w-5 h-5" />
      </button>

      {/* Emoji Picker Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Picker Panel */}
          <div className={`absolute bottom-full left-0 mb-2 border rounded-2xl shadow-2xl z-50 w-80 ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            {/* Category Tabs */}
            <div className={`flex border-b p-2 gap-1 ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              {Object.keys(EMOJI_CATEGORIES).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
                  className={`flex-1 py-2 px-1 text-xs rounded-lg transition-colors ${
                    activeCategory === category
                      ? theme === 'dark'
                        ? 'bg-gray-700 text-blue-400'
                        : 'bg-blue-50 text-[#2B4C7E]'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:bg-gray-700'
                        : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {category === 'smileys' && '😊'}
                  {category === 'gestures' && '👋'}
                  {category === 'emotions' && '❤️'}
                  {category === 'activities' && '⚽'}
                  {category === 'objects' && '📱'}
                  {category === 'symbols' && '✨'}
                </button>
              ))}
            </div>

            {/* Emoji Grid */}
            <div className="p-3 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    className={`text-2xl p-2 rounded-lg transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer with frequently used */}
            <div className={`border-t p-2 ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex gap-1 overflow-x-auto">
                {['❤️', '👍', '😊', '🎉', '🔥', '✨', '💯', '👏'].map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    className={`text-xl p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
