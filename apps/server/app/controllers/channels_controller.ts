import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import ChannelParticipant from '#models/channel_participant'
import Invitation from '#models/invitation'
import User from '#models/user'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import transmit from '@adonisjs/transmit/services/main'

const createChannelSchema = vine.compile(
  vine.object({
    type: vine.enum(['private', 'public']),
    name: vine.string().trim().minLength(1).maxLength(100),
    description: vine.string().trim().maxLength(500).optional(),
  })
)

const updateChannelSchema = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100).optional(),
    description: vine.string().trim().maxLength(500).optional(),
  })
)

const inviteSchema = vine.compile(
  vine.object({
    userId: vine.number(),
  })
)

const channelIdParamsSchema = vine.object({
  id: vine.number(),
})

export default class ChannelsController {
  /**
   * List user's channels
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.user!

    const participants = await ChannelParticipant.query()
      .where('user_id', user.id)
      .whereNull('left_at')
      .preload('channel', (query) => {
        query.preload('creator').preload('participants', (pQuery) => {
          pQuery.whereNull('left_at')
        })
      })

    const channels = participants.map((p) => ({
      id: p.channel.id,
      type: p.channel.type,
      name: p.channel.name,
      description: p.channel.description,
      createdBy: p.channel.createdBy,
      creator: p.channel.creator,
      role: p.role,
      joinedAt: p.joinedAt,
      lastActivityAt: p.channel.lastActivityAt,
      memberCount: p.channel.participants.length,
    }))

    return response.json({
      success: true,
      data: { channels },
    })
  }

  /**
   * Create new channel
   */
  async create({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const data = await request.validateUsing(createChannelSchema)

    const channel = await Channel.create({
      type: data.type,
      name: data.name,
      description: data.description || null,
      createdBy: user.id,
      lastActivityAt: DateTime.now(),
    })

    await ChannelParticipant.create({
      channelId: channel.id,
      userId: user.id,
      role: 'admin',
      addedBy: null,
      joinedAt: DateTime.now(),
    })

    await channel.load('creator')

    return response.status(201).json({
      success: true,
      data: { channel },
    })
  }

  /**
   * Get channel details
   */
  async show({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const { id: channelId } = await vine.validate({
      schema: channelIdParamsSchema,
      data: params,
    })

    const participant = await ChannelParticipant.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .whereNull('left_at')
      .first()

    if (!participant) {
      return response.status(403).json({
        success: false,
        message: 'You are not a member of this channel',
      })
    }

    const channel = await Channel.query()
      .where('id', channelId)
      .preload('creator')
      .preload('participants', (query) => {
        query.whereNull('left_at').preload('user')
      })
      .firstOrFail()

    const members = channel.participants.map((p) => ({
      id: p.user.id,
      nickName: p.user.nickName,
      firstName: p.user.firstName,
      lastName: p.user.lastName,
      email: p.user.email,
      status: p.user.status,
      role: p.role,
      joinedAt: p.joinedAt,
    }))

    return response.json({
      success: true,
      data: {
        channel: {
          id: channel.id,
          type: channel.type,
          name: channel.name,
          description: channel.description,
          createdBy: channel.createdBy,
          creator: channel.creator,
          memberCount: members.length,
        },
        userRole: participant.role,
        members,
      },
    })
  }

  /**
   * Update channel (admin only)
   */
  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const { id: channelId } = await vine.validate({
      schema: channelIdParamsSchema,
      data: params,
    })
    const data = await request.validateUsing(updateChannelSchema)

    const participant = await ChannelParticipant.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .whereNull('left_at')
      .first()

    if (!participant || participant.role !== 'admin') {
      return response.status(403).json({
        success: false,
        message: 'Only admins can update the channel',
      })
    }

    const channel = await Channel.findOrFail(channelId)

    if (data.name) channel.name = data.name
    if (data.description !== undefined) channel.description = data.description || null

    await channel.save()
    await channel.load('creator')

    return response.json({
      success: true,
      data: { channel },
    })
  }

  /**
   * Delete channel (admin only)
   */
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const { id: channelId } = await vine.validate({
      schema: channelIdParamsSchema,
      data: params,
    })

    const participant = await ChannelParticipant.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .whereNull('left_at')
      .first()

    if (!participant || participant.role !== 'admin') {
      return response.status(403).json({
        success: false,
        message: 'Only admins can delete the channel',
      })
    }

    const channel = await Channel.findOrFail(channelId)
    await channel.delete()

    return response.json({
      success: true,
      message: 'Channel deleted successfully',
    })
  }

