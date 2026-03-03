import capPersonAvatar from "@/assets/cap_person.jpg";
import crimePersonAvatar from "@/assets/crime_person.jpg";
import pabloAvatar from "@/assets/pablo.jpg";
import { PageContainer } from "@/components/layout/PageContainer";
import { Block } from "@/components/ui/Block";
import { Button } from "@/components/ui/Button";
import { Form } from "@/components/ui/Form";
import { ShowStars } from "@/components/ui/ShowStars";
import { UserService } from "@/services/user.service";
import { useStore } from "@/store/root.store";
import { IUser } from "@/types/auth";
import { onRequest } from "@/utils/handleReq";
import { BarChart3, Box, Coins, Copy, Gift, History, ShipWheelIcon, TrendingUp, User, Users, Wallet } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";


export interface IRecentAction {
    id: string;
    type: 'deposit' | 'boxes' | 'roulette' | 'cases' | 'asset_buy' | 'asset_income';
    label: string;
    amount?: number;
    amountStr?: string;
    status: string;
    date: string;
}

interface IProfile extends IUser {
    totalReferrals: number;
    totalReferralEarnings: number;
    totalDepositsStars?: number;
    starToRub?: number;
    activeReferrals?: number;
    UsersConfig?: { language?: string };
    recentActions?: IRecentAction[];
}

const ProfilePage: React.FC = observer(() => {
    const { userStore: { user, updateUserBalance } } = useStore();
    const [leaderboardPlayers, setLeaderboardPlayers] = useState<IUser[]>([]);
    const [profile, setProfile] = useState<IProfile | null>(null);

    const getLeaderboardPlayers = async () => {
        // const data = await onRequest(UserService.getLeaderboard({ limit: 3, page: 1 }))
        const profile: IProfile = await onRequest(UserService.getUserProfile())

        console.log(profile);

        setProfile(profile);
        // console.log(data);
        
    }

    useEffect(() => {
        getLeaderboardPlayers();
    }, []);




    return (
        <PageContainer title="" className="gap-4" itemsStart loading={false}>
            <Block
                className="gap-4"
            >
                <div className="flex flex-col sm:flex-row items-start gap-4">

                    <div className="flex flex-row items-center gap-4">
                        <div className="flex-shrink-0 w-20 h-20 rounded-full border-2 border-app-border bg-app-darker overflow-hidden flex items-center justify-center">
                            {profile?.photo_url ? (
                                <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-white/40" />
                            )}
                        </div>

                        <div className="flex flex-col">
                            <div className="text-lg font-bold text-gray-100">
                                {[profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || profile?.username || 'Username'}
                            </div>
                            {profile?.username && (
                                <div className="text-sm text-gray-400">@{profile.username}</div>
                            )}

                            {profile?.id && (
                                <div className="text-sm text-gray-400">{profile.id}</div>
                            )}
                        </div>



                    </div>
                </div>

                {/* <div className="grid grid-cols-2 gap-3 pt-2 border-t border-app-border/50">
                    <Block title="Всего пополнено" smallTitle>
                        <ShowStars value={profile?.totalDepositsStars ?? 0} size="medium" className="mt-1" />
                    </Block>

                </div> */}
            </Block>






            {/* Последние действия */}
            {/* <Block
                className="gap-4"
                title="ПОСЛЕДНИЕ ДЕЙСТВИЯ"
                icons={[<History className="w-4 h-4 stroke-[3.5] text-gold-500" />]}
            >
                {recentActions.length === 0 ? (
                    <p className="text-gray-400 text-sm py-4 text-center">Пока нет операций</p>
                ) : (
                    <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[360px] border-collapse">
                            <thead>
                                <tr className="border-b border-app-border/80 bg-black/10 *:text-center">
                                    <th className="py-2 pr-2 text-xs font-semibold uppercase text-white/60 text-left">
                                        Операция
                                    </th>
                                    <th className="py-2 pr-2 text-xs font-semibold uppercase text-white/60 !text-left">
                                        Сумма
                                    </th>
                                    <th className="py-2 text-xs font-semibold uppercase text-white/60 text-left">
                                        Статус
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentActions.map((action) => (
                                    <tr
                                        key={action.id}
                                        className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.03] transition-colors"
                                    >
                                        <td className="py-2 pr-2 ">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/40 border border-app-border flex-shrink-0">
                                                    {getActionIcon(action.type)}
                                                </div>
                                                <div className="flex flex-col min-w-0 !text-left">
                                                    <span
                                                        className="text-sm font-medium text-gray-200 truncate"
                                                        title={action.label}
                                                    >
                                                        {action.label}
                                                    </span>
                                                    <span className="text-[11px] text-white/40">
                                                        {formatDate(action.date)}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-2 pr-2 h-full items-center ">
                                            <ShowStars className="!w-min" value={action.amount ?? 0} size="small" toFixed={2} />
                                        </td>

                                        <td className="py-2 text-center">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusClass(action.status)}`}
                                            >
                                                {action.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Block> */}
        </PageContainer>
    );
});

export default ProfilePage;
