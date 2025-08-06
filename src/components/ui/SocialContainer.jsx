import React, { useEffect, useState } from "react";
import InstagramButton from "./InstagramButton";
import FeedbackButton from "./FeedbackButton";
import FacebookButton from "./FacebookButton";
import { MessageCircleHeart, ChevronUp, Minus, Sparkles } from "lucide-react";

const SocialContainer = ({ onFeedbackClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const toggleMenu = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setIsOpen(!isOpen);
      // Reset animation state after animation completes
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Auto-close on click outside (mobile) - simplificado
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(".social-container")) {
        setIsOpen(false);
        setIsAnimating(false);
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);

  return (
    <>
      {/* Desktop: Sidebar fijo elegante */}
      <div className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-50 flex-col gap-3 p-4 bg-gradient-to-b from-white/95 to-indigo-50/95 backdrop-blur-md rounded-tl-2xl rounded-bl-2xl border-l border-t border-b border-indigo-200/50 shadow-2xl hover:shadow-indigo-200/25 transition-all duration-500 hover:scale-105">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-indigo-100">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <span className="text-xs font-medium text-indigo-700 hidden lg:block">
            Conecta
          </span>
        </div>

        <div className="flex flex-col gap-3 items-center">
          <div className="transform hover:scale-110 transition-transform duration-200">
            <FeedbackButton onClick={onFeedbackClick} />
          </div>
          <div className="transform hover:scale-110 transition-transform duration-200">
            <InstagramButton />
          </div>
          <div className="transform hover:scale-110 transition-transform duration-200">
            <FacebookButton />
          </div>
        </div>
      </div>

      {/* Mobile: Floating Action Button con botones desplegables */}
      <div className="md:hidden social-container fixed bottom-4 right-4 z-50">
        {/* Botones sociales desplegables - aparecen hacia arriba */}
        <div className="flex flex-col-reverse gap-3 mb-3">
          <div
            className={`transform transition-all duration-300 ease-out ${
              isOpen
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-75 pointer-events-none"
            }`}
            style={{ transitionDelay: isOpen ? "0.1s" : "0s" }}
          >
            <div className="transform hover:scale-110 transition-transform duration-200">
              <FeedbackButton onClick={onFeedbackClick} />
            </div>
          </div>

          <div
            className={`transform transition-all duration-300 ease-out ${
              isOpen
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-75 pointer-events-none"
            }`}
            style={{ transitionDelay: isOpen ? "0.2s" : "0s" }}
          >
            <div className="transform hover:scale-110 transition-transform duration-200">
              <InstagramButton />
            </div>
          </div>

          <div
            className={`transform transition-all duration-300 ease-out ${
              isOpen
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-75 pointer-events-none"
            }`}
            style={{ transitionDelay: isOpen ? "0.3s" : "0s" }}
          >
            <div className="transform hover:scale-110 transition-transform duration-200">
              <FacebookButton />
            </div>
          </div>
        </div>

        {/* Main FAB (Floating Action Button) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMenu();
          }}
          disabled={isAnimating}
          className={`w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 shadow-lg hover:shadow-2xl transform transition-all duration-300 flex items-center justify-center group relative ${
            isOpen
              ? "rotate-180 scale-110 shadow-2xl"
              : "rotate-0 scale-100 hover:scale-110"
          }`}
        >
          <div className="w-full h-full flex items-center justify-center pointer-events-none">
            {isOpen ? (
              <Minus className="h-6 w-6 text-white transform transition-transform duration-300" />
            ) : (
              <MessageCircleHeart className="h-6 w-6 text-white transform transition-transform duration-300 group-hover:scale-110" />
            )}
          </div>

          {/* Ripple effect on click */}
          {isAnimating && (
            <div className="absolute inset-0 rounded-full bg-white/30 animate-ping pointer-events-none" />
          )}
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
          }
        }
      `}</style>
    </>
  );
};

export default SocialContainer;
