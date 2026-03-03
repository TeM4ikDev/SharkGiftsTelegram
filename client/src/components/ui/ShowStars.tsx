import starsIcon from "@/assets/star.webp";
import tonIcon from "@/assets/ton.svg";
import { Minus } from "lucide-react";
import React from "react";

interface ShowStarsProps {
    value: number;
    className?: string;
    size?: "small" | "medium" | "large";
    variant?: "light" | "dark";
    text?: string;
    toFixed?: number;
    type?: "stars" | "ton";
}

export const ShowStars: React.FC<ShowStarsProps> = ({ 
    value, 
    size = "medium", 
    className, 
    variant = "light", 
    text, 
    toFixed = 2,
    type = "stars" 
}) => {
    const sizeClass = {
        small: "text-xs",
        medium: "text-base",
        large: "text-xl",
    };
    const sizeIconClass = {
        small: "w-4 h-4",
        medium: "min-w-5 min-h-5 w-5 h-5",
        large: "w-6 h-6",
    };

    const isPositive = value >= 0;
    const isStars = type === "stars";

    // Определяем иконку
    const iconSrc = isStars ? starsIcon : tonIcon;

    // Логика теней/фильтров для иконки
    const imageColorClass = variant === "dark" 
        ? "filter brightness-0 drop-shadow-[0_0_6px_rgba(0,0,0,0.4)]" 
        : isStars 
            ? "drop-shadow-[0_0_6px_rgba(255,215,0,0.4)]" 
            : "drop-shadow-[0_0_6px_rgba(0,152,234,0.4)]";

    // Логика цвета текста
    const getTextColor = () => {
        if (variant === "dark") return "text-app-darker";
        if (!isPositive) return "text-red-500";
        
        return isStars ? "text-gold-500" : "text-[#0098EA]"; 
    };

    return (
        <div className={`flex flex-row items-center gap-1 text-nowrap ${className || ''}`}>
            {text && <span className={`text-inherit ${sizeClass[size]} font-extrabold`}>{text}</span>}
            
            {!isPositive && <Minus className={`w-4 h-4 stroke-[5] ${variant === 'dark' ? 'text-app-darker' : 'text-red-500'}`} />}
            
            <img 
                src={iconSrc} 
                alt={type} 
                className={`${sizeIconClass[size]} ${imageColorClass} flex-shrink-0 object-contain`} 
            />
            
            <span className={`font-extrabold ${getTextColor()} ${sizeClass[size]}`}>
                {Number(Math.abs(value)).toFixed(toFixed)}
            </span>
        </div>
    );
};