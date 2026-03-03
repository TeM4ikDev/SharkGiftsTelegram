import starsIcon from "@/assets/star.webp";
import { Minus } from "lucide-react";
import React from "react";

interface ShowStarsProps {
    value: number;
    className?: string;
    size?: "small" | "medium" | "large";
    variant?: "light" | "dark";
    text?: string;
    toFixed?: number;
}

export const ShowStars: React.FC<ShowStarsProps> = ({ value, size = "medium", className, variant = "light", text, toFixed = 2 }) => {
    const sizeClass = {
        small: "text-xs",
        medium: "text-base",
        large: "text-xl",
    };
    const sizeIconClass = {
        small: "w-4 h-4",
        medium: "w-5 h-5",
        large: "w-6 h-6",
    };

    const isPositive = value >= 0;
    const imageColorClass = variant === "dark" ? "filter brightness-0 drop-shadow-[0_0_6px_rgba(0,0,0,0.4)]" : "drop-shadow-[0_0_6px_rgba(255,215,0,0.4)]";
    const textColorClass = variant === "dark" ? "text-app-darker" : isPositive ? "text-gold-500" : "text-red-500";

    return (
        <div className={`flex flex-row items-center gap-1  text-nowrap ${className || ''}`}>
            {text && <span className={`text-inherit ${sizeClass[size]} font-extrabold`}>{text}</span>}
            {isPositive ? '' : <Minus className="w-4 h-4 text-red-500  stroke-[5]" />}
            <img src={starsIcon} alt="stars" className={`${sizeIconClass[size]} ${imageColorClass} flex-shrink-0`} />
            <span className={`font-extrabold ${textColorClass} ${sizeClass[size]}`}>
                {Number(Math.abs(value)).toFixed(toFixed)}
            </span>
        </div>
    );
};
