// Этот файл сгенерирован автоматически. Не редактируйте вручную!

export type RootRouteKey =
  | 'HOME'
  | 'ADMIN'
  | 'PROFILE'
  | 'TOP_UP_BALANCE'
  | 'FAQ'
  | 'NO_RIGHTS'
  | 'NOT_FOUND';

export type SubRouteKey =
  | 'ADMIN_USERS'
  | 'ADMIN_USERS_ID'
  | 'ADMIN_SETTINGS';

export type RouteKey = RootRouteKey | SubRouteKey;

export const rootRouteKeys = [
  "HOME",
  "ADMIN",
  "PROFILE",
  "TOP_UP_BALANCE",
  "FAQ",
  "NO_RIGHTS",
  "NOT_FOUND"
] as const;

export const subRouteKeys = [
  "ADMIN_USERS",
  "ADMIN_USERS_ID",
  "ADMIN_SETTINGS"
] as const;
