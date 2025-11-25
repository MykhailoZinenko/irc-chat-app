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

const invitationIdParamsSchema = vine.object({
  invitationId: vine.number(),
})

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

    // Check if channel name already exists
    const existingChannel = await Channel.query().where('name', data.name).first()
    if (existingChannel) {
      return response.status(422).json({
        success: false,
        message: 'A channel with this name already exists',
      })
    }

    try {
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
    } catch (error) {
      // Handle unique constraint violation
      if (error.code === '23505' || error.constraint?.includes('unique')) {
        return response.status(422).json({
          success: false,
          message: 'A channel with this name already exists',
        })
      }
      throw error
    }
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

    const channel = await Channel.query()
      .where('id', channelId)
      .preload('creator')
      .preload('participants', (query) => {
        query.whereNull('left_at').preload('user')
      })
      .firstOrFail()

    const participant = await ChannelParticipant.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .whereNull('left_at')
      .first()

    if (!participant && channel.type === 'private') {
      return response.status(403).json({
        success: false,
        message: 'You are not a member of this channel',
      })
    }

    const members = channel.participants.map((p) => ({
      id: p.user.id,
      nickName: p.user.nickName,
      firstName: p.user.firstName,
      lastName: p.user.lastName,
      email: p.user.email,
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
        userRole: participant?.role || null,
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

    // Check if new name already exists (excluding current channel)
    if (data.name && data.name !== channel.name) {
      const existingChannel = await Channel.query()
        .where('name', data.name)
        .whereNot('id', channelId)
        .first()

      if (existingChannel) {
        return response.status(422).json({
          success: false,
          message: 'A channel with this name already exists',
        })
      }
    }

    try {
      if (data.name) channel.name = data.name
      if (data.description !== undefined) channel.description = data.description || null

      await channel.save()
      await channel.load('creator')

      return response.json({
        success: true,
        data: { channel },
      })
    } catch (error) {
      // Handle unique constraint violation
      if (error.code === '23505' || error.constraint?.includes('unique')) {
        return response.status(422).json({
          success: false,
          message: 'A channel with this name already exists',
        })
      }
      throw error
    }
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

    // Get all channel members to broadcast to their user channels
    const channelMembers = await ChannelParticipant.query()
      .where('channel_id', channelId)
      .whereNull('left_at')
      .select('user_id')

    const memberJoinedPayload = {
      type: 'member_joined',
      data: {
        channelId,
        user: {
          id: user.id,
          nickName: user.nickName,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        role: participant?.role || 'member',
        memberCount: memberCount[0].$extras.total,
      },
    }

    // Broadcast to all channel members' user channels
    for (const member of channelMembers) {
      transmit.broadcast(`users/${member.userId}`, memberJoinedPayload)
    }

    // Also broadcast user_joined_channel to the joining user
    transmit.broadcast(`users/${user.id}`, {
      type: 'user_joined_channel',
      data: {
        userId: user.id,
        channelId,
        channelName: channel.name,
      },
    })

    return response.json({
      success: true,
      message: 'Joined channel successfully',
    })
  }
  /**
   * Join public channel by name or create new one if doesn't exist
   */
  async joinByName({ auth, params, request, response }: HttpContext) {
    const { name } = request.body()
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return response.status(400).json({
        success: false,
        message: 'Channel name is required',
      })
    }

    const channelName = name.trim()
    const channel = await Channel.query().where('name', channelName).first()

    // If channel doesn't exist, create a new public channel
    if (!channel) {
      const mockRequest = {
        ...request,
        validateUsing: async () => ({
          type: 'public' as const,
          name: channelName,
          description: undefined,
        }),
      }
      return await this.create({
        auth,
        request: mockRequest,
        response,
      } as any)
    }
    // Else join/request to join an existing channel
    const mockParams = { ...params, id: channel.id }
    return await this.join({
      auth,
      params: mockParams,
      request,
      response,
    } as any)
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
      const channelDeletedPayload = {
        type: 'channel_deleted',
        data: {
          channelId,
          reason: remainingMembers.length === 0 ? 'no_members' : 'no_admins',
        },
      }

      // Broadcast to all remaining members (if any) before deleting
      for (const member of remainingMembers) {
        transmit.broadcast(`users/${member.userId}`, channelDeletedPayload)
      }

      // Also notify the leaving user
      transmit.broadcast(`users/${user.id}`, channelDeletedPayload)

      await channel.delete()

      return response.json({
        success: true,
        message: 'Left channel successfully. Channel has been deleted.',
        channelDeleted: true,
      })
    }

    const memberLeftPayload = {
      type: 'member_left',
      data: {
        channelId,
        userId: user.id,
        memberCount: remainingMembers.length,
      },
    }

    // Broadcast to all remaining channel members' user channels
    for (const member of remainingMembers) {
      transmit.broadcast(`users/${member.userId}`, memberLeftPayload)
    }

    // Broadcast user_left_channel to the leaving user
    transmit.broadcast(`users/${user.id}`, {
      type: 'user_left_channel',
      data: {
        userId: user.id,
        channelId,
        channelName: channel.name,
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

    if (data.userId === user.id) {
      return response.status(422).json({
        success: false,
        message: 'You cannot invite yourself',
      })
    }

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

    const invitation = await Invitation.create({
      channelId: channel.id,
      invitedUserId: data.userId,
      invitedBy: user.id,
      status: 'pending',
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    // Broadcast invitation_received to invited user
    transmit.broadcast(`users/${data.userId}`, {
      type: 'invitation_received',
      data: {
        invitationId: invitation.id,
        channelId: channel.id,
        channelName: channel.name,
        channelType: channel.type,
        channelDescription: channel.description,
        inviterId: user.id,
        inviterNickName: user.nickName,
        inviterFirstName: user.firstName,
        inviterLastName: user.lastName,
        inviterEmail: user.email,
        createdAt: invitation.createdAt.toISO(),
        expiresAt: invitation.expiresAt?.toISO() || null,
      },
    })

    return response.json({
      success: true,
      message: 'Invitation sent successfully',
    })
  }

  /**
   * Accept invitation
   */
  async acceptInvitation({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const { invitationId } = await vine.validate({
      schema: invitationIdParamsSchema,
      data: params,
    })

    const invitation = await Invitation.query()
      .where('id', invitationId)
      .where('invited_user_id', user.id)
      .where('status', 'pending')
      .preload('channel')
      .preload('inviter')
      .first()

    if (!invitation) {
      return response.status(404).json({
        success: false,
        message: 'Invitation not found or already processed',
      })
    }

    // Check if user is already a member
    const existingParticipant = await ChannelParticipant.query()
      .where('channel_id', invitation.channelId)
      .where('user_id', user.id)
      .whereNull('left_at')
      .first()

    if (existingParticipant) {
      invitation.status = 'accepted'
      invitation.respondedAt = DateTime.now()
      await invitation.save()

      return response.status(422).json({
        success: false,
        message: 'You are already a member of this channel',
      })
    }

    // Check if user previously left and rejoin them
    const previousParticipant = await ChannelParticipant.query()
      .where('channel_id', invitation.channelId)
      .where('user_id', user.id)
      .whereNotNull('left_at')
      .first()

    if (previousParticipant) {
      previousParticipant.leftAt = null
      previousParticipant.joinedAt = DateTime.now()
      previousParticipant.addedBy = invitation.invitedBy
      await previousParticipant.save()
    } else {
      await ChannelParticipant.create({
        channelId: invitation.channelId,
        userId: user.id,
        role: 'member',
        addedBy: invitation.invitedBy,
        joinedAt: DateTime.now(),
      })
    }

    // Update invitation status
    invitation.status = 'accepted'
    invitation.respondedAt = DateTime.now()
    await invitation.save()

    // Get updated member count and participant with role
    const memberCount = await ChannelParticipant.query()
      .where('channel_id', invitation.channelId)
      .whereNull('left_at')
      .count('* as total')

    const participant = await ChannelParticipant.query()
      .where('channel_id', invitation.channelId)
      .where('user_id', user.id)
      .whereNull('left_at')
      .first()

    // Get all channel members to broadcast to their user channels
    const channelMembers = await ChannelParticipant.query()
      .where('channel_id', invitation.channelId)
      .whereNull('left_at')
      .select('user_id')

    const memberJoinedPayload = {
      type: 'member_joined',
      data: {
        channelId: invitation.channelId,
        user: {
          id: user.id,
          nickName: user.nickName,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        role: participant?.role || 'member',
        memberCount: memberCount[0].$extras.total,
      },
    }

    // Broadcast to all channel members' user channels
    for (const member of channelMembers) {
      transmit.broadcast(`users/${member.userId}`, memberJoinedPayload)
    }

    // Also broadcast user_joined_channel to the joining user
    transmit.broadcast(`users/${user.id}`, {
      type: 'user_joined_channel',
      data: {
        userId: user.id,
        channelId: invitation.channelId,
        channelName: invitation.channel.name,
      },
    })

    // Broadcast invitation_accepted to inviter
    transmit.broadcast(`users/${invitation.invitedBy}`, {
      type: 'invitation_accepted',
      data: {
        invitationId: invitation.id,
        channelId: invitation.channelId,
        channelName: invitation.channel.name,
        userId: user.id,
        userNickName: user.nickName,
        userFirstName: user.firstName,
        userLastName: user.lastName,
      },
    })

    return response.json({
      success: true,
      message: 'Invitation accepted successfully',
    })
  }

  /**
   * Decline invitation
   */
  async declineInvitation({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const { invitationId } = await vine.validate({
      schema: invitationIdParamsSchema,
      data: params,
    })

    const invitation = await Invitation.query()
      .where('id', invitationId)
      .where('invited_user_id', user.id)
      .where('status', 'pending')
      .preload('channel')
      .first()

    if (!invitation) {
      return response.status(404).json({
        success: false,
        message: 'Invitation not found or already processed',
      })
    }

    // Update invitation status
    invitation.status = 'rejected'
    invitation.respondedAt = DateTime.now()
    await invitation.save()

    // Broadcast invitation_declined to inviter
    transmit.broadcast(`users/${invitation.invitedBy}`, {
      type: 'invitation_declined',
      data: {
        invitationId: invitation.id,
        channelId: invitation.channelId,
        channelName: invitation.channel.name,
        userId: user.id,
        userNickName: user.nickName,
        userFirstName: user.firstName,
        userLastName: user.lastName,
      },
    })

    return response.json({
      success: true,
      message: 'Invitation declined',
    })
  }
}
