import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channels'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['name'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['name'])
    })
  }
}