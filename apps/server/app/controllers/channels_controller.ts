import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import ChannelParticipant from '#models/channel_participant'
import Invitation from '#models/invitation'
import User from '#models/user'
import ChannelBan from '#models/channel_ban'
import KickVote from '#models/kick_vote'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import { emitToUser, emitToUsers } from '#services/realtime'

const KICK_VOTE_THRESHOLD = 3

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

const kickSchema = vine.compile(
  vine.object({
    userId: vine.number(),
    reason: vine.string().trim().maxLength(255).optional(),
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

    // Block banned users from joining
    const activeBan = await ChannelBan.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .whereNull('lifted_at')
      .first()

    if (activeBan) {
      return response.status(403).json({
        success: false,
        message: 'You are banned from this channel',
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
    emitToUsers(
      channelMembers.map((m) => m.userId),
      memberJoinedPayload
    )

    // Also broadcast user_joined_channel to the joining user
    emitToUser(user.id, {
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
      emitToUsers(
        remainingMembers.map((m) => m.userId),
        channelDeletedPayload
      )

      // Also notify the leaving user
      emitToUser(user.id, channelDeletedPayload)

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
    emitToUsers(
      remainingMembers.map((m) => m.userId),
      memberLeftPayload
    )

    // Broadcast user_left_channel to the leaving user
    emitToUser(user.id, {
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

    if (channel.type === 'private' && participant.role !== 'admin') {
      return response.status(403).json({
        success: false,
        message: 'Only admins can invite users to private channels',
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

    // Handle existing bans for public channels
    const activeBan = await ChannelBan.query()
      .where('channel_id', channelId)
      .where('user_id', data.userId)
      .whereNull('lifted_at')
      .first()

    if (activeBan) {
      if (participant.role !== 'admin') {
        return response.status(403).json({
          success: false,
          message: 'Only admins can re-invite a banned user',
        })
      }

      activeBan.liftedAt = DateTime.now()
      await activeBan.save()

      // Clear any previous votes for this user
      await KickVote.query()
        .where('channel_id', channelId)
        .where('target_user_id', data.userId)
        .delete()
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
    emitToUser(data.userId, {
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
   * Invite user to channel by username
   */
  async inviteByName({ auth, params, request, response }: HttpContext) {
    const { username } = request.body()

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return response.status(400).json({
        success: false,
        message: 'Username is required',
      })
    }

    const invitedUser = await User.query().where('nick_name', username.trim()).first()
    
    if (!invitedUser) {
      return response.status(404).json({
        success: false,
        message: 'User does not exist',
      })
    }

    const mockRequest = {
      ...request,
      validateUsing: async () => ({
        userId: invitedUser.id,
      }),
    }

    return await this.invite({
      auth,
      params,
      request: mockRequest,
      response,
    } as any)
  }

  /**
   * Revoke (remove) a user from a private channel (admin only)
   */
  async revoke({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const { id: channelId } = await vine.validate({
      schema: channelIdParamsSchema,
      data: params,
    })
    const { userId: targetUserId } = await request.validateUsing(inviteSchema)

    const channel = await Channel.findOrFail(channelId)

    if (channel.type !== 'private') {
      return response.status(403).json({
        success: false,
        message: 'Revoke is only available for private channels',
      })
    }

    const actorParticipant = await ChannelParticipant.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .whereNull('left_at')
      .first()

    if (!actorParticipant || actorParticipant.role !== 'admin') {
      return response.status(403).json({
        success: false,
        message: 'Only admins can revoke users from this channel',
      })
    }

    const targetParticipant = await ChannelParticipant.query()
      .where('channel_id', channelId)
      .where('user_id', targetUserId)
      .whereNull('left_at')
      .first()

    if (!targetParticipant) {
      return response.status(404).json({
        success: false,
        message: 'User is not a member of this channel',
      })
    }

    if (targetParticipant.role === 'admin') {
      return response.status(422).json({
        success: false,
        message: 'You cannot revoke another admin from the channel',
      })
    }

    targetParticipant.leftAt = DateTime.now()
    await targetParticipant.save()

    const remainingMembers = await ChannelParticipant.query()
      .where('channel_id', channelId)
      .whereNull('left_at')

    const memberLeftPayload = {
      type: 'member_left',
      data: {
        channelId,
        userId: targetUserId,
        memberCount: remainingMembers.length,
      },
    }

    emitToUsers(
      remainingMembers.map((m) => m.userId),
      memberLeftPayload
    )

    emitToUser(targetUserId, {
      type: 'user_left_channel',
      data: {
        userId: targetUserId,
        channelId,
        channelName: channel.name,
      },
    })

    return response.json({
      success: true,
      message: 'User removed from the channel',
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

    // If user is banned from the channel, block acceptance
    const activeBan = await ChannelBan.query()
      .where('channel_id', invitation.channelId)
      .where('user_id', user.id)
      .whereNull('lifted_at')
      .first()

    if (activeBan) {
      return response.status(403).json({
        success: false,
        message: 'You are banned from this channel',
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
    emitToUsers(
      channelMembers.map((m) => m.userId),
      memberJoinedPayload
    )

    // Also broadcast user_joined_channel to the joining user
    emitToUser(user.id, {
      type: 'user_joined_channel',
      data: {
        userId: user.id,
        channelId: invitation.channelId,
        channelName: invitation.channel.name,
      },
    })

    // Broadcast invitation_accepted to inviter
    emitToUser(invitation.invitedBy, {
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
    emitToUser(invitation.invitedBy, {
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

  /**
   * Kick/ban logic for public channels
   */
  async kick({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const { id: channelId } = await vine.validate({
      schema: channelIdParamsSchema,
      data: params,
    })
    const { userId: targetUserId, reason } = await request.validateUsing(kickSchema)

    if (targetUserId === user.id) {
      return response.status(422).json({
        success: false,
        message: 'You cannot kick yourself',
      })
    }

    const channel = await Channel.findOrFail(channelId)

    if (channel.type !== 'public') {
      return response.status(403).json({
        success: false,
        message: 'Kick is only available for public channels',
      })
    }

    const actorParticipant = await ChannelParticipant.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .whereNull('left_at')
      .first()

    if (!actorParticipant) {
      return response.status(403).json({
        success: false,
        message: 'You are not a member of this channel',
      })
    }

    const targetParticipant = await ChannelParticipant.query()
      .where('channel_id', channelId)
      .where('user_id', targetUserId)
      .whereNull('left_at')
      .first()

    if (!targetParticipant) {
      return response.status(404).json({
        success: false,
        message: 'User is not an active member of this channel',
      })
    }

    // Block kicking other admins unless current user is admin
    if (targetParticipant.role === 'admin' && actorParticipant.role !== 'admin') {
      return response.status(403).json({
        success: false,
        message: 'You cannot kick an admin',
      })
    }

    const activeBan = await ChannelBan.query()
      .where('channel_id', channelId)
      .where('user_id', targetUserId)
      .whereNull('lifted_at')
      .first()

    if (activeBan) {
      return response.status(422).json({
        success: false,
        message: 'User is already banned from this channel',
      })
    }

    // Admin can ban immediately
    if (actorParticipant.role === 'admin') {
      const memberCount = await this.banUserFromPublicChannel(channel, targetParticipant, user.id, reason)

      return response.json({
        success: true,
        message: 'User has been banned from the channel',
        memberCount,
      })
    }

    // Record kick vote
    try {
      await KickVote.create({
        channelId,
        targetUserId,
        voterId: user.id,
      })
    } catch (error: any) {
      if (error.code === '23505') {
        return response.status(422).json({
          success: false,
          message: 'You have already voted to kick this user',
        })
      }
      throw error
    }

    const voteCount = await KickVote.query()
      .where('channel_id', channelId)
      .where('target_user_id', targetUserId)
      .count('* as total')

    const totalVotes = Number(voteCount[0].$extras.total)

    if (totalVotes >= KICK_VOTE_THRESHOLD) {
      const memberCount = await this.banUserFromPublicChannel(
        channel,
        targetParticipant,
        null,
        reason || 'Reached vote threshold'
      )

      return response.json({
        success: true,
        message: 'User has been banned after reaching the vote threshold',
        memberCount,
      })
    }

    return response.json({
      success: true,
      message: `Kick vote recorded (${totalVotes}/${KICK_VOTE_THRESHOLD})`,
      votes: totalVotes,
    })
  }

  /**
   * Shared ban helper for public channels
   */
  private async banUserFromPublicChannel(
    channel: Channel,
    targetParticipant: ChannelParticipant,
    bannedBy: number | null,
    reason?: string
  ) {
    const existingBan = await ChannelBan.query()
      .where('channel_id', channel.id)
      .where('user_id', targetParticipant.userId)
      .first()

    if (existingBan) {
      existingBan.bannedBy = bannedBy
      existingBan.reason = reason || existingBan.reason
      existingBan.liftedAt = null
      existingBan.bannedAt = DateTime.now()
      await existingBan.save()
    } else {
      await ChannelBan.create({
        channelId: channel.id,
        userId: targetParticipant.userId,
        bannedBy,
        reason: reason || null,
        bannedAt: DateTime.now(),
        liftedAt: null,
      })
    }

    targetParticipant.leftAt = DateTime.now()
    await targetParticipant.save()

    await KickVote.query()
      .where('channel_id', channel.id)
      .where('target_user_id', targetParticipant.userId)
      .delete()

    const remainingMembers = await ChannelParticipant.query()
      .where('channel_id', channel.id)
      .whereNull('left_at')

    const memberLeftPayload = {
      type: 'member_left',
      data: {
        channelId: channel.id,
        userId: targetParticipant.userId,
        memberCount: remainingMembers.length,
      },
    }

    emitToUsers(
      remainingMembers.map((m) => m.userId),
      memberLeftPayload
    )

    emitToUser(targetParticipant.userId, {
      type: 'user_left_channel',
      data: {
        userId: targetParticipant.userId,
        channelId: channel.id,
        channelName: channel.name,
      },
    })

    return remainingMembers.length
  }
}
