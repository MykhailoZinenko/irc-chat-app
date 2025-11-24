import { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import ChannelParticipant from '#models/channel_participant'
import Invitation from '#models/invitation'

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

const userIdParamsSchema = vine.object({
  id: vine.number(),
})

export default class UserController {
  async profile({ params, response }: HttpContext) {
    const { id: userId } = await vine.validate({
      schema: userIdParamsSchema,
      data: params,
    })

    const user = await User.find(userId)

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

  async updateProfile({ auth, request, response }: HttpContext) {
    try {
      const user = auth.user!
      const data = await request.validateUsing(updateProfileSchema)

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

  async updatePassword({ auth, request, response }: HttpContext) {
    try {
      const user = auth.user!
      const data = await request.validateUsing(updatePasswordSchema)

      const isValid = await hash.verify(user.password, data.currentPassword)
      if (!isValid) {
        return response.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        })
      }

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

  async deleteAccount({ auth, request, response }: HttpContext) {
    try {
      const user = auth.user!
      const data = await request.validateUsing(deleteAccountSchema)

      const isValid = await hash.verify(user.password, data.password)
      if (!isValid) {
        return response.status(401).json({
          success: false,
          message: 'Password is incorrect',
        })
      }

      await user.related('tokens').query().delete()
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

  /**
   * Get common channels between authenticated user and another user
   */
  async commonChannels({ auth, params, response }: HttpContext) {
    const authUser = auth.user!
    const { id: userId } = await vine.validate({
      schema: userIdParamsSchema,
      data: params,
    })

    if (authUser.id === userId) {
      return response.status(400).json({
        success: false,
        message: 'Cannot get common channels with yourself',
      })
    }

    const targetUser = await User.find(userId)
    if (!targetUser) {
      return response.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    // Get channels where both users are active members
    const authUserParticipants = await ChannelParticipant.query()
      .where('user_id', authUser.id)
      .whereNull('left_at')
      .preload('channel')

    const targetUserParticipants = await ChannelParticipant.query()
      .where('user_id', userId)
      .whereNull('left_at')

    const targetUserChannelIds = targetUserParticipants.map((p) => p.channelId)

    const commonChannels = authUserParticipants
      .filter((p) => targetUserChannelIds.includes(p.channelId))
      .map((p) => ({
        id: p.channel.id,
        type: p.channel.type,
        name: p.channel.name,
        description: p.channel.description,
      }))

    return response.json({
      success: true,
      data: { channels: commonChannels },
    })
  }

  /**
   * Get user's channel memberships (for invite dialog filtering)
   */
  async userChannels({ params, response }: HttpContext) {
    const { id: userId } = await vine.validate({
      schema: userIdParamsSchema,
      data: params,
    })

    const targetUser = await User.find(userId)
    if (!targetUser) {
      return response.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    // Get all channels where target user is a member
    const participants = await ChannelParticipant.query()
      .where('user_id', userId)
      .whereNull('left_at')

    const channelIds = participants.map((p) => p.channelId)

    return response.json({
      success: true,
      data: { channelIds },
    })
  }

  /**
   * Get pending invitations for a specific user (for invite dialog)
   */
  async userInvitations({ auth, params, response }: HttpContext) {
    const authUser = auth.user!
    const { id: userId } = await vine.validate({
      schema: userIdParamsSchema,
      data: params,
    })

    const targetUser = await User.find(userId)
    if (!targetUser) {
      return response.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    // Get all channels where auth user is admin
    const adminParticipants = await ChannelParticipant.query()
      .where('user_id', authUser.id)
      .where('role', 'admin')
      .whereNull('left_at')

    const adminChannelIds = adminParticipants.map((p) => p.channelId)

    if (adminChannelIds.length === 0) {
      return response.json({
        success: true,
        data: { invitations: [] },
      })
    }

    // Get pending invitations for target user in channels where auth user is admin
    const invitations = await Invitation.query()
      .where('invited_user_id', userId)
      .where('status', 'pending')
      .whereIn('channel_id', adminChannelIds)
      .preload('channel')

    return response.json({
      success: true,
      data: {
        invitations: invitations.map((inv) => ({
          id: inv.id,
          channelId: inv.channelId,
          channelName: inv.channel.name,
          createdAt: inv.createdAt,
          expiresAt: inv.expiresAt,
        })),
      },
    })
  }

  /**
   * Get current user's received pending invitations
   */
  async myInvitations({ auth, response }: HttpContext) {
    const user = auth.user!

    const invitations = await Invitation.query()
      .where('invited_user_id', user.id)
      .where('status', 'pending')
      .preload('channel')
      .preload('inviter')

    return response.json({
      success: true,
      data: {
        invitations: invitations.map((inv) => ({
          id: inv.id,
          channelId: inv.channelId,
          channel: {
            id: inv.channel.id,
            name: inv.channel.name,
            type: inv.channel.type,
            description: inv.channel.description,
          },
          inviter: {
            id: inv.inviter.id,
            nickName: inv.inviter.nickName,
            firstName: inv.inviter.firstName,
            lastName: inv.inviter.lastName,
            email: inv.inviter.email,
          },
          createdAt: inv.createdAt,
          expiresAt: inv.expiresAt,
        })),
      },
    })
  }
}
