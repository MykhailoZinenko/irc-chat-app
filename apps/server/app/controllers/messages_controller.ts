import type { HttpContext } from '@adonisjs/core/http'
import Message from '#models/message'
import MessageRead from '#models/message_read'
import ChannelParticipant from '#models/channel_participant'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import transmit from '@adonisjs/transmit/services/main'

const sendMessageSchema = vine.compile(
  vine.object({
    content: vine.string().trim().minLength(1).maxLength(5000),
  })
)

const channelIdParamsSchema = vine.object({
  id: vine.number(),
})

const messageIdParamsSchema = vine.object({
  messageId: vine.number(),
})

export default class MessagesController {
  /**
   * Send message to channel
   */
  async sendMessage({ params, request, auth, response }: HttpContext) {
    const user = auth.user!
    const { id: channelId } = await vine.validate({
      schema: channelIdParamsSchema,
      data: params,
    })
    const data = await request.validateUsing(sendMessageSchema)

    // Check if user is a member of the channel
    const participant = await ChannelParticipant.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .whereNull('left_at')
      .preload('channel', (query) => {
        query.preload('participants', (pQuery) => {
          pQuery.whereNull('left_at')
        })
      })
      .first()

    if (!participant) {
      return response.status(403).json({
        success: false,
        message: 'You are not a member of this channel',
      })
    }

    // Create the message
    const message = await Message.create({
      channelId: channelId,
      senderId: user.id,
      content: data.content,
    })

    await message.load('sender')

    // Update channel's lastActivityAt
    await participant.channel.merge({ lastActivityAt: DateTime.now() }).save()

    // Create delivered status for all channel participants (including sender)
    const participants = participant.channel.participants
    const deliveredAt = DateTime.now()

    await Promise.all(
      participants.map((p) =>
        MessageRead.create({
          userId: p.userId,
          messageId: message.id,
          deliveredAt: deliveredAt,
          readAt: null,
        })
      )
    )

    // Format message for response
    const formattedMessage = {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      sender: {
        id: message.sender.id,
        fullName: message.sender.fullName,
        nickName: message.sender.nickName,
      },
      channelId: message.channelId,
      createdAt: message.createdAt.toISO(),
      status: {
        sent: true,
        delivered: true,
        read: false,
        deliveredAt: deliveredAt.toISO(),
        readAt: null,
      },
    }

    // Broadcast to each participant individually (not to the channel)
    for (const p of participants) {
      transmit.broadcast(`users/${p.userId}`, {
        type: 'new_message',
        data: formattedMessage,
      })
    }

    return response.status(201).json({
      success: true,
      data: formattedMessage,
    })
  }

  /**
   * Get messages for a channel with pagination
   */
  async getMessages({ params, auth, request, response }: HttpContext) {
    const user = auth.user!
    const { id: channelId } = await vine.validate({
      schema: channelIdParamsSchema,
      data: params,
    })

    // Check if user is a member of the channel
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

    // Get pagination parameters
    const page = request.input('page', 1)
    const limit = request.input('limit', 50)

    // Fetch messages with pagination
    const messages = await Message.query()
      .where('channel_id', channelId)
      .whereNull('deleted_for_everyone_at')
      .preload('sender')
      .preload('reads', (query) => {
        query.where('user_id', user.id)
      })
      .orderBy('created_at', 'desc')
      .paginate(page, limit)

    // Format messages
    const formattedMessages = messages.all().map((message) => {
      const userRead = message.reads?.[0]

      return {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        sender: {
          id: message.sender.id,
          fullName: message.sender.fullName,
          nickName: message.sender.nickName,
        },
        channelId: message.channelId,
        createdAt: message.createdAt.toISO(),
        status: {
          sent: true,
          delivered: !!userRead?.deliveredAt,
          read: !!userRead?.readAt,
          deliveredAt: userRead?.deliveredAt?.toISO() || null,
          readAt: userRead?.readAt?.toISO() || null,
        },
      }
    })

    return response.json({
      success: true,
      data: {
        messages: formattedMessages,
        meta: messages.getMeta(),
      },
    })
  }

  /**
   * Mark message as read
   */
  async markAsRead({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const { messageId } = await vine.validate({
      schema: messageIdParamsSchema,
      data: params,
    })

    // Check if message exists and user has access
    const message = await Message.query()
      .where('id', messageId)
      .whereHas('channel', (query) => {
        query.whereHas('participants', (pQuery) => {
          pQuery.where('user_id', user.id).whereNull('left_at')
        })
      })
      .first()

    if (!message) {
      return response.status(404).json({
        success: false,
        message: 'Message not found or you do not have access',
      })
    }

    // Update or create read status
    const messageRead = await MessageRead.updateOrCreate(
      { userId: user.id, messageId: message.id },
      { readAt: DateTime.now(), deliveredAt: DateTime.now() }
    )

    const readPayload = {
      type: 'message_read',
      data: {
        messageId: message.id,
        readBy: user.id,
        readAt: messageRead.readAt?.toISO(),
      },
    }

    // Notify sender about read status (only if not the sender)
    if (message.senderId !== user.id) {
      transmit.broadcast(`users/${message.senderId}`, readPayload)
    }

    // Also notify the reader to update their own UI
    transmit.broadcast(`users/${user.id}`, readPayload)

    return response.json({
      success: true,
      data: {
        messageId: message.id,
        readAt: messageRead.readAt?.toISO(),
      },
    })
  }

  /**
   * Mark message as delivered
   */
  async markAsDelivered({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const { messageId } = await vine.validate({
      schema: messageIdParamsSchema,
      data: params,
    })

    // Check if message exists and user has access
    const message = await Message.query()
      .where('id', messageId)
      .whereHas('channel', (query) => {
        query.whereHas('participants', (pQuery) => {
          pQuery.where('user_id', user.id).whereNull('left_at')
        })
      })
      .first()

    if (!message) {
      return response.status(404).json({
        success: false,
        message: 'Message not found or you do not have access',
      })
    }

    // Update or create delivered status (don't overwrite readAt if it exists)
    const messageRead = await MessageRead.updateOrCreate(
      { userId: user.id, messageId: message.id },
      { deliveredAt: DateTime.now() }
    )

    // Notify sender about delivered status (only if not the sender)
    if (message.senderId !== user.id) {
      transmit.broadcast(`users/${message.senderId}`, {
        type: 'message_delivered',
        data: {
          messageId: message.id,
          deliveredTo: user.id,
          deliveredAt: messageRead.deliveredAt?.toISO(),
        },
      })
    }

    return response.json({
      success: true,
      data: {
        messageId: message.id,
        deliveredAt: messageRead.deliveredAt?.toISO(),
      },
    })
  }
}
