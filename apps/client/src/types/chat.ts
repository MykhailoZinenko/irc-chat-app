export type ChannelType = 'public' | 'private';
export type UserRole = 'member' | 'admin';
export type ChatPreview = {
  id: number,
  name: string,
  type: ChannelType,
  description: string | null,
  memberCount: number,
}