import Umzug from'umzug';
import Sequelize from 'sequelize';
import fs from 'fs';

export default class Migration {
  constructor(config) {

    // Config
    this.config = config;

    // Create Sequelize instance
    this.sequelize = new Sequelize(config.dbName, config.dbUser, config.dbPass, {
      host: config.dbHost,
      dialect: 'postgres'
    });

    // Create Umzub instance
    this.umzug = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: this.sequelize
      },
      migrations: {
        params: [this.sequelize.getQueryInterface(), Sequelize],
        path: config.migrations,
        pattern: /\.js$/,
        wrap: fn => () => fn(this.sequelize.getQueryInterface(), this.sequelize.constructor),
        customResolver: (migrationPath) => {
          const contents = fs.readFileSync(migrationPath, 'utf8');
          const evaluated = eval(contents);

          return {
            up: evaluated.up,
            down: evaluated.down,
          };
        },
      }
    });
  }

  up(event, context, callback) {
    this.umzug
      .up()
      .then(() => {
        const response = {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Migration Up Complete',
            input: event
          })
        };
        this.sequelize.close();
        callback(null, response);
      })
      .catch(error => {
        this.sequelize.close();
        callback(error, error);
      });
  };

  down(event, context, callback) {
    this.umzug
      .down()
      .then(() => {
        const response = {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Migration Down Complete',
            input: event
          })
        };
        this.sequelize.close();
        callback(null, response);
      })
      .catch(error => {
        this.sequelize.close();
        callback(error, error);
      });
  };
}
