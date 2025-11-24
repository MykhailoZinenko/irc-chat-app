import { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

const updateProfileSchema = vine.compile(
  vine.object({
    firstName: vine.string().optional(),
    lastName: vine.string().optional(),
    nickName: vine.string().minLength(2).maxLength(50).optional(),
    email: vine.string().email().optional(),
  })
)

const updatePasswordSchema = vine.compile(
  vine.object({
    currentPassword: vine.string(),
    newPassword: vine.string().minLength(8),
  })
)

const deleteAccountSchema = vine.compile(
  vine.object({
    password: vine.string(),
  })
)

export default class UserController {
  /**
   * Get user profile by ID
   */
  async profile({ params, response }: HttpContext) {
    const user = await User.find(params.id)

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
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt.toISO(),
      },
    })
  }

  /**
   * Update user profile (name, nickname, email)
   */
  async updateProfile({ auth, request, response }: HttpContext) {
    try {
      const user = auth.user!
      const data = await request.validateUsing(updateProfileSchema)

      // Check if nickname is being updated and if it's already taken
      if (data.nickName && data.nickName !== user.nickName) {
        const existingUser = await User.findBy('nickName', data.nickName)
        if (existingUser) {
          return response.status(422).json({
            success: false,
            message: 'Nickname already taken',
            errors: { nickName: 'This nickname is already taken' },
          })
        }
      }

      // Check if email is being updated and if it's already taken
      if (data.email && data.email !== user.email) {
        const existingUser = await User.findBy('email', data.email)
        if (existingUser) {
          return response.status(422).json({
            success: false,
            message: 'Email already registered',
            errors: { email: 'This email is already registered' },
          })
        }
      }

      // Update user fields
      if (data.firstName !== undefined) user.firstName = data.firstName || null
      if (data.lastName !== undefined) user.lastName = data.lastName || null
      if (data.nickName) user.nickName = data.nickName
      if (data.email) user.email = data.email

      await user.save()

      return response.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            nickName: user.nickName,
            email: user.email,
            fullName: user.fullName,
            emailVerifiedAt: user.emailVerifiedAt?.toISO(),
            sessionTimeoutDays: user.sessionTimeoutDays,
            createdAt: user.createdAt.toISO(),
            updatedAt: user.updatedAt?.toISO(),
          },
        },
      })
    } catch (error) {
      return response.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: error.messages || error.message,
      })
    }
  }

  /**
   * Update user password
   */
  async updatePassword({ auth, request, response }: HttpContext) {
    try {
      const user = auth.user!
      const data = await request.validateUsing(updatePasswordSchema)

      // Verify current password
      const isValid = await hash.verify(user.password, data.currentPassword)
      if (!isValid) {
        return response.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        })
      }

      // Update password
      user.password = data.newPassword
      await user.save()

      return response.json({
        success: true,
        message: 'Password updated successfully',
      })
    } catch (error) {
      return response.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: error.messages || error.message,
      })
    }
  }

  /**
   * Delete user account (requires password confirmation)
   */
  async deleteAccount({ auth, request, response }: HttpContext) {
    try {
      const user = auth.user!
      const data = await request.validateUsing(deleteAccountSchema)

      // Verify password before deletion
      const isValid = await hash.verify(user.password, data.password)
      if (!isValid) {
        return response.status(401).json({
          success: false,
          message: 'Password is incorrect',
        })
      }

      // Delete all user's access tokens first
      await user.related('tokens').query().delete()

      // Delete the user account
      await user.delete()

      return response.json({
        success: true,
        message: 'Account deleted successfully',
      })
    } catch (error) {
      return response.status(422).json({
        success: false,
        message: 'Failed to delete account',
        errors: error.messages || error.message,
      })
    }
  }
}
