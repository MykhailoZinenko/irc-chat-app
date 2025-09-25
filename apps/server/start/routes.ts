/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

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
