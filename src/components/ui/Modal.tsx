import React, { useRef, useState, useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?:
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "full";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "lg",
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

        setShowTopShadow(scrollTop > 10);
        setShowBottomShadow(scrollTop < scrollHeight - clientHeight - 10);
      }
    };

    checkScroll();
    const scrollElement = scrollRef.current;
    scrollElement?.addEventListener("scroll", checkScroll);

    // Check after content loads
    const timer = setTimeout(checkScroll, 100);

    return () => {
      scrollElement?.removeEventListener("scroll", checkScroll);
      clearTimeout(timer);
    };
  }, [isOpen, children]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
    "3xl": "sm:max-w-3xl",
    "4xl": "sm:max-w-4xl",
    "5xl": "sm:max-w-5xl",
    "6xl": "sm:max-w-6xl",
    full: "sm:max-w-full sm:mx-4",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div
        className="fixed inset-0 transition-all duration-300 bg-slate-900 bg-opacity-50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`relative flex flex-col bg-white dark:bg-gray-900 premium-card shadow-premium-lg transform transition-all duration-300 scale-100 animate-fade-in ${sizeClasses[size]} w-full mx-4 max-h-[90vh] rounded-xl overflow-hidden`}
      >
        {/* Fixed Header */}
        <div
          className={`flex-shrink-0 sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 transition-shadow duration-300 ${
            showTopShadow ? "shadow-xl" : "shadow-lg"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 focus:outline-none p-2 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content with custom scrollbar */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth modal-scrollable"
        >
          {children}
        </div>

        {/* Bottom Scroll Indicator */}
        {showBottomShadow && (
          <div className="absolute bottom-16 left-0 right-0 h-12 bg-gradient-to-t from-white/90 to-transparent pointer-events-none" />
        )}

        {/* Fixed Footer */}
        {footer && (
          <div
            className={`flex-shrink-0 sticky bottom-0 bg-gradient-to-r from-slate-50 to-stone-50 dark:from-gray-800 dark:to-gray-900 px-6 py-4 sm:flex sm:flex-row-reverse border-t border-slate-200 dark:border-gray-700 transition-shadow duration-300 ${
              showBottomShadow ? "shadow-2xl" : "shadow-lg"
            }`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
