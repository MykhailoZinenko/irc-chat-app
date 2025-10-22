import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_chat_settings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('chat_id').unsigned().references('id').inTable('chats').onDelete('CASCADE')
      table.boolean('is_hidden').defaultTo(false)
      table.boolean('is_muted').defaultTo(false)
      table.boolean('notifications_enabled').defaultTo(true)
      table.timestamp('last_cleared_at').nullable()

      table.primary(['user_id', 'chat_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}