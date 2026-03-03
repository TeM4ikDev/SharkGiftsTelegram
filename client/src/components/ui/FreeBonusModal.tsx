import { UserService } from '@/services/user.service';
import { useStore } from '@/store/root.store';
import { onRequest } from '@/utils/handleReq';
import { Megaphone, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Block } from './Block';
import { Button } from './Button';
import { Modal } from './Modal';
import { ShowStars } from './ShowStars';

interface FreeBonusModalProps {
    isOpen: boolean;
    setIsOpen: (arg: boolean) => void;
}


interface BonusInfo {
    id: string
    canBeCollectedAt: string
}



export const FreeBonusModal = ({ isOpen, setIsOpen }: FreeBonusModalProps) => {
    const { userStore: { updateUserBalance } } = useStore()
    const [bonusInfo, setBonusInfo] = useState<BonusInfo | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState(0);


    const getBonusInfo = async () => {
        const data = await onRequest(UserService.getBonusInfo())
        console.log(data)
        setBonusInfo(data);

        return data;
    }

    useEffect(() => {
        getBonusInfo();
    }, []);

    useEffect(() => {
        if (!bonusInfo?.canBeCollectedAt) {
            setRemainingSeconds(0);
            return;
        }

        const updateRemainingTime = () => {
            const targetMs = new Date(bonusInfo.canBeCollectedAt).getTime();
            const nowMs = Date.now();
            const diffSec = Math.max(0, Math.ceil((targetMs - nowMs) / 1000));
            setRemainingSeconds(diffSec);
        };

        updateRemainingTime();
        if (!isOpen) return;

        const timer = window.setInterval(updateRemainingTime, 1000);
        return () => window.clearInterval(timer);
    }, [bonusInfo?.canBeCollectedAt, isOpen]);

    const formatTime = (value: number) => {
        return value.toString().padStart(2, '0');
    };

    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    const canCollectNow = !!bonusInfo && remainingSeconds <= 0;

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleGetBonus = async () => {

        const data: string[] = await onRequest(UserService.getFreeBonus())

        if (data.length > 0) {
            for (const item of data) {
                toast.error(`Нет подписки на @${item}`);
            }
        } else {
            toast.success('Спасибо за подписки!');
            getBonusInfo();
            updateUserBalance().catch();

        }
    };

    return (
        <Modal title="Выполните условия, чтобы получить бесплатные звезды" isOpen={isOpen} setIsOpen={setIsOpen} buttonCloseText="Закрыть" buttonColor="blue" buttonFC={handleClose}>

            <div className="flex justify-between font-bold flex-col flex-1 gap-3">

                <div className="flex flex-col gap-3">
                    {bonusInfo && (
                        <Block
                            title={canCollectNow ? "" : "СЛЕДУЮЩАЯ НАГРАДА ЧЕРЕЗ"}
                            titleCenter
                            className={canCollectNow ? "bg-gradient-to-r from-gold-500/30 to-yellow-400/20 border-gold-400/50" : ""}
                        >
                            <div className={`text-center tracking-wider ${canCollectNow ? "text-xl font-black text-gold-200" : "text-3xl font-bold text-gold-500"}`}>
                                {canCollectNow
                                    ? "Бонус можно забрать"
                                    : `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`}
                            </div>
                        </Block>
                    )}

                    <div className="flex  flex-col gap-3">
                        <Block variant="lighter" className='!flex-row justify-between'>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gold-500/10 rounded-lg">
                                    <Megaphone className="w-5 h-5 text-gold-500" />
                                </div>
                                <div className="text-gray-200">
                                    Подпишитесь на канал
                                </div>
                            </div>
                            <Button
                                text="ПЕРЕЙТИ"
                                color="gold"
                                href='https://t.me/news_pablo'
                                className="!ml-auto"
                                widthMin
                            />
                        </Block>

                        <Block variant="lighter" className='!flex-row justify-between'>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gold-500/10 rounded-lg">
                                    <MessageCircle className="w-5 h-5 text-gold-500" />
                                </div>
                                <div className="text-left text-gray-200">
                                    Подпишитесь на чат
                                </div>
                            </div>
                            <Button
                                text="ПЕРЕЙТИ"
                                color="gold"
                                href='https://t.me/chatt_pablo'
                                className="!m-auto"
                                widthMin
                            />
                        </Block>
                    </div>
                </div>

                <Button
                    text={<ShowStars text="Получить бонус" value={10} variant="dark" />}
                    FC={handleGetBonus}
                    color="gold"
                    className="!mt-auto"
                    disabled={remainingSeconds > 0}
                />
            </div>
        </Modal>
    );
};
