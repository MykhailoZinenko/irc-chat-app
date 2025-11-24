import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Channel from '#models/channel'
import User from '#models/user'

export default class Invitation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare channelId: number

  @column()
  declare invitedUserId: number

  @column()
  declare invitedBy: number

  @column()
  declare status: 'pending' | 'accepted' | 'rejected'

  @column.dateTime()
  declare expiresAt: DateTime | null

  @column.dateTime()
  declare respondedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Channel, { foreignKey: 'channelId' })
  declare channel: BelongsTo<typeof Channel>

  @belongsTo(() => User, { foreignKey: 'invitedUserId' })
  declare invitedUser: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'invitedBy' })
  declare inviter: BelongsTo<typeof User>
}