import croissantImage from "@/assets/croissant.png";
import giftImage from "@/assets/gift.png";
import pabloLogo from "@/assets/pablo.png";
import { useLocation } from "react-router-dom";
import { Block } from "./Block";

export const Banner = ({ type }: { type: 'shop' | 'assets' | 'main' }) => {
    const location = useLocation();

    // Определяем контент в зависимости от страницы
    const getBannerContent = () => {
        if (type === 'shop') {
            return {
                text: "Обменяй свои звезды на подарки или премиум",
                image: giftImage,
                alt: "Подарок"
            };
        }
        if (type === 'assets') {
            return {
                text: "Покупай здания - добывай звезды!",
                image: croissantImage,
                alt: "Активы"
            };
        }
        return {
            text: "Добро пожаловать в PABLO!",
            image: pabloLogo,
            alt: "Pablo Logo"
        };
    };

    const { text, image, alt } = getBannerContent();

    return (
        <Block className="py-6 !min-h-min h-min">
            <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `radial-gradient(circle, #ffd700 2px, transparent 2px)`,
                backgroundSize: '20px 20px'
            }}></div>

            <div className="relative flex flex-row items-center justify-between">
                <div className="flex-1 flex flex-col gap-2 relative z-10">
                    <div className="text-xl md:text-2xl font-bold uppercase relative text-center">
                        <span className="bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,215,0,0.5)] animate-gradient">
                            {text}
                        </span>
                        <div className="absolute -inset-1 bg-gradient-to-r from-gold-500/20 via-gold-400/20 to-gold-600/20 blur-xl opacity-50 animate-pulse"></div>
                    </div>
                </div>

                <div className="relative min-w-24 h-24 flex items-center justify-center group flex-shrink-0 ml-4">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-500/50 via-gold-600/30 to-gold-700/20 p-[3px]">
                        <div className="w-full h-full rounded-full bg-app-darker"></div>
                    </div>

                    <div className="relative w-24 h-24 rounded-full border-2 border-transparent bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 p-[3px] transition-transform duration-300">
                        <div className="w-full h-full rounded-full bg-app-darker overflow-hidden flex items-center justify-center">
                            <img
                                src={image}
                                alt={alt}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Block>
    );
};