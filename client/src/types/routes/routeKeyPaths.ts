
    // Этот файл сгенерирован автоматически. Не редактируйте вручную!

    import type { LucideIcon } from 'lucide-react';
    import { RouteKey } from './routeKeys';

    export type Route = {
        key: RouteKey;
        path: string;
        label: string;
        shortLabel?: string;
        showInHeader?: boolean;
        icon?: LucideIcon;
        disabled?: boolean;
        accessRoles?: string[];
        isSubRoute?: boolean;
    };

    import { HomeIcon, ShieldCheckIcon, UserIcon, Settings, UserCog2Icon, PlusIcon, HelpCircleIcon } from 'lucide-react';


   

    export const routeKeyPaths: Route[] = [
  {
    "key": "HOME",
    "path": "/",
    "label": "Главная",
    "showInHeader": true,
    "icon": HomeIcon,
    "isSubRoute": false
  },
  {
    "key": "ADMIN",
    "path": "/admin",
    "label": "Админка",
    "showInHeader": true,
    "icon": ShieldCheckIcon,
    "accessRoles": [
      "ADMIN",
      "SUPER_ADMIN"
    ],
    "isSubRoute": true
  },
  {
    "key": "ADMIN_USERS",
    "path": "/admin/users",
    "label": "Пользователи",
    "showInHeader": false,
    "icon": UserIcon,
    "isSubRoute": true
  },
  {
    "key": "ADMIN_USERS_ID",
    "path": "/admin/users/:id",
    "label": "Детали пользователя",
    "showInHeader": false,
    "isSubRoute": false
  },
  {
    "key": "ADMIN_SETTINGS",
    "path": "/admin/settings",
    "showInHeader": false,
    "label": "Настройки",
    "icon": Settings,
    "isSubRoute": false
  },
  {
    "key": "PROFILE",
    "path": "/profile",
    "label": "Профиль",
    "showInHeader": true,
    "icon": UserCog2Icon,
    "isSubRoute": false
  },
  {
    "key": "TOP_UP_BALANCE",
    "path": "/topup",
    "label": "Пополнить баланс",
    "showInHeader": true,
    "icon": PlusIcon,
    "disabled": true,
    "isSubRoute": false
  },
  {
    "key": "FAQ",
    "path": "/faq",
    "label": "FAQ",
    "showInHeader": true,
    "icon": HelpCircleIcon,
    "disabled": true,
    "isSubRoute": false
  },
  {
    "key": "NO_RIGHTS",
    "path": "/no-rights",
    "label": "Нет прав",
    "shortLabel": "Нет прав",
    "showInHeader": false,
    "disabled": true,
    "isSubRoute": false
  },
  {
    "key": "NOT_FOUND",
    "path": "/404",
    "label": "Страница не найдена",
    "shortLabel": "404",
    "showInHeader": false,
    "disabled": true,
    "isSubRoute": false
  }
] as const;

