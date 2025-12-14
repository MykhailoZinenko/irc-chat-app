import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import AccessToken from '#models/access_token'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare firstName: string | null

  @column()
  declare lastName: string | null

  @column()
  declare nickName: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string | null

  @column()
  declare provider: string | null

  @column()
  declare providerId: string | null

  @column()
  declare avatarUrl: string | null

  @column.dateTime()
  declare emailVerifiedAt: DateTime | null

  @column()
  declare sessionTimeoutDays: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => AccessToken, {
    foreignKey: 'tokenableId',
  })
  declare tokens: HasMany<typeof AccessToken>

  static accessTokens = DbAccessTokensProvider.forModel(User)

  async getActiveSessions() {
    const cutoffDate = DateTime.now().minus({ days: this.sessionTimeoutDays })

    return await AccessToken.query()
      .where('tokenableId', this.id)
      .where((query) => {
        query.where('lastActivityAt', '>', cutoffDate.toSQL()).orWhereNull('lastActivityAt')
      })
      .where((query) => {
        query.where('expiresAt', '>', DateTime.now().toSQL()).orWhereNull('expiresAt')
      })
      .orderBy('lastActivityAt', 'desc')
  }

  async cleanupExpiredSessions() {
    const cutoffDate = DateTime.now().minus({ days: this.sessionTimeoutDays })

    await AccessToken.query()
      .where('tokenableId', this.id)
      .where((query) => {
        query
          .where('lastActivityAt', '<=', cutoffDate.toSQL())
          .orWhere('expiresAt', '<=', DateTime.now().toSQL())
      })
      .delete()
  }

  get fullName(): string {
    const parts = [this.firstName, this.lastName].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : this.nickName
  }
}
