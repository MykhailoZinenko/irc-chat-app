import type { HttpContext } from '@adonisjs/core/http'
import Chat from '#models/chat'
import ChatParticipant from '#models/chat_participant'
import User from '#models/user'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

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

export default class ChannelController {
  /**
   * List user's channels
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.user!

    const participants = await ChatParticipant.query()
      .where('user_id', user.id)
      .whereNull('left_at')
      .preload('chat', (query) => {
        query.preload('creator')
      })

    const channels = participants.map((p) => ({
      id: p.chat.id,
      type: p.chat.type,
      name: p.chat.name,
      description: p.chat.description,
      createdBy: p.chat.createdBy,
      creator: p.chat.creator,
      role: p.role,
      joinedAt: p.joinedAt,
      lastActivityAt: p.chat.lastActivityAt,
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

    const chat = await Chat.create({
      type: data.type,
      name: data.name,
      description: data.description || null,
      createdBy: user.id,
      lastActivityAt: DateTime.now(),
    })

    await ChatParticipant.create({
      chatId: chat.id,
      userId: user.id,
      role: 'admin',
      addedBy: null,
      joinedAt: DateTime.now(),
    })

    await chat.load('creator')

    return response.status(201).json({
      success: true,
      data: { channel: chat },
    })
  }

  /**
   * Get channel details
   */
  async show({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const channelId = params.id

    const participant = await ChatParticipant.query()
      .where('chat_id', channelId)
      .where('user_id', user.id)
      .whereNull('left_at')
      .first()

    if (!participant) {
      return response.status(403).json({
        success: false,
        message: 'You are not a member of this channel',
      })
    }

    const chat = await Chat.query()
      .where('id', channelId)
      .preload('creator')
      .preload('participants', (query) => {
        query.whereNull('left_at').preload('user')
      })
      .firstOrFail()

    return response.json({
      success: true,
      data: { channel: chat, userRole: participant.role },
    })
  }

  /**
   * Update channel (admin only)
   */
  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const channelId = params.id
    const data = await request.validateUsing(updateChannelSchema)

    const participant = await ChatParticipant.query()
      .where('chat_id', channelId)
      .where('user_id', user.id)
      .whereNull('left_at')
      .first()

    if (!participant || participant.role !== 'admin') {
      return response.status(403).json({
        success: false,
        message: 'Only admins can update the channel',
      })
    }

    const chat = await Chat.findOrFail(channelId)

    if (data.name) chat.name = data.name
    if (data.description !== undefined) chat.description = data.description || null

    await chat.save()
    await chat.load('creator')

    return response.json({
      success: true,
      data: { channel: chat },
    })
  }

  /**
   * Delete channel (admin only)
   */
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const channelId = params.id

    const participant = await ChatParticipant.query()
      .where('chat_id', channelId)
      .where('user_id', user.id)
      .whereNull('left_at')
      .first()

    if (!participant || participant.role !== 'admin') {
      return response.status(403).json({
        success: false,
        message: 'Only admins can delete the channel',
      })
    }

    const chat = await Chat.findOrFail(channelId)
    await chat.delete()

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
    const channelId = params.id

    const chat = await Chat.findOrFail(channelId)

    if (chat.type !== 'public') {
      return response.status(403).json({
        success: false,
        message: 'This is a private channel. You need an invitation to join.',
      })
    }

    const existingParticipant = await ChatParticipant.query()
      .where('chat_id', channelId)
      .where('user_id', user.id)
      .whereNull('left_at')
      .first()

    if (existingParticipant) {
      return response.status(422).json({
        success: false,
        message: 'You are already a member of this channel',
      })
    }

    await ChatParticipant.create({
      chatId: chat.id,
      userId: user.id,
      role: 'member',
      addedBy: null,
      joinedAt: DateTime.now(),
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
    const channelId = params.id

    const participant = await ChatParticipant.query()
      .where('chat_id', channelId)
      .where('user_id', user.id)
      .whereNull('left_at')
      .first()

    if (!participant) {
      return response.status(404).json({
        success: false,
        message: 'You are not a member of this channel',
      })
    }

    participant.leftAt = DateTime.now()
    await participant.save()

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
    const channelId = params.id
    const data = await request.validateUsing(inviteSchema)

    const participant = await ChatParticipant.query()
      .where('chat_id', channelId)
      .where('user_id', user.id)
      .whereNull('left_at')
      .first()

    if (!participant) {
      return response.status(403).json({
        success: false,
        message: 'You are not a member of this channel',
      })
    }

    const chat = await Chat.findOrFail(channelId)

    if (chat.type === 'public' && participant.role !== 'admin') {
      return response.status(403).json({
        success: false,
        message: 'Only admins can invite users to public channels',
      })
    }

    const invitedUser = await User.find(data.userId)
    if (!invitedUser) {
      return response.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    const existingParticipant = await ChatParticipant.query()
      .where('chat_id', channelId)
      .where('user_id', data.userId)
      .whereNull('left_at')
      .first()

    if (existingParticipant) {
      return response.status(422).json({
        success: false,
        message: 'User is already a member of this channel',
      })
    }

    await ChatParticipant.create({
      chatId: chat.id,
      userId: data.userId,
      role: 'member',
      addedBy: user.id,
      joinedAt: DateTime.now(),
    })

    return response.json({
      success: true,
      message: 'User invited successfully',
    })
  }
}
