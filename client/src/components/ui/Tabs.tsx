import { cn } from "@/utils/cn";
import React, { useEffect, useRef, useState } from "react";

const INDICATOR_INSET = 3;

export interface TabItem {
    label: string;
    value: string | number;
}

export interface TabsProps {
    tabs: TabItem[];
    activeTab: string | number;
    onChange: (value: string | number) => void;
    className?: string;
    variant?: "equal" | "scroll";
    rightFade?: boolean;
    /** Количество колонок в grid. По умолчанию 2. Укажите 1 для одной колонки, 3+ для сетки. */
    gridCols?: number;
}

const GRID_COLS_MAP: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
};

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className, variant = "equal", rightFade = false, gridCols = 2 }) => {
    const activeTabRef = useRef<HTMLButtonElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, top: 0, width: 0, height: 0 });

    useEffect(() => {
        if (activeTabRef.current && scrollRef.current) {
            const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = activeTabRef.current;
            setIndicatorStyle({
                left: offsetLeft,
                top: offsetTop,
                width: offsetWidth,
                height: offsetHeight
            });

            if (variant === "scroll") {
                const container = scrollRef.current;
                const target = activeTabRef.current;
                const targetCenter = target.offsetLeft + target.offsetWidth / 2;
                const nextScrollLeft = Math.max(0, targetCenter - container.clientWidth / 2);
                container.scrollTo({ left: nextScrollLeft, behavior: "smooth" });
            }
        }
    }, [activeTab, variant]);

    return (
        <div className={cn("relative flex p-1 bg-app-card rounded-xl border border-app-border w-full shadow-inner shadow-black/20", className)}>
            <div
                ref={scrollRef}
                className={cn(
                    "relative w-full min-h-[2.25rem]",
                    variant === "scroll"
                        ? "flex gap-1.5 overflow-x-auto scrollbar-hide"
                        : cn("grid gap-1.5", GRID_COLS_MAP[gridCols] ?? `grid-cols-[repeat(${gridCols},minmax(0,1fr))]`)
                )}
            >
               
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.value;
                    return (
                        <button
                            key={tab.value}
                            ref={isActive ? activeTabRef : null}
                            onClick={() => onChange(tab.value)}
                            className={cn(
                                "relative z-10 py-2 px-2 rounded-lg text-sm font-bold uppercase tracking-wide whitespace-nowrap ",
                                variant === "equal" ? "flex-1 min-w-0" : "flex-shrink-0",
                                isActive
                                    ? "bg-gold-500 text-app-darker"
                                    : "text-gray-400 bg-white/[0.04] hover:bg-white/[0.08] hover:text-gray-200 "
                            )}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {rightFade && variant === "scroll" && (
                <div className="pointer-events-none absolute top-0 right-0 h-full w-10 bg-gradient-to-l from-app-card via-app-card/60 to-transparent rounded-r-xl" />
            )}
        </div>
    );
};
