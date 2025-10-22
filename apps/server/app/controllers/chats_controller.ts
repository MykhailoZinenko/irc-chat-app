import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import vine from '@vinejs/vine'
import Chat from '#models/chat'
import ChatParticipant from '#models/chat_participant'
import Message from '#models/message'
import MessageRead from '#models/message_read'
import User from '#models/user'
import transmit from '@adonisjs/transmit/services/main'
import { ModelPaginator } from '@adonisjs/lucid/orm'

const sendMessageSchema = vine.compile(
  vine.object({
    content: vine.string().minLength(1),
  })
)

export default class ChatsController {
  async startChat({ request, response, auth }: HttpContext) {
    const userId = request.param('userId')
    const currentUser = auth.user!

    if (parseInt(userId) === currentUser.id) {
      return response.status(400).json({
        success: false,
        message: 'Cannot start chat with yourself',
      })
    }

    const otherUser = await User.find(userId)
    if (!otherUser) {
      return response.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    const existingChat = await Chat.query()
      .where('type', 'direct')
      .whereHas('participants', (query) => {
        query.where('user_id', currentUser.id)
      })
      .whereHas('participants', (query) => {
        query.where('user_id', userId)
      })
      .first()

    if (existingChat) {
      await existingChat.load('participants', (query) => {
        query.preload('user')
      })

      return response.json({
        success: true,
        data: {
          id: existingChat.id,
          type: existingChat.type,
          name: existingChat.name,
          participants: existingChat.participants.map((p) => ({
            id: p.user.id,
            firstName: p.user.firstName,
            lastName: p.user.lastName,
            nickName: p.user.nickName,
            fullName: p.user.fullName,
            role: p.role,
          })),
          createdAt: existingChat.createdAt.toISO(),
        },
      })
    }

    const chat = await Chat.create({
      type: 'direct',
      name: null,
      description: null,
      createdBy: currentUser.id,
    })

    await ChatParticipant.createMany([
      {
        chatId: chat.id,
        userId: currentUser.id,
        role: 'owner',
        addedBy: currentUser.id,
        joinedAt: DateTime.now(),
      },
      {
        chatId: chat.id,
        userId: parseInt(userId),
        role: 'member',
        addedBy: currentUser.id,
        joinedAt: DateTime.now(),
      },
    ])

    await chat.load('participants', (query) => {
      query.preload('user')
    })

    return response.status(201).json({
      success: true,
      data: {
        id: chat.id,
        type: chat.type,
        name: chat.name,
        participants: chat.participants.map((p) => ({
          id: p.user.id,
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          nickName: p.user.nickName,
          fullName: p.user.fullName,
          role: p.role,
        })),
        createdAt: chat.createdAt.toISO(),
      },
    })
  }

  async index({ auth, response }: HttpContext) {
    const user = auth.user!

    const chats = await Chat.query()
      .whereHas('participants', (query) => {
        query.where('user_id', user.id).whereNull('left_at')
      })
      .preload('participants', (query) => {
        query.preload('user')
      })
      .orderBy('updated_at', 'desc')

    // Get last messages for all chats efficiently using raw SQL
    const chatIds = chats.map((chat) => chat.id)
    const lastMessages =
      chatIds.length > 0
        ? await Message.query()
            .whereIn('chat_id', chatIds)
            .whereNull('deleted_for_everyone_at')
            .preload('sender')
            .whereRaw(
              `id IN (
        SELECT DISTINCT ON (chat_id) id
        FROM messages
        WHERE chat_id = ANY(?)
          AND deleted_for_everyone_at IS NULL
        ORDER BY chat_id, created_at DESC
      )`,
              [chatIds]
            )
        : []

    const formattedChats = chats.map((chat) => {
      const otherParticipant = chat.participants.find((p) => p.userId !== user.id)
      const lastMessage = lastMessages.find((msg) => msg.chatId === chat.id) || null

      return {
        id: chat.id,
        type: chat.type,
        name:
          chat.type === 'direct'
            ? otherParticipant?.user.fullName || otherParticipant?.user.nickName
            : chat.name,
        avatar: otherParticipant?.user.fullName || otherParticipant?.user.nickName,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              senderName: lastMessage.sender.fullName || lastMessage.sender.nickName,
              createdAt: lastMessage.createdAt.toISO(),
            }
          : null,
        updatedAt: chat.updatedAt.toISO(),
      }
    })

    return response.json({
      success: true,
      data: formattedChats,
    })
  }

