import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

interface SelectableImageGridProps {
  images: string[];
  selected: string[];
  onToggle: (url: string) => void;
  getAlt: (url: string) => string;
}

export const SelectableImageGrid: React.FC<SelectableImageGridProps> = ({ images, selected, onToggle, getAlt }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
    {images.map((url) => {
      const isSelected = selected.includes(url);
      return (
        <button
          key={url}
          type="button"
          onClick={() => onToggle(url)}
          aria-pressed={isSelected}
          className={cn(
            "relative aspect-square rounded overflow-hidden border-2 transition-colors",
            isSelected ? "border-blue-600" : "border-transparent hover:border-gray-300"
          )}
        >
          <img src={url} alt={getAlt(url)} className="w-full h-full object-cover" />
          {isSelected && (
            <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
              <Check size={14} aria-hidden="true" />
            </span>
          )}
        </button>
      );
    })}
  </div>
);
