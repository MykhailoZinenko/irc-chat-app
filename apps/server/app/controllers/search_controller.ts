import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import User from '#models/user'
import vine from '@vinejs/vine'

const searchSchema = vine.compile(
  vine.object({
    query: vine.string().trim().minLength(1).maxLength(100),
  })
)

export default class SearchController {
  /**
   * Global search - searches channels, users, and public channels
   */
  async global({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { query } = await request.validateUsing(searchSchema)

    // Search in user's channels
    const userChannels = await Channel.query()
      .whereHas('participants', (participantQuery) => {
        participantQuery.where('user_id', user.id).whereNull('left_at')
      })
      .where('name', 'ilike', `%${query}%`)
      .preload('creator')
      .limit(5)

    // Search in public channels
    const publicChannels = await Channel.query()
      .where('type', 'public')
      .where('name', 'ilike', `%${query}%`)
      .whereDoesntHave('participants', (participantQuery) => {
        participantQuery.where('user_id', user.id).whereNull('left_at')
      })
      .preload('creator')
      .limit(5)

    // Search users (for now, search all users - in production you'd add privacy settings)
    const users = await User.query()
      .where((builder) => {
        builder
          .where('nick_name', 'ilike', `%${query}%`)
          .orWhere('first_name', 'ilike', `%${query}%`)
          .orWhere('last_name', 'ilike', `%${query}%`)
          .orWhere('email', 'ilike', `%${query}%`)
      })
      .whereNot('id', user.id)
      .limit(5)

    return response.json({
      success: true,
      data: {
        userChannels: userChannels.map((channel) => ({
          id: channel.id,
          type: channel.type,
          name: channel.name,
          description: channel.description,
          createdBy: channel.createdBy,
          resultType: 'user_channel' as const,
        })),
        publicChannels: publicChannels.map((channel) => ({
          id: channel.id,
          type: channel.type,
          name: channel.name,
          description: channel.description,
          createdBy: channel.createdBy,
          resultType: 'public_channel' as const,
        })),
        users: users.map((u) => ({
          id: u.id,
          nickName: u.nickName,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          resultType: 'user' as const,
        })),
      },
    })
  }
}