  async show({ params, auth, response }: HttpContext) {
    const chatId = params.id
    const user = auth.user!

    const chat = await Chat.query()
      .where('id', chatId)
      .whereHas('participants', (query) => {
        query.where('user_id', user.id).whereNull('left_at')
      })
      .preload('participants', (query) => {
        query.preload('user')
      })
      .first()

    if (!chat) {
      return response.status(404).json({
        success: false,
        message: 'Chat not found',
      })
    }

    const otherParticipant = chat.participants.find((p) => p.userId !== user.id)

    return response.json({
      success: true,
      data: {
        id: chat.id,
        type: chat.type,
        name:
          chat.type === 'direct'
            ? otherParticipant?.user.fullName || otherParticipant?.user.nickName
            : chat.name,
        participants: chat.participants.map((p) => ({
          id: p.user.id,
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          nickName: p.user.nickName,
          fullName: p.user.fullName,
          role: p.role,
        })),
        createdAt: chat.createdAt.toISO(),
      },
    })
  }

  async messages({ params, request, auth, response }: HttpContext) {
    const chatId = params.id
    const user = auth.user!
    const page = request.input('page', 1)
    const limit = request.input('limit', 50)

    const chat = await Chat.query()
      .where('id', chatId)
      .whereHas('participants', (query) => {
        query.where('user_id', user.id).whereNull('left_at')
      })
      .first()

    if (!chat) {
      return response.status(404).json({
        success: false,
        message: 'Chat not found',
      })
    }

    const messages = (
      await Message.query()
        .where('chat_id', chatId)
        .whereNull('deleted_for_everyone_at')
        .preload('sender')
        .preload('reads')
        .preload('replyToMessage', (query) => {
          query.preload('sender')
        })
        .orderBy('created_at', 'desc')
        .paginate(page, limit)
    ).serialize()

    const formattedMessages = messages.data.map((message: any) => {
      // Get read status for current user and other participants
      const readStatus = message.reads || []
      const isDelivered = readStatus.some((read: any) => read.deliveredAt)
      const isRead = readStatus.some((read: any) => read.readAt)

      return {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        sender: {
          id: message.sender.id,
          firstName: message.sender.firstName,
          lastName: message.sender.lastName,
          nickName: message.sender.nickName,
          fullName: message.sender.fullName,
        },
        replyToMessage: message.replyToMessage
          ? {
              id: message.replyToMessage.id,
              content: message.replyToMessage.content,
              sender: {
                id: message.replyToMessage.sender.id,
                fullName: message.replyToMessage.sender.fullName,
              },
            }
          : null,
        editedAt: message.editedAt || null,
        createdAt: message.createdAt,
        status: {
          sent: true, // Message exists so it's sent
          delivered: isDelivered,
          read: isRead,
          deliveredAt: readStatus.find((read: any) => read.deliveredAt)?.deliveredAt || null,
          readAt: readStatus.find((read: any) => read.readAt)?.readAt || null,
        },
      }
    })

    return response.json({
      success: true,
      data: formattedMessages.reverse(),
      meta: {
        total: messages.meta.total,
        perPage: messages.meta.perPage,
        currentPage: messages.meta.currentPage,
        lastPage: messages.meta.lastPage,
        hasMorePages: messages.meta.hasMorePages,
      },
    })
  }

