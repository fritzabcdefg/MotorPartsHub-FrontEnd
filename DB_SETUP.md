DB setup and migration
----------------------

Steps to create the MySQL database and let Sequelize create tables:

1. Make sure your MySQL server is running and `.env` contains correct values for:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

2. If you prefer using CLI, run the SQL template in `scripts/create_db.sql` (edit as needed):

```sql
CREATE DATABASE IF NOT EXISTS `motorpartshub`;
-- create user and grant privileges if needed (edit password)
-- CREATE USER 'mph_user'@'localhost' IDENTIFIED BY 'strong_password_here';
-- GRANT ALL PRIVILEGES ON `motorpartshub`.* TO 'mph_user'@'localhost';
-- FLUSH PRIVILEGES;
```

3. Or run the Node setup script which uses your `.env` credentials:

```bash
node scripts/setup-db.js
```

4. Start the app so Sequelize can create tables:

```bash
npm start
```

Additional commands:

```bash
npm run setup-db
npm run seed
npm run test-api
```

Troubleshooting:
- If you see `Access denied for user '...'` update `.env` with the correct credentials.
- If the setup script fails with permission errors, run the SQL in step 2 as a MySQL admin user.

Optional cleanup:
- If you previously used SQLite and no longer need it, delete `database.sqlite` from the project root.
