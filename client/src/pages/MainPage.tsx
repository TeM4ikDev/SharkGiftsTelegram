import { PageContainer } from "@/components/layout/PageContainer";
import { Block } from "@/components/ui/Block";
import { Button } from "@/components/ui/Button";
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

import { UserService } from "@/services/user.service";
import WebApp from "@twa-dev/sdk";


const generateMemo = (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

interface IGiftTransformed extends IGiftItem {
    markupInStars: number
    markupInTon: number
}


// 90⭐ = 1.17 USDT → 1⭐ = 1.17 / 90 USDT
const STAR_PRICE_USDT = 0.015
const STARS_PRICE_PER_GIFT = 90;
const STARS_EQUIVALENT_FOR_TON = 75;

// UQD4mAJ7e_fD9bGQvn6d6oQ8Vh948GnFf_XbKSpJ2u5wqYuT
const addressToSend = "UQC2-_V9_-xc262zUdaxxIyxyWeWgWQbJOM4Ud2MVJQmWVpF"

const MainPage: React.FC = observer(() => {
    const { userStore } = useStore();
    const [selectedGift, setSelectedGift] = useState<IGiftTransformed | null>(null);
    const [recipientUsername, setRecipientUsername] = useState("");
    const [giftsValue, setGiftsValue] = useState<number | null>(1);
    const [giftMessage, setGiftMessage] = useState<string>("");
    const [tonConnectUI] = useTonConnectUI();
    const [isWalletConnected, setIsWalletConnected] = useState<boolean>(tonConnectUI.connected);
    const [globalConfig, setGlobalConfig] = useState<IGlobalConfig | null>(null);

    const [gifts, setGifts] = useState<IGiftTransformed[]>([])


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

    // useMemo(() => {
    //     WebApp.onEvent("invoiceClosed", async () => {
    //         setTimeout(() => {
    //             toast.success('Пополнение успешно');
    //             setSelectedGift(null)
    //         }, 1000);
    //     });
    // }, []);

    useEffect(() => {
        const load = async () => {
            const data = await onRequest(AdminService.getGlobalConfig());
            if (data) {
                setGlobalConfig(data);

                if (!data.tonRateInUsd) {
                    toast.error("Ошибка получения курса")
                    return
                }

                const t: IGiftTransformed[] = GIFTS_DATA.map(g =>
                ({
                    ...g,
                    // фиксированная цена подарка в звёздах
                    markupInStars: STARS_PRICE_PER_GIFT,
                    // цена в TON через USDT: сначала считаем USDT за 75⭐, затем конвертируем в TON
                    markupInTon: (STARS_EQUIVALENT_FOR_TON * STAR_PRICE_USDT) / Number(data.tonRateInUsd)
                }))

                console.log(t)
                setGifts(t)

            }
        };
        load();
    }, []);

    const onBuyGiftTon = async () => {

        if (!selectedGift) {
            toast.error("Нет выбранного подарка")
            return
        }

        if (!giftsValue) {
            toast.error("Неправильное количество")
            return
        }

        const { markupInStars, markupInTon, id } = selectedGift
        const totalStars = markupInStars * giftsValue;
        const totalTon = markupInTon * giftsValue;
        const username = recipientUsername.trim().replace("@", "");

        console.log(markupInTon)

        if (!tonConnectUI) {
            toast.error('TonConnectUI не подключен');
            return;
        }
        if (!globalConfig?.tonRateInUsd) {
            toast.error('Не задан курс TON в USDT (настройте в админке)');
            return;
        }
        if (!markupInStars || markupInTon <= 0) {
            toast.error('Не удалось рассчитать цену в TON');
            return;
        }

        const data = await onRequest(UserService.getUserTelegramData(username));
        console.log(data, 'data')

        if (!data) {
            toast.error("Такого аккаунта нет. Возможно это канал или группа")
            return;
        }


        const comment = generateMemo();
        const recipient = recipientUsername.trim().replace("@", "");
        const payload = beginCell()
            .storeUint(0, 32) // opcode для текстового комментария
            .storeStringTail(comment)
            .endCell()
            .toBoc()
            .toString('base64');


        const transaction: SendTransactionRequest = {
            validUntil: Math.floor(Date.now() / 1000) + 300,

            messages: [
                {
                    address: addressToSend, // Куда придут деньги
                    amount: toNano(totalTon.toFixed(9)).toString(), // Конвертация в нанотоны
                    payload: payload // Payload с комментарием в формате base64,

                }
            ],
        };

        try {
            const result = await tonConnectUI.sendTransaction(transaction);
            console.log("Транзакция отправлена:", result.boc);

            const data = await onRequest(UserService.sendDepositData({
                boc: result.boc,
                username,
                giftId: id,
                giftAmount: giftsValue,
                amountInStars: totalStars,
                amountInTon: totalTon,
                memo: comment,
                message: giftMessage || undefined,
            }));
            console.log(data, 'data')

            if (data) {

            }

            toast.success("Платеж отправлен! Ожидайте зачисления.");
            setRecipientUsername("");
            setSelectedGift(null);
        } catch (e) {
            console.error("Ошибка при оплате:", e);
        }
    };

    const onBuyGiftStars = async () => {
        if (!selectedGift) {
            toast.error("Нет выбранного подарка")
            return
        }

        if (!giftsValue) {
            toast.error("Неправильное количество")
            return
        }

        const { markupInStars, markupInTon, id } = selectedGift
        const username = recipientUsername.trim().replace("@", "");
        const totalStars = markupInStars * giftsValue;

        if (!testIsUsername(username)) {
            toast.error("Введите корректный @username получателя")
            return;
        }

        const data = await onRequest(
            UserService.getInvoiceLink(
                { username, giftsValue, amount: totalStars, giftId: id, message: giftMessage || undefined },
                "stars"
            )
        );

        const invoiceLink = data.invoiceLink;
        (window as any).Telegram.WebApp.openInvoice(invoiceLink);

        setSelectedGift(null)
    };


    return (
        <PageContainer title="Доступные Подарки" itemsStart loading={false}>
            <Block variant="transparent" title="" className="">
                <div className="grid grid-cols-2 md:grid-cols-3 w-full gap-3 sm:gap-4">
                    {gifts.map((g) => (
                        <Block
                            key={g.id}
                            className="gap-2 !rounded-3xl !h-full items-center cursor-pointer transition-opacity hover:opacity-90"
                            onClick={() => setSelectedGift(g)}
                        >
                            <div className="relative w-full max-w-[160px] mx-auto aspect-square rounded-3xl overflow-hidden bg-gray-700/40 flex items-center justify-center">
                                <img
                                    src={g.image}
                                    alt={g.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex flex-col items-center w-full">
                                <h3 className="text-sm font-bold text-gray-200 text-center">
                                    {g.title}
                                </h3>


                                <ShowStars value={g.markupInStars} />

                                <ShowStars type="ton" value={g.markupInTon} />
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

                        <div className="flex flex-col gap-3">
                            {/* <span className="text-sm font-bold text-gray-400 text-left">
                                Кому отправить подарок
                            </span> */}
                            <div className="flex items-center gap-2">
                                <input
                                    name="recipientUsername"
                                    placeholder="Кому отправить подарок"
                                    value={recipientUsername}
                                    onChange={(e) => setRecipientUsername(e.target.value)}
                                    className="w-full px-4 py-2 bg-app-card border border-app-border rounded-lg text-white
                                               focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50
                                               hover:border-gray-500/50 font-bold"
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

                            <input
                                name="giftsValue"
                                placeholder="Количество подарков"
                                type="number"
                                step={1}
                                min={0}
                                value={giftsValue ?? ""}
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === '') {
                                        setGiftsValue(null);
                                        return;
                                    }
                                    const parsed = Number(raw);
                                    // if (Number.isNaN(parsed) || parsed <= 0) {
                                    //     setGiftsValue(1);
                                    //     return;
                                    // }
                                    setGiftsValue(Math.floor(parsed));
                                }}
                                className="w-full px-4 py-2 bg-app-card border border-app-border rounded-lg text-white
                                               focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50
                                               hover:border-gray-500/50 font-bold"
                            />

                            <input
                                name="giftMessage"
                                placeholder="Комментарий к подарку (необязательно)"
                                value={giftMessage}
                                onChange={(e) => setGiftMessage(e.target.value)}
                                maxLength={200}
                                className="w-full px-4 py-2 bg-app-card border border-app-border rounded-lg text-white
                                               focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50
                                               hover:border-gray-500/50 font-bold"
                            />
                        </div>


                        <div className="flex flex-col gap-2">
                            <Button
                                text={<ShowStars variant={testIsUsername(recipientUsername) ? "dark" : "light"} text="Оплатить в звёздах" value={giftsValue ? selectedGift.markupInStars * giftsValue : 0} />}
                                color="gold"
                                disabled={!testIsUsername(recipientUsername) || (giftsValue == null || giftsValue < 1 || giftsValue > 10)}
                                FC={onBuyGiftStars}
                            />

                            {isWalletConnected ? (
                                <Button
                                    text={<ShowStars type="ton" text="Оплатить в TON" value={giftsValue ? selectedGift.markupInTon * giftsValue : 0} />}
                                    color="blue"
                                    disabled={!testIsUsername(recipientUsername) || (giftsValue == null || giftsValue < 1 || giftsValue > 10)}
                                    FC={onBuyGiftTon}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <Button
                                        text="Подключить кошелек для оплаты TON"
                                        color="blue"
                                        FC={() => tonConnectUI.openModal()}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </PageContainer>
    );
});

export default MainPage;