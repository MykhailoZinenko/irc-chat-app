import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Chat from './chat.js'
import User from './user.js'

export type ParticipantRole = 'member' | 'admin'

export default class ChatParticipant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare chatId: number

  @column()
  declare userId: number

  @column()
  declare role: ParticipantRole

  @column()
  declare addedBy: number | null

  @column.dateTime()
  declare joinedAt: DateTime

  @column.dateTime()
  declare leftAt: DateTime | null

  // Relationships
  @belongsTo(() => Chat)
  declare chat: BelongsTo<typeof Chat>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'addedBy',
  })
  declare inviter: BelongsTo<typeof User>
}
