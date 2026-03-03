export interface IAdminDashboard {
    financialMetric: IMetric;
    chartData: IChartDataPoint[];
    totalPlayers: IMetric;
    activePlayers: IMetric;
    arpu: IMetric;
    conversion: IMetric;
    averageSession: IMetric;
}

export interface IMetric {
    value: number;
    change: number;
    changeDirection: "up" | "down" | "neutral";
    description?: string;
}

export interface IChartDataPoint {
    date: string;
    value: number;
    previousValue?: number;
}


export type DashboardPeriod = "day" | "week" | "month" | "year" | "allTime";
export type DashboardMainMetric = "totalRevenue" | "totalExpense" | "netProfit";
export interface IDashboardQuery {
    period: DashboardPeriod;
    mainMetric: DashboardMainMetric;
    startDate?: string;
    endDate?: string;
}