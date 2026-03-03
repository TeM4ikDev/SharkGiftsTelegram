import { Loader } from "@/components/layout/Loader";
import { AdminService } from "@/services/admin.service";
import { onRequest } from "@/utils/handleReq";
import { useEffect, useState } from "react";
import { PageContainer } from "../../layout/PageContainer";
import { Block } from "../../ui/Block";
import { ChartLineIcon } from "lucide-react";

interface StarsPurchase {
    id: string;
    starsAmount: number;
    priceInRub: number;
    recipientUsername: string;
    isGift: boolean;
    createdAt: string;
    serviceProfit: number;
    buyer: {
        telegramId: string;
        username: string | null;
        firstName: string | null;
        lastName: string | null;
    };
}

interface PremiumPurchase {
    id: string;
    telegramPremiumType: 'MONTHS_3' | 'MONTHS_6' | 'MONTHS_12' | null;
    priceInRub: number;
    recipientUsername: string;
    isGift: boolean;
    createdAt: string;
    serviceProfit: number;
    buyer: {
        telegramId: string;
        username: string | null;
        firstName: string | null;
        lastName: string | null;
    };
}

interface StarsStatsData {
    period: string;
    startDate: string;
    endDate: string;
    totalStars: number;
    totalRevenue: number;
    totalServiceProfit: number;
    totalReferralEarning: number;
    totalPurchases: number;
    uniqueBuyers: number;
    purchases: StarsPurchase[];
}

interface PremiumStatsData {
    period: string;
    startDate: string;
    endDate: string;
    totalRevenue: number;
    totalServiceProfit: number;
    totalReferralEarning: number;
    totalPurchases: number;
    uniqueBuyers: number;
    byType: {
        MONTHS_3: number;
        MONTHS_6: number;
        MONTHS_12: number;
    };
    purchases: PremiumPurchase[];
}

type PeriodType = 'day' | 'week' | 'month' | 'year';
type StatsType = 'stars' | 'premium';

const periodLabels: Record<PeriodType, string> = {
    day: 'День',
    week: 'Неделя',
    month: 'Месяц',
    year: 'Год',
};

const statsTypeLabels: Record<StatsType, string> = {
    stars: 'Звезды',
    premium: 'Premium',
};

