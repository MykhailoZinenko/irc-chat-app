import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_message_actions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('message_id').unsigned().references('id').inTable('messages').onDelete('CASCADE')
      table.boolean('is_hidden').defaultTo(false)
      table.boolean('is_pinned_personally').defaultTo(false)

      table.primary(['user_id', 'message_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}