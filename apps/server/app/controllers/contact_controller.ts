import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Contact from '#models/contact'

export default class ContactController {
  async index({ auth, response }: HttpContext) {
    try {
      const user = auth.user!

      const contacts = await Contact.query()
        .where('userId', user.id)
        .preload('contactUser', (query) => {
          query.select(['id', 'firstName', 'lastName', 'nickName', 'createdAt'])
        })
        .orderBy('createdAt', 'desc')

      return response.json({
        success: true,
        data: contacts.map(contact => ({
          id: contact.id,
          user: {
            id: contact.contactUser.id,
            firstName: contact.contactUser.firstName,
            lastName: contact.contactUser.lastName,
            nickName: contact.contactUser.nickName,
            fullName: contact.contactUser.fullName,
            createdAt: contact.contactUser.createdAt.toISO(),
          },
          createdAt: contact.createdAt.toISO(),
        }))
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch contacts',
      })
    }
  }

  async store({ params, auth, response }: HttpContext) {
    try {
      const userId = parseInt(params.userId)
      const currentUser = auth.user!

      if (isNaN(userId)) {
        return response.status(422).json({
          success: false,
          message: 'Invalid user ID',
        })
      }

      if (userId === currentUser.id) {
        return response.status(422).json({
          success: false,
          message: 'Cannot add yourself as a contact',
        })
      }

      const targetUser = await User.find(userId)
      if (!targetUser) {
        return response.status(404).json({
          success: false,
          message: 'User not found',
        })
      }

      const existingContact = await Contact.query()
        .where('userId', currentUser.id)
        .where('contactUserId', userId)
        .first()

      if (existingContact) {
        return response.status(422).json({
          success: false,
          message: 'User is already in your contacts',
        })
      }

      const contact = await Contact.create({
        userId: currentUser.id,
        contactUserId: userId,
      })

      await contact.load('contactUser', (query) => {
        query.select(['id', 'firstName', 'lastName', 'nickName', 'createdAt'])
      })

      return response.status(201).json({
        success: true,
        message: 'Contact added successfully',
        data: {
          id: contact.id,
          user: {
            id: contact.contactUser.id,
            firstName: contact.contactUser.firstName,
            lastName: contact.contactUser.lastName,
            nickName: contact.contactUser.nickName,
            fullName: contact.contactUser.fullName,
            createdAt: contact.contactUser.createdAt.toISO(),
          },
          createdAt: contact.createdAt.toISO(),
        }
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to add contact',
      })
    }
  }

  async destroy({ params, auth, response }: HttpContext) {
    try {
      const { userId } = params
      const currentUser = auth.user!

      const contact = await Contact.query()
        .where('userId', currentUser.id)
        .where('contactUserId', userId)
        .first()

      if (!contact) {
        return response.status(404).json({
          success: false,
          message: 'Contact not found',
        })
      }

      await contact.delete()

      return response.json({
        success: true,
        message: 'Contact removed successfully',
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to remove contact',
      })
    }
  }
}