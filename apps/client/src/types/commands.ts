// ─────────────────────────────────────────────

import { type ChannelType } from "./chat"

// ─────────────────────────────────────────────

const COMMAND_TYPES = ["join", "cancel", "quit", "invite", "revoke", "kick", "list"] as const;

export type CommandType = typeof COMMAND_TYPES[number];

export type CommandItem = {
  name: CommandType
  description: string
}

export type Command = {
  name: string
  args: string
}

// ─────────────────────────────────────────────

export const CMD_JOIN = {
  name: "join",
  description: "/join [ChannelName] - Join an existing channel or create a new public channel."
} as const satisfies CommandItem

export const CMD_CANCEL = {
  name: "cancel",
  description: "/cancel - Leave the current channel. If the channel admin uses this command, the channel is deleted."
} as const satisfies CommandItem

export const CMD_LIST = {
  name: "list",
  description: "/list - Show the list of channel members."
} as const satisfies CommandItem

export const CMD_INVITE_PRIVATE = {
  name: "invite",
  description: "/invite @[Username] - Invite a user to a channel"
} as const satisfies CommandItem

export const CMD_INVITE_PUBLIC = {
  name: "invite",
  description: "/invite @[Username] - Invite a user to a channel or re-invite/unban it."
} as const satisfies CommandItem

export const CMD_INVITE_PUBLIC_ADMIN = {
  name: "invite",
  description: "/invite @[Username] - Invite a user to a channel or re-invite/unban it."
} as const satisfies CommandItem


export const CMD_REVOKE = {
  name: "revoke",
  description: "/revoke @[Username] - Kick a user from a private channel."
} as const satisfies CommandItem

export const CMD_KICK = {
  name: "kick",
  description: "/kick @[Username] - Ban a user from a public channel. Requires 3 user votes or 1 admin vote."
} as const satisfies CommandItem

export const CMD_QUIT = {
  name: "quit",
  description: "/quit - Delete the current channel."
} as const satisfies CommandItem

// ─────────────────────────────────────────────

export const Commands_Menu: CommandItem[] = [
  CMD_JOIN
]

export const Commands_Chat: CommandItem[] = [
  CMD_JOIN,
  CMD_CANCEL,
  CMD_LIST
]

// PRIVATE channel admins
export const Commands_PrivateAdmin: CommandItem[] = [
  ...Commands_Chat,
  CMD_QUIT,
  CMD_INVITE_PRIVATE,
  CMD_REVOKE
]

// PRIVATE channel regular users
export const Commands_PrivateUser: CommandItem[] = [
  ...Commands_Chat
]

// PUBLIC channel admins
export const Commands_PublicAdmin: CommandItem[] = [
  ...Commands_Chat,
  CMD_QUIT,
  CMD_INVITE_PUBLIC_ADMIN,
  CMD_KICK
]

// PUBLIC channel regular users
export const Commands_PublicUser: CommandItem[] = [
  ...Commands_Chat,
  CMD_INVITE_PUBLIC,
  CMD_KICK
]

// ─────────────────────────────────────────────

export function getChatCommands(
  channelType: ChannelType,
  powerUser: boolean
): CommandItem[] {
  if (channelType === "private") {
    return powerUser ? Commands_PrivateAdmin : Commands_PrivateUser
  } else {
    return powerUser ? Commands_PublicAdmin : Commands_PublicUser
  }
}

export function getMenuCommands(): CommandItem[] {
  return Commands_Menu;
}


export function isCommandType(value: string): value is CommandType{
  return COMMAND_TYPES.includes(value as CommandType);
}

// ─────────────────────────────────────────────
