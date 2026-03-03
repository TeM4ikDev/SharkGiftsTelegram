import { AuthService } from "@/services/auth.service";
import { UserService } from "@/services/user.service";
import { ITelegramUser, IUser } from "@/types/auth";
import { onRequest } from "@/utils/handleReq";
import { setTokenToLocalStorage } from "@/utils/localstorage";
import WebApp from '@twa-dev/sdk';
import { makeAutoObservable, runInAction } from "mobx";
import { fromPromise } from "mobx-utils";

const MOCK_USERS_STORAGE_KEY = 'dev_mock_user_id';

export const MOCK_USERS: ITelegramUser[] = [
    {
        id: 2027571609,
        first_name: "Artem",
        last_name: "",
        username: "TeM4ik20",
        language_code: "ru",
        is_premium: true,
    },

    { id: 111111111, first_name: "Иван", last_name: "Петров", username: "ivan_dev", language_code: "ru", is_premium: false },
    { id: 222222222, first_name: "Maria", last_name: "Admin", username: "maria_admin", language_code: "ru", is_premium: true },
    { id: 333333333, first_name: "Test", last_name: "User", username: "test_user", language_code: "en", is_premium: false },
];

function getStoredMockUserId(): number {
    try {
        const stored = localStorage.getItem(MOCK_USERS_STORAGE_KEY);
        if (stored) {
            const id = parseInt(stored, 10);
            if (MOCK_USERS.some((u) => u.id === id)) return id;
        }
    } catch (_) { }
    return MOCK_USERS[0].id;
}

class UserStore {
    user: IUser | null = null;
    isAuth: boolean = false;
    isLoading: boolean = true;
    updateTrigger: boolean = false;
    selectedMockUserId: number = getStoredMockUserId();

    constructor() {
        makeAutoObservable(this);
        this.checkAuth();
    }

    get selectedMockUser(): ITelegramUser {
        return MOCK_USERS.find((u) => u.id === this.selectedMockUserId) ?? MOCK_USERS[0];
    }

    setMockUser = (userId: number) => {
        if (!MOCK_USERS.some((u) => u.id === userId)) return;
        this.selectedMockUserId = userId;
        localStorage.setItem(MOCK_USERS_STORAGE_KEY, String(userId));
        this.checkAuth();
    };

    checkAuth = () => {
        this.isLoading = true;
        const authPromise = fromPromise(this.getAuthPromise());


        authPromise.then(
            (data) => {
                runInAction(() => {
                    if (data?.user) {
                        setTokenToLocalStorage(data.token);
                        this.login(data.user);
                    } else {
                        this.logout();
                    }
                });
            },
            (error) => {
                console.error("Ошибка при получении профиля:", error);
                runInAction(() => {
                    this.logout();
                });
            }
        );
    };

    getAuthPromise(): Promise<{ token: string, user: IUser }> {
        // import.meta.env.DEV
        console.log(import.meta.env.DEV);
        if (import.meta.env.DEV == true) {
            // В режиме разработки используем mock initData
            // ВАЖНО: В продакшене это должно быть отключено!
            console.warn('⚠️ Используется режим разработки с mock данными');
            // Создаем mock initData строку для разработки
            // В реальном приложении это должно быть отключено или использовать тестовый бот
            const mockInitData = `user=${encodeURIComponent(JSON.stringify(this.selectedMockUser))}&auth_date=${Math.floor(Date.now() / 1000)}&hash=mock_hash_for_dev`;
            return onRequest(AuthService.login({ initData: mockInitData }));
        } else {
            console.log('real');
            console.log(WebApp.initData);
            // Получаем полную строку initData с подписью от Telegram WebApp
            const initData = WebApp.initData;
            if (initData) {
                return onRequest(AuthService.login({ initData }));
            } else {
                return Promise.reject('no telegram data');
            }
        }
    }

    login(userData: IUser) {
        this.user = userData;
        this.isAuth = true;
        this.isLoading = false;
    }

    logout() {
        this.isAuth = false;
        this.user = null;
        this.isLoading = false;
    }

    setLoading(loading: boolean) {
        this.isLoading = loading;
    }

    updateUserBalance = async () => {
        if (!this.user) return;
        try {
            const balance = await onRequest(UserService.getUserBalance());
            if (balance) {
                runInAction(() => {
                    if (this.user) {
                        this.user = { ...this.user, balance: Number(balance) };
                    }
                });
            }
        } catch (error) {
            console.error("Ошибка при обновлении данных пользователя:", error);
        }

    }

    updateData = async () => {
        if (!this.user) return;

        try {
            const userData = await onRequest(UserService.getUserProfile());
            if (userData) {
                runInAction(() => {
                    if (this.user) {
                        // Обновляем только данные пользователя без установки isLoading
                        this.user = { ...this.user, ...userData };
                        this.updateTrigger = !this.updateTrigger;
                    }
                });
            }
        } catch (error) {
            console.error("Ошибка при обновлении данных пользователя:", error);
        }
    }



    get userRole() {
        return this.user?.role;
    }
}

export default new UserStore(); 