import * as path from 'path';
import { Input } from 'telegraf';

// export const IMAGE_PATHS = {
//   SCAMMER: path.join(__dirname, '../../../public/scammer.jpg'),
//   UNKNOWN: path.join(__dirname, '../../../public/noinfo.png'),
//   GARANT: path.join(__dirname, '../../../public/garant.jpg'),
//   SUSPICIOUS: path.join(__dirname, '../../../public/suspicious.jpg'),
//   OGUREC: path.join(__dirname, '../../../public/ogurec.png'),
//   PROGRAMMER: path.join(__dirname, '../../../public/programmer.mp4'),
//   BOT: path.join(__dirname, '../../../public/bot.png')
// };


export const INLINE_QUERY_PATHS = {
  GARANTS: 'https://fv5-4.files.fm/thumb_show.php?i=kd2v67urhs&view&v=1&PHPSESSID=71225c7fa9a6a03132a91f930137035ead17371d',
  USERNAME_SEARCH: 'https://fv5-4.files.fm/thumb_show.php?i=95n6dk8msx&view&v=1&PHPSESSID=71225c7fa9a6a03132a91f930137035ead17371d',
  UNKNOWN:"https://fv5-2.files.fm/thumb_show.php?i=ykc4shveng&view&v=1&PHPSESSID=abaa0272f29702db984c638202ba075179b809fc",
  SCAMMER:"https://fv5-2.files.fm/thumb_show.php?i=m7jpsgpmk9&view&v=1&PHPSESSID=abaa0272f29702db984c638202ba075179b809fc",
  SUSPICIOUS:"https://fv5-2.files.fm/thumb_show.php?i=e5qcq6grj8&view&v=1&PHPSESSID=abaa0272f29702db984c638202ba075179b809fc",
  SPAMMER:"https://fv5-2.files.fm/thumb_show.php?i=8zyz2jaqx2&view&v=1&PHPSESSID=abaa0272f29702db984c638202ba075179b809fc"
}

export enum SCENES {
  BUY_STARS = 'BUY_STARS',
  SELL_STARS = 'SELL_STARS',
  BUY_PREMIUM = 'BUY_PREMIUM',
  TOP_UP_BALANCE = 'TOP_UP_BALANCE',
  NEWS = 'NEWS',

  DEPOSIT_TON = 'DEPOSIT_TON',
  DEPOSIT_CRYPTOBOT = 'DEPOSIT_CRYPTOBOT',
  DEPOSIT_PLATEGA = 'DEPOSIT_PLATEGA',
}

export const BOT_NAME = 'svdbasebot';
export const SUPPORT = ''

export const CUSTOM_INFO = {
  PROGRAMMER_INFO: `*👨‍💻 Разработчик проекта* @svdbasebot\n\n💡 *Стек:* \`React, TypeScript, NestJS, Tailwind, Prisma, Node.js, Telegram Bot API\`\n\n📬 *Связь:* [@TeM4ik20](https://t.me/TeM4ik20)`,
  BOT_INFO: `*🤖 Бот проекта* @giftthread\n\n*Владелец:* [@SVDProject](https://t.me/SVDProject)\n\n📬 *Разработчик:* [@TeM4ik20](https://t.me/TeM4ik20)`
}


export const BASE_BOT_IMAGE = Input.fromLocalFile(path.join(__dirname, '../../../public/image.png'));

