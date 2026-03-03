import { AdminService } from "@/services/admin.service"
import { IUser, IUserDetailedProfile } from "@/types/auth"
import { onRequest } from "@/utils/handleReq"
import { MessageCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { toast } from "react-toastify"
import { PageContainer } from "../../layout/PageContainer"
import { Button } from "../../ui/Button"
import { UserProfile } from "../../user/UserProfile"
import { Form } from "@/components/ui/Form"

export const UserDetails: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [userData, setUserData] = useState<IUser | null>(null)
    const { id } = useParams();

    const getUserData = async () => {
        setIsLoading(true)
        if (!id) {
            toast.error('id пользователя не передан')
            return
        }

        const userData: IUser = await onRequest(AdminService.getUserDetails(id))

        console.log({ userData })

        if (userData) {
            setUserData(userData)
        }

        setIsLoading(false)
    }

    const updateUserBalance = async (values: any) => {
        console.log(values)
        if (!userData) return
        await onRequest(AdminService.updateUserBalance(userData.id, values.balance))
        getUserData()
    }

    useEffect(() => {
        getUserData()
    }, [])

    if (!userData) return null;

    return (
        <PageContainer
            title={
                userData?.username
                || userData?.firstName
                || "Пользователь"
            }
            loading={isLoading}
            returnPage
            itemsStart
        >
            <Button
                text="Чат Telegram"
                icon={<MessageCircle />}
                href={`https://t.me/${userData.username}`}
                className="mb-4"
            />

            <Form
                title="Изменить баланс пользователя"
                message="Баланс успешно изменен"
                config={{
                    input: [
                        {
                            name: "balance",
                            label: "Баланс",
                            type: "number",
                            required: true,
                        }
                    ]
                }}
                initialValues={{ balance: userData.balance }}
                onSubmit={updateUserBalance}
            />

            <UserProfile
                user={userData as IUserDetailedProfile}
                showAvatar={false}
                title={`Детали пользователя`}
            />
        </PageContainer>
    )
}