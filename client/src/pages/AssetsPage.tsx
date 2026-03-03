import { PageContainer } from "@/components/layout/PageContainer";

import { Block } from "@/components/ui/Block";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ShowStars } from "@/components/ui/ShowStars";
import { Tabs } from "@/components/ui/Tabs";
import { GameService } from "@/services/game.service";
import { useStore } from "@/store/root.store";
import { onRequest } from "@/utils/handleReq";
import { ArrowRight, Building2, Car, Croissant, Factory, HeartPulse, Info, MessageCircleQuestion, UtensilsCrossed, Warehouse, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

interface Asset {
    id: string;
    name: string;
    priceStars: string;
    maxStars: string;
    starsPerHour: string;
    limitPerUser: number | null;
    durationDays: number; // в днях
    description: string; // описание актива
}

interface UserAsset {
    id: string;
    asset: Asset;

    starsPerHour: string
    userId: string
    assetId: string
    purchasedAt: string
    expiresAt: string
    lastCollectedAt: string
}

interface IAssetModal {
    onlyView?: boolean;
    asset: Asset | null;

}


const defaultAssetsIcons: { name: string, icon: typeof Building2 }[] = [
    {
        name: "Булочная",
        icon: Croissant,
    },
    {
        name: "Склад",
        icon: Warehouse,
    },
    {
        name: "Мойка",
        icon: Car,
    },
    {
        name: "Аптека",
        icon: HeartPulse,
    },
    {
        name: "Ресторан",
        icon: UtensilsCrossed,
    },
    {
        name: "Завод",
        icon: Factory,
    }
];

// const HOUR_MS = 60 * 1000; // hour
const HOUR_MS = 60 * 60 * 1000;
const MAX_ACCUMULATION_HOURS = 8;
const MAX_ACCUMULATION_MS = MAX_ACCUMULATION_HOURS * HOUR_MS;


const AssetsPage: React.FC = () => {
    const { userStore: { user, updateUserBalance } } = useStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'buy' | 'me'>('buy');
    const [nowTs, setNowTs] = useState(Date.now());

    const [assets, setAssets] = useState<Asset[] | null>(null);
    const [myAssets, setMyAssets] = useState<UserAsset[] | null>(null);
    const [showAssetModal, setShowAssetModal] = useState<IAssetModal>({ onlyView: false, asset: null });
    const [showUserAssetModal, setShowUserAssetModal] = useState<{ onlyView: boolean, asset: UserAsset | null }>({ onlyView: false, asset: null });

    const getAssets = async () => {
        const assets = await onRequest(GameService.getAssets())
        setAssets(assets);
    }


    const getUserAssets = async () => {
        const userAssets = await onRequest(GameService.getUserAssets())
        setMyAssets(userAssets);
    }

    useEffect(() => {
        getAssets();
        getUserAssets();
    }, []);


    useEffect(() => {
        if (activeTab === 'me' && myAssets && myAssets.length > 0) {
            const interval = setInterval(() => {
                setNowTs(Date.now());
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [activeTab, myAssets]);

    const getCollectableStars = (asset: UserAsset, now: number, globalLastCollectedAt: number) => {
        const starsPerHour = Number(asset.starsPerHour) || 0;
        const purchasedAt = new Date(asset.purchasedAt).getTime();
        const expiresAt = new Date(asset.expiresAt).getTime();
        const startTs = Math.max(globalLastCollectedAt, purchasedAt);

        const effectiveNow = Math.min(now, expiresAt);
        const elapsedMs = Math.max(0, effectiveNow - startTs);
        const cappedElapsedMs = Math.min(elapsedMs, MAX_ACCUMULATION_MS);

        const fullPeriodsPassed = Math.floor(cappedElapsedMs / HOUR_MS);
        return fullPeriodsPassed * starsPerHour;
    };

    const formatLifetimeLeft = (expiresAt: string, now: number): string => {
        const diffMs = new Date(expiresAt).getTime() - now;
        if (diffMs <= 0) return "Истек";

        const totalSeconds = Math.floor(diffMs / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        if (days > 0) return `${days} д ${hours} ч ${minutes} м`;
        if (hours > 0) return `${hours} ч ${minutes} м`;
        return `${minutes} м`;
    };

    const formatTimeLeftToFull = (ms: number): string => {
        if (ms <= 0) return "Заполнено";
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours}ч ${minutes}м ${seconds}с`;
    };

    const globalLastCollectedAt = myAssets && myAssets.length > 0
        ? Math.min(...myAssets.map((asset) => new Date(asset.lastCollectedAt).getTime()))
        : nowTs;
    const totalYield = myAssets?.reduce((sum, asset) => sum + parseFloat(asset.starsPerHour.toString()), 0) || 0;
    const totalCollectableStars = myAssets?.reduce((sum, asset) => sum + getCollectableStars(asset, nowTs, globalLastCollectedAt), 0) || 0;
    const elapsedSinceGlobalCollectMs = Math.max(0, nowTs - globalLastCollectedAt);
    const timeToFullMs = Math.max(0, MAX_ACCUMULATION_MS - elapsedSinceGlobalCollectMs);
    const isScaleFull = totalYield > 0 && elapsedSinceGlobalCollectMs >= MAX_ACCUMULATION_MS;
    const canCollectStars = totalCollectableStars > 0;
    const formatAssetLimit = (limitPerUser: number | null) =>
        limitPerUser === null ? "нет" : `${limitPerUser}`;


    const onCollectStars = async () => {
        const data = await onRequest(GameService.collectAssetsStars())
        console.log(data)
        if (data) {
            getUserAssets();
            // setMyAssets(prev => prev?.map(asset => asset.asset.id === data.collectedFromAssets.toString() ? { ...asset, lastCollectedAt: new Date().toISOString() } : asset) || []);
            toast.success(`Вы собрали ${data.collectedStars} звезд`);
            updateUserBalance().catch()
        }

    }


    const buyAsset = async (asset: Asset) => {
        // setAssets(assets.filter((a) => a.id !== asset.id));
        const data = await onRequest(GameService.buyAsset(asset.id))
        if (data) {
            setMyAssets(prev => [...(prev || []), data]);
            toast.success(`Вы купили ${asset.name}`);
            setActiveTab('me');
            setShowAssetModal({ onlyView: false, asset: null });
            updateUserBalance().catch()

        }

    }

    const AssetItem = ({ asset }: { asset: Asset }) => {
        const Icon = useMemo(() => defaultAssetsIcons.find(icon => icon.name === (asset as Asset).name)?.icon, [asset]);

        return (
            <Block key={asset.id} className="gap-3">
                <div className="flex flex-row items-center justify-between gap-2">
                    <div className="flex flex-col  gap-2">
                        <div className="w-12 h-12 rounded-lg bg-gold-500/10 flex items-center justify-center">
                            {Icon && <Icon className="w-6 h-6 text-gold-500" />}
                        </div>
                        <h3 className="text-sm font-semibold text-gray-200 text-center">
                            {asset.name}
                        </h3>
                    </div>

                    <MessageCircleQuestion
                        className="w-4 h-4 text-gray-400 mb-auto"
                        onClick={() => setShowAssetModal({ onlyView: true, asset })}
                    />
                </div>

                <div className="flex flex-col gap-1 text-xs ">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400">Стоимость:</span>
                        <ShowStars size="small" value={parseFloat(asset.priceStars)} />
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-gray-400">Макс добыча:</span>
                        <ShowStars size="small" value={parseFloat(asset.maxStars)} />
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-gray-400">Срок жизни:</span>
                        <span className="text-gray-300 font-semibold">
                            {asset.durationDays} дн
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-gray-400">Лимит:</span>
                        <span className="text-gray-300 font-semibold">
                            {formatAssetLimit(asset.limitPerUser)}
                        </span>
                    </div>
                </div>



                <Button
                    text="КУПИТЬ"
                    color="transparent"
                    FC={() => {
                        setShowAssetModal({ onlyView: false, asset });
                    }}
                />
            </Block>
        )
    }

    const AssetUserItem = ({ asset }: { asset: UserAsset }) => {
        const { asset: assetData } = asset;

        const Icon = useMemo(() => defaultAssetsIcons.find(icon => icon.name === assetData?.name)?.icon, [assetData]);

        const stars = getCollectableStars(asset, nowTs, globalLastCollectedAt);
        return (
            <Block key={assetData.id} className="gap-3">
                <div className="flex flex-row items-center justify-between gap-2">
                    <div className="flex flex-col  gap-2">
                        <div className="w-12 h-12 rounded-lg bg-gold-500/10 flex items-center justify-center">
                            {Icon && <Icon className="w-6 h-6 text-gold-500" />}
                        </div>
                        <h3 className="text-sm font-semibold text-gray-200 text-center">
                            {assetData.name}
                        </h3>
                    </div>


                    <MessageCircleQuestion
                        className="w-4 h-4 text-gray-400 mb-auto"
                        onClick={() => setShowUserAssetModal({ onlyView: true, asset })}
                    />
                </div>

                <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400">Срок жизни:</span>
                        <span className="text-gray-300 font-semibold">
                            {formatLifetimeLeft(asset.expiresAt, nowTs)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-gray-400">Добыча в час:</span>
                        <ShowStars size="small" value={parseFloat(asset.starsPerHour)} />
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-gray-400">К сбору:</span>
                        <ShowStars size="small" value={stars} />
                    </div>
                </div>





            </Block>
        )
    }

    return (
        <PageContainer title="" itemsStart loading={false}>
            {/* <Banner type="assets" /> */}

            <Tabs
                tabs={[
                    { label: "Купить", value: "buy" },
                    { label: "Мои Активы", value: "me" },
                ]}
                activeTab={activeTab}
                onChange={(value) => setActiveTab(value as 'buy' | 'me')}
            />

            {activeTab === 'buy' ? (
                <div className="grid grid-cols-2 w-full gap-2 max-w">
                    {assets && assets.map((asset) => (
                        <AssetItem key={asset.id} asset={asset} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col w-full gap-2 items-center">
                    {myAssets === null || myAssets.length === 0 ? (
                        <div className="col-span-2 flex flex-col items-center justify-center gap-6 py-12">
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-2 border-dashed border-gold-500"></div>
                                <div className="relative z-10 flex items-center justify-center">
                                    <Building2 className="w-16 h-16 text-gold-500" />
                                </div>

                            </div>

                            <div className="flex flex-col items-center gap-2 text-center">
                                <h3 className="text-xl font-bold text-gold-500">Активов нет</h3>
                                <p className="text-sm text-gray-400 max-w-xs">
                                    У вас пока нет активных зданий. Купите свое первое предприятие, чтобы начать получать звезды!
                                </p>
                            </div>

                            <Button
                                text="КУПИТЬ ПЕРВОЕ ЗДАНИЕ"
                                icon={<ArrowRight className="w-5 h-5" />}
                                FC={() => setActiveTab('buy')}
                                color="gold"
                                className="w-full"
                            />
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-gray-400 font-bold text-lg">Ваша добыча:</span>
                                <div className="flex items-center gap-1">
                                    <ShowStars value={totalYield} />
                                    <span className="text-gray-400 text-base">/ в час</span>
                                </div>
                            </div>
                            {totalYield > 0 && !isScaleFull && (
                                <div className="text-sm font-bold text-gray-400 text-center">
                                    До заполнения: {formatTimeLeftToFull(timeToFullMs)}
                                </div>
                            )}
                            {isScaleFull && (
                                <div className="text-xs text-gold-500 text-center font-semibold">
                                    Общая шкала добычи заполнена - заберите звезды
                                </div>
                            )}

                            <Button
                                text={
                                    <ShowStars text={canCollectStars ? "Собрать" : "Сбор недоступен"} variant="dark" value={totalCollectableStars} />
                                }
                                FC={onCollectStars}
                                widthMin
                                color={canCollectStars ? "gold" : "transparent"}
                                className="w-full !px-10"
                                disabled={!canCollectStars}
                            />

                            <div className="grid grid-cols-2 gap-3 w-full">
                                {myAssets.map((asset) => (
                                    <AssetUserItem key={asset.id} asset={asset} />
                                ))}
                            </div>
                        </>
                    )}


                </div>

            )}

            <Modal
                isOpen={showAssetModal.asset !== null}
                setIsOpen={(value) => setShowAssetModal(value ? { asset: showAssetModal.asset, onlyView: showAssetModal.onlyView } : { onlyView: false, asset: null })}
                title={showAssetModal.asset?.name}
                buttonCloseText="Закрыть"
                buttonColor="blue"
                buttonFC={() => setShowAssetModal({ onlyView: false, asset: null })}
            >
                {showAssetModal.asset && (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-24 h-24 shadow-2xl shadow-gold-500/50 rounded-lg bg-black flex items-center justify-center">
                                {(() => {
                                    const Icon = defaultAssetsIcons.find(icon => icon.name === (showAssetModal.asset as Asset).name)?.icon;
                                    return Icon && <Icon className="w-20 h-20 text-gold-500" />;
                                })()}
                            </div>
                        </div>

                        <div className="grid *:gap-2 *:items-center *:text-center grid-cols-4 gap-2">
                            <Block title="ЦЕНА" smallTitle variant="darker">
                                <ShowStars toFixed={0} value={parseFloat((showAssetModal.asset as Asset).priceStars)} />
                            </Block>

                            <Block title="МАКС. ДОБЫЧА" smallTitle variant="darker">
                                <ShowStars toFixed={0} value={parseFloat(showAssetModal.asset.maxStars)} />
                            </Block>

                            <Block title="СРОК" className="font-bold" smallTitle variant="darker">
                                {showAssetModal.asset.durationDays} дн
                            </Block>

                            <Block title="ЛИМИТ" className="font-bold" smallTitle variant="darker">
                                {formatAssetLimit(showAssetModal.asset.limitPerUser)}
                            </Block>
                        </div>

                        <Block
                            icons={[<Info className="w-5 h-5 text-gold-500 flex-shrink-0" />]}
                            title="ОПИСАНИЕ" smallTitle variant="darker"
                            subtitle={showAssetModal.asset?.description}
                        />

                        <Block
                            title={`Максимальная добыча: ${((Number(showAssetModal.asset.maxStars) / Number(showAssetModal.asset.priceStars) * 100 - 100).toFixed(0))}% за ${showAssetModal.asset?.durationDays} дней`}
                            icons={[<Zap className="w-5 h-5 text-gold-500 flex-shrink-0" />]}
                            smallTitle
                            variant="darker"
                        />


                        <Button
                            text="КУПИТЬ"
                            FC={() => buyAsset(showAssetModal.asset as Asset)}
                            color="gold"
                        />

                    </div>
                )}
            </Modal>

            <Modal
                isOpen={showUserAssetModal.asset !== null}
                setIsOpen={(value) => setShowUserAssetModal(value ? { asset: showUserAssetModal.asset, onlyView: showUserAssetModal.onlyView } : { onlyView: false, asset: null })}
                title={showUserAssetModal.asset?.asset.name}
                buttonCloseText="Закрыть"
                buttonColor="blue"
                buttonFC={() => setShowUserAssetModal({ onlyView: false, asset: null })}
            >
                {showUserAssetModal.asset && (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-24 h-24 shadow-2xl shadow-gold-500/50 rounded-lg bg-black flex items-center justify-center">
                                {(() => {
                                    const Icon = defaultAssetsIcons.find(icon => icon.name === showUserAssetModal.asset?.asset.name)?.icon;
                                    return Icon && <Icon className="w-20 h-20 text-gold-500" />;
                                })()}
                            </div>
                        </div>

                        <div className="grid *:gap-2 *:items-center *:text-center grid-cols-3 gap-2">
                            <Block title="ЦЕНА" smallTitle variant="darker">
                                <ShowStars value={parseFloat(showUserAssetModal.asset.asset.priceStars)} />
                            </Block>

                            <Block title="ДОБЫЧА В ЧАС" smallTitle variant="darker">
                                <ShowStars value={parseFloat(showUserAssetModal.asset.asset.starsPerHour)} />
                            </Block>

                            <Block title="СРОК" className="font-bold" smallTitle variant="darker">
                                {showUserAssetModal.asset.asset.durationDays} дн
                            </Block>
                        </div>

                        <Block
                            icons={[<Info className="w-5 h-5 text-gold-500 flex-shrink-0" />]}
                            title="ОПИСАНИЕ" smallTitle variant="darker"
                            subtitle={showUserAssetModal.asset.asset?.description}
                        />

<Block
                            title={`Максимальная добыча: ${((Number(showUserAssetModal.asset.asset.maxStars) / Number(showUserAssetModal.asset.asset.priceStars) * 100 - 100).toFixed(0))}% за ${showUserAssetModal.asset.asset.durationDays} дней`}
                            icons={[<Zap className="w-5 h-5 text-gold-500 flex-shrink-0" />]}
                            smallTitle
                            variant="darker"
                        />


                    </div>
                )}
            </Modal>
        </PageContainer>
    );
};
export default AssetsPage;
