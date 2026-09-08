import 'dotenv/config';
import { DataSource, type DataSourceOptions } from 'typeorm';

const migrationModule = process.env.MIGRATION_MODULE;

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',

  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,

  entities: ['dist/modules/**/database/entities/*.{ts,js}'],

  // migrations: ['dist/modules/**/database/migrations/*.{ts,js}'],

  migrations: migrationModule
    ? [`dist/modules/${migrationModule}/database/migrations/*.{ts,js}`]
    : ['dist/modules/**/database/migrations/*.{ts,js}'],

  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;

dataSource.initialize();
