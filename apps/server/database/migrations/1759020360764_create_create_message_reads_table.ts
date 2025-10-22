import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'message_reads'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('message_id').unsigned().references('id').inTable('messages').onDelete('CASCADE')

      table.timestamp('delivered_at').nullable()
      table.timestamp('read_at').nullable()

      table.primary(['user_id', 'message_id'])
      table.index(['message_id', 'read_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}