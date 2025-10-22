import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Chat from '#models/chat'
import User from '#models/user'
import MessageRead from '#models/message_read'

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

  @belongsTo(() => Chat)
  declare chat: BelongsTo<typeof Chat>

  @belongsTo(() => User, {
    foreignKey: 'senderId',
  })
  declare sender: BelongsTo<typeof User>

  @belongsTo(() => Message, {
    foreignKey: 'replyToMessageId',
  })
  declare replyToMessage: BelongsTo<typeof Message>

  @belongsTo(() => User, {
    foreignKey: 'pinnedBy',
  })
  declare pinnedByUser: BelongsTo<typeof User>

  @hasMany(() => MessageRead)
  declare reads: HasMany<typeof MessageRead>
}