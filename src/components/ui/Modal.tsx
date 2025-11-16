import React from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "lg",
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
    "3xl": "sm:max-w-3xl",
    "4xl": "sm:max-w-4xl",
    full: "sm:max-w-full sm:mx-4",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-all duration-300 bg-slate-900 bg-opacity-50 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />
        <div
          className={`inline-block align-bottom premium-card text-left overflow-hidden shadow-premium-lg transform transition-all duration-300 scale-100 animate-fade-in sm:my-8 sm:align-middle ${sizeClasses[size]} sm:w-full`}
        >
          <div className="bg-white dark:bg-gray-900 px-6 pt-6 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-gray-100">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 focus:outline-none p-1 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mt-4">{children}</div>
          </div>
          {footer && (
            <div className="bg-gradient-to-r from-slate-50 to-stone-50 dark:from-gray-800 dark:to-gray-900 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-200 dark:border-gray-700">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
