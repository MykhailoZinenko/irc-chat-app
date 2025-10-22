import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Message from '#models/message'

export default class UserMessageAction extends BaseModel {
  static table = 'user_message_actions'

  @column({ isPrimary: true })
  declare userId: number

  @column({ isPrimary: true })
  declare messageId: number

  @column()
  declare isHidden: boolean

  @column()
  declare isPinnedPersonally: boolean

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Message)
  declare message: BelongsTo<typeof Message>
}