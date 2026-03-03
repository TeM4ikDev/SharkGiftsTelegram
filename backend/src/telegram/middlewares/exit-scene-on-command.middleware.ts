import { Context, MiddlewareFn } from 'telegraf';

/**
 * Middleware для автоматического выхода из сцены при использовании команд
 */
export const exitSceneOnCommandMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  const sceneContext = ctx as any;
  

  console.log(sceneContext, 'sceneContext')
  // Проверяем, находится ли пользователь в сцене
  if (!sceneContext.scene?.current) {
    return next();
  }

  // Проверяем, является ли это командой, через структуру update
  let isCommand = false;
  
  // Получаем текст сообщения из разных источников
  let messageText: string | undefined;
  
  if (ctx.message && 'text' in ctx.message) {
    messageText = ctx.message.text;
  } else if (ctx.update && 'message' in ctx.update) {
    const update = ctx.update as any;
    messageText = update.message?.text;
  }
  
  if (messageText) {
    const text = messageText.trim();
    // Проверяем, начинается ли текст с / и содержит ли хотя бы один символ после /
    isCommand = text.startsWith('/') && text.length > 1 && !text.startsWith('//');
    
    // Дополнительная проверка через entities
    if (!isCommand && ctx.message && 'entities' in ctx.message) {
      const message = ctx.message as any;
      if (message.entities && Array.isArray(message.entities)) {
        isCommand = message.entities.some((entity: any) => entity.type === 'bot_command');
      }
    }
  }
  
  if (isCommand) {
    // Если пользователь находится в сцене и использует команду, выходим из сцены
    try {
      await sceneContext.scene.leave();
    } catch (error) {
      console.error('[ExitSceneMiddleware] Error leaving scene:', error);
    }
  }
  
  // Продолжаем обработку
  return next();
};
