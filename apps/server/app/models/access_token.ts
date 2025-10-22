import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class AccessToken extends BaseModel {
  static table = 'auth_access_tokens'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tokenableId: number

  @column()
  declare type: string

  @column()
  declare name: string | null

  @column()
  declare hash: string

  @column()
  declare abilities: string

  @column()
  declare deviceName: string | null

  @column()
  declare deviceType: 'web' | 'desktop' | 'mobile'

  @column()
  declare ipAddress: string | null

  @column()
  declare userAgent: string | null

  @column.dateTime()
  declare lastActivityAt: DateTime | null

  @column.dateTime()
  declare lastUsedAt: DateTime | null

  @column.dateTime()
  declare expiresAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, {
    foreignKey: 'tokenableId',
  })
  declare user: BelongsTo<typeof User>
}