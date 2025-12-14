import ChannelParticipant from '#models/channel_participant'
import User from '#models/user'
import { emitToUsers } from './realtime.js'

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
    const channelIds = await ChannelParticipant.query()
      .where('user_id', userId)
      .whereNull('left_at')
      .pluck('channel_id')

    if (channelIds.length) {
      const audience = await ChannelParticipant.query()
        .whereIn('channel_id', channelIds)
        .whereNull('left_at')
        .whereNot('user_id', userId)
        .pluck('user_id')

      const recipients = uniq(audience)
      if (recipients.length) {
        emitToUsers(recipients, {
          type: 'user_status_changed',
          data: { userId, status },
        })
      }
    }
  }

  return user
}
