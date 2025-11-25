export interface IReaction {
  emoji: string
  count: number
}

export interface IMessage {
  id: number
  sender: string
  avatar: string
  text: string
  time: string
  own: boolean
  read: boolean
  reactions?: IReaction[]
}

