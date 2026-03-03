import { useStore } from "@/store/root.store";
import { TonConnectButton } from "@tonconnect/ui-react";
import { observer } from "mobx-react-lite";
import { forwardRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";


import logo from "../../assets/logo.png"

export interface HeaderProps {
    onHeightChange?: (height: number) => void;
}

export const Header = observer(forwardRef<HTMLElement, HeaderProps>(({ onHeightChange }, ref) => {
    const { userStore: { user } } = useStore();
    const navigate = useNavigate();
    const location = useLocation();

    const username = user?.username || "username";

    // Определяем активную вкладку на основе текущего пути (для ссылки на FAQ)
    const activeTab = useMemo<"general" | "assets" | "shop" | "roulette">(() => {
        if (location.pathname.includes('/assets')) {
            return 'assets';
        }
        if (location.pathname.includes('/shop')) {
            return 'shop';
        }
        if (location.pathname.includes('/games/roulette')) {
            return 'roulette';
        }
        return 'general';
    }, [location.pathname]);
    


    return (
        <header
            ref={ref}
            className="sticky py-1 top-0 left-0 right-0 w-full h-min z-50  backdrop-blur-sm border-b border-white/10 flex items-center shadow-2xl bg-app-darker/70 shadow-black/80"
        >
            <div className="flex items-center   justify-between max-w-md mx-auto w-full px-4 gap-3">
                {/* <div className="flex items-center gap-2 overflow-hidden">
                   
                    <span className="text-blue-400 text-[14px] font-extrabold  tracking-tight">@{username}</span>
                </div> */}


                <div className="flex flex-row items-center gap-3">       
                    <img className="h-16" src={logo}></img>
                    <p className="font-bold">Shark Gifts</p>

                </div>


                <TonConnectButton />
                {/* <div 
                    onClick={() => navigate('/topup')} 
                    className="flex absolute left-1/2 -translate-x-1/2 items-center gap-2 px-3 py-1.5 bg-app-card border border-gold-300/50 rounded-2xl cursor-pointer hover:bg-white/10 active:scale-95 transition-all duration-200 group"
                >
                    <ShowStars  size="small" value={user?.balance || 0} />
                    
                    <div className="w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center group-hover:bg-gold-400 transition-colors shadow-sm shadow-gold-500/30">
                        <Plus className="w-3.5 h-3.5 text-app-darker stroke-[4]" />
                    </div>
                </div> */}

                {/* <Link 
                    to="/faq"
                    state={{ tab: activeTab }}
                    className="flex-shrink-0"
                >
                    <span className="text-[14px] font-black text-gold-500/80 bg-gold-500/10 px-3 py-1 rounded-lg border border-gold-500/20 hover:bg-gold-500/20 transition-all uppercase tracking-wider">
                        FAQ
                    </span>
                </Link> */}
            </div>
        </header>
    );
}));
