import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invitations'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Drop the old unique constraint
      table.dropUnique(['channel_id', 'invited_user_id', 'status'])
    })

    // Add partial unique index for pending invitations only
    this.schema.raw(`
      CREATE UNIQUE INDEX invitations_pending_unique
      ON invitations (channel_id, invited_user_id)
      WHERE status = 'pending'
    `)
  }

  async down() {
    this.schema.raw('DROP INDEX IF EXISTS invitations_pending_unique')

    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['channel_id', 'invited_user_id', 'status'])
    })
  }
}