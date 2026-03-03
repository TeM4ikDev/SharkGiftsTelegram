export interface IGameAnalyticsPeriod {
  value: number;
  inStars: number;
  change: number;
}

export interface IGameAnalyticsResult {
  rtp: { value: number; change: number; label: string };
  revenue: { value: number; inStars: number };
  expenses: { value: number; inStars: number };
  netProfit: { value: number; inStars: number };
  byPeriod: {
    day: IGameAnalyticsPeriod;
    week: IGameAnalyticsPeriod;
    month: IGameAnalyticsPeriod;
    allTime: IGameAnalyticsPeriod;
  };
  rouletteOnly?: boolean;
  /** Для активов: блок «в перспективе» — макс. звёзд, которые могут дать все купленные здания (сумма maxStars) */
  potentialStars?: { value: number; inStars: number };
  /** Для активов: в 4 блоках byPeriod показываем earnedAssetsStars (сколько пользователи получили), а не прибыль */
  assetsOnly?: boolean;
}
