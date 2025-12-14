import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    // Ensure existing rows have a value
    await this.schema.raw(`UPDATE ${this.tableName} SET status = 'online' WHERE status IS NULL`)

    // Reinforce default to online
    this.schema.alterTable(this.tableName, (table) => {
      table.string('status').notNullable().defaultTo('online').alter()
    })
  }

  async down() {
    // Keep the column but drop the default (optional rollback)
    this.schema.alterTable(this.tableName, (table) => {
      table.string('status').nullable().alter()
    })
  }
}
