import { useStore } from "@/store/root.store"
import { cn } from "@/utils/cn"
import { motion } from "framer-motion"
import { ArrowLeft, LogOut } from "lucide-react"
import React, { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Block } from "../ui/Block"
import { Button } from "../ui/Button"
import { Loader } from "./Loader"

interface PageContainerProps {
    title?: string
    children: ReactNode
    className?: string
    returnPage?: boolean
    loading?: boolean
    itemsStart?: boolean,
    needAuth?: boolean
}

export const PageContainer: React.FC<PageContainerProps> = ({ title, children, className, returnPage = false, loading = false, itemsStart = false, needAuth = false }) => {
    const navigate = useNavigate()
    const { userStore: { user, isLoading } } = useStore()

    if (needAuth && !user && !isLoading) {
        return (
            <PageContainer itemsStart>
                <Block  
                    title="Вы не авторизованы"
                    icons={[<LogOut />]}
                    className="!max-w-[500px] mt-10 p-5 gap-5"
                    variant="darker"
                    titleCenter
                    mediumTitle
                >
                    <Button text="На главную" routeKey="HOME" />
                </Block>
            </PageContainer>
        )
    }

    return (
        <motion.section
            initial={{ opacity: 0,  }}
            animate={{ opacity: 1,  }}
            exit={{ opacity: 0,  }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ willChange: 'opacity' }}
            className={cn(
                "flex flex-col *:w-full w-full max-w-[600px] mx-auto  flex-1 min-h-min md:px-4 z-10 p-2 gap-1 items-center",
                !itemsStart ? "justify-center" : "justify-start",
                "min-h-full",
                className
            )}
        >
            {title && (
                <div className="relative w-full flex justify-center  items-center p-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-center">
                        {title}
                    </h1>
                    {returnPage && (
                        <div className="absolute left-0">
                            <Button icon={<ArrowLeft />} FC={() => navigate(-1)} />
                        </div>
                    )}
                </div>
            )}


            {!loading ? children : <Loader />}
        </motion.section>
    )
}
