import React from "react";
import InstagramButton from "./InstagramButton";

const SocialContainer = () => {
  return (
    <div className="fixed bottom-5 right-3 md:bottom-1/2 md:right-0 z-50 p-2 rounded-full md:rounded-none md:rounded-tl-2xl md:rounded-bl-2xl bg-primary-300  text-white  flex items-center justify-center shadow-lg">
      <InstagramButton />
    </div>
  );
};

export default SocialContainer;
