import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Chat from '#models/chat'

export default class UserChatSetting extends BaseModel {
  static table = 'user_chat_settings'

  @column({ isPrimary: true })
  declare userId: number

  @column({ isPrimary: true })
  declare chatId: number

  @column()
  declare isHidden: boolean

  @column()
  declare isMuted: boolean

  @column()
  declare notificationsEnabled: boolean

  @column.dateTime()
  declare lastClearedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Chat)
  declare chat: BelongsTo<typeof Chat>
}