  async sendMessage({ params, request, auth, response }: HttpContext) {
    const chatId = params.id
    const user = auth.user!

    try {
      const data = await request.validateUsing(sendMessageSchema)

      const chat = await Chat.query()
        .where('id', chatId)
        .whereHas('participants', (query) => {
          query.where('user_id', user.id).whereNull('left_at')
        })
        .preload('participants')
        .first()

      if (!chat) {
        return response.status(404).json({
          success: false,
          message: 'Chat not found',
        })
      }

      const message = await Message.create({
        chatId: chat.id,
        senderId: user.id,
        content: data.content,
        contentMarkdown: null,
        replyToMessageId: null,
      })

      await message.load('sender')

      await Chat.query().where('id', chat.id).update({
        updatedAt: DateTime.now(),
      })

      const formattedMessage = {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        sender: {
          id: message.sender.id,
          firstName: message.sender.firstName,
          lastName: message.sender.lastName,
          nickName: message.sender.nickName,
          fullName: message.sender.fullName,
        },
        chatId: message.chatId,
        createdAt: message.createdAt.toISO(),
        status: {
          sent: true,
          delivered: false,
          read: false,
        },
      }

      console.log(
        'Broadcasting to participants:',
        chat.participants.map((p) => ({ userId: p.userId, type: typeof p.userId }))
      )
      console.log('Current user ID:', user.id, 'type:', typeof user.id)

      for (const participant of chat.participants) {
        if (participant.userId !== user.id) {
          console.log(`Broadcasting message to user:${participant.userId}`)
          try {
            transmit.broadcast(`user:${participant.userId}`, {
              type: 'new_message',
              data: formattedMessage,
            })
            console.log(`Successfully broadcast to user:${participant.userId}`)
          } catch (error) {
            console.error(`Failed to broadcast to user:${participant.userId}`, error)
          }
        } else {
          console.log(`Skipping broadcast to sender (user:${participant.userId})`)
        }
      }

      return response.status(201).json({
        success: true,
        data: formattedMessage,
      })
    } catch (error) {
      return response.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: error.messages || error.message,
      })
    }
  }

  async markAsDelivered({ params, auth, response }: HttpContext) {
    const messageId = params.messageId
    const user = auth.user!

    const message = await Message.query()
      .where('id', messageId)
      .whereHas('chat', (query) => {
        query.whereHas('participants', (participantQuery) => {
          participantQuery.where('user_id', user.id).whereNull('left_at')
        })
      })
      .first()

    if (!message) {
      return response.status(404).json({
        success: false,
        message: 'Message not found',
      })
    }

    await MessageRead.updateOrCreate(
      {
        userId: user.id,
        messageId: message.id,
      },
      {
        deliveredAt: DateTime.now(),
      }
    )

    // Load the message with sender to get sender ID
    await message.load('sender')

    // Notify the message sender about delivery status
    if (message.senderId !== user.id) {
      transmit.broadcast(`user:${message.senderId}`, {
        type: 'message_delivered',
        data: {
          messageId: message.id,
          deliveredTo: user.id,
          deliveredAt: DateTime.now().toISO(),
        },
      })
    }

    return response.json({
      success: true,
      message: 'Message marked as delivered',
    })
  }

  async markAsRead({ params, auth, response }: HttpContext) {
    const messageId = params.messageId
    const user = auth.user!

    const message = await Message.query()
      .where('id', messageId)
      .whereHas('chat', (query) => {
        query.whereHas('participants', (participantQuery) => {
          participantQuery.where('user_id', user.id).whereNull('left_at')
        })
      })
      .first()

    if (!message) {
      return response.status(404).json({
        success: false,
        message: 'Message not found',
      })
    }

    await MessageRead.updateOrCreate(
      {
        userId: user.id,
        messageId: message.id,
      },
      {
        readAt: DateTime.now(),
        deliveredAt: DateTime.now(),
      }
    )

    // Load the message with sender to get sender ID
    await message.load('sender')

    // Notify the message sender about read status
    if (message.senderId !== user.id) {
      transmit.broadcast(`user:${message.senderId}`, {
        type: 'message_read',
        data: {
          messageId: message.id,
          readBy: user.id,
          readAt: DateTime.now().toISO(),
        },
      })
    }

    return response.json({
      success: true,
      message: 'Message marked as read',
    })
  }

  async getMessageStatus({ params, auth, response }: HttpContext) {
    const messageId = params.messageId
    const user = auth.user!

    const message = await Message.query()
      .where('id', messageId)
      .whereHas('chat', (query) => {
        query.whereHas('participants', (participantQuery) => {
          participantQuery.where('user_id', user.id).whereNull('left_at')
        })
      })
      .preload('reads', (query) => {
        query.preload('user')
      })
      .first()

    if (!message) {
      return response.status(404).json({
        success: false,
        message: 'Message not found',
      })
    }

    const statusData = {
      messageId: message.id,
      sent: true, // Message exists, so it's sent
      deliveredTo: message.reads
        .filter((read) => read.deliveredAt)
        .map((read) => ({
          userId: read.userId,
          userName: read.user.fullName || read.user.nickName,
          deliveredAt: read.deliveredAt?.toISO(),
        })),
      readBy: message.reads
        .filter((read) => read.readAt)
        .map((read) => ({
          userId: read.userId,
          userName: read.user.fullName || read.user.nickName,
          readAt: read.readAt?.toISO(),
        })),
    }

    return response.json({
      success: true,
      data: statusData,
    })
  }
}
