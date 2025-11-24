import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invitations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('channel_id').unsigned().references('id').inTable('channels').onDelete('CASCADE')
      table.integer('invited_user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('invited_by').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.enum('status', ['pending', 'accepted', 'rejected']).defaultTo('pending')
      table.timestamp('expires_at').nullable()
      table.timestamp('responded_at').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.unique(['channel_id', 'invited_user_id', 'status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}