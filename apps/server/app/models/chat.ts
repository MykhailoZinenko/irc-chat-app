import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import ChatParticipant from './chat_participant.js'
import Message from './message.js'

export type ChatType = 'private' | 'public'

export default class Chat extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare type: ChatType

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare createdBy: number

  @column.dateTime()
  declare lastActivityAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare creator: BelongsTo<typeof User>

  @hasMany(() => ChatParticipant)
  declare participants: HasMany<typeof ChatParticipant>

  @hasMany(() => Message)
  declare messages: HasMany<typeof Message>
}
