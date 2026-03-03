import tonIcon from '@/assets/ton.svg';
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import React, { ReactNode, useCallback, useMemo, useRef, useState } from "react";

export interface BlockProps {
    children?: ReactNode,
    className?: string
    variant?: 'default' | 'lighter' | 'darker' | 'transparent'
    title?: ReactNode
    subtitle?: ReactNode
    icons?: ReactNode[]
    canCollapse?: boolean
    isCollapsedInitially?: boolean
    priceTitle?: number | ReactNode
    titleCenter?: boolean
    hugeTitle?: boolean
    smallTitle?: boolean
    mediumTitle?: boolean
    overflowHidden?: boolean
    onClick?: () => void
    disabled?: boolean
}

export const Block = React.memo(({
    children,
    className,
    variant = 'default',
    title,
    subtitle,
    icons: Icons,
    canCollapse = false,
    isCollapsedInitially = false,
    priceTitle,
    titleCenter = false,
    hugeTitle = false,
    smallTitle = false,
    mediumTitle = false,
    overflowHidden = false,
    onClick,
    disabled = false
}: BlockProps) => {
    const [isCollapsed, setIsCollapsed] = useState(isCollapsedInitially);
    const blockRef = useRef<HTMLDivElement>(null);

    const handleCollapse = useCallback((value: boolean) => {
        setIsCollapsed(value);
    }, []);

    const getBackgroundColor = useMemo(() => {
        switch (variant) {
            case 'lighter':
                return ' bg-gradient-to-b from-app-cardLight to-app-cardLight/50'
            case 'darker':
                return ' bg-gradient-to-b from-app-darker to-app-darker/50'
            case 'transparent':
                return 'bg-transparent border-none shadow-none'
            default:
                return 'bg-gradient-to-b from-app-card to-app-card-50'
        }
    }, [variant]);

    return (
        <div    
            ref={blockRef}
            className={cn(
                getBackgroundColor,
                `flex w-full max-w-2xl lg:max-w-6xl h-min min-h-0 flex-col relative shadow-lg rounded-lg border border-app-border p-2`,
                overflowHidden && '!overflow-hidden',
                className,
                onClick && 'cursor-pointer',
                disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={onClick}
        >

            {disabled && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeIn" }}
                    className="absolute top-0 left-0 w-full h-full bg-black/50 z-20"
                >
                </motion.div>
            )}


            {(title || Icons || canCollapse) && (
                <div className={cn("flex flex-col gap-3 w-auto items-center", canCollapse && 'cursor-pointer !flex-row')}
                    onClick={() => canCollapse && handleCollapse(!isCollapsed)}>

                    <div className="flex flex-col items-start gap-2 w-full h-min">
                        <div className="flex w-full h-auto gap-2">
                            <div className={cn("flex  h-full w-full items-center", titleCenter && '!justify-center text-center')}>
                                <div className={cn("flex items-center justify-center", Icons && Icons.length > 0 && 'mr-2')}>
                                    {Icons && Icons.map((Icon, index) => (
                                        <div key={index} className="flex items-center justify-center">{Icon}</div>
                                    ))}
                                </div>

                                {title && (
                                    typeof title === 'string'
                                        ? <h3 className={cn("text-lg items-center  h-min font-bold text-gold-500", hugeTitle && '!text-3xl lg:!text-4xl', mediumTitle && '!text-2xl lg:!text-3xl', smallTitle && '!text-sm')}>{title}</h3>
                                        : title
                                )}
                            </div>

                            {priceTitle && (
                                <div className="flex items-center gap-1">
                                    {typeof priceTitle === 'number' ? (
                                        <>
                                            <span className="text-lg font-semibold">{priceTitle}</span>
                                            <img src={tonIcon} alt="TON" className="w-4 h-4" />
                                        </>
                                    ) : (
                                        priceTitle
                                    )}
                                </div>
                            )}
                        </div>
                        {subtitle && (
                            <p className={cn("text-base font-bold md:text-lg w-full text-gray-400", titleCenter && '!text-center')}>{subtitle}</p>
                        )}
                    </div>
                    {canCollapse && (
                        <button
                            onClick={(e) => {
                                handleCollapse(!isCollapsed);
                            }}
                            className="p-1 rounded-md hover:bg-app-cardLight transition-colors"
                            // aria-expanded={!isCollapsed}
                            aria-label={isCollapsed ? 'Развернуть блок' : 'Свернуть блок'}
                        >
                            <motion.div
                                animate={{ rotate: isCollapsed ? 0 : 180 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                style={{ willChange: 'transform' }}
                            >
                                <ChevronDown className="w-5 h-5" />
                            </motion.div>
                        </button>
                    )}
                </div>
            )}

            {!isCollapsed && children}
        </div>
    )
});