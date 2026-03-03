import { PageContainer } from "@/components/layout/PageContainer";
import { Block } from "@/components/ui/Block";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useStore } from "@/store/root.store";
import { ArrowRight, Copy, Diamond, Gift, Plus, Star, Wallet } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { data, useNavigate } from "react-router-dom";

import star from "@/assets/star.webp";
import { UserService } from "@/services/user.service";
import { onRequest } from "@/utils/handleReq";
import { toast } from "react-toastify";

import { AdminService } from "@/services/admin.service";
import { DepositType, IGlobalConfig } from "@/types";
import { fromNano } from "@ton/core";
import { Address, TonClient } from "@ton/ton";
import WebApp from "@twa-dev/sdk";
import { useEffect, useState } from "react";




interface PaymentMethod {
    icon: typeof Star;
    label: string;
    key: DepositType;
}

import { SendTransactionRequest, TonConnectUI, useTonAddress, useTonWallet } from '@tonconnect/ui-react';

import { Input } from "@/components/ui/Input";
import { ShowStars } from "@/components/ui/ShowStars";
import { Tabs } from "@/components/ui/Tabs";
import { GiftService } from "@/services/gift.service";
import { beginCell, toNano } from '@ton/core';
import { useTonConnectUI } from '@tonconnect/ui-react';

