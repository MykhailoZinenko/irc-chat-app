import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('chat_id').unsigned().references('id').inTable('chats').onDelete('CASCADE')
      table.integer('sender_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.text('content').notNullable()
      table.text('content_markdown').nullable()
      table.integer('reply_to_message_id').unsigned().references('id').inTable('messages').nullable()
      table.integer('pinned_by').unsigned().references('id').inTable('users').nullable()

      table.timestamp('edited_at').nullable()
      table.timestamp('deleted_for_everyone_at').nullable()
      table.timestamp('pinned_at').nullable()
      table.timestamp('created_at').notNullable()

      table.index(['chat_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
