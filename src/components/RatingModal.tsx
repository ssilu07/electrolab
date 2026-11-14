import React, { useState } from 'react';
import { Star, X, Sparkles, MessageSquare, ThumbsUp, Send, Heart } from 'lucide-react';
import { soundFX } from '../audio/SoundFX';
import { NativeBridge } from '../utils/nativeBridge';
import { ratingService } from '../services/ratingService';
import { i18n } from '../services/i18nService';
import confetti from 'canvas-confetti';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast?: (type: 'info' | 'success' | 'warning', title: string, message: string) => void;
}

const FEEDBACK_TAGS_EN = [
  '+ More ICs & Sensors',
  '🐞 Fix Solver/Wire Bug',
  '📚 Better Circuit Tutorials',
  '⚡ Faster Simulation',
  '🎨 Dark/Light Themes',
];

const FEEDBACK_TAGS_HI = [
  '+ नए कंपोनेंट्स और सेंसर्स',
  '🐞 सर्किट बग ठीक करें',
  '📚 सरल ट्यूटोरियल',
  '⚡ तेज सिमुलेशन',
  '🎨 नए विज़ुअल थीम',
];

export const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, onToast }) => {
  const [selectedStars, setSelectedStars] = useState<number>(0);
  const [hoveredStars, setHoveredStars] = useState<number>(0);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState<boolean>(false);

  if (!isOpen) return null;

  const isHindi = i18n.language === 'hi';
  const activeStars = hoveredStars || selectedStars;
  const feedbackTags = isHindi ? FEEDBACK_TAGS_HI : FEEDBACK_TAGS_EN;

  const handleSelectStar = (stars: number) => {
    setSelectedStars(stars);
    NativeBridge.haptic('light');
    soundFX.playClick();

    if (stars >= 4) {
      soundFX.playVictory();
      NativeBridge.haptic('success');
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#38bdf8', '#34d399', '#f43f5e'],
        });
      } catch {}
    }
  };

  const handleRateOnPlayStore = async () => {
    soundFX.playVictory();
    NativeBridge.haptic('heavy');
    await ratingService.launchPlayStoreReview();
    if (onToast) {
      onToast(
        'success',
        isHindi ? 'धन्यवाद! ⭐' : 'Thank You! ⭐',
        isHindi
          ? 'आपका फीडबैक ElectroLab को बेहतर बनाने में बहुत मदद करता है!'
          : 'Your support helps us keep ElectroLab free and growing!'
      );
    }
    onClose();
  };

  const handleSubmitFeedback = () => {
    soundFX.playConnect();
    NativeBridge.haptic('medium');
    setHasSubmittedFeedback(true);
    ratingService.markCompleted();

    // Log feedback locally for developer diagnostics
    try {
      const stored = JSON.parse(localStorage.getItem('electrolab_user_feedback') || '[]');
      stored.push({
        stars: selectedStars,
        tag: selectedTag,
        comment: feedbackText,
        timestamp: Date.now(),
      });
      localStorage.setItem('electrolab_user_feedback', JSON.stringify(stored));
    } catch {}

    if (onToast) {
      onToast(
        'info',
        isHindi ? 'फीडबैक प्राप्त हुआ' : 'Feedback Received',
        isHindi
          ? 'हम आपके सुझाव पर जल्द काम करेंगे। धन्यवाद!'
          : 'Thank you for helping us improve ElectroLab for everyone!'
      );
    }

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleDismiss = () => {
    soundFX.playClick();
    ratingService.snooze();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn font-sans">
      <div className="w-full max-w-sm glass-modal rounded-3xl p-6 border border-amber-500/40 shadow-[0_0_50px_rgba(251,191,36,0.25)] text-center space-y-4">
        {/* Header Dismiss Button */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHindi ? 'ElectroLab कम्युनिटी' : 'ElectroLab Community'}</span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Title & Icon based on Rating Stage */}
        {selectedStars === 0 && (
          <div className="space-y-1">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30">
              <Star className="w-8 h-8 fill-slate-950" />
            </div>
            <h2 className="text-xl font-black text-white pt-2">
              {isHindi ? 'ElectroLab कैसा लग रहा है?' : 'Enjoying ElectroLab?'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed px-2">
              {isHindi
                ? 'आपका एक छोटा सा रिव्यू हमें नए कंपोनेंट्स और 3D लैब फीचर्स जोड़ने में मदद करता है।'
                : 'How has your experience been building and simulating circuits?'}
            </p>
          </div>
        )}

        {selectedStars >= 4 && (
          <div className="space-y-1 animate-fadeIn">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/30">
              <Heart className="w-8 h-8 fill-slate-950 animate-bounce" />
            </div>
            <h2 className="text-xl font-black text-white pt-2">
              {isHindi ? 'बहुत-बहुत धन्यवाद! ❤️' : 'Thank You So Much! ❤️'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed px-2">
              {isHindi
                ? 'क्या आप Google Play पर एक छोटा सा रिव्यू दे सकते हैं? इससे ज्यादा छात्रों को फ्री में सीखने में मदद मिलती है।'
                : 'Could you share your 5-star rating on Google Play? It takes 5 seconds and keeps ElectroLab 100% free for students and makers!'}
            </p>
          </div>
        )}

        {selectedStars > 0 && selectedStars < 4 && !hasSubmittedFeedback && (
          <div className="space-y-1 animate-fadeIn">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-slate-950 shadow-lg shadow-sky-500/30">
              <MessageSquare className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-lg font-black text-white pt-2">
              {isHindi ? 'हम इसे कैसे बेहतर बना सकते हैं?' : 'How Can We Improve?'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isHindi
                ? 'कृपया हमें बताएं ताकि हम अगली अपडेट में इसे सुधार सकें।'
                : 'Tell us what you need and we will fix it in the next update.'}
            </p>
          </div>
        )}

        {/* 5 Interactive Stars */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleSelectStar(star)}
              onMouseEnter={() => setHoveredStars(star)}
              onMouseLeave={() => setHoveredStars(0)}
              className="p-1 transform hover:scale-125 transition-transform active:scale-95"
            >
              <Star
                className={`w-9 h-9 transition-colors ${
                  star <= activeStars
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]'
                    : 'text-slate-600 hover:text-amber-400/50'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Case 1: Initial Prompt -> Tap a star guidance */}
        {selectedStars === 0 && (
          <div className="text-[11px] font-mono text-slate-400">
            {isHindi ? 'रेटिंग देने के लिए स्टार्स पर टैप करें' : 'Tap a star to rate'}
          </div>
        )}

        {/* Case 2: 4 or 5 Stars -> High Conversion Google Play Button */}
        {selectedStars >= 4 && (
          <div className="space-y-2 pt-1 animate-fadeIn">
            <button
              onClick={handleRateOnPlayStore}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition flex items-center justify-center gap-2"
            >
              <ThumbsUp className="w-4 h-4 fill-slate-950" />
              <span>{isHindi ? 'Google Play पर 5★ रेट करें' : 'Rate on Google Play ⭐'}</span>
            </button>

            <button
              onClick={handleDismiss}
              className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              {isHindi ? 'शायद बाद में' : 'Maybe Later'}
            </button>
          </div>
        )}

        {/* Case 3: 1, 2, or 3 Stars -> In-App Feedback Shield */}
        {selectedStars > 0 && selectedStars < 4 && !hasSubmittedFeedback && (
          <div className="space-y-3 pt-1 text-left animate-fadeIn">
            <div className="flex flex-wrap gap-1.5 justify-center">
              {feedbackTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    NativeBridge.haptic('light');
                    setSelectedTag(tag);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition ${
                    selectedTag === tag
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={isHindi ? 'अपनी राय यहाँ लिखें (वैकल्पिक)...' : 'Write your suggestion here (optional)...'}
              rows={2}
              className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmitFeedback}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isHindi ? 'फीडबैक भेजें' : 'Send Feedback'}</span>
              </button>

              <button
                onClick={handleDismiss}
                className="px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-slate-400 hover:text-white"
              >
                {isHindi ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        )}

        {hasSubmittedFeedback && (
          <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-bold animate-fadeIn">
            ✓ {isHindi ? 'फीडबैक सफलतापूर्वक दर्ज हुआ!' : 'Feedback submitted successfully!'}
          </div>
        )}
      </div>
    </div>
  );
};
