import { Server as IOServer } from 'socket.io'
import { DateTime } from 'luxon'
import server from '@adonisjs/core/services/server'
import app from '@adonisjs/core/services/app'
import AccessToken from '#models/access_token'
import User from '#models/user'
import Channel from '#models/channel'
import ChannelParticipant from '#models/channel_participant'
import ChannelBan from '#models/channel_ban'
import Invitation from '#models/invitation'
import KickVote from '#models/kick_vote'
import Message from '#models/message'
import MessageRead from '#models/message_read'
import { Secret } from '@adonisjs/core/helpers'
import { emitToUser, emitToUsers, initializeRealtime } from '#services/realtime'
import { setUserStatus } from '#services/presence'

function getRawToken(socket: any): string | null {
  const authToken = socket.handshake?.auth?.token
  if (authToken && typeof authToken === 'string') {
    return authToken
  }

  const headerAuth = socket.handshake?.headers?.authorization
  if (headerAuth && typeof headerAuth === 'string') {
    return headerAuth
  }

  return null
}

function normalizeToken(raw: string): string {
  let token = raw.trim()
  token = token.replace(/^[{\s"]+/, '').replace(/[}\s"]+$/, '')
  while (token.toLowerCase().startsWith('bearer ')) {
    token = token.slice(7).trim()
  }
  return token
}

async function authenticateSocket(socket: any) {
  const tokenValue = getRawToken(socket)
  if (!tokenValue) {
    throw new Error('UNAUTHORIZED')
  }

  const cleanedToken = normalizeToken(tokenValue)
  try {
    const verified = await User.accessTokens.verify(new Secret(cleanedToken))

    console.log('verified', verified)
    let user = (verified as any).tokenable ?? (verified as any).user

    if (!user && (verified as any).tokenableId) {
      user = await User.find((verified as any).tokenableId)
    }

    if (!user) throw new Error('USER_NOT_FOUND')

    const tokenId = (verified as any).id
    if (tokenId) {
      await AccessToken.query().where('id', tokenId).update({ lastActivityAt: DateTime.now() })
    }

    socket.data.user = user
    return user
  } catch (error: any) {
    console.error('[socket-auth] verify failed', {
      message: error?.message,
      name: error?.name,
      tokenPreview: cleanedToken.slice(0, 8),
      tokenLength: cleanedToken.length,
    })
    throw new Error('INVALID_TOKEN')
  }
}

type AckFn = (payload: any) => void

const ackOk = (ack?: AckFn, data?: any) => ack?.({ ok: true, data })
const ackError = (ack?: AckFn, message: string = 'Unknown error') => ack?.({ ok: false, message })

async function ensureChannelMember(channelId: number, userId: number) {
  return ChannelParticipant.query()
    .where('channel_id', channelId)
    .where('user_id', userId)
    .whereNull('left_at')
    .first()
}

async function joinChannel(channelId: number, user: User, socket: any, ack?: AckFn) {
  const channel = await Channel.find(channelId)
  if (!channel) return ackError(ack, 'Channel not found')

  if (channel.type !== 'public') return ackError(ack, 'Private channel requires invite')

  const ban = await ChannelBan.query()
    .where('channel_id', channelId)
    .where('user_id', user.id)
    .whereNull('lifted_at')
    .first()
  if (ban) return ackError(ack, 'You are banned from this channel')

  const activeParticipant = await ensureChannelMember(channelId, user.id)
  if (activeParticipant) return ackError(ack, 'Already joined')

  const previous = await ChannelParticipant.query()
    .where('channel_id', channelId)
    .where('user_id', user.id)
    .whereNotNull('left_at')
    .first()

  if (previous) {
    previous.leftAt = null
    previous.joinedAt = DateTime.now()
    await previous.save()
  } else {
    await ChannelParticipant.create({
      channelId,
      userId: user.id,
      role: 'member',
      addedBy: null,
      joinedAt: DateTime.now(),
    })
  }

  const memberCount = await ChannelParticipant.query()
    .where('channel_id', channelId)
    .whereNull('left_at')
    .count('* as total')

  const participant = await ensureChannelMember(channelId, user.id)
  const channelMembers = await ChannelParticipant.query()
    .where('channel_id', channelId)
    .whereNull('left_at')
    .select('user_id')

  const payload = {
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
  }

  emitToUsers(
    channelMembers.map((m) => m.userId),
    payload
  )
  emitToUser(user.id, {
    type: 'user_joined_channel',
    data: { userId: user.id, channelId, channelName: channel.name },
  })

  socket.join(`channels:${channelId}`)
  ackOk(ack, { memberCount: memberCount[0].$extras.total })
}

async function createInvitation(channelId: number, actor: User, targetUserId: number) {
  if (targetUserId === actor.id) throw new Error('Cannot invite yourself')

  const participant = await ensureChannelMember(channelId, actor.id)
  if (!participant) throw new Error('Not a member')

  const channel = await Channel.findOrFail(channelId)
  if (channel.type === 'private' && participant.role !== 'admin') {
    throw new Error('Only admins can invite to private channels')
  }

  const invitedUser = await User.find(targetUserId)
  if (!invitedUser) throw new Error('User not found')

  const existingParticipant = await ensureChannelMember(channelId, targetUserId)
  if (existingParticipant) throw new Error('User already a member')

  const activeBan = await ChannelBan.query()
    .where('channel_id', channelId)
    .where('user_id', targetUserId)
    .whereNull('lifted_at')
    .first()

  if (activeBan && participant.role !== 'admin') {
    throw new Error('Only admins can re-invite banned users')
  }
  if (activeBan) {
    activeBan.liftedAt = DateTime.now()
    await activeBan.save()
    await KickVote.query()
      .where('channel_id', channelId)
      .where('target_user_id', targetUserId)
      .delete()
  }

  const existingInvitation = await Invitation.query()
    .where('channel_id', channelId)
    .where('invited_user_id', targetUserId)
    .where('status', 'pending')
    .first()
  if (existingInvitation) throw new Error('Pending invitation exists')

  const invitation = await Invitation.create({
    channelId,
    invitedUserId: targetUserId,
    invitedBy: actor.id,
    status: 'pending',
    expiresAt: DateTime.now().plus({ days: 7 }),
  })

  emitToUser(targetUserId, {
    type: 'invitation_received',
    data: {
      invitationId: invitation.id,
      channelId: channel.id,
      channelName: channel.name,
      channelType: channel.type,
      channelDescription: channel.description,
      inviterId: actor.id,
      inviterNickName: actor.nickName,
      inviterFirstName: actor.firstName,
      inviterLastName: actor.lastName,
      inviterEmail: actor.email,
      createdAt: invitation.createdAt.toISO(),
      expiresAt: invitation.expiresAt?.toISO() || null,
    },
  })

  return invitation
}

async function banUser(
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

function bootSocketsWhenReady() {
  const timer = setInterval(() => {
    const httpServer = server.getNodeServer()
    if (!httpServer) {
      return
    }

    clearInterval(timer)

    const io = new IOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    })

    console.log('booting sockets', server, httpServer)

    io.use(async (socket, next) => {
      try {
        await authenticateSocket(socket)

        console.log('authenticated socket', socket.data.user)
        next()
      } catch (error: any) {
        next(error)
      }
    })

    io.on('connection', async (socket) => {
      const user = socket.data.user as User

      const initialStatus =
        user.status === 'dnd' ? 'dnd' : user.status === 'offline' ? 'online' : user.status || 'online'
      await setUserStatus(user.id, initialStatus)
      socket.data.user.status = initialStatus

      socket.on('disconnect', () => {
        const currentStatus = socket.data.user?.status || initialStatus
        if (currentStatus === 'online') {
          void setUserStatus(user.id, 'offline')
        } else {
          // Preserve explicit DND/offline preference on disconnect
          void setUserStatus(user.id, currentStatus, { broadcast: false })
        }
      })

      // Join the personal room
      socket.join(`users:${user.id}`)

      socket.on('subscribe:channels', (channelIds: number[] = [], ack?: (payload: any) => void) => {
        if (Array.isArray(channelIds)) {
          channelIds.forEach((id) => socket.join(`channels:${id}`))
        }
        ack?.({ ok: true })
      })

      socket.on(
        'unsubscribe:channels',
        (channelIds: number[] = [], ack?: (payload: any) => void) => {
          if (Array.isArray(channelIds)) {
            channelIds.forEach((id) => socket.leave(`channels:${id}`))
          }
          ack?.({ ok: true })
        }
      )

      socket.on('channel:join', async ({ channelId }: { channelId: number }, ack?: AckFn) => {
        try {
          await joinChannel(channelId, user, socket, ack)
        } catch (error: any) {
          ackError(ack, error.message)
        }
      })

      socket.on('channel:joinByName', async ({ name }: { name: string }, ack?: AckFn) => {
        if (!name || typeof name !== 'string') return ackError(ack, 'Name required')
        const channelName = name.trim()
        let channel = await Channel.query().where('name', channelName).first()

        if (!channel) {
          channel = await Channel.create({
            type: 'public',
            name: channelName,
            description: null,
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

          socket.join(`channels:${channel.id}`)
          emitToUser(user.id, {
            type: 'user_joined_channel',
            data: { userId: user.id, channelId: channel.id, channelName: channel.name },
          })
          return ackOk(ack, { channel, created: true })
        }

        const alreadyMember = await ensureChannelMember(channel.id, user.id)
        if (alreadyMember) {
          socket.join(`channels:${channel.id}`)
          emitToUser(user.id, {
            type: 'user_joined_channel',
            data: { userId: user.id, channelId: channel.id, channelName: channel.name },
          })
          return ackOk(ack, { channelId: channel.id, alreadyJoined: true })
        }

        await joinChannel(channel.id, user, socket, ack)
      })

      socket.on('channel:leave', async ({ channelId }: { channelId: number }, ack?: AckFn) => {
        try {
          const participant = await ensureChannelMember(channelId, user.id)
          if (!participant) return ackError(ack, 'Not a member')

          const channel = await Channel.findOrFail(channelId)
          participant.leftAt = DateTime.now()
          await participant.save()

          const remainingMembers = await ChannelParticipant.query()
            .where('channel_id', channelId)
            .whereNull('left_at')

          const remainingAdmins = remainingMembers.filter((p) => p.role === 'admin')
          if (
            remainingMembers.length === 0 ||
            (participant.role === 'admin' && remainingAdmins.length === 0)
          ) {
            const payload = {
              type: 'channel_deleted',
              data: {
                channelId,
                reason: remainingMembers.length === 0 ? 'no_members' : 'no_admins',
              },
            }
            emitToUsers(
              remainingMembers.map((m) => m.userId),
              payload
            )
            emitToUser(user.id, payload)
            await channel.delete()
            socket.leave(`channels:${channelId}`)
            return ackOk(ack, { channelDeleted: true })
          }

          const memberLeftPayload = {
            type: 'member_left',
            data: { channelId, userId: user.id, memberCount: remainingMembers.length },
          }

          emitToUsers(
            remainingMembers.map((m) => m.userId),
            memberLeftPayload
          )
          emitToUser(user.id, {
            type: 'user_left_channel',
            data: { userId: user.id, channelId, channelName: channel.name },
          })
          socket.leave(`channels:${channelId}`)
          ackOk(ack, { memberCount: remainingMembers.length })
        } catch (error: any) {
          ackError(ack, error.message)
        }
      })

      socket.on(
        'channel:create',
        async (
          {
            type,
            name,
            description,
          }: { type: 'private' | 'public'; name: string; description?: string },
          ack?: AckFn
        ) => {
          try {
            if (!name || name.trim().length === 0) return ackError(ack, 'Name is required')
            const existing = await Channel.query().where('name', name.trim()).first()
            if (existing) return ackError(ack, 'Channel name already exists')

            const channel = await Channel.create({
              type,
              name: name.trim(),
              description: description || null,
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

            ackOk(ack, { channel })
          } catch (error: any) {
            ackError(ack, error.message)
          }
        }
      )

      socket.on(
        'channel:update',
        async (
          {
            channelId,
            name,
            description,
          }: { channelId: number; name?: string; description?: string },
          ack?: AckFn
        ) => {
          try {
            const participant = await ensureChannelMember(channelId, user.id)
            if (!participant || participant.role !== 'admin')
              return ackError(ack, 'Only admins can update')

            const channel = await Channel.findOrFail(channelId)
            if (name && name !== channel.name) {
              const exists = await Channel.query()
                .where('name', name)
                .whereNot('id', channelId)
                .first()
              if (exists) return ackError(ack, 'Name already taken')
            }

            if (name) channel.name = name
            if (description !== undefined) channel.description = description || null
            await channel.save()
            ackOk(ack, { channel })
          } catch (error: any) {
            ackError(ack, error.message)
          }
        }
      )

      socket.on('channel:delete', async ({ channelId }: { channelId: number }, ack?: AckFn) => {
        try {
          const participant = await ensureChannelMember(channelId, user.id)
          if (!participant || participant.role !== 'admin')
            return ackError(ack, 'Only admins can delete')
          const channel = await Channel.findOrFail(channelId)
          await channel.delete()
          ackOk(ack, { deleted: true })
        } catch (error: any) {
          ackError(ack, error.message)
        }
      })

      socket.on(
        'channel:invite',
        async ({ channelId, userId }: { channelId: number; userId: number }, ack?: AckFn) => {
          try {
            const invitation = await createInvitation(channelId, user, userId)
            ackOk(ack, { invitationId: invitation.id })
          } catch (error: any) {
            ackError(ack, error.message)
          }
        }
      )

      socket.on(
        'channel:inviteByName',
        async ({ channelId, username }: { channelId: number; username: string }, ack?: AckFn) => {
          try {
            if (!username || typeof username !== 'string')
              return ackError(ack, 'Username is required')
            const invitedUser = await User.query().where('nick_name', username.trim()).first()
            if (!invitedUser) return ackError(ack, 'User does not exist')

            const invitation = await createInvitation(channelId, user, invitedUser.id)
            ackOk(ack, { invitationId: invitation.id })
          } catch (error: any) {
            ackError(ack, error.message)
          }
        }
      )

      socket.on(
        'channel:acceptInvitation',
        async ({ invitationId }: { invitationId: number }, ack?: AckFn) => {
          try {
            const invitation = await Invitation.query()
              .where('id', invitationId)
              .where('invited_user_id', user.id)
              .where('status', 'pending')
              .preload('channel')
              .first()

            if (!invitation) return ackError(ack, 'Invitation not found')

            const activeBan = await ChannelBan.query()
              .where('channel_id', invitation.channelId)
              .where('user_id', user.id)
              .whereNull('lifted_at')
              .first()
            if (activeBan) return ackError(ack, 'You are banned from this channel')

            const existingParticipant = await ensureChannelMember(invitation.channelId, user.id)
            if (existingParticipant) {
              invitation.status = 'accepted'
              invitation.respondedAt = DateTime.now()
              await invitation.save()
              return ackError(ack, 'Already a member')
            }

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

            invitation.status = 'accepted'
            invitation.respondedAt = DateTime.now()
            await invitation.save()

            const memberCount = await ChannelParticipant.query()
              .where('channel_id', invitation.channelId)
              .whereNull('left_at')
              .count('* as total')

            const participant = await ensureChannelMember(invitation.channelId, user.id)
            const channelMembers = await ChannelParticipant.query()
              .where('channel_id', invitation.channelId)
              .whereNull('left_at')
              .select('user_id')

            const payload = {
              type: 'member_joined',
              data: {
                channelId: invitation.channelId,
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
            }

            emitToUsers(
              channelMembers.map((m) => m.userId),
              payload
            )
            emitToUser(user.id, {
              type: 'user_joined_channel',
              data: {
                userId: user.id,
                channelId: invitation.channelId,
                channelName: invitation.channel.name,
              },
            })
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

            socket.join(`channels:${invitation.channelId}`)
            ackOk(ack, { memberCount: memberCount[0].$extras.total })
          } catch (error: any) {
            ackError(ack, error.message)
          }
        }
      )

      socket.on(
        'channel:declineInvitation',
        async ({ invitationId }: { invitationId: number }, ack?: AckFn) => {
          try {
            const invitation = await Invitation.query()
              .where('id', invitationId)
              .where('invited_user_id', user.id)
              .where('status', 'pending')
              .preload('channel')
              .first()

            if (!invitation) return ackError(ack, 'Invitation not found')

            invitation.status = 'rejected'
            invitation.respondedAt = DateTime.now()
            await invitation.save()

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

            ackOk(ack, { declined: true })
          } catch (error: any) {
            ackError(ack, error.message)
          }
        }
      )

      socket.on(
        'channel:revoke',
        async ({ channelId, userId }: { channelId: number; userId: number }, ack?: AckFn) => {
          try {
            const channel = await Channel.findOrFail(channelId)
            if (channel.type !== 'private') return ackError(ack, 'Revoke only for private channels')

            const actor = await ensureChannelMember(channelId, user.id)
            if (!actor || actor.role !== 'admin') return ackError(ack, 'Only admins can revoke')

            const target = await ensureChannelMember(channelId, userId)
            if (!target) return ackError(ack, 'User not a member')
            if (target.role === 'admin') return ackError(ack, 'Cannot revoke another admin')

            target.leftAt = DateTime.now()
            await target.save()

            const remaining = await ChannelParticipant.query()
              .where('channel_id', channelId)
              .whereNull('left_at')
            const memberLeftPayload = {
              type: 'member_left',
              data: { channelId, userId, memberCount: remaining.length },
            }
            emitToUsers(
              remaining.map((m) => m.userId),
              memberLeftPayload
            )
            emitToUser(userId, {
              type: 'user_left_channel',
              data: { userId, channelId, channelName: channel.name },
            })
            socket.leave(`channels:${channelId}`)
            ackOk(ack, { memberCount: remaining.length })
          } catch (error: any) {
            ackError(ack, error.message)
          }
        }
      )

      socket.on(
        'channel:kick',
        async (
          { channelId, userId, reason }: { channelId: number; userId: number; reason?: string },
          ack?: AckFn
        ) => {
          try {
            if (userId === user.id) return ackError(ack, 'Cannot kick yourself')

            const channel = await Channel.findOrFail(channelId)
            if (channel.type !== 'public') return ackError(ack, 'Kick only for public channels')

            const actor = await ensureChannelMember(channelId, user.id)
            if (!actor) return ackError(ack, 'Not a member')

            const target = await ensureChannelMember(channelId, userId)
            if (!target) return ackError(ack, 'Target not a member')

            if (target.role === 'admin' && actor.role !== 'admin')
              return ackError(ack, 'Cannot kick an admin')

            const activeBan = await ChannelBan.query()
              .where('channel_id', channelId)
              .where('user_id', userId)
              .whereNull('lifted_at')
              .first()
            if (activeBan) return ackError(ack, 'User already banned')

            // Admin immediate ban
            if (actor.role === 'admin') {
              const remaining = await banUser(channel, target, user.id, reason)
              return ackOk(ack, { memberCount: remaining })
            }

            try {
              await KickVote.create({ channelId, targetUserId: userId, voterId: user.id })
            } catch (error: any) {
              if (error.code === '23505') return ackError(ack, 'Already voted')
              throw error
            }

            const voteCount = await KickVote.query()
              .where('channel_id', channelId)
              .where('target_user_id', userId)
              .count('* as total')
            const totalVotes = Number(voteCount[0].$extras.total)
            const threshold = 3
            if (totalVotes >= threshold) {
              const remaining = await banUser(
                channel,
                target,
                null,
                reason || 'Reached vote threshold'
              )
              return ackOk(ack, { memberCount: remaining })
            }

            ackOk(ack, { votes: totalVotes })
          } catch (error: any) {
            ackError(ack, error.message)
          }
        }
      )

      socket.on(
        'message:send',
        async ({ channelId, content }: { channelId: number; content: string }, ack?: AckFn) => {
          try {
            if (!content || content.trim().length === 0)
              return ackError(ack, 'Message content required')
            const participant = await ChannelParticipant.query()
              .where('channel_id', channelId)
              .where('user_id', user.id)
              .whereNull('left_at')
              .preload('channel', (query) => {
                query.preload('participants', (pQuery) => pQuery.whereNull('left_at'))
              })
              .first()
            if (!participant) return ackError(ack, 'Not a member')

            const message = await Message.create({ channelId, senderId: user.id, content })
            await message.load('sender')

            await participant.channel.merge({ lastActivityAt: DateTime.now() }).save()

            const participants = participant.channel.participants
            const deliveredAt = DateTime.now()
            await Promise.all(
              participants.map((p) =>
                MessageRead.create({
                  userId: p.userId,
                  messageId: message.id,
                  deliveredAt,
                  readAt: null,
                })
              )
            )

            const formatted = {
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

            emitToUsers(
              participants.map((p) => p.userId),
              { type: 'new_message', data: formatted }
            )
            ackOk(ack, formatted)
          } catch (error: any) {
            ackError(ack, error.message)
          }
        }
      )

      socket.on('message:markRead', async ({ messageId }: { messageId: number }, ack?: AckFn) => {
        try {
          const message = await Message.query()
            .where('id', messageId)
            .whereHas('channel', (query) => {
              query.whereHas('participants', (pQuery) =>
                pQuery.where('user_id', user.id).whereNull('left_at')
              )
            })
            .first()
          if (!message) return ackError(ack, 'Message not found')

          const messageRead = await MessageRead.updateOrCreate(
            { userId: user.id, messageId: message.id },
            { readAt: DateTime.now(), deliveredAt: DateTime.now() }
          )

          const payload = {
            type: 'message_read',
            data: { messageId: message.id, readBy: user.id, readAt: messageRead.readAt?.toISO() },
          }
          if (message.senderId !== user.id) emitToUser(message.senderId, payload)
          emitToUser(user.id, payload)
          ackOk(ack, { messageId: message.id, readAt: messageRead.readAt?.toISO() })
        } catch (error: any) {
          ackError(ack, error.message)
        }
      })

      socket.on(
        'message:markDelivered',
        async ({ messageId }: { messageId: number }, ack?: AckFn) => {
          try {
            const message = await Message.query()
              .where('id', messageId)
              .whereHas('channel', (query) => {
                query.whereHas('participants', (pQuery) =>
                  pQuery.where('user_id', user.id).whereNull('left_at')
                )
              })
              .first()
            if (!message) return ackError(ack, 'Message not found')

            const messageRead = await MessageRead.updateOrCreate(
              { userId: user.id, messageId: message.id },
              { deliveredAt: DateTime.now() }
            )

            if (message.senderId !== user.id) {
              emitToUser(message.senderId, {
                type: 'message_delivered',
                data: {
                  messageId: message.id,
                  deliveredTo: user.id,
                  deliveredAt: messageRead.deliveredAt?.toISO(),
                },
              })
            }

            ackOk(ack, { messageId: message.id, deliveredAt: messageRead.deliveredAt?.toISO() })
          } catch (error: any) {
            ackError(ack, error.message)
          }
        }
      )
    })

    initializeRealtime(io)
  }, 50)
}

app.booted(() => {
  bootSocketsWhenReady()
})
