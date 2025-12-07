import scheduler from 'adonisjs-scheduler/services/main'
import Channel from '#models/channel'
import { DateTime } from 'luxon'
import { emitToUsers } from '#services/realtime'

// Clean up inactive channels after 30 days of inactivity
scheduler
  .call(async () => {
    const inactivityThreshold = DateTime.now().minus({ days: 30 })

    // Find channels that have been inactive for 30+ days
    const inactiveChannels = await Channel.query()
      .where('last_activity_at', '<', inactivityThreshold.toSQL())
      .orWhereNull('last_activity_at')
      .preload('participants', (query) => {
        query.whereNull('left_at')
      })

    console.log(`Found ${inactiveChannels.length} inactive channels to delete`)

    for (const channel of inactiveChannels) {
      // Notify all participants that the channel is being deleted
      emitToUsers(
        channel.participants.map((p) => p.userId),
        {
          type: 'channel_deleted',
          data: {
            channelId: channel.id,
            channelName: channel.name,
            reason: 'inactivity',
          },
        }
      )

      // Delete the channel (cascade will handle participants, messages, etc.)
      await channel.delete()

      console.log(`Deleted inactive channel: ${channel.name} (ID: ${channel.id})`)
    }
  })
  .daily() // Run daily at midnight
