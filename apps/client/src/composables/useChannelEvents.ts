import { onUnmounted } from 'vue';
import { Notify } from 'quasar';
import { transmitService } from '@/services/transmit';
import { useChannelStore, type ChannelMember } from '@/stores/channel-store';

export interface ChannelEventHandlers {
  onMemberJoined?: (data: any) => void | Promise<void>;
  onMemberLeft?: (data: any) => void | Promise<void>;
  onChannelDeleted?: (data: any) => void | Promise<void>;
}

export const useChannelEvents = () => {
  const channelStore = useChannelStore();
  const activeSubscriptions = new Map<number, { unsubscribe: () => void }>();

  /**
   * Subscribe to a channel's events
   */
  const subscribeToChannel = (channelId: number, handlers: ChannelEventHandlers = {}) => {
    unsubscribeFromChannel(channelId);

    const messageHandler = (message: any) => {
      const { type, data } = message;

      switch (type) {
        case 'member_joined':
          handleMemberJoined(data);
          void handlers.onMemberJoined?.(data);
          break;

        case 'member_left':
          handleMemberLeft(data);
          void handlers.onMemberLeft?.(data);
          break;

        case 'channel_deleted':
          void handleChannelDeleted(data);
          void handlers.onChannelDeleted?.(data);
          break;
      }
    };

    const subscription = transmitService.subscribeToChannel(channelId, messageHandler);
    activeSubscriptions.set(channelId, subscription);

    return subscription;
  };

  /**
   * Unsubscribe from a channel
   */
  const unsubscribeFromChannel = (channelId: number) => {
    const subscription = activeSubscriptions.get(channelId);
    if (subscription) {
      subscription.unsubscribe();
      activeSubscriptions.delete(channelId);
    }
  };

  /**
   * Unsubscribe from all channels
   */
  const unsubscribeAll = () => {
    activeSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    activeSubscriptions.clear();
  };

  /**
   * Handle member_joined event
   */
  const handleMemberJoined = (data: any) => {
    channelStore.updateMemberCount(data.channelId, data.memberCount);

    if (channelStore.currentChannelDetails?.id === data.channelId) {
      const newMember: ChannelMember = {
        id: data.user.id,
        nickName: data.user.nickName,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        role: data.role || 'member',
        joinedAt: new Date().toISOString(),
      };
      channelStore.addMember(newMember);

      Notify.create({
        type: 'positive',
        message: `${data.user.nickName || data.user.firstName || 'Someone'} joined the channel`,
        position: 'top-right',
        timeout: 2000,
      });
    }
  };

  /**
   * Handle member_left event
   */
  const handleMemberLeft = (data: any) => {
    channelStore.updateMemberCount(data.channelId, data.memberCount);

    if (channelStore.currentChannelDetails?.id === data.channelId) {
      channelStore.removeMember(data.userId);
    }
  };

  /**
   * Handle channel_deleted event
   */
  const handleChannelDeleted = async (data: any) => {
    const reason =
      data.reason === 'no_members'
        ? 'This channel has been deleted because all members left.'
        : 'This channel has been deleted because no admins remain.';

    Notify.create({
      type: 'warning',
      message: 'Channel Deleted',
      caption: reason,
      position: 'top',
      timeout: 4000,
    });

    await channelStore.fetchChannels();
    unsubscribeFromChannel(data.channelId);
  };

  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribeAll();
  });

  return {
    subscribeToChannel,
    unsubscribeFromChannel,
    unsubscribeAll,
    activeSubscriptions,
  };
};
