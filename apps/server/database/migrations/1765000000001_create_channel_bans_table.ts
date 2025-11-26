import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channel_bans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('channel_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('banned_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.string('reason', 255).nullable()
      table.timestamp('banned_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('lifted_at', { useTz: true }).nullable()

      table.unique(['channel_id', 'user_id'])
      table.index(['channel_id', 'user_id'])
      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
