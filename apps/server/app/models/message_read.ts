import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Message from './message.js'
import User from './user.js'

export default class MessageRead extends BaseModel {
  static table = 'message_reads'

  @column({ isPrimary: true })
  declare userId: number

  @column({ isPrimary: true })
  declare messageId: number

  @column.dateTime()
  declare deliveredAt: DateTime | null

  @column.dateTime()
  declare readAt: DateTime | null

  // Relationships
  @belongsTo(() => Message)
  declare message: BelongsTo<typeof Message>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
