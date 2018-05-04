import Umzug from'umzug';
import Sequelize from'sequelize';

export default class Migration {
  constructor(config) {
    this.sequelize = new Sequelize(config.dbName, config.dbUser, config.dbPass, {
      host: config.dbHost,
      dialect: 'postgres'
    });

    this.umzug = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: this.sequelize
      },
      migrations: {
        params: [this.sequelize.getQueryInterface(), Sequelize],
        path: config.migrations,
        pattern: /\.js$/
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
        callback(null, response);
      })
      .catch(error => {
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
        callback(null, response);
      })
      .catch(error => {
        callback(error, error);
      });
  };
}
