import React from "react";
import InstagramButton from "./InstagramButton";
import FeedbackButton from "./FeedbackButton";

const SocialContainer = ({ onFeedbackClick }) => {
  return (
    <div className="fixed bottom-5 right-3 md:bottom-1/2 md:right-0 z-50 p-2 rounded-full md:rounded-none md:rounded-tl-2xl md:rounded-bl-2xl bg-white/90 backdrop-blur-sm border border-indigo-200 shadow-xl hover:shadow-2xl transition-all duration-300">
      {/* Desktop: ambos botones verticales */}
      <div className="hidden md:flex md:flex-col gap-2 items-center justify-center">
        <FeedbackButton onClick={onFeedbackClick} />
        <InstagramButton />
      </div>
      
      {/* Mobile: solo Instagram */}
      <div className="md:hidden flex items-center justify-center">
        <InstagramButton />
      </div>
    </div>
  );
};

export default SocialContainer;
