import { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import User from '#models/user'
import Contact from '#models/contact'

const searchSchema = vine.compile(
  vine.object({
    q: vine.string().minLength(1).maxLength(50),
  })
)

export default class UserController {
  async search({ request, response }: HttpContext) {
    try {
      const { q } = await request.validateUsing(searchSchema)

      const users = await User.query()
        .where('nickName', 'like', `%${q}%`)
        .orWhere('firstName', 'like', `%${q}%`)
        .orWhere('lastName', 'like', `%${q}%`)
        .limit(20)
        .select(['id', 'firstName', 'lastName', 'nickName', 'createdAt'])

      return response.json({
        success: true,
        data: users.map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          nickName: user.nickName,
          fullName: user.fullName,
          createdAt: user.createdAt.toISO(),
        }))
      })
    } catch (error) {
      return response.status(422).json({
        success: false,
        message: 'Invalid search query',
        errors: error.messages || error.message,
      })
    }
  }

  async profile({ params, response }: HttpContext) {
    try {
      const { id } = params

      const user = await User.query()
        .where('id', id)
        .select(['id', 'firstName', 'lastName', 'nickName', 'createdAt'])
        .first()

      if (!user) {
        return response.status(404).json({
          success: false,
          message: 'User not found',
        })
      }

      return response.json({
        success: true,
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          nickName: user.nickName,
          fullName: user.fullName,
          createdAt: user.createdAt.toISO(),
        }
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch user profile',
      })
    }
  }
}