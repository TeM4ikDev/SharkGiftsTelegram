import { AdminService } from "@/services/admin.service";
import { FormConfig } from "@/types/form";
import type { IGlobalConfig } from "@/types";
import { onRequest } from "@/utils/handleReq";
import { Crown, DollarSign, InfoIcon, MessageCircle, Plus, Settings as SettingsIcon, Star, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { PageContainer } from "../../layout/PageContainer";
import { Block } from "../../ui/Block";
import { Button } from "../../ui/Button";
import { Form } from "../../ui/Form";
import { Input } from "../../ui/Input";

type GlobalConfig = Partial<IGlobalConfig> & {
    // legacy/optional поля (могут приходить с бэка в старом формате)
    usdToRubRate?: number;
    buyStarsRateInRub?: number;
    sellStarsRateInRub?: number;
    buyTonRateInRub?: number;
    premiumPrice3Months?: number;
    premiumPrice6Months?: number;
    premiumPrice12Months?: number;
    referralPercent?: number | string;
    channelsToSubscribe?: string[];
    supportUsername?: string | null;
    minStarsToBuy?: number;
    minStarsToSell?: number;
};

const STAR_USDT_RATE = 0.015;
const BASE_GIFT_PRICE_STARS = 100;

export const Settings: React.FC = () => {
    const [config, setConfig] = useState<GlobalConfig | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const getSettings = async () => {
        setIsLoading(true);
        const data = await onRequest(AdminService.getGlobalConfig());
        console.log(data, 'data')
        if (data) {
            setConfig(data);
            // Преобразуем channelsToSubscribe из JSON массива в обычный массив
            // if (data.channelsToSubscribe && Array.isArray(data.channelsToSubscribe)) {
            //     setChannels(data.channelsToSubscribe);
            // } else {
            //     setChannels([]);
            // }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getSettings();
    }, []);

  

    const giftsPricingConfig: FormConfig = {
        input: [
            {
                name: "giftMarkupInStars",
                label: "Наценка на подарок (звёзд)",
                placeholder: "Например: 25",
                required: true,
                type: "number",
                step: 1
            }
        ]
    };
   

    // const otherSettingsConfig: FormConfig = {
    //     input: [
    //         {
    //             name: "referralPercent",
    //             label: "Процент реферальной программы (%)",
    //             placeholder: "Процент реферальной программы (%)",
    //             required: true,
    //             type: "number",
    //             step: 0.1
    //         },
    //         {
    //             name: "supportUsername",
    //             label: "Username поддержки",
    //             placeholder: "Username поддержки",
    //             required: false,
    //             type: "text"
    //         },
    //         {
    //             name: "minStarsToBuy",
    //             label: "Минимальное количество звезд для покупки",
    //             placeholder: "Минимальное количество звезд для покупки",
    //             required: true,
    //             type: "number"
    //         },
    //         {
    //             name: "minStarsToSell",
    //             label: "Минимальное количество звезд для продажи",
    //             placeholder: "Минимальное количество звезд для продажи",
    //             required: true,
    //             type: "number"
    //         }
    //     ]
    // };

    const handleSubmit = async (values: any) => {
        const submitData: any = {};

        // Обрабатываем только те поля, которые есть в values
        if (values.buyStarsRateInRub !== undefined) {
            submitData.buyStarsRateInRub = parseFloat(values.buyStarsRateInRub);
        }
        if (values.sellStarsRateInRub !== undefined) {
            submitData.sellStarsRateInRub = parseFloat(values.sellStarsRateInRub);
        }
        if (values.buyTonRateInRub !== undefined) {
            submitData.buyTonRateInRub = parseFloat(values.buyTonRateInRub);
        }
        if (values.tonRateInUsd !== undefined) {
            submitData.tonRateInUsd = String(values.tonRateInUsd);
        }
        if (values.giftMarkupInStars !== undefined) {
            submitData.giftMarkupInStars = parseInt(values.giftMarkupInStars);
        }
        if (values.premiumPrice3Months !== undefined) {
            submitData.premiumPrice3Months = parseFloat(values.premiumPrice3Months);
        }
        if (values.premiumPrice6Months !== undefined) {
            submitData.premiumPrice6Months = parseFloat(values.premiumPrice6Months);
        }
        if (values.premiumPrice12Months !== undefined) {
            submitData.premiumPrice12Months = parseFloat(values.premiumPrice12Months);
        }
        if (values.referralPercent !== undefined) {
            submitData.referralPercent = parseFloat(values.referralPercent);
        }
        if (values.supportUsername !== undefined) {
            submitData.supportUsername = (values.supportUsername).replace("@", "") || null;
        }
        if (values.minStarsToBuy !== undefined) {
            submitData.minStarsToBuy = parseInt(values.minStarsToBuy);
        }
        if (values.minStarsToSell !== undefined) {
            submitData.minStarsToSell = parseInt(values.minStarsToSell);
        }

        const data = await onRequest(AdminService.updateSettings(submitData));
        if (data) {
            toast.success("Настройки успешно обновлены");
            // getSettings();
        }
    };

    

    return (
        <PageContainer className="gap-4 !items-start" loading={isLoading} itemsStart>

            <Block title="Информация" variant="darker" icons={[<InfoIcon />]}>
            {config && (    
                <div>
                   
                    {config?.tonRateInUsd != null && (
                        <p>1 TON = {Number(config.tonRateInUsd).toFixed(4)} USDT</p>
                    )}
                    {/* {config?.tonRateInUsd != null && config?.giftMarkupInStars != null && (
                        <p>
                            Подарок: {BASE_GIFT_PRICE_STARS} + {Number(config.giftMarkupInStars)} ={" "}
                            {BASE_GIFT_PRICE_STARS + Number(config.giftMarkupInStars)} ⭐ →{" "}
                            {((BASE_GIFT_PRICE_STARS + Number(config.giftMarkupInStars)) * STAR_USDT_RATE).toFixed(3)} USDT →{" "}
                            {(((BASE_GIFT_PRICE_STARS + Number(config.giftMarkupInStars)) * STAR_USDT_RATE) / Number(config.tonRateInUsd)).toFixed(4)} TON
                        </p>
                    )} */}
                </div>
                )}
            </Block>

            {config && (
                <>
                    {/* <Form
                        config={starsConfig}
                        message="Курсы звезд обновлены"
                        onSubmit={handleSubmit}
                        initialValues={{
                            buyStarsRateInRub: config.buyStarsRateInRub,
                            sellStarsRateInRub: config.sellStarsRateInRub
                        }}
                        title="Курсы звезд"
                        icons={[<Star className="w-6 h-6 text-yellow-400" />]}
                        variant="lighter"
                        isCollapsedInitially={false}
                        canCollapse={false}
                    /> */}

                    {/* <Form
                        config={tonConfig}
                        message="Курс TON обновлен"
                        onSubmit={handleSubmit}
                        initialValues={{
                            buyTonRateInRub: config.buyTonRateInRub
                        }}
                        title="Курс TON"
                        icons={[<DollarSign className="w-6 h-6 text-blue-400" />]}
                        variant="lighter"
                        isCollapsedInitially={false}
                        canCollapse={false}
                    /> */}

                    

                    <Form
                        config={giftsPricingConfig}
                        message="Наценка обновлена"
                        onSubmit={handleSubmit}
                        initialValues={{
                            giftMarkupInStars: config.giftMarkupInStars || ""
                        }}
                        title="Подарки"
                        icons={[<Star className="w-6 h-6 text-yellow-400" />]}
                        variant="lighter"
                        isCollapsedInitially={false}
                        canCollapse={false}
                    />


                    
                </>
            )} 
        </PageContainer>
    );
};

