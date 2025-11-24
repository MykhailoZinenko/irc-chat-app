import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import ChannelParticipant from './channel_participant.js'
import Message from './message.js'

export type ChannelType = 'private' | 'public'

export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare type: ChannelType

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

  @hasMany(() => ChannelParticipant)
  declare participants: HasMany<typeof ChannelParticipant>

  @hasMany(() => Message)
  declare messages: HasMany<typeof Message>
}
