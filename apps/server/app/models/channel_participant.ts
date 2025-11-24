import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Channel from './channel.js'
import User from './user.js'

export type ParticipantRole = 'member' | 'admin'

export default class ChannelParticipant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare channelId: number

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
  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'addedBy',
  })
  declare inviter: BelongsTo<typeof User>
}
