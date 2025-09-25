import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('device_name').nullable()
      table.enum('device_type', ['web', 'desktop', 'mobile']).notNullable().defaultTo('web')
      table.string('ip_address').nullable()
      table.text('user_agent').nullable()
      table.timestamp('last_activity_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('device_name')
      table.dropColumn('device_type')
      table.dropColumn('ip_address')
      table.dropColumn('user_agent')
      table.dropColumn('last_activity_at')
    })
  }
}