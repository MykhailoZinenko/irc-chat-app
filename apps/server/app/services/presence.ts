import ChannelParticipant from '#models/channel_participant'
import User from '#models/user'
import { emitToUsers, getIO } from './realtime.js'

export type PresenceStatus = 'online' | 'dnd' | 'offline'

const uniq = (values: number[]) => Array.from(new Set(values))

export async function setUserStatus(
  userId: number,
  status: PresenceStatus,
  { broadcast = true }: { broadcast?: boolean } = {}
) {
  const user = await User.find(userId)
  if (!user) return null
  if (user.status === status) return user

  user.status = status
  await user.save()

  if (broadcast) {
    const channelRows = await ChannelParticipant.query()
      .where('user_id', userId)
      .whereNull('left_at')
      .select('channel_id')

    const channelIds = channelRows.map((row: any) => Number(row.channelId ?? row.channel_id))

    if (channelIds.length) {
      const audienceRows = await ChannelParticipant.query()
        .whereIn('channel_id', channelIds)
        .whereNull('left_at')
        .whereNot('user_id', userId)
        .select('user_id')

      const audience = audienceRows.map((row: any) => Number(row.userId ?? row.user_id))

      const recipients = uniq(audience)
      if (recipients.length) {
        emitToUsers(recipients, {
          type: 'user_status_changed',
          data: { userId, status },
        })
      }
    }
  }

  if (status === 'offline') {
    try {
      getIO().in(`users:${userId}`).disconnectSockets(true)
    } catch {
      /* ignore if IO not ready */
    }
  }

  return user
}
