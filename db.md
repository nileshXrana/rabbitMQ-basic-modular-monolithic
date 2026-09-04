npm run typeorm -- migration:create src/modules/orders/migrations/CreateOrdersTable


import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateOrder1788501551890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createSchema('orders', true);

    await queryRunner.createTable(
      new Table({
        schema: 'orders',
        name: 'orders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(
      new Table({
        schema: 'orders',
        name: 'orders',
      }),
    );

    await queryRunner.dropSchema('orders', true);
  }
}
