import Umzug from 'umzug';
import Sequelize from 'sequelize';
import fs from 'fs';

/**
 * PG SQL Migration Class
 */
export default class Migration {
  /**
   * Migration Class Constructor
   * @param {Object} config
   */
  constructor(config) {
    // Config
    this.config = config;

    // Create Sequelize instance
    this.sequelize = new Sequelize(config.dbName, config.dbUser, config.dbPass, {
      host: config.dbHost,
      dialect: 'postgres',
    });

    // Create Umzub instance
    this.umzug = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: this.sequelize,
      },
      migrations: {
        params: [this.sequelize.getQueryInterface(), Sequelize],
        path: config.migrations,
        pattern: /\.js$/,
        wrap: fn => () => fn(this.sequelize.getQueryInterface(), this.sequelize.constructor),
        customResolver: (migrationPath) => {
          const contents = fs.readFileSync(migrationPath, 'utf8');
          // eslint-disable-next-line no-eval
          const evaluated = eval(contents);

          return {
            up: evaluated.up,
            down: evaluated.down,
          };
        },
      },
    });
  }

  /**
   * Migrates new SQL to the DB
   * @param {Object} event
   * @param {Object} context
   * @param {Function} callback
   */
  up(event, context, callback) {
    this.umzug
      .up()
      .then(() => {
        const response = {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Migration Up Complete',
            input: event,
          }),
        };
        this.sequelize.close();
        callback(null, response);
      })
      .catch((error) => {
        this.sequelize.close();
        callback(error, error);
      });
  }

  /**
   * Rollsback a migration to the DB
   * @param {Object} event
   * @param {Object} context
   * @param {Function} callback
   */
  down(event, context, callback) {
    this.umzug
      .down()
      .then(() => {
        const response = {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Migration Down Complete',
            input: event,
          }),
        };
        this.sequelize.close();
        callback(null, response);
      })
      .catch((error) => {
        this.sequelize.close();
        callback(error, error);
      });
  }
}
