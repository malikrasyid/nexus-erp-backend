import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DIRECT_URL!, {
  ssl: 'require',
  // Max connections in the pool
  max: 10, 
  // Custom transform to make Postgres snake_case play nice with JS camelCase
  transform: postgres.camel
});

export default sql;