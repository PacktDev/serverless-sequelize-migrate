import Umzug from'umzug';
import Sequelize from 'sequelize';
import { Client } from 'pg';

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
        pattern: /\.js$/
      }
    });
  }

  up(event, context, callback) {
    const config = this.config;
    const umzug = this.umzug;

    Promise.resolve()
    .then(()=>{
      // Create the DB if it doesn't exist
      if(process.env.SLS_DEBUG) {
        console.log('Check DB exists');
        console.log('Create PG client');
      }
      const client = new Client({
        host: config.dbHost,
        port: config.dbPort || 5432,
        user: config.dbUser,
        password: config.dbPass,
        database: 'postgres'
      })
      return Promise.resolve()
      .then(()=>{
        if(process.env.SLS_DEBUG) {
          console.log('Connect to PG');
        }
        return client.connect();
      })
      .then(()=>{
        if(process.env.SLS_DEBUG) {
          console.log(`Check if ${config.dbName} exists`);
        }
        const query = `SELECT datname FROM pg_catalog.pg_database WHERE datname = '${config.dbName}'`;
        return client.query(query)
      })
      .then((data)=>{
        if(!data.rowCount) {
          if(process.env.SLS_DEBUG) {
            console.log(`Create ${config.dbName}`);
          }
          const query = `CREATE DATABASE "${config.dbName}"`;
          return client.query(query);
        } else {
          if(process.env.SLS_DEBUG) {
            console.log(`${config.dbName} exists`);
          }
          return Promise.resolve()
        }
      })
      .then(()=>{
        if(process.env.SLS_DEBUG) {
          console.log(`Close PG`);
        }
        client.end()
      })
      .catch((error)=>{
        if(process.env.SLS_DEBUG) {
          console.log('ERROR DURING DB CREATE')
          console.log(error);
        }
        return Promise.resolve();
      })
    })
    .then(()=>{
      return umzug.up()
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
    })
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
