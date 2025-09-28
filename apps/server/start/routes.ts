/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

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
const ContactController = () => import('#controllers/contact_controller')

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
    router.get('search', [UserController, 'search'])
    router.get(':id/profile', [UserController, 'profile'])
  })
  .prefix('api/users')
  .use(middleware.auth())

router
  .group(() => {
    router.get('/', [ContactController, 'index'])
    router.post('/:userId', [ContactController, 'store'])
    router.delete('/:userId', [ContactController, 'destroy'])
  })
  .prefix('api/contacts')
  .use(middleware.auth())