export const StarsStats: React.FC = () => {
    const [statsType, setStatsType] = useState<StatsType>('stars');
    const [period, setPeriod] = useState<PeriodType>('day');
    const [starsStats, setStarsStats] = useState<StarsStatsData | null>(null);
    const [premiumStats, setPremiumStats] = useState<PremiumStatsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = async () => {
        setIsLoading(true);
        if (statsType === 'stars') {
            const data = await onRequest(AdminService.getStarsStats(period));
            console.log(data);
            if (data) {
                setStarsStats(data);
            }
        } else {
            const data = await onRequest(AdminService.getPremiumStats(period));
            console.log(data);
            if (data) {
                setPremiumStats(data);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchStats();
    }, [period, statsType]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatPremiumType = (type: string | null) => {
        switch (type) {
            case 'MONTHS_3':
                return '3 месяца';
            case 'MONTHS_6':
                return '6 месяцев';
            case 'MONTHS_12':
                return '12 месяцев';
            default:
                return 'Неизвестно';
        }
    };

    if (isLoading) {
        return (
            <Loader text={`Загрузка статистики ${statsTypeLabels[statsType]}...`} />
        );
    }

    const stats = statsType === 'stars' ? starsStats : premiumStats;
    if (!stats) {
        return (
            <PageContainer title="Статистика покупок">
                <Block className="w-full p-4">
                    <div className="text-center text-red-400">Ошибка загрузки данных</div>
                </Block>
            </PageContainer>
        );
    }

    return (
        <PageContainer title="Статистика покупок" returnPage>
            <div className="w-full space-y-4">
                {/* Переключатель типа статистики */}
                <Block className="w-full p-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {(Object.keys(statsTypeLabels) as StatsType[]).map((type) => (
                            <button
                                key={type}
                                onClick={() => setStatsType(type)}
                                className={`px-4 py-2 rounded-lg transition ${statsType === type
                                    ? 'bg-[#6c47ff] text-white'
                                    : 'bg-[#221a3a] text-gray-300 hover:bg-[#31295a]'
                                    }`}
                            >
                                {statsTypeLabels[type]}
                            </button>
                        ))}
                    </div>
                    {/* Переключатель периодов */}
                    <div className="flex flex-wrap gap-2">
                        {(Object.keys(periodLabels) as PeriodType[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-lg transition ${period === p
                                    ? 'bg-[#6c47ff] text-white'
                                    : 'bg-[#221a3a] text-gray-300 hover:bg-[#31295a]'
                                    }`}
                            >
                                {periodLabels[p]}
                            </button>
                        ))}
                    </div>
                </Block>
                {/* Общая статистика */}
                <Block className="w-full p-2 gap-2" title="Общая статистика" icons={[<ChartLineIcon className="w-min h-min" />]}>
                    <Block variant="lighter">
                        <div className="text-sm text-gray-400 mb-1">Всего покупок</div>
                        <div className="text-2xl font-bold text-[#b6aaff]">{stats.totalPurchases}</div>
                    </Block>
                    {statsType === 'stars' && 'totalStars' in stats && (
                        <Block variant="lighter">
                            <div className="text-sm text-gray-400 mb-1">Всего звезд</div>
                            <div className="text-2xl font-bold text-[#b6aaff]">{stats.totalStars.toLocaleString('ru-RU')} ⭐</div>
                        </Block>
                    )}
                    {statsType === 'premium' && 'byType' in stats && (
                        <Block variant="lighter">
                            <div className="text-sm text-gray-400 mb-1">По типам подписки</div>
                            <div className="text-sm text-[#b6aaff]">
                                <div>3 мес: {stats.byType.MONTHS_3}</div>
                                <div>6 мес: {stats.byType.MONTHS_6}</div>
                                <div>12 мес: {stats.byType.MONTHS_12}</div>
                            </div>
                        </Block>
                    )}
                    <Block variant="lighter">
                        <div className="text-sm text-gray-400 mb-1">Общий объем покупок</div>
                        <div className="text-2xl font-bold text-green-400">{formatCurrency(stats.totalRevenue)}</div>
                    </Block>
                    <Block variant="lighter">
                        <div className="text-sm text-gray-400 mb-1">Общий профит</div>
                        <div className="text-2xl font-bold text-yellow-400">{formatCurrency(stats.totalServiceProfit)}</div>
                    </Block>
                    <Block variant="lighter">
                        <div className="text-sm text-gray-400 mb-1">Реферальные выплаты</div>
                        <div className="text-2xl font-bold text-blue-400">{formatCurrency(stats.totalReferralEarning)}</div>
                    </Block>
                    <Block variant="lighter">
                        <div className="text-sm text-gray-400 mb-1">Уникальных покупателей</div>
                        <div className="text-2xl font-bold text-[#b6aaff]">{stats.uniqueBuyers}</div>
                    </Block>
                    <div className="text-sm text-gray-400">
                        Период: {formatDate(stats.startDate)} - {formatDate(stats.endDate)}
                    </div>
                </Block>

                {/* Список покупок */}
                <Block className="w-full p-4">
                    <h2 className="text-xl font-bold text-[#b6aaff] mb-4">Список покупок</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#28204a]">
                            <thead className="bg-[#221a3a]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-[#b6aaff] uppercase tracking-wider">Дата</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-[#b6aaff] uppercase tracking-wider">Покупатель</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-[#b6aaff] uppercase tracking-wider">Получатель</th>
                                    {statsType === 'stars' && (
                                        <th className="px-4 py-3 text-center text-xs font-bold text-[#b6aaff] uppercase tracking-wider">Звезд</th>
                                    )}
                                    {statsType === 'premium' && (
                                        <th className="px-4 py-3 text-center text-xs font-bold text-[#b6aaff] uppercase tracking-wider">Срок подписки</th>
                                    )}
                                    <th className="px-4 py-3 text-center text-xs font-bold text-[#b6aaff] uppercase tracking-wider">Сумма</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-[#b6aaff] uppercase tracking-wider">Профит</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-[#b6aaff] uppercase tracking-wider">Тип</th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#1a1333] divide-y divide-[#28204a]">
                                {stats.purchases.length > 0 ? (
                                    stats.purchases.map((purchase) => (
                                        <tr key={purchase.id} className="hover:bg-[#221a3a] transition">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                                {formatDate(purchase.createdAt)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                                {purchase.buyer.username ? (
                                                    <span>@{purchase.buyer.username}</span>
                                                ) : (
                                                    <span className="text-gray-500">
                                                        {purchase.buyer.firstName || ''} {purchase.buyer.lastName || ''}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                                @{purchase.recipientUsername}
                                            </td>
                                            {statsType === 'stars' && 'starsAmount' in purchase && (
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-[#b6aaff] font-semibold">
                                                    {purchase.starsAmount.toLocaleString('ru-RU')} ⭐
                                                </td>
                                            )}
                                            {statsType === 'premium' && 'telegramPremiumType' in purchase && (
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-[#b6aaff] font-semibold">
                                                    {formatPremiumType(purchase.telegramPremiumType)}
                                                </td>
                                            )}
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-green-400 font-semibold">
                                                {formatCurrency(purchase.priceInRub)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-yellow-400 font-semibold">
                                                {formatCurrency(purchase.serviceProfit)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                {purchase.isGift ? (
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-300">
                                                        Подарок
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300">
                                                        Себе
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={statsType === 'stars' ? 7 : 7} className="px-4 py-8 text-center text-gray-400">
                                            Покупки не найдены
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Block>
            </div>
        </PageContainer>
    );
};

