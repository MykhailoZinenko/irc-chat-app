import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channel_participants'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('channel_id').unsigned().references('id').inTable('channels').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.enum('role', ['member', 'admin']).defaultTo('member')
      table.integer('added_by').unsigned().references('id').inTable('users').nullable()

      table.timestamp('joined_at').notNullable()
      table.timestamp('left_at').nullable()

      table.unique(['channel_id', 'user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
