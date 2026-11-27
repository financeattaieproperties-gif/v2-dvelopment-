import { useState } from "react";
import { cn } from "@/lib/utils";

interface BeforeAfterProps {
  beforeImage: string;
  afterImage: string;
}

export function BeforeAfterComparison({ beforeImage, afterImage }: BeforeAfterProps) {
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-lg cursor-col-resize">
      <img src={beforeImage} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
      <div 
        className="absolute inset-0 w-full h-full object-cover overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <img src={afterImage} alt="After" className="w-full h-full object-cover" />
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPos}
        onChange={(e) => setSliderPos(Number(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-col-resize"
      />
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
        style={{ left: `${sliderPos}%` }}
      />
    </div>
  );
}
