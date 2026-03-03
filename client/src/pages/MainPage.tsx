import { PageContainer } from "@/components/layout/PageContainer";
import { Block } from "@/components/ui/Block";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ShowStars } from "@/components/ui/ShowStars";
import { useStore } from "@/store/root.store";
import { GIFTS_DATA, IGiftItem } from "@/utils/gifts";
import { onRequest } from "@/utils/handleReq";
import { DotLottiePlayer } from "@dotlottie/react-player";
import { beginCell, toNano } from "@ton/core";
import { SendTransactionRequest, useTonConnectUI } from "@tonconnect/ui-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import type { IGlobalConfig } from "@/types";
import { AdminService } from "@/services/admin.service";


const generateMemo = (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}


const STAR_USDT_RATE = 0.015;

const MainPage: React.FC = observer(() => {
    const { userStore } = useStore();
    const [selectedGift, setSelectedGift] = useState<IGiftItem | null>(null);
    const [recipientUsername, setRecipientUsername] = useState("");
    const [tonConnectUI] = useTonConnectUI();
    const [isWalletConnected, setIsWalletConnected] = useState<boolean>(tonConnectUI.connected);
    const [globalConfig, setGlobalConfig] = useState<IGlobalConfig | null>(null);


    const testIsUsername = (username: string) => {
        const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{3,31}$/;
        return USERNAME_REGEX.test(username.replace('@', ''));
    }

    useEffect(() => {
        const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
            setIsWalletConnected(Boolean(wallet));
        });
        return () => {
            unsubscribe();
        };
    }, [tonConnectUI]);

    useEffect(() => {
        const load = async () => {
            const data = await onRequest(AdminService.getGlobalConfig());
            if (data) setGlobalConfig(data);
        };
        load();
    }, []);

    const giftMarkupStars = useMemo(() => Number(globalConfig?.giftMarkupInStars ?? 1), [globalConfig?.giftMarkupInStars]);


    // const totalGiftStars = useMemo(() => selectedGift?.price + giftMarkupStars, [selectedGift?.price, giftMarkupStars]);
    // const totalGiftUsdt = useMemo(() => totalGiftStars * STAR_USDT_RATE, [totalGiftStars]);
    // const tonRateInUsd = useMemo(() => Number(globalConfig?.tonRateInUsd ?? 0), [globalConfig?.tonRateInUsd]);


    // const totalGiftTon = useMemo(() => {
    //     if (!tonRateInUsd) return 0;
    //     return totalGiftUsdt / tonRateInUsd;
    // }, [totalGiftUsdt, tonRateInUsd]);

    const onBuyGift = async (totalGiftTon: number) => {

        
        if (!tonConnectUI) {
            toast.error('TonConnectUI не подключен');
            return;
        }
        if (!globalConfig?.tonRateInUsd) {
            toast.error('Не задан курс TON в USDT (настройте в админке)');
            return;
        }
        if (!totalGiftTon || totalGiftTon <= 0) {
            toast.error('Не удалось рассчитать цену в TON');
            return;
        }

        const amountInTon = totalGiftTon;

        const comment = generateMemo();
        const recipient = recipientUsername.trim().replace("@", "");
        const payload = beginCell()
            .storeUint(0, 32) // opcode для текстового комментария
            .storeStringTail(`${comment}${recipient ? `|to:${recipient}` : ""}`) // текст комментария
            .endCell()
            .toBoc()
            .toString('base64');


        const transaction: SendTransactionRequest = {
            validUntil: Math.floor(Date.now() / 1000) + 300,

            messages: [
                {
                    address: "UQC2-_V9_-xc262zUdaxxIyxyWeWgWQbJOM4Ud2MVJQmWVpF", // Куда придут деньги
                    amount: toNano(amountInTon.toString()).toString(), // Конвертация в нанотоны
                    payload: payload // Payload с комментарием в формате base64,

                }
            ],
        };

        try {
            const result = await tonConnectUI.sendTransaction(transaction);
            console.log("Транзакция отправлена:", result.boc);

            toast.loading("Платеж отправлен! Ожидайте зачисления.");
            setRecipientUsername("");
            setSelectedGift(null);
        } catch (e) {
            console.error("Ошибка при оплате:", e);
        }
    };


    return (
        <PageContainer title="Доступные Подарки" itemsStart loading={false}>
            <Block variant="transparent" title="" className="">
                <div className="grid grid-cols-2 md:grid-cols-3 w-full gap-3 sm:gap-4">
                    {GIFTS_DATA.map((g) => (
                        <Block
                            key={g.id}
                            className="gap-2 !rounded-3xl !h-full items-center cursor-pointer transition-opacity hover:opacity-90"
                            onClick={() => setSelectedGift(g)}
                        >
                            <div className="relative w-full max-w-[160px] mx-auto aspect-square rounded-3xl overflow-hidden bg-gray-700/40 flex items-center justify-center">
                                <DotLottiePlayer
                                    src={g.animation}
                                    autoplay
                                    loop
                                    className="w-full h-full"
                                />
                            </div>
                            <div className="flex flex-col items-center w-full">
                                <h3 className="text-sm font-bold text-gray-200 text-center">
                                    {g.title}
                                </h3>


                                <ShowStars value={g.price * (1 + (giftMarkupStars / 100))} />
                                {/* <span className="text-xs text-gray-500">#{g.id.slice(-6)}</span> */}
                            </div>
                        </Block>
                    ))}
                </div>
            </Block>

            <Modal
                isOpen={selectedGift !== null}
                setIsOpen={(v) => {
                    if (!v) {
                        setSelectedGift(null);
                        setRecipientUsername("");
                    }
                }}
                title={selectedGift?.title ?? ""}
                buttonFC={() => {
                    setSelectedGift(null);
                    setRecipientUsername("");
                }}
            >
                {selectedGift && (
                    <div className="flex flex-col gap-4">
                        <div className="relative w-full max-w-[200px] mx-auto aspect-square max-h-[200px] rounded-3xl overflow-hidden bg-gray-700/40 flex items-center justify-center">
                            <DotLottiePlayer
                                src={selectedGift.animation}
                                autoplay
                                loop
                                className="w-full h-full"

                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-gray-400 text-left">
                                Кому отправить подарок
                            </span>
                            <div className="flex items-center gap-2">
                                <Input
                                    name="recipientUsername"
                                    placeholder="@username"
                                    value={recipientUsername}
                                    onChange={(e) => setRecipientUsername(e.target.value)}
                                    showTopPlaceholder={false}
                                />
                                <Button
                                    text="Себе"
                                    className="text-bas"
                                    FC={() => {
                                        const selfUsername = userStore.user?.username;
                                        if (selfUsername) {
                                            setRecipientUsername(selfUsername);
                                        }
                                    }}

                                    widthMin
                                />

                            </div>
                        </div>


                        {isWalletConnected ? (
                            <>
                                <Button
                                    text={`Оплптить ${selectedGift.price * (1 + (giftMarkupStars / 100)) / giftMarkupStars} TON`}
                                    color="gold"
                                    disabled={!testIsUsername(recipientUsername)}
                                    FC={() => onBuyGift(selectedGift.price * (1 + (giftMarkupStars / 100)) / giftMarkupStars)}
                                />
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-2">
                                {/* <p className="text-sm text-gray-400">Для отправки подарка, пожалуйста, подключите кошелек</p> */}
                                <Button
                                    text="Подключить кошелек"
                                    color="blue"
                                    FC={() => tonConnectUI.openModal()}
                                />
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </PageContainer>
    );
});

export default MainPage;