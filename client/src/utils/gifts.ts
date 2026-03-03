import winterBearLottie from "@/assets/gifts/winter-bear.lottie";
import winterTreeLottie from "@/assets/gifts/winter-tree.lottie";
import loveBearLottie from "@/assets/gifts/love-bear.lottie";
import loveHeartLottie from "@/assets/gifts/love-heart.lottie";

export interface IGiftItem {
    id: string;
    title: string;
    animation: string;
    price: number;
}

export const GIFTS_DATA: IGiftItem[] = [
    {
        id: "5956217000635139069",
        title: "Зимний мишка",
        animation: winterBearLottie,
        price: 50,
    },
    {
        id: "5922558454332916696",
        title: "Зимняя ёлка",
        animation: winterTreeLottie,
        price: 50,
    },
    {
        id: "5800655655995968830",
        title: "Медвежонок любви",
        animation: loveBearLottie,
        price: 50,
    },
    {
        id: "5801108895304779062",
        title: "Сердечко",
        animation: loveHeartLottie,
        price: 50,
    },
];
