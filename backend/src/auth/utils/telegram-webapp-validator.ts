import { BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';

/**
 * Валидирует подпись Telegram WebApp initData
 * @param initData - строка initData от Telegram WebApp
 * @param botToken - токен бота для проверки подписи
 * @returns объект с данными пользователя или null если валидация не прошла
 */
export function validateTelegramWebAppData(
  initData: string,
  botToken: string,
): any {
  if (!initData || !botToken) {
    throw new BadRequestException('Missing initData or botToken');
  }

  try {
    // Парсим initData строку
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');

    if (!hash) {
      throw new BadRequestException('Missing hash in initData');
    }

    // Удаляем hash из параметров для проверки подписи
    urlParams.delete('hash');

    // Сортируем параметры по ключу
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Создаем секретный ключ из botToken
    // Алгоритм: HMAC-SHA256('WebAppData', botToken)
    const secretKey = createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest(); // Возвращает Buffer

    // Вычисляем подпись
    // Алгоритм: HMAC-SHA256(dataCheckString, secretKey)
    // Используем Buffer напрямую, не преобразуем в hex
    const calculatedHash = createHmac('sha256', secretKey as any)
      .update(dataCheckString)
      .digest('hex');

    console.log("calculatedHash", calculatedHash)
    console.log("hash", hash)

    // Проверяем подпись
    if (calculatedHash !== hash) {
      // Логируем для отладки (только в режиме разработки)
      if (process.env.NODE_ENV === 'development') {
        console.error('Telegram WebApp validation failed:', {
          receivedHash: hash,
          calculatedHash,
          dataCheckString: dataCheckString.substring(0, 100) + '...',
        });
      }
      throw new BadRequestException('Invalid Telegram WebApp data signature');
    }

    // Проверяем время жизни данных (не старше 24 часов)
    const authDate = urlParams.get('auth_date');
    if (authDate) {
      const authTimestamp = parseInt(authDate, 10);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const timeDiff = currentTimestamp - authTimestamp;

      // Данные не должны быть старше 24 часов (86400 секунд)
      if (timeDiff > 86400) {
        throw new BadRequestException('Telegram WebApp data expired');
      }
    }

    // Извлекаем данные пользователя
    const userParam = urlParams.get('user');
    if (!userParam) {
      throw new BadRequestException('Missing user data in initData');
    }

    const userData = JSON.parse(userParam);
    return userData;
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException('Failed to validate Telegram WebApp data');
  }
}
