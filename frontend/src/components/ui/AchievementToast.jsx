import React, { useEffect, useState } from 'react';
import { Trophy, X, Star, Sparkles } from 'lucide-react';
import { getRarityColor } from '../../data/achievements';

/**
 * Achievement Toast Notification Component
 * Shows animated popup when user earns an achievement
 */
const AchievementToast = ({ achievement, onClose, duration = 8000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-close after duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!achievement) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-full opacity-0 scale-95'
      }`}
      style={{ maxWidth: '400px' }}
    >
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl shadow-2xl overflow-hidden">
        {/* Animated sparkles background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="sparkle-container">
            {[...Array(20)].map((_, i) => (
              <Sparkles
                key={i}
                className="sparkle text-yellow-400 opacity-70"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
                size={12 + Math.random() * 8}
              />
            ))}
          </div>
        </div>

        <div className="relative p-6">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-yellow-200 transition-colors"
          >
            <X size={20} className="text-yellow-700" />
          </button>

          {/* Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-slow">
                <Trophy className="text-white" size={28} />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-900 flex items-center space-x-2">
                <span>Achievement Unlocked!</span>
              </h3>
              <p className="text-sm text-yellow-700">You've earned a new achievement</p>
            </div>
          </div>

          {/* Achievement Details */}
          <div className="bg-white bg-opacity-80 rounded-xl p-4 border border-yellow-200">
            <div className="flex items-start space-x-4">
              {/* Achievement Icon */}
              <div className="text-5xl flex-shrink-0 animate-bounce-slow">
                {achievement.icon}
              </div>

              {/* Achievement Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg text-gray-900 mb-1">
                  {achievement.name}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {achievement.description}
                </p>

                {/* Rarity and Points */}
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRarityColor(achievement.rarity)}`}>
                    {achievement.rarity.toUpperCase()}
                  </span>
                  <div className="flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded-full">
                    <Star size={14} className="text-yellow-600" />
                    <span className="text-xs font-bold text-yellow-700">
                      +{achievement.points} pts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mt-3 flex justify-center">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-8 rounded-full ${
                    i < 5 ? 'bg-yellow-400' : 'bg-yellow-200'
                  }`}
                  style={{
                    animation: `fillProgress 0.5s ease-out ${i * 0.1}s forwards`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }

        @keyframes fillProgress {
          from {
            width: 0;
          }
          to {
            width: 2rem;
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .sparkle {
          position: absolute;
          animation: sparkle 2s infinite;
        }

        .sparkle-container {
          position: absolute;
          inset: 0;
        }
      `}</style>
    </div>
  );
};

/**
 * Achievement Toast Container
 * Manages multiple achievement toasts in a queue
 */
export const AchievementToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Listen for achievement events from the achievement handler
    const handleAchievementEarned = (event) => {
      const { achievements } = event.detail;
      
      // Add new achievements to the queue with a slight delay between each
      achievements.forEach((achievement, index) => {
        setTimeout(() => {
          setToasts(prev => [...prev, { id: Date.now() + index, achievement }]);
        }, index * 500); // Stagger by 500ms
      });
    };

    window.addEventListener('achievementEarned', handleAchievementEarned);
    return () => window.removeEventListener('achievementEarned', handleAchievementEarned);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            transform: `translateY(${index * 120}px)`, // Stack toasts vertically
            transition: 'transform 0.3s ease-out',
          }}
        >
          <AchievementToast
            achievement={toast.achievement}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </>
  );
};

export default AchievementToast;
