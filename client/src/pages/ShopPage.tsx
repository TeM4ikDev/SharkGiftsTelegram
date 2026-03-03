import telegramStarsIcon from "@/assets/star.webp";
import telegramIcon from "@/assets/telegram.svg";
import { PageContainer } from "@/components/layout/PageContainer";
import { Block } from "@/components/ui/Block";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ShowStars } from "@/components/ui/ShowStars";
import { Tabs } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import { GiftService, PremiumType } from "@/services/gift.service";
import { useStore } from "@/store/root.store";
import { GIFT_IMAGE_BASE, IGift } from "@/types";
import { apiConfig } from "@/types/pagesConfig";
import { onRequest } from "@/utils/handleReq";
import { DotLottiePlayer } from "@dotlottie/react-player";
import { ExternalLink, Gift, Icon, Plane } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface ShopItem {
    id: string | number;
    name: string;
    icon: typeof Gift;
    customIcon?: "telegram-premium" | "telegram-stars";
    iconColor?: string;
    price: number;
    category: 'gifts' | 'other';
    premiumType?: PremiumType;
    imageUrl?: string | null;
}

type PurchaseItem = {
    type: 'gift';
    gift: IGift;
} | {
    type: 'other';
    item: ShopItem;
};

const ShopPage: React.FC = () => {
    const { userStore } = useStore();
    const [activeTab, setActiveTab] = useState<'gifts' | 'other'>('gifts');
    const [searchQuery, setSearchQuery] = useState('');
    const [priceFilter, setPriceFilter] = useState<'high' | 'low' | null>(null);
    const [gifts, setGifts] = useState<IGift[]>([]);
    const [giftsLoading, setGiftsLoading] = useState(true);
    const [otherProducts, setOtherProducts] = useState<ShopItem[]>([]);
    const [otherLoading, setOtherLoading] = useState(false);
    const [selectedGift, setSelectedGift] = useState<IGift | null>(null);
    const [purchaseConfirm, setPurchaseConfirm] = useState<PurchaseItem | null>(null);
    const [purchasing, setPurchasing] = useState(false);
    const [premiumTargetUsername, setPremiumTargetUsername] = useState("");

    const getGifts = async () => {
        setGiftsLoading(true);
        const gifts = await onRequest(GiftService.getGifts());
        setGifts(gifts ?? []);
        setGiftsLoading(false);
    };

    const getOtherProducts = async () => {
        setOtherLoading(true);
        const list = await onRequest(GiftService.getShopProducts());
        setOtherLoading(false);
        if (!Array.isArray(list)) {
            setOtherProducts([]);
            return;
        }
        const items: ShopItem[] = list.map((p: { id: string; name: string; priceInStars: number | string; type: string; premiumMonths?: string | null; imageUrl?: string | null }) => ({
            id: p.id,
            name: p.name,
            price: Number(p.priceInStars),
            category: 'other',
            icon: Plane,
            customIcon: p.type === 'PREMIUM' ? 'telegram-premium' : p.type === 'STARS' ? 'telegram-stars' : undefined,
            premiumType: (p.premiumMonths as PremiumType) ?? undefined,
            imageUrl: p.imageUrl ?? null,
        }));
        setOtherProducts(items);
    };

    useEffect(() => {
        if (activeTab === "gifts") getGifts();
        if (activeTab === "other") getOtherProducts();
    }, [activeTab]);


    const buyGift = async (item: PurchaseItem | null) => {
        if (!item) return;
        if (purchasing) return;

        setPurchasing(true);
        try {
            if (item.type === 'gift') {
                const result = await onRequest(GiftService.buyGift(item.gift.id));
                if (result != null) {
                    setGifts(prev => prev.filter(g => g.id !== item.gift.id));
                    toast.success('Подарок успешно куплен');
                    setPurchaseConfirm(null);
                }
            } else {
                const isPremium = item.item.customIcon === "telegram-premium";
                const targetUsername = isPremium ? premiumTargetUsername.trim() || undefined : undefined;
                const data = await onRequest(GiftService.buyShopProduct(String(item.item.id), targetUsername));
                if (data) {
                    toast.success('Покупка успешно совершена');
                    setPurchaseConfirm(null);
                    setPremiumTargetUsername("");
                }
            }
        } finally {
            await userStore.updateUserBalance();
            setPurchasing(false);
        }
    }

    const giftImageUrl = (slug: string) =>
        `${GIFT_IMAGE_BASE}/${encodeURIComponent(slug)}.medium.jpg`;

    const giftLottieUrl = (slug: string) =>
        `${GIFT_IMAGE_BASE}/${encodeURIComponent(slug)}.lottie.json`;

    const giftViewUrl = (slug: string) =>
        `https://t.me/nft/${encodeURIComponent(slug)}`;

    const attributesList = (g: IGift) =>
        [g.model, g.symbol, g.backdrop].filter(Boolean) as string[];



    return (
        <PageContainer title="" itemsStart loading={false}>

            <Tabs
                tabs={[
                    { label: "Подарки", value: "gifts" },
                    { label: "Разное", value: "other" }
                ]}
                activeTab={activeTab}
                onChange={(value) => {
                    setActiveTab(value as 'gifts' | 'other');
                    setPriceFilter(null);
                }}
            />

            {activeTab === "gifts" && (
                <>
                    {giftsLoading ? (
                        <Block className="p-10" title="Загрузка подарков..." titleCenter />
                    ) : !gifts || gifts.length === 0 ? (
                        <Block className="p-10" title="Подарки не найдены" titleCenter />
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3  w-full gap-3 sm:gap-4">
                            {gifts.map((g) => (
                                <Block key={g.id} className="gap-2 !rounded-3xl !h-full items-center">
                                    <img
                                        src={giftImageUrl(g.slug)}
                                        alt={g.title}
                                        className="w-full h-full max-w-[160px] mx-auto aspect-square rounded-3xl"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = "none";
                                        }}
                                        onClick={() => setSelectedGift(g)}
                                    />

                                    <div className="flex flex-col items-start w-full">
                                        <h3 className="text-sm font-bold text-gray-200 text-center">
                                            {g.title}
                                        </h3>

                                        <h3 className="text-sm font-bold text-gray-500 text-center">
                                            #{g.num}
                                        </h3>

                                    </div>


                                    <Button
                                        text={<ShowStars size="small" value={Number(g.priceInStars)} />}
                                        color="blue"
                                        FC={() => setSelectedGift(g)}
                                    />
                                </Block>
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeTab === "other" && (
                <>
                    {otherLoading ? (
                        <Block className="p-10" title="Загрузка..." titleCenter />
                    ) : (
                        <div className="grid grid-cols-2 w-full gap-3">
                            {otherProducts.map((item) => {
                                const Icon = item.icon;
                                const iconColor = item.iconColor || 'text-gold-500';
                                const bgColor = item.iconColor ? 'bg-blue-500/10' : 'bg-gold-500/10';
                                return (
                                    <Block key={String(item.id)} className="gap-3 !rounded-3xl justify-between !h-full items-center">
                                        <div className="flex justify-center">
                                            <div className={`w-24 h-24 rounded-3xl ${bgColor} flex items-center justify-center overflow-hidden`}>
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt="" className="w-20 h-20 object-cover" />
                                                ) : (item.customIcon === "telegram-premium" || item.customIcon === "telegram-stars") ? (
                                                    <img
                                                        src={item.customIcon === "telegram-premium" ? telegramIcon : telegramStarsIcon}
                                                        alt="Telegram"
                                                        className="w-20 h-20"
                                                    />
                                                ) : (
                                                    <Icon className={`w-8 h-8 ${iconColor}`} />
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="text-sm font-extrabold text-gray-200 text-center">
                                            {item.name}
                                        </h3>

                                        <ShowStars size="small" value={item.price} />
                                        <Button
                                            text="КУПИТЬ"
                                            color="blue"
                                            className="!rounded-2xl"
                                            FC={() => setPurchaseConfirm({ type: 'other', item })}
                                        />
                                    </Block>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {activeTab === "other" && !otherLoading && otherProducts.length === 0 && (
                <Block className="p-10" title="Товары не найдены" titleCenter />
            )}

            <Modal
                isOpen={selectedGift !== null}
                setIsOpen={(v) => !v && setSelectedGift(null)}
                title={selectedGift?.title ?? ""}
                buttonFC={() => setSelectedGift(null)}
            >
                {selectedGift && (
                    <div className="flex flex-col gap-4">
                        <div className="relative w-full max-w-[200px] mx-auto aspect-square max-h-[200px] rounded-3xl overflow-hidden bg-gray-800/50 flex items-center justify-center">
                            <DotLottiePlayer
                                src={giftLottieUrl(selectedGift.slug)}
                                autoplay
                                loop
                                className="w-full h-full"
                            />
                        </div>

                        <Button
                            text="Просмотр"
                            color="blue"
                            href={giftViewUrl(selectedGift.slug)}
                            icon={<ExternalLink className="w-4 h-4" />}
                        />

                        <div className="rounded-xl border border-gray-600/50 overflow-hidden">
                            {[
                                { label: "Model", value: selectedGift.model, percent: selectedGift.modelRarityPermille },
                                { label: "Symbol", value: selectedGift.symbol, percent: selectedGift.symbolRarityPermille },
                                { label: "Backdrop", value: selectedGift.backdrop, percent: selectedGift.backdropRarityPermille },
                            ].filter((row) => row.value).map((row, i) => (
                                <div
                                    key={row.label}
                                    className={`flex items-center justify-between px-3 py-2.5 ${i > 0 ? "border-t border-gray-600/50" : ""}`}
                                >
                                    <span className="text-gray-400 text-sm">{row.label}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm font-medium">{row.value}</span>
                                        {/* <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                                            {row.percent != null ? `${(Number(row.percent) / 10).toFixed(1)}%` : "—"}
                                        </span> */}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button
                            text={<ShowStars text="Купить" variant="dark" value={Number(selectedGift.priceInStars)} />}
                            color="gold"
                            FC={() => {
                                setPurchaseConfirm({ type: 'gift', gift: selectedGift });
                                setSelectedGift(null);
                            }}
                        />
                    </div>
                )}
            </Modal>

            {/* Модальное окно подтверждения покупки */}
            <Modal
                isOpen={purchaseConfirm !== null}
                setIsOpen={(v) => {
                    if (!v) {
                        setPurchaseConfirm(null);
                        setPremiumTargetUsername("");
                    }
                }}
                title="Подтверждение покупки"
                buttonFC={() => {
                    setPurchaseConfirm(null);
                    setPremiumTargetUsername("");
                }}
            >
                {purchaseConfirm && (
                    <div className="flex flex-col gap-4">
                        {purchaseConfirm.type === 'gift' ? (
                            <>
                                <div className="text-center font-bold text-gray-300 text-sm">
                                    Вы уверены, что хотите купить этот подарок?
                                </div>
                                
                                <div className="relative w-full max-w-[150px] mx-auto aspect-square max-h-[150px] rounded-2xl overflow-hidden bg-gray-800/50 flex items-center justify-center">
                                    <DotLottiePlayer
                                        src={giftLottieUrl(purchaseConfirm.gift.slug)}
                                        autoplay
                                        loop
                                        className="w-full h-full"
                                    />
                                </div>

                                <div className="text-center space-y-1">
                                    <div className="text-lg font-bold text-white">{purchaseConfirm.gift.title}</div>
                                    <div className="text-sm text-gray-400">#{purchaseConfirm.gift.num}</div>
                                </div>

                                <div className="flex items-center justify-center gap-2 py-2 border-y border-gray-700">
                                    <span className="text-gray-400 text-sm">Стоимость:</span>
                                    <ShowStars size="medium" value={Number(purchaseConfirm.gift.priceInStars)} />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-center font-bold text-gray-300 text-sm">
                                    Вы уверены, что хотите купить этот товар?
                                </div>

                                <div className="flex justify-center">
                                    {(() => {
                                        const Icon = purchaseConfirm.item.icon;
                                        const iconColor = purchaseConfirm.item.iconColor || 'text-gold-500';
                                        const bgColor = purchaseConfirm.item.iconColor ? 'bg-blue-500/10' : 'bg-gold-500/10';
                                        return (
                                            <div className={`w-24 h-24 rounded-3xl ${bgColor} flex items-center justify-center overflow-hidden`}>
                                                {purchaseConfirm.item.imageUrl ? (
                                                    <img src={purchaseConfirm.item.imageUrl} alt="" className="w-20 h-20 object-cover" />
                                                ) : (purchaseConfirm.item.customIcon === "telegram-premium" || purchaseConfirm.item.customIcon === "telegram-stars") ? (
                                                    <img
                                                        src={purchaseConfirm.item.customIcon === "telegram-premium" ? telegramIcon : telegramStarsIcon}
                                                        alt="Telegram"
                                                        className="w-20 h-20"
                                                    />
                                                ) : (
                                                    <Icon className={`w-8 h-8 ${iconColor}`} />
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className="text-center space-y-1">
                                    <div className="text-lg font-bold text-white">{purchaseConfirm.item.name}</div>
                                </div>

                                {purchaseConfirm.item.customIcon === "telegram-premium" && (
                                    <div className="mt-3 flex flex-col gap-1">
                                        <span className="text-xs text-gray-400 text-left">
                                            Кому выдать Telegram Premium
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                name="premiumUsername"
                                                placeholder="@username"
                                                value={premiumTargetUsername}
                                                onChange={(e) => setPremiumTargetUsername(e.target.value)}
                                                showTopPlaceholder={false}
                                            />
                                            <button
                                                type="button"
                                                className="text-xs text-blue-400 hover:text-blue-300 font-semibold whitespace-nowrap"
                                                onClick={() => {
                                                    const selfUsername = userStore.user?.username;
                                                    if (selfUsername) {
                                                        setPremiumTargetUsername(selfUsername);
                                                    }
                                                }}
                                            >
                                                купить себе
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-center gap-2 py-2 border-y border-gray-700">
                                    <span className="text-gray-400 text-sm">Стоимость:</span>
                                    <ShowStars size="medium" value={purchaseConfirm.item.price} />
                                </div>
                            </>
                        )}

                        <div className="flex gap-3">
                            <Button
                                text="Отмена"
                                color="transparent"
                                FC={() => {
                                    setPurchaseConfirm(null);
                                    setPremiumTargetUsername("");
                                }}
                                className="flex-1"
                                formSubmit={true}
                            />
                            <Button
                                text={
                                    purchaseConfirm.type === 'gift'
                                        ? <ShowStars text="Подтвердить" variant="dark" value={Number(purchaseConfirm.gift.priceInStars)} />
                                        : <ShowStars text="Подтвердить" variant="dark" value={purchaseConfirm.item.price} />
                                }
                                color="gold"
                                FC={() => buyGift(purchaseConfirm)}
                                className="flex-1"
                                formSubmit={true}
                                loading={purchasing}
                                disabled={purchasing}
                            />
                        </div>
                    </div>
                )}
            </Modal>
        </PageContainer>
    );
};

export default ShopPage;
