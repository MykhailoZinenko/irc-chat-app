import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';
import { Notify } from 'quasar';

export interface ChannelMember {
  id: number;
  nickName: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: 'member' | 'admin';
  joinedAt: string;
}

export interface Channel {
  id: number;
  type: 'private' | 'public';
  name: string;
  description: string | null;
  createdBy: number;
  role: 'member' | 'admin';
  joinedAt: string;
  lastActivityAt: string | null;
  memberCount?: number;
}

export interface ChannelDetails {
  id: number;
  type: 'private' | 'public';
  name: string;
  description: string | null;
  createdBy: number;
  memberCount: number;
  creator: {
    id: number;
    nickName: string;
    firstName: string | null;
    lastName: string | null;
  };
  userRole?: 'member' | 'admin' | undefined;
}

interface CreateChannelData {
  type: 'private' | 'public';
  name: string;
  description?: string;
}

export const useChannelStore = defineStore('channel', () => {
  const channels = ref<Channel[]>([]);
  const currentChannelDetails = ref<ChannelDetails | null>(null);
  const currentChannelMembers = ref<ChannelMember[]>([]);
  const loading = ref(false);

  const fetchChannels = async () => {
    loading.value = true;
    try {
      const response = await api.get<{ success: boolean; data: { channels: Channel[] } }>(
        '/api/channels',
      );
      if (response.data.success) {
        channels.value = response.data.data.channels;
      }
    } catch (error: any) {
      Notify.create({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to fetch channels',
      });
    } finally {
      loading.value = false;
    }
  };

  const fetchChannelDetails = async (channelId: number) => {
    try {
      const response = await api.get<{
        success: boolean;
        data: { channel: ChannelDetails; userRole?: 'member' | 'admin'; members: ChannelMember[] };
      }>(`/api/channels/${channelId}`);

      if (response.data.success) {
        currentChannelDetails.value = {
          ...response.data.data.channel,
          userRole: response.data.data.userRole,
        };
        currentChannelMembers.value = response.data.data.members;

        // Update member count in channel list - create new object for reactivity
        const channelIndex = channels.value.findIndex((c) => c.id === channelId);
        if (channelIndex !== -1) {
          const existingChannel = channels.value[channelIndex]!;
          channels.value[channelIndex] = {
            ...existingChannel,
            memberCount: response.data.data.channel.memberCount,
          };
        }

        return {
          success: true,
          data: currentChannelDetails.value,
          members: currentChannelMembers.value,
        };
      }
      return { success: false };
    } catch (error: any) {
      // If 403, user is not a member - still return success but without userRole
      if (error.response?.status === 403) {
        return { success: false, notMember: true };
      }
      Notify.create({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to fetch channel details',
      });
      return { success: false };
    }
  };

  const updateMemberCount = (channelId: number, newCount: number) => {
    // Ensure channelId is a number
    channelId = Number(channelId);

    // Update in channels list - create new object for reactivity
    const channelIndex = channels.value.findIndex((c) => c.id === channelId);
    if (channelIndex !== -1) {
      const existingChannel = channels.value[channelIndex]!;
      channels.value[channelIndex] = {
        ...existingChannel,
        memberCount: newCount,
      };
    }

    // Update in current channel details if it's the same channel
    if (currentChannelDetails.value?.id === channelId) {
      currentChannelDetails.value = {
        ...currentChannelDetails.value,
        memberCount: newCount,
      };
    }
  };

  const addMember = (member: ChannelMember) => {
    // Add to members list if not already present
    if (!currentChannelMembers.value.find((m) => m.id === member.id)) {
      currentChannelMembers.value.push(member);
    }
  };

  const removeMember = (userId: number) => {
    currentChannelMembers.value = currentChannelMembers.value.filter((m) => m.id !== userId);
  };

  const joinChannel = async (channelId: number) => {
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        `/api/channels/${channelId}/join`,
      );
      if (response.data.success) {
        await fetchChannels();
        Notify.create({
          type: 'positive',
          message: response.data.message,
        });
        return { success: true };
      }
      return { success: false };
    } catch (error: any) {
      Notify.create({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to join channel',
      });
      return { success: false };
    }
  };

  const createChannel = async (data: CreateChannelData) => {
    try {
      const response = await api.post<{ success: boolean; data: { channel: any } }>(
        '/api/channels',
        data,
      );
      if (response.data.success) {
        await fetchChannels();
        Notify.create({
          type: 'positive',
          message: 'Channel created successfully',
        });
        return { success: true, channel: response.data.data.channel };
      }
      return { success: false };
    } catch (error: any) {
      Notify.create({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to create channel',
      });
      return { success: false };
    }
  };

  const leaveChannel = async (channelId: number) => {
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        `/api/channels/${channelId}/leave`,
      );
      if (response.data.success) {
        await fetchChannels();
        Notify.create({
          type: 'positive',
          message: response.data.message,
        });
        return { success: true };
      }
      return { success: false };
    } catch (error: any) {
      Notify.create({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to leave channel',
      });
      return { success: false };
    }
  };

  const deleteChannel = async (channelId: number) => {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(
        `/api/channels/${channelId}`,
      );
      if (response.data.success) {
        await fetchChannels();
        Notify.create({
          type: 'positive',
          message: response.data.message,
        });
        return { success: true };
      }
      return { success: false };
    } catch (error: any) {
      Notify.create({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to delete channel',
      });
      return { success: false };
    }
  };

  return {
    channels,
    currentChannelDetails,
    currentChannelMembers,
    loading,
    fetchChannels,
    fetchChannelDetails,
    createChannel,
    joinChannel,
    leaveChannel,
    deleteChannel,
    updateMemberCount,
    addMember,
    removeMember,
  };
});