  /**
   * Join public channel
   */
  async join({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const { id: channelId } = await vine.validate({
      schema: channelIdParamsSchema,
      data: params,
    })

    const channel = await Channel.findOrFail(channelId)

    if (channel.type !== 'public') {
      return response.status(403).json({
        success: false,
        message: 'This is a private channel. You need an invitation to join.',
      })
    }

    // Check if user is currently a member
    const activeParticipant = await ChannelParticipant.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .whereNull('left_at')
      .first()

    if (activeParticipant) {
      return response.status(422).json({
        success: false,
        message: 'You are already a member of this channel',
      })
    }

    // Check if user previously left and rejoin them
    const previousParticipant = await ChannelParticipant.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .whereNotNull('left_at')
      .first()

    if (previousParticipant) {
      // Rejoin: clear left_at and update joined_at
      previousParticipant.leftAt = null
      previousParticipant.joinedAt = DateTime.now()
      await previousParticipant.save()
    } else {
      // First time joining
      await ChannelParticipant.create({
        channelId: channel.id,
        userId: user.id,
        role: 'member',
        addedBy: null,
        joinedAt: DateTime.now(),
      })
    }

    // Get updated member count and the participant record with role
    const memberCount = await ChannelParticipant.query()
      .where('channel_id', channelId)
      .whereNull('left_at')
      .count('* as total')

    const participant = await ChannelParticipant.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .whereNull('left_at')
      .first()

    // Broadcast member joined event to channel
    transmit.broadcast(`channels/${channelId}`, {
      type: 'member_joined',
      data: {
        channelId,
        user: {
          id: user.id,
          nickName: user.nickName,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          status: user.status,
        },
        role: participant?.role || 'member',
        memberCount: memberCount[0].$extras.total,
      },
    })

    return response.json({
      success: true,
      message: 'Joined channel successfully',
    })
  }

  /**
   * Leave channel
   */
  async leave({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const { id: channelId } = await vine.validate({
      schema: channelIdParamsSchema,
      data: params,
    })

    const participant = await ChannelParticipant.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .whereNull('left_at')
      .first()

    if (!participant) {
      return response.status(404).json({
        success: false,
        message: 'You are not a member of this channel',
      })
    }

    const channel = await Channel.findOrFail(channelId)

    // Mark user as left
    participant.leftAt = DateTime.now()
    await participant.save()

    // Check remaining members
    const remainingMembers = await ChannelParticipant.query()
      .where('channel_id', channelId)
      .whereNull('left_at')

    // Check if there are any remaining admins
    const remainingAdmins = remainingMembers.filter((p) => p.role === 'admin')

    // Delete channel if no members left OR if leaving user was admin and no admins remain
    if (
      remainingMembers.length === 0 ||
      (participant.role === 'admin' && remainingAdmins.length === 0)
    ) {
      await channel.delete()

      // Broadcast channel deleted event
      transmit.broadcast(`channels/${channelId}`, {
        type: 'channel_deleted',
        data: {
          channelId,
          reason: remainingMembers.length === 0 ? 'no_members' : 'no_admins',
        },
      })

      return response.json({
        success: true,
        message: 'Left channel successfully. Channel has been deleted.',
        channelDeleted: true,
      })
    }

    // Broadcast member left event to channel
    transmit.broadcast(`channels/${channelId}`, {
      type: 'member_left',
      data: {
        channelId,
        userId: user.id,
        memberCount: remainingMembers.length,
      },
    })

    return response.json({
      success: true,
      message: 'Left channel successfully',
    })
  }

  /**
   * Invite user to channel
   */
  async invite({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const { id: channelId } = await vine.validate({
      schema: channelIdParamsSchema,
      data: params,
    })
    const data = await request.validateUsing(inviteSchema)

    const participant = await ChannelParticipant.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .whereNull('left_at')
      .first()

    if (!participant) {
      return response.status(403).json({
        success: false,
        message: 'You are not a member of this channel',
      })
    }

    const channel = await Channel.findOrFail(channelId)

    // Only admins can invite users to any channel (both private and public)
    if (participant.role !== 'admin') {
      return response.status(403).json({
        success: false,
        message: 'Only admins can invite users to channels',
      })
    }

    const invitedUser = await User.find(data.userId)
    if (!invitedUser) {
      return response.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    const existingParticipant = await ChannelParticipant.query()
      .where('channel_id', channelId)
      .where('user_id', data.userId)
      .whereNull('left_at')
      .first()

    if (existingParticipant) {
      return response.status(422).json({
        success: false,
        message: 'User is already a member of this channel',
      })
    }

    const existingInvitation = await Invitation.query()
      .where('channel_id', channelId)
      .where('invited_user_id', data.userId)
      .where('status', 'pending')
      .first()

    if (existingInvitation) {
      return response.status(422).json({
        success: false,
        message: 'User already has a pending invitation to this channel',
      })
    }

    await Invitation.create({
      channelId: channel.id,
      invitedUserId: data.userId,
      invitedBy: user.id,
      status: 'pending',
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    return response.json({
      success: true,
      message: 'Invitation sent successfully',
    })
  }
}
