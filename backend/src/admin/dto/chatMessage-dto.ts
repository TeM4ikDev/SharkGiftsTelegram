export interface CreateChatMessageDto {
    username: string

    newUserMessage: string;
    showNewUserInfo?: 'true' | 'false';
    showUserBanMessage?: 'true' | 'false';
    banUserFromChat?: 'true' | 'false';
    rulesTelegramLink?: string;

    banWorlds?: string[];
}