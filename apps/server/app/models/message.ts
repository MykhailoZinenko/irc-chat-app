import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Chat from './chat.js'
import User from './user.js'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare chatId: number

  @column()
  declare senderId: number

  @column()
  declare content: string

  @column()
  declare contentMarkdown: string | null

  @column()
  declare replyToMessageId: number | null

  @column()
  declare pinnedBy: number | null

  @column.dateTime()
  declare editedAt: DateTime | null

  @column.dateTime()
  declare deletedForEveryoneAt: DateTime | null

  @column.dateTime()
  declare pinnedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  // Relationships
  @belongsTo(() => Chat)
  declare chat: BelongsTo<typeof Chat>

  @belongsTo(() => User, {
    foreignKey: 'senderId',
  })
  declare sender: BelongsTo<typeof User>

  @belongsTo(() => Message, {
    foreignKey: 'replyToMessageId',
  })
  declare replyTo: BelongsTo<typeof Message>

  @belongsTo(() => User, {
    foreignKey: 'pinnedBy',
  })
  declare pinner: BelongsTo<typeof User>
}
