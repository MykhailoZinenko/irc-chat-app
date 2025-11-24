import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import vine from '@vinejs/vine'
import User from '#models/user'
import AccessToken from '#models/access_token'
import { DeviceDetector } from '../utils/device_detector.js'

const registerSchema = vine.compile(
  vine.object({
    firstName: vine.string().optional(),
    lastName: vine.string().optional(),
    nickName: vine.string().minLength(2).maxLength(50),
    email: vine.string().email(),
    password: vine.string().minLength(8),
  })
)

const loginSchema = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string(),
  })
)

const tokenIdParamsSchema = vine.object({
  tokenId: vine.number(),
})

export default class AuthController {
  async register({ request, response }: HttpContext) {
    try {
      const data = await request.validateUsing(registerSchema)
      const userAgent = request.header('user-agent') || ''
      const ipAddress = request.ip()

      const existingUser = await User.findBy('email', data.email)
      if (existingUser) {
        return response.status(422).json({
          success: false,
          message: 'Email already registered',
          errors: { email: 'This email is already registered' },
        })
      }

      const existingNickname = await User.findBy('nickName', data.nickName)
      if (existingNickname) {
        return response.status(422).json({
          success: false,
          message: 'Nickname already taken',
          errors: { nickName: 'This nickname is already taken' },
        })
      }

      let user
      try {
        user = await User.create({
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          nickName: data.nickName,
          email: data.email,
          password: data.password,
          sessionTimeoutDays: 30,
        })
      } catch (error) {
        // Handle unique constraint violation at database level
        if (error.code === '23505') {
          if (error.constraint?.includes('email')) {
            return response.status(422).json({
              success: false,
              message: 'Email already registered',
              errors: { email: 'This email is already registered' },
            })
          }
          if (error.constraint?.includes('nick_name')) {
            return response.status(422).json({
              success: false,
              message: 'Nickname already taken',
              errors: { nickName: 'This nickname is already taken' },
            })
          }
        }
        throw error
      }

      const deviceInfo = DeviceDetector.detect(userAgent)
      const token = await User.accessTokens.create(user, ['*'], {
        name: deviceInfo.name,
        expiresIn: '30 days',
      })

      const tokenValue = token.value?.release()

      await AccessToken.query().where('hash', token.hash).update({
        deviceName: deviceInfo.name,
        deviceType: deviceInfo.type,
        ipAddress: ipAddress,
        userAgent: userAgent,
        lastActivityAt: DateTime.now(),
      })

      return response.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            nickName: user.nickName,
            email: user.email,
            fullName: user.fullName,
          },
          token: {
            type: 'Bearer',
            token: tokenValue,
          },
        },
      })
    } catch (error) {
      return response.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: error.messages || error.message,
      })
    }
  }

  async login({ request, response }: HttpContext) {
    try {
      const data = await request.validateUsing(loginSchema)
      const userAgent = request.header('user-agent') || ''
      const ipAddress = request.ip()

      const user = await User.verifyCredentials(data.email, data.password)
      const deviceInfo = DeviceDetector.detect(userAgent)

      const token = await User.accessTokens.create(user, ['*'], {
        name: deviceInfo.name,
        expiresIn: `${user.sessionTimeoutDays} days`,
      })

      await AccessToken.query().where('hash', token.hash).update({
        deviceName: deviceInfo.name,
        deviceType: deviceInfo.type,
        ipAddress: ipAddress,
        userAgent: userAgent,
        lastActivityAt: DateTime.now(),
      })

      await user.cleanupExpiredSessions()

      return response.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            nickName: user.nickName,
            email: user.email,
            fullName: user.fullName,
          },
          token: {
            type: 'Bearer',
            token: token.value!.release(),
          },
        },
      })
    } catch (error) {
      return response.status(401).json({
        success: false,
        message: 'Invalid credentials',
      })
    }
  }

  async logout({ auth, response }: HttpContext) {
    const user = auth.user!
    const token = auth.user?.currentAccessToken

    if (token) {
      await User.accessTokens.delete(user, token.identifier)
    }

    return response.json({
      success: true,
      message: 'Logged out successfully',
    })
  }

  async logoutAll({ auth, response }: HttpContext) {
    const user = auth.user!
    await User.accessTokens
      .all(user)
      .then((tokens) =>
        Promise.all(tokens.map((token) => User.accessTokens.delete(user, token.identifier)))
      )

    return response.json({
      success: true,
      message: 'Logged out from all devices',
    })
  }

  async sessions({ auth, response }: HttpContext) {
    const user = auth.user!
    const sessions = await user.getActiveSessions()

    const currentTokenId = auth.user?.currentAccessToken?.identifier

    return response.json({
      success: true,
      data: sessions.map((session) => ({
        id: session.id,
        deviceName: session.deviceName,
        deviceType: session.deviceType,
        ipAddress: session.ipAddress,
        lastActivityAt: session.lastActivityAt?.toISO(),
        createdAt: session.createdAt.toISO(),
        isCurrent: session.id === currentTokenId,
      })),
    })
  }

  async revokeSession({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const { tokenId: sessionId } = await vine.validate({
      schema: tokenIdParamsSchema,
      data: params,
    })

    const session = await AccessToken.query()
      .where('id', sessionId)
      .where('tokenableId', user.id)
      .first()

    if (!session) {
      return response.status(404).json({
        success: false,
        message: 'Session not found',
      })
    }

    await AccessToken.query().where('id', session.id).where('tokenableId', user.id).delete()

    return response.json({
      success: true,
      message: 'Session revoked successfully',
    })
  }

  async me({ auth, response }: HttpContext) {
    const user = auth.user!

    return response.json({
      success: true,
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        nickName: user.nickName,
        email: user.email,
        fullName: user.fullName,
        emailVerifiedAt: user.emailVerifiedAt?.toISO(),
        sessionTimeoutDays: user.sessionTimeoutDays,
        createdAt: user.createdAt.toISO(),
        updatedAt: user.updatedAt?.toISO(),
      },
    })
  }
}
