import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('full_name')
      table.string('first_name').nullable()
      table.string('last_name').nullable()
      table.string('nick_name', 50).notNullable().unique()
      table.timestamp('email_verified_at').nullable()
      table.integer('session_timeout_days').defaultTo(30)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('first_name')
      table.dropColumn('last_name')
      table.dropColumn('nick_name')
      table.dropColumn('email_verified_at')
      table.dropColumn('session_timeout_days')
      table.string('full_name').nullable()
    })
  }
}
