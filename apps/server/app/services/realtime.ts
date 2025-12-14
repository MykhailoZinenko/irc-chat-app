import { Server as IOServer } from 'socket.io'

type SocketServer = IOServer | null

let io: SocketServer = null

export function initializeRealtime(server: IOServer) {
  io = server
}

export function getIO() {
  if (!io) {
    throw new Error('Socket server not initialized')
  }
  return io
}

export function emitToUser(userId: number, payload: unknown) {
  if (!io) return
  io.to(`users:${userId}`).emit('event', payload)
}

export function emitToChannel(channelId: number, payload: unknown) {
  if (!io) return
  io.to(`channels:${channelId}`).emit('event', payload)
}

export function emitToUsers(userIds: number[], payload: unknown) {
  if (!io) return
  if (userIds.length === 0) return
  io.to(userIds.map((id) => `users:${id}`)).emit('event', payload)
}


