import { Instagram } from "lucide-react";

export default function InstagramButton() {
  return (
    <a
      href="https://www.instagram.com/letranido"
      target="_blank"
      rel="noopener noreferrer"
      className="z-50 md:w-6 md:h-6 bg-pink-600 text-white rounded-md flex items-center justify-center shadow-lg hover:bg-pink-700"
    >
      <Instagram />
    </a>
  );
}
