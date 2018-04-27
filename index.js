const Umzug = require('umzug');
const Sequelize = require('sequelize');

modules.exports = config => {
  const sequelize = new Sequelize(config.dbName, config.dbUser, config.dbPass, {
    host: config.dbHost,
    dialect: 'postgres'
  });

  const umzug = new Umzug({
    storage: 'sequelize',
    storageOptions: {
      sequelize: sequelize
    },
    migrations: {
      params: [sequelize.getQueryInterface(), Sequelize],
      path: config.migrations,
      pattern: /\.js$/
    }
  });

  const up = (event, context, callback) => {
    umzug
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

  const down = (event, context, callback) => {
    umzug
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

  return {
    up,
    down
  };
};
