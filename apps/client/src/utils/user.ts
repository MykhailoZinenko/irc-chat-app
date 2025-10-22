import type { PublicUser } from 'src/stores/contact-store'

export const getInitials = (user: PublicUser) => {
  const firstName = user.firstName || ''
  const lastName = user.lastName || ''

  if (firstName && lastName && firstName.length > 0 && lastName.length > 0) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  } else if (firstName && firstName.length > 0) {
    return firstName[0].toUpperCase()
  } else if (user.nickName && user.nickName.length > 0) {
    return user.nickName[0].toUpperCase()
  }

  return '??'
}