/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import transmit from '@adonisjs/transmit/services/main'
import { middleware } from './kernel.js'

transmit.registerRoutes()

router.get('api/test', async () => {
  return {
    message: 'Hello from AdonisJS backend!',
    timestamp: new Date().toISOString(),
    channels: [
      { id: 1, name: 'general', memberCount: 5 },
      { id: 2, name: 'random', memberCount: 3 },
      { id: 3, name: 'development', memberCount: 2 },
    ],
    user: {
      id: 1,
      nickname: 'TestUser',
      status: 'online',
    },
  }
})

const AuthController = () => import('#controllers/auth_controller')
const UserController = () => import('#controllers/user_controller')
const ChannelsController = () => import('#controllers/channels_controller')
const SearchController = () => import('#controllers/search_controller')

router
  .group(() => {
    router.post('register', [AuthController, 'register'])
    router.post('login', [AuthController, 'login'])
    router.post('logout', [AuthController, 'logout']).use(middleware.auth())
    router.delete('logout-all', [AuthController, 'logoutAll']).use(middleware.auth())
    router.get('sessions', [AuthController, 'sessions']).use(middleware.auth())
    router.delete('sessions/:tokenId', [AuthController, 'revokeSession']).use(middleware.auth())
    router.get('me', [AuthController, 'me']).use(middleware.auth())
  })
  .prefix('api/auth')

router
  .group(() => {
    router.get(':id/profile', [UserController, 'profile'])
    router.put('profile', [UserController, 'updateProfile'])
    router.put('password', [UserController, 'updatePassword'])
    router.delete('account', [UserController, 'deleteAccount'])
  })
  .prefix('api/users')
  .use(middleware.auth())

router
  .group(() => {
    router.get('/', [ChannelsController, 'index'])
    router.post('/', [ChannelsController, 'create'])
    router.get(':id', [ChannelsController, 'show'])
    router.put(':id', [ChannelsController, 'update'])
    router.delete(':id', [ChannelsController, 'destroy'])
    router.post(':id/join', [ChannelsController, 'join'])
    router.post(':id/leave', [ChannelsController, 'leave'])
    router.post(':id/invite', [ChannelsController, 'invite'])
  })
  .prefix('api/channels')
  .use(middleware.auth())

router.get('api/search', [SearchController, 'global']).use(middleware.auth())
