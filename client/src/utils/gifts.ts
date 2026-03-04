import winterBearLottie from "@/assets/gifts/winter-bear.lottie";
import winterTreeLottie from "@/assets/gifts/winter-tree.lottie";
import loveBearLottie from "@/assets/gifts/love-bear.lottie";
import loveHeartLottie from "@/assets/gifts/love-heart.lottie";

import winterBearImage from "@/assets/gifts/winter-bear.webp";
import winterTreeImage from "@/assets/gifts/winter-tree.webp";
import loveBearImage from "@/assets/gifts/love-bear.webp";
import loveHeartImage from "@/assets/gifts/love-heart.webp";

export interface IGiftItem {
    id: string;
    title: string;
    animation: string;
    price: number;
    image: string;
}

export const GIFTS_DATA: IGiftItem[] = [
    {
        id: "5956217000635139069",
        title: "New Year bear",
        animation: winterBearLottie,
        price: 1,
        image: winterBearImage,
    },
    {
        id: "5922558454332916696",
        title: "New Year tree",
        animation: winterTreeLottie,
        price: 50,
        image: winterTreeImage,
    },
    {
        id: "5800655655995968830",
        title: "Bear of Lovers",
        animation: loveBearLottie,
        price: 50,
        image: loveBearImage,
    },
    {
        id: "5801108895304779062",
        title: "Heart of Lovers",
        animation: loveHeartLottie,
        price: 50,
        image: loveHeartImage,
    },
];
