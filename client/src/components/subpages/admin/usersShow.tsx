import { Pagination } from "@/components/ui/Pagination"
import { User } from "@/components/user/user"
import { AdminService } from "@/services/admin.service"
import { useStore } from "@/store/root.store"
import { IPagination } from "@/types"
import { IUser, UserRoles } from "@/types/auth"
import { onRequest } from "@/utils/handleReq"
import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { PageContainer } from "../../layout/PageContainer"
import { Block } from "../../ui/Block"
import { Button } from "../../ui/Button"
import { Input } from "../../ui/Input"
import { Modal } from "../../ui/Modal"

interface IUsersList {
  users: IUser[]
  pagination: IPagination
}

export const UsersShow: React.FC = () => {
  const { userStore: { user } } = useStore()
  const [users, setUsers] = useState<IUser[]>([])


  const [pagination, setPagination] = useState<IPagination>({
    totalCount: 0,
    maxPage: 1,
    currentPage: 1,
    limit: 10
  })
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const fetchUsers = async (page: number, searchValue = search) => {
    setIsLoading(true)

    const data = await onRequest(AdminService.getUsers({ page, limit: pagination.limit, search: searchValue.replace('@', '') }))
    console.log(data)
    if (data) {
      setUsers(data.users)
      setPagination(data.pagination)
    }
    setIsLoading(false)
  }



  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.maxPage) {
      setPagination(prev => ({ ...prev, currentPage: newPage }))
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }



  const handleToggleAdmin = async (userId: string, role: UserRoles) => {
    const data = await onRequest(AdminService.updateUserRole(userId, role))

    if (data) {
      toast.success('Права успешно обновлены')
      // fetchUsers(pagination.currentPage, search)
    }
  }

  const handleClearAllBalancesClick = () => {
    setIsConfirmModalOpen(true);
  }

  const handleClearAllBalancesConfirm = async () => {
    setIsConfirmModalOpen(false);
    const data = await onRequest(AdminService.clearAllBalances())

    if (data) {
      toast.success(`Балансы ${data.count} пользователей успешно очищены`)
      fetchUsers(pagination?.currentPage, search)
    }
  }

  useEffect(() => {
    fetchUsers(pagination?.currentPage, search)
  }, [pagination?.currentPage, search])

  return (
    <PageContainer loading={false} itemsStart>
      <Block className="w-full p-2 gap-2" >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <Input
            placeholder="Поиск по username"
            name="search"
            value={search}
            onChange={handleSearchChange}
            className="w-full sm:w-64 bg-[#221a3a] border border-[#31295a] rounded-lg px-4 py-2 text-gray-200 focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] transition"
            isRequired={false}
          />

        </div>

        <Pagination
          currentPage={pagination?.currentPage}
          maxPage={pagination?.maxPage}
          onPageChange={handlePageChange}
        />

        <div className="!h-full rounded-xl shadow-lg border border-[#28204a] bg-[#1a1333]">
          <table className="min-w-[300px] w-full h-min divide-y divide-[#28204a]">
            <thead className="bg-[#221a3a] h-min top-0 z-10 rounded-t-xl">
              <tr className="grid grid-cols-4 items-center h-12 rounded-t-xl">
                <th className="flex items-center px-4 text-xs font-bold text-[#b6aaff] uppercase tracking-wider">Username</th>
                <th className="flex items-center justify-center px-4 text-xs font-bold text-[#b6aaff] uppercase tracking-wider">Баланс</th>
                <th className="flex items-center justify-center px-4 text-xs font-bold text-[#b6aaff] uppercase tracking-wider">Админ</th>
                <th className="flex items-center justify-center px-4 text-xs font-bold text-[#b6aaff] uppercase tracking-wider">Роль</th>
              </tr>
            </thead>
            <tbody className="bg-[#1a1333] divide-y divide-[#28204a]">
              {users?.length > 0 ? users.map(userData => (
                <User
                  key={userData.id}
                  user={user}
                  userProp={userData}
                  onToggleAdmin={handleToggleAdmin}
                />
              )) : (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-400">Пользователи не найдены</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </Block>


      {/* <Button
        text="Очистить все балансы"
        FC={handleClearAllBalancesClick}
        color="red"
        className="w-full sm:w-auto"
      /> */}

      <Modal
        isOpen={isConfirmModalOpen}
        setIsOpen={setIsConfirmModalOpen}
        title="Подтверждение очистки балансов"
      >
        <div className="flex flex-col gap-4">
          <p className="text-gray-300">
            Вы уверены, что хотите очистить балансы всех пользователей? Это действие нельзя отменить!
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              text="Отменить"
              FC={() => setIsConfirmModalOpen(false)}
              color="transparent"
            />
            <Button
              text="Подтвердить"
              FC={handleClearAllBalancesConfirm}
              color="red"
            />
          </div>
        </div>
      </Modal>
    </PageContainer>
  )
}
