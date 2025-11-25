import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Channel from './channel.js'
import User from './user.js'
import MessageRead from './message_read.js'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare channelId: number

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
  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

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

  @hasMany(() => MessageRead)
  declare reads: HasMany<typeof MessageRead>
}
