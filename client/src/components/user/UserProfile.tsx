import { IUserDetailedProfile } from "@/types/auth"
import { BadgeCheck, CreditCard, DollarSign, Send, ShieldCheck, Star, UserCircle2, Users } from "lucide-react"
import { Block } from "../ui/Block"
import { GradientLine } from "../ui/GradientLine"

interface UserProfileProps {
    user: IUserDetailedProfile
    title?: string
    showAvatar?: boolean
    className?: string
}

export const UserProfile: React.FC<UserProfileProps> = ({
    user,
    title,
    showAvatar = true,
    className = ""
}) => {
    const displayName = user.firstName || user.name
    const avatarUrl = user.photo_url

    return (
        <Block
            title={title || `Профиль ${displayName}`}
            icons={[<UserCircle2 className="text-cyan-400" />]}
            className={`p-4 gap-4 ${className}`}
            titleCenter
            mediumTitle
        >
            {/* {showAvatar && (
                <div className="flex flex-col items-center gap-4">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="avatar"
                            className="w-28 h-28 rounded-full border-4 border-cyan-400 shadow-lg object-cover"
                        />
                    ) : (
                        <div className="w-28 h-28 rounded-full border-4 border-cyan-400 shadow-lg flex items-center justify-center bg-slate-800">
                            <UserCircle2 className="w-16 h-16 text-cyan-400" />
                        </div>
                    )}

                    <span className="text-sm text-gray-400 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" />
                        {user.role}
                    </span>
                </div>
            )} */}

            <GradientLine />

            <div className="flex flex-col gap-3">
                {user.username && (
                    <div className="flex items-center justify-between bg-slate-700/60 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                            <Send className="text-cyan-400 w-5 h-5" />
                            <span className="font-semibold">Telegram:</span>
                        </div>
                        <span className="text-gray-200 text-sm">@{user.username}</span>
                    </div>
                )}

                <div className="flex items-center justify-between bg-slate-700/60 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                        <DollarSign className="text-green-400 w-5 h-5" />
                        <span className="font-semibold">Баланс:</span>
                    </div>
                    <span className="text-green-400 font-bold">{user.balance} ₽</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
                {/* <div className="bg-slate-700/40 rounded-lg p-3 flex flex-col items-center justify-center text-center gap-1 border border-slate-600/50">
                    <CreditCard className="text-purple-400 w-5 h-5" />
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Сумма</span>
                    <span className="text-sm font-bold text-gray-100">{user.totalOrdersAmount} ₽</span>
                </div> */}
                <div className="bg-slate-700/40 rounded-lg p-3 flex flex-col items-center justify-center text-center gap-1 border border-slate-600/50">
                    <Users className="text-blue-400 w-5 h-5" />
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Рефералов</span>
                    <span className="text-lg font-bold text-gray-100">{user.totalReferrals}</span>
                </div>
            </div>

            <div className="mt-2 bg-slate-700/40 rounded-lg p-3 flex justify-between items-center border border-slate-600/50">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span>Заработано на реф:</span>
                </div>
                <span className="text-green-400 font-bold">{user.totalReferralEarnings} ₽</span>
            </div>

            <GradientLine />

            <div className="flex flex-col gap-2 text-xs text-gray-500">
                <div className="flex justify-between">
                    <span>Системный ID:</span>
                    <span className="font-mono">{user.id}</span>
                </div>
                <div className="flex justify-between">
                    <span>Telegram ID:</span>
                    <span className="font-mono">{user.telegramId}</span>
                </div>
            </div>
        </Block>
    )
} 