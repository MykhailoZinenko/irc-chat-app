import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Chat from '#models/chat'
import User from '#models/user'

export default class ChatParticipant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare chatId: number

  @column()
  declare userId: number

  @column()
  declare role: 'member' | 'admin' | 'owner'

  @column()
  declare addedBy: number | null

  @column.dateTime()
  declare joinedAt: DateTime

  @column.dateTime()
  declare leftAt: DateTime | null

  @belongsTo(() => Chat)
  declare chat: BelongsTo<typeof Chat>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'addedBy',
  })
  declare addedByUser: BelongsTo<typeof User>
}