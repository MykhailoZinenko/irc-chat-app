export type ChannelType = 'public' | 'private';
export type UserRole = 'member' | 'admin';

export type ChatPreview = {
  id: number,
  name: string,
  type: ChannelType,
  description: string | null,
  memberCount: number,
}

export type MemberItem = {
  id?: string | number
  name?: string
  username?: string
}

export interface ChannelMember {
  id: number;
  nickName: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  status: 'online' | 'dnd' | 'offline';
  role: UserRole;
  joinedAt: string;
}

export interface Channel {
  id: number;
  type: ChannelType;
  name: string;
  description: string | null;
  createdBy: number;
  role: UserRole;
  joinedAt: string;
  lastActivityAt: string | null;
  memberCount?: number;
}

export interface ChannelDetails {
  id: number;
  type: ChannelType;
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
  userRole?: UserRole | undefined;
}

export interface CreateChannelData {
  type: ChannelType;
  name: string;
  description?: string;
}

export function memberToSuggestion(member: ChannelMember): MemberItem {
  return {
    id: member.id, 
    name: `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim(), 
    username: member.nickName
  }
}