const generateMemo = (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export const DepositTon = async ({
    amountInTon,
    amountInStars,
    userId,
    tonConnectUI
}: {
    amountInTon: number;
    amountInStars: number;
    userId: string | undefined;
    tonConnectUI: TonConnectUI;
}) => {
    if (!userId) {
        toast.error('Ошибка при получении ID пользователя');
        return;
    }

    const comment = generateMemo();
    const payload = beginCell()
        .storeUint(0, 32) // opcode для текстового комментария
        .storeStringTail(comment) // текст комментария
        .endCell()
        .toBoc()
        .toString('base64');


    const transaction: SendTransactionRequest = {
        validUntil: Math.floor(Date.now() / 1000) + 300,

        messages: [
            {
                address: "UQC2-_V9_-xc262zUdaxxIyxyWeWgWQbJOM4Ud2MVJQmWVpF", // Куда придут деньги
                amount: toNano(amountInTon).toString(), // Конвертация в нанотоны
                payload: payload // Payload с комментарием в формате base64,

            }
        ],
    };

    // const data = await onRequest(UserService.sendDepositData({ boc: "te6cckEBAgEA7QAB4YgAsL1N0xvRToZYE3Ch34uqsyluB7kchUfEwkpJH77BxaoD8rWpAolrNov5hoYgbc4+YlZEvPy2mjYpicvnycNRX+XQeCIjbsi8EwFwy4vNEuUxrdGEf97iJzsc+WOWImPYeU1NGLtLxUoIAAAESAAcAQDuQgBbffq+//YubdbZqOtY4kZY5LPLQLINknGcKO7GKkoTLKAX14QAAAAAAAAAAAAAAAAAAAAAAAB7InVzZXJJZCI6IjUzMTdkNWUxLTJhNGYtNDQwOC1iMjVjLTcwMjNhMDE5ZTg4OCIsImFtb3VudCI6MC4wNX0aNZTK", amountInStars, amountInTon }));
    // if (!data) return;


    try {
        const result = await tonConnectUI.sendTransaction(transaction);
        console.log("Транзакция отправлена:", result.boc);

        const data = await onRequest(UserService.sendDepositData({ boc: result.boc, amountInStars, amountInTon, memo: comment }));
        console.log(data, 'data')

        if (data) {

        }

        // await fetch('/api/payment/verify', {
        //     method: 'POST',
        //     body: JSON.stringify({ hash: result.boc })
        // });

        toast.loading("Платеж отправлен! Ожидайте зачисления.");
    } catch (e) {
        console.error("Ошибка при оплате:", e);
    }
};


export const WalletStatus = () => {
    const wallet = useTonWallet();
    const userFriendlyAddress = useTonAddress();
    const rawAddress = useTonAddress(false);
    const [tonConnectUI] = useTonConnectUI();

    const [walletBalance, setWalletBalance] = useState<string>("0.00");
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Получаем баланс из сети TON, если кошелек подключен
    useEffect(() => {
        if (rawAddress) {
            const client = new TonClient({
                endpoint: "https://toncenter.com/api/v2/jsonRPC",
            });
            if (client) {
                client.getBalance(Address.parse(rawAddress)).then((b) => {
                    setWalletBalance(Number(fromNano(b)).toFixed(2));
                });
            }
        }
    }, [rawAddress]);



    const handleDisconnect = () => {
        tonConnectUI.disconnect();
        setIsModalOpen(false);
    };

    const handleCopyAddress = () => {
        if (userFriendlyAddress) {
            navigator.clipboard.writeText(userFriendlyAddress);
            toast.success('Адрес скопирован');
        }
    };

    return (
        <>
            <div className="w-full  mx-auto px-4 py-3 bg-[#2c2c2e] rounded-t-2xl flex justify-between items-center text-sm font-sans">
                {/* Левая часть: Иконка + Статус/Адрес */}
                <div className="flex items-center gap-2 text-[#929298]">
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                        <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                        <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
                    </svg>

                    {wallet ? (
                        <span className="truncate">
                            Ваш кошелёк {userFriendlyAddress.slice(0, 4)}...{userFriendlyAddress.slice(-4)}
                        </span>
                    ) : (
                        <span>Кошелёк не подключён</span>
                    )}
                </div>

                {/* Правая часть: Баланс или Кнопка подключения */}
                {wallet ? (
                    <div
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-1 text-white font-bold cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        <span>{walletBalance} TON</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </div>
                ) : (
                    <button
                        onClick={() => tonConnectUI.openModal()}
                        className="text-white font-bold hover:text-blue-400 transition-colors"
                    >
                        Подключить +
                    </button>
                )}
            </div>

            {/* Модальное окно с информацией о кошельке */}
            <Modal
                isOpen={isModalOpen}
                setIsOpen={setIsModalOpen}
                title="Ваш кошелёк"
            >
                <div className="flex flex-col gap-4">
                    {/* Баланс */}
                    <div className="flex flex-col gap-1">
                        <div className="text-sm text-gray-400">Баланс</div>
                        <div className="text-4xl font-bold text-white">{walletBalance} TON</div>
                    </div>

                    {/* Адрес кошелька */}
                    <div className="bg-app-cardLight rounded-xl p-4 border border-gray-700">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Wallet className="w-6 h-6 text-blue-500 flex-shrink-0" />
                                <div className="flex flex-col min-w-0 flex-1">
                                    <div className="text-white font-medium truncate">
                                        {userFriendlyAddress}
                                    </div>
                                    <div className="text-xs text-gray-400">Адрес</div>
                                </div>
                            </div>
                            <button
                                onClick={handleCopyAddress}
                                className="p-2 rounded-lg bg-app-card hover:bg-app-darker transition-colors flex-shrink-0"
                                title="Копировать адрес"
                            >
                                <Copy className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
                            </button>
                        </div>
                    </div>

                    {/* Кнопка отключения */}
                    <Button
                        text="Отключить кошелёк"
                        FC={handleDisconnect}
                        color="red"
                        className="w-full py-3"
                    />
                </div>
            </Modal>
        </>
    );
};

const minAmount = 5;
const quickAddAmounts = [50, 200, 1000];
const accountGiftTag = "help_pablo"
const LAST_DEPOSIT_METHOD_KEY = "csb:last_deposit_method";

interface DepositHistoryItem {
    id: string;
    userId: string;
    amountInStars: number | null;
    status: string;
    type: DepositType | "GIFTS";
    createdAt: string;
    updatedAt: string;
    source?: string;
    title?: string;
    giftId?: string;
}

const TopUpPage: React.FC = observer(() => {
    const { userStore: { user, updateUserBalance } } = useStore();
    const navigate = useNavigate();
    const [tonConnectUI] = useTonConnectUI();
    const [amount, setAmount] = useState<number>(100);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<DepositType>(() => {
        if (typeof window === "undefined") return DepositType.STARS;
        const stored = window.localStorage.getItem(LAST_DEPOSIT_METHOD_KEY) as DepositType | null;
        if (stored && Object.values(DepositType).includes(stored)) {
            return stored;
        }
        return DepositType.STARS;
    });
    const [giftLink, setGiftLink] = useState<string>('');
    const [giftInfo, setGiftInfo] = useState<any>(null);
    const [isLoadingGift, setIsLoadingGift] = useState<boolean>(false);
    const [depositHistory, setDepositHistory] = useState<DepositHistoryItem[]>([]);
    const [globalConfig, setGlobalConfig] = useState<IGlobalConfig | null>(null);


    useMemo(() => {
        WebApp.onEvent("invoiceClosed", async () => {
            setTimeout(() => {
                // toast.success('Пополнение успешно');
                updateUserBalance().catch(console.error);
            }, 1000);
        });
    }, []);



    const paymentMethods: PaymentMethod[] = [
        {
            icon: Star,
            label: "STARS",
            key: DepositType.STARS
        },
        {
            icon: Diamond,
            label: "CRYPTOBOT",
            key: DepositType.CRYPTOBOT
        },

        {
            icon: Gift,
            label: "GIFT",
            key: DepositType.GIFTS
        },

        {
            icon: Wallet,
            label: "Wallet",
            key: DepositType.TON
        }
    ];

    const getGlobalConfig = async () => {
        const data = await onRequest(AdminService.getGlobalConfig());
        if (data) {
            setGlobalConfig(data);
        }
    }

    useEffect(() => {
        getGlobalConfig();
    }, []);


    const getDepositHistory = async () => {
        const res = await onRequest(UserService.getDepositHistory(selectedPaymentMethod, 10, 1));
        if (res) {
            setDepositHistory(res.data || []);
        }
    }

    useEffect(() => {
        getDepositHistory();
    }, [selectedPaymentMethod, ]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(LAST_DEPOSIT_METHOD_KEY, selectedPaymentMethod);
    }, [selectedPaymentMethod]);

    const handleQuickAdd = (addAmount: number) => {
        setAmount(prev => prev + addAmount);
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '') {
            setAmount(0);
            return;
        }
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 0) {
            setAmount(numValue);
        }
    };

    const handleTopUp = async () => {
        const data = await onRequest(UserService.topupBalance(selectedPaymentMethod, amount));
        if (data) {
            toast.success('Пополнение успешно');
            navigate('/profile');
        }
    }


    const getInvoiceLink = async () => {

        if (!data) {
            toast.error('Ошибка при получении ссылки на оплату');
            return;
        }

        if (!globalConfig) {
            toast.error('Ошибка при получении глобальной конфигурации');
            return;
        }

        switch (selectedPaymentMethod) {
            case DepositType.STARS: {
                const data = await onRequest(UserService.getInvoiceLink(amount, "stars"));

                const invoiceLink = data.invoiceLink;
                (window as any).Telegram.WebApp.openInvoice(invoiceLink);
                break;
            }
            case DepositType.CRYPTOBOT: {
                // const amountWithCommission = (amount * Number(globalConfig.starRateInUsd)) / 0.97;
                const data = await onRequest(UserService.getInvoiceLink(amount, "cryptobot"));

                if (data) {
                    const invoiceLink = data.invoiceLink;
                    (window as any).Telegram.WebApp.openLink(invoiceLink);
                }
                break;
            }
            case DepositType.TON: {
                await DepositTon({ amountInTon: (amount * Number(globalConfig.starRateInTon)), amountInStars: amount, userId: user?.id, tonConnectUI });
                break;
            }
        }
    }

    const PaymentInfo = () => {
        const renderContent = {
            [DepositType.STARS]: (
                <>
                    <img src={star} alt="Stars" className="w-7 h-7" />
                    <span className="text-sm text-white">1 ЗВЕЗДА = 1 TELEGRAM STARS</span>
                </>
            ),
            [DepositType.CRYPTOBOT]: (
                <>
                    <img src={star} alt="Stars" className="w-7 h-7" />
                    <span className="text-sm text-white">
                        1 ЗВЕЗДА = {globalConfig?.starRateInUsd} USDT
                    </span>
                </>
            ),
            [DepositType.TON]: (
                <>
                    <img src={star} alt="Stars" className="w-7 h-7" />
                    <span className="text-sm text-white">1 ЗВЕЗДА = {globalConfig?.starRateInTon} TON</span>
                </>
            )
        };

        return (
            <Block variant="lighter" className="flex !w-min  text-nowrap !shadow-lg !shadow-black/50 font-bold justify-center !flex-row items-center gap-3 !py-1 px-7 !rounded-full">
                {renderContent[selectedPaymentMethod as keyof typeof renderContent]}
            </Block>
        );
    };

    const ButtonPaymentInfo = () => {

        const renderContent = {
            [DepositType.STARS]: (
                <>
                    <p>{(amount).toFixed(2)} Stars</p>

                </>
            ),
            [DepositType.CRYPTOBOT]: (
                <>
                    <p>{((amount * Number(globalConfig?.starRateInUsd)) / 0.97).toFixed(2)} USDT</p>

                </>
            ),
            [DepositType.TON]: (
                <>
                    <p>{(amount * Number(globalConfig?.starRateInTon)).toFixed(2)} TON</p>

                </>
            )
        };
        return (
            <div className="flex items-center gap-2 text-base">
                <p>Оплатить</p>
                {renderContent[selectedPaymentMethod as keyof typeof renderContent]}
            </div>
        );
    };


    return (
        <PageContainer itemsStart loading={false} className="">
            {/* <div className="flex flex-col gap-2 w-full">
                <div className="grid grid-cols-2 gap-2 flex-wrap">
                    {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        const isSelected = selectedPaymentMethod === method.key;
                        const iconColor = method.key === 'crypto' ? 'text-blue-500' : 'text-gold-500';

                        return (
                            <Button
                                key={method.key}
                                text={method.label}
                                // FC={() => getInvoiceLink()}
                                FC={() => setSelectedPaymentMethod(method.key)}
                                color="transparent"
                                className={cn(
                                    "w-min min-w-32 !text-lg flex-1",
                                    isSelected
                                        ? "!border-gold-500 !bg-app-cardLight"
                                        : "!border-app-border"
                                )}
                                icon={<Icon className={`w-5 h-5 flex-shrink-0  ${iconColor}`} />}
                            />
                        );
                    })}
                </div>
            </div> */}


            <Tabs
                tabs={paymentMethods.map((method) => ({ label: method.label, value: method.key as string }))}
                activeTab={selectedPaymentMethod}
                onChange={(value) => setSelectedPaymentMethod(value as DepositType)}
                gridCols={2}
            />

            {selectedPaymentMethod === DepositType.GIFTS && (
                <>
                    {/* Предупреждение */}
                    <Block variant="lighter" className="p-4 border-red-500/50 bg-red-500/15">
                        <div className="text-[13px] sm:text-sm font-extrabold leading-relaxed text-red-300 text-center">
                            Важно: не дарите подарки с Telegram-маркета.
                            <br />
                            Отправляйте подарок только напрямую со своего аккаунта.
                        </div>
                    </Block>
                    {globalConfig?.sellGiftCommissionPercent && (
                        <>
                            <Block title="Введите ссылку на подарок" className="gap-3">
                                <div className="flex flex-col gap-3">
                                    <Input
                                        name="giftLink"
                                        value={giftLink}
                                        placeholder="https://t.me/nft/DeskCalendar-31294"
                                        showClearButton={true}
                                        onClear={() => setGiftLink("")}
                                        showTopPlaceholder={false}
                                        onChange={(e) => setGiftLink(e.target.value.trim())}
                                    // icon={<Link className="w-4 h-4" />}
                                    />
                                    <Button
                                        text={isLoadingGift ? "ЗАГРУЗКА..." : "ПОЛУЧИТЬ ИНФОРМАЦИЮ О ПОДАРКЕ"}
                                        FC={async () => {
                                            if (!giftLink) {
                                                toast.error('Введите ссылку на подарок');
                                                return;
                                            }
                                            setIsLoadingGift(true);
                                            try {
                                                const data = await onRequest(GiftService.getMarketGift(giftLink));
                                                if (data) {
                                                    setGiftInfo(data);
                                                    toast.success('Информация о подарке получена');
                                                }
                                            } catch (error: any) {
                                                toast.error(error?.response?.data?.message || 'Ошибка при получении информации о подарке');
                                                setGiftInfo(null);
                                            } finally {
                                                setIsLoadingGift(false);
                                            }
                                        }}
                                        color="gold"
                                        className="py-3"
                                        disabled={isLoadingGift || !giftLink}
                                    />
                                </div>
                                {giftInfo && (
                                    <Block variant="lighter" title="Информация о подарке">
                                        {giftInfo.name && <div><span className="text-gray-400">Название:</span> {giftInfo.name}</div>}
                                        {giftInfo.floor_price && <div><span className="text-gray-400">Цена:</span> {giftInfo.floor_price} TON</div>}

                                        {giftInfo.floor_price && <ShowStars text="Цена в звездах:" value={Number(giftInfo.floor_price / Number(globalConfig?.starRateInTon)) * (1 + globalConfig?.sellGiftCommissionPercent / 100)} />}

                                    </Block>
                                )}
                            </Block>


                            <Block title="Как это работает" className="gap-3 p-3" icons={[<Gift className="w-4 h-4 stroke-[3.5] text-gold-500" />]}>
                                <ol className="flex font-bold flex-col gap-2 text-sm sm:text-[15px] leading-relaxed text-gray-100 list-decimal list-outside pl-5">
                                    <li>
                                        Перейдите в личные сообщения{" "}
                                        <br />
                                        <a
                                            href={`https://t.me/${accountGiftTag}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-200 font-extrabold underline underline-offset-4 break-all"
                                        >
                                            @{accountGiftTag}
                                        </a>
                                    </li>
                                    <li>
                                        Отправьте подарок напрямую со своего аккаунта
                                    </li>
                                    <li>
                                        Мы оцениваем подарок по floor-цене на маркетах и конвертируем стоимость в игровые звезды по текущему курсу
                                    </li>
                                    <li>
                                        После подтверждения вы получаете звезды, а сам подарок автоматически появляется в магазине
                                    </li>
                                </ol>


                                <div className="rounded-xl border border-gold-400/50 bg-gradient-to-br from-gold-500/20 to-gold-500/10 p-5">


                                    {/* <div className="text-sm sm:text-[15px] leading-relaxed text-gold-100/90 space-y-2"> */}


                                    <div className="pt-2 ">
                                        <div className="text-gold-200/80 mb-2 font-medium">Пример:</div>
                                        <div className="flex flex-col gap-2 pl-2">
                                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                                <span className="text-gold-100/70">Подарок оценен в</span>
                                                <ShowStars size="small" text="10 TON =" value={1000} />
                                            </div>
                                            <div className="flex items-center gap-2 text-gold-100/70 text-sm">
                                                <span>→</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-gold-100/70">В магазине будет выставлен за</span>
                                                <ShowStars size="small" value={Number(1000 * (1 + globalConfig.sellGiftCommissionPercent / 100))} />
                                            </div>
                                        </div>
                                    </div>
                                    {/* </div> */}
                                </div>

                            </Block>
                        </>
                    )}

                    {/* Кнопка отправки подарка */}
                    <Button
                        text="ОТПРАВИТЬ ПОДАРОК"
                        // FC={() => window.open('https://t.me/', '_blank')}
                        href={`https://t.me/${accountGiftTag}`}
                        openNewPage={true}
                        color="gold"
                        className="py-4"
                        icon={<ArrowRight className="w-4 h-4 stroke-[3.5]" />}
                    />
                </>
            )}

            {selectedPaymentMethod === DepositType.TON && (
                <>

                    <WalletStatus />
                    {/* <TonConnectButton /> */}

                    {/* <DepositComponent /> */}
                </>
            )}

            {selectedPaymentMethod === DepositType.CRYPTOBOT && (

                <div className="flex flex-col w-full items-center justify-center">
                    <p className="font-bold text-lg text-center text-red-400">! Комиссия за пополнение 3%</p>
                    <p className="text-sm text-center text-gray-400">Комиссия включена в сумму</p>
                </div>
            )}

            {[DepositType.STARS, DepositType.CRYPTOBOT, DepositType.TON].includes(selectedPaymentMethod) && (
                <>
                    <Block className="gap-4 h-min items-center !px-8 !py-5 bg-gradient-to-b from-app-card to-app-cardLight border border-gold-500/30 shadow-lg shadow-black/40" >
                        <div className="text-sm font-bold text-gray-400 uppercase">ВВЕДИТЕ СУММУ</div>

                        <div className="flex items-center justify-center gap-2">
                            <img src={star} alt="Stars" className="w-8 h-8" />
                            <input
                                type="number"
                                value={amount || ''}
                                onChange={handleAmountChange}
                                min="50"
                                className="text-5xl font-bold text-white bg-transparent border-none outline-none w-52 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="0"
                            />

                        </div>

                        <PaymentInfo />
                    </Block>

                    <div className="flex gap-2 w-full">
                        {quickAddAmounts.map((addAmount) => (
                            <Button
                                key={addAmount}
                                text={`${addAmount}`}
                                FC={() => handleQuickAdd(addAmount)}
                                color="transparent"
                                className="py-3 !text-lg bg-app-card/60 hover:bg-app-cardLight border border-app-border/80"
                                icon={<Plus className="w-5 h-5 stroke-[3.5]" />}
                            />
                        ))}
                    </div>

                    <Button
                        text={<ButtonPaymentInfo />}
                        FC={() => getInvoiceLink()}
                        disabled={amount < minAmount}
                        color="gold"
                        className="py-4"
                    />
                </>
            )}
            
            {/* История пополнений */}
            <Block
                className="gap-4 mt-4"
                title="ИСТОРИЯ ПОПОЛНЕНИЙ"
                subtitle="Последние операции пополнения"
                icons={[<Wallet key="wallet" className="w-4 h-4 stroke-[3.5] text-gold-500" />]}
            >
                {depositHistory.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-3">
                        История пополнений пока пуста.
                    </p>
                ) : (
                    <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[360px] border-collapse">
                            <thead>
                                <tr className="border-b border-app-border/80 bg-black/10">
                                    <th className="py-2 pr-2 text-xs font-semibold uppercase text-white/60 text-left">
                                        Дата
                                    </th>
                                    <th className="py-2 pr-2 text-xs font-semibold uppercase text-white/60 text-left">
                                        Метод
                                    </th>
                                    <th className="py-2 pr-2 text-xs font-semibold uppercase text-white/60 text-right">
                                        Сумма
                                    </th>
                                    <th className="py-2 text-xs font-semibold uppercase text-white/60 text-right">
                                        Статус
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {depositHistory.map((item) => {
                                    const date = new Date(item.createdAt).toLocaleString("ru-RU", {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                    });

                                    const isGift = item.type === "GIFTS";
                                    const methodLabel =
                                        item.type === DepositType.STARS
                                            ? "Stars"
                                            : item.type === DepositType.CRYPTOBOT
                                            ? "Cryptobot"
                                            : item.type === DepositType.TON
                                            ? "TON"
                                            : isGift
                                            ? "Продажа подарка"
                                            : String(item.type);

                                    const amount = item.amountInStars;

                                    let statusClass = "bg-app-cardLight text-gray-300 border-app-border";
                                    if (item.status === "COMPLETED") {
                                        statusClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
                                    } else if (item.status === "PENDING") {
                                        statusClass = "bg-amber-500/20 text-amber-300 border-amber-500/40";
                                    } else if (item.status === "FAILED" || item.status === "CANCELED") {
                                        statusClass = "bg-red-500/20 text-red-400 border-red-500/40";
                                    }

                                    return (
                                        <tr
                                            key={item.id}
                                            className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.03] transition-colors"
                                        >
                                            <td className="py-2 pr-2 text-sm text-gray-300 whitespace-nowrap">
                                                {date}
                                            </td>
                                            <td className="py-2 pr-2 text-sm text-gray-100">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{methodLabel}</span>
                                                    {isGift && item.title && (
                                                        <span className="text-[11px] text-white/40 truncate">
                                                            {item.title}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-2 pr-2 text-right text-sm font-semibold">
                                                {amount != null ? (
                                                    <div className="inline-flex items-center justify-end gap-1 text-gold-300">
                                                        <img src={star} alt="Stars" className="w-4 h-4" />
                                                        <span>{amount.toFixed(2)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-white/40">—</span>
                                                )}
                                            </td>
                                            <td className="py-2 text-right">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusClass}`}
                                                >
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Block>

        </PageContainer>
    );
});

export default TopUpPage;
