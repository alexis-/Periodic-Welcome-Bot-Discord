import { Sequelize, Model } from 'sequelize'

import { init as initServerModel } from '@/models/server';
import { Server } from 'http';

export class Db {
  db: Sequelize;

  users: Model<Server>;

  private initModels() {
    this.users = initServerModel(this.db);
  }

  async init(): Promise<boolean> {
    try {
      const dbCfg = global.cfg.db;

      switch (dbCfg.engine) {
        case 'sqlite':
          this.db = new Sequelize({
            dialect: 'sqlite',
            storage: dbCfg.storage,
          });
          break;

        default:
          throw new Error(`Unknown db engine: ${dbCfg.engine}`);
      }

      await this.db.authenticate();

      this.initModels();

      // TODO: Run migrations https://sequelize.org/master/manual/migrations.html
      await this.db.sync();

      return true;
    } catch (ex) {
      console.error('Unable to connect to the database:', ex);
      return false;
    }
  }
}

export default new Db();
