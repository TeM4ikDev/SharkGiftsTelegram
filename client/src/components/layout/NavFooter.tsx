import { useStore } from "@/store/root.store";
import { ChevronDown, ChevronUp } from "lucide-react";
import { observer } from "mobx-react-lite";
import { forwardRef, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

export interface NavFooterProps {
    onHeightChange?: (height: number) => void;
}

export const hiddenRoutes: string[] = [
    // "/games",
];

/** Страницы, на которых меню сворачивается и показывается кнопка для раскрытия */
export const collapsibleRoutes = [
    // "/games"
];

export const isNavFooterHidden = (pathname: string): boolean => {
    return hiddenRoutes.some(route => pathname.startsWith(route));
};

export const isNavFooterCollapsible = (pathname: string): boolean => {
    return collapsibleRoutes.some(route => pathname.startsWith(route));
};

export const NavFooter = observer(forwardRef<HTMLDivElement, NavFooterProps>(({ onHeightChange }, ref) => {
    const { routesStore: { getRootRoutes }, userStore: { user } } = useStore();
    const pathname = useLocation().pathname;
    const isActive = (route: string) => pathname === route;

    const canCollapse = isNavFooterCollapsible(pathname);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (canCollapse) {
            setIsExpanded(false);
        } else {
            setIsExpanded(true);
        }
    }, [pathname, canCollapse]);

    const rootRoutes = useMemo(() => getRootRoutes().filter(
        route => !(route.disabled) &&
        (!route.accessRoles || (user && route.accessRoles.includes(user.role)))
    ), [user]);

    if (isNavFooterHidden(pathname)) {
        return null;
    }

    const showFullMenu = !canCollapse || isExpanded;

    return (
        <div 
            ref={ref}
            className="sticky mt-auto bottom-0 left-0 right-0 z-40"
        >
            <div className="max-w-full mx-auto">
                <div className="bg-app-darker/70 backdrop-blur-sm border border-white/10 shadow-2xl shadow-black/80 flex items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-gold-500/5 to-transparent pointer-events-none" />

                    {showFullMenu ? (
                        <>
                            <div className="flex items-center justify-between w-full px-2">
                                {rootRoutes.map((item, index) => {
                                    const Icon = item.icon;
                                    const isActiveItem = isActive(item.path);

                                    return (
                                        <NavLink
                                            key={index}
                                            to={item.path}
                                            className={({ isActive }) => `
                                                relative w-full flex flex-col items-center gap-1.5 flex-1 py-2 rounded-xl transition-all duration-200
                                                ${isActive ? 'scale-105' : 'scale-100 opacity-70 hover:opacity-100'}
                                            `}
                                        >
                                            {Icon && (
                                                <Icon 
                                                    className={`w-6 h-6 transition-all duration-300 ${
                                                        isActiveItem 
                                                            ? 'text-gold-100 filter drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]' 
                                                            : 'text-white/70'
                                                    }`} 
                                                />
                                            )}
                                            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                                                isActiveItem ? 'text-gold-100' : 'text-white/50'
                                            }`}>
                                                {item.label}
                                            </span>
                                            {isActiveItem && (
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold-500 rounded-full shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </div>
                            {canCollapse && (
                                <button
                                    type="button"
                                    onClick={() => setIsExpanded(false)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all"
                                    aria-label="Свернуть меню"
                                >
                                    <ChevronDown className="w-6 h-6" />
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsExpanded(true)}
                            className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-gold-500 transition-all"
                            aria-label="Показать меню"
                        >
                            <ChevronUp className="w-6 h-6" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Меню</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}));