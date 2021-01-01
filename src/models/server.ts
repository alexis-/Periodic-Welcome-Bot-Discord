import { Sequelize, Model, DataTypes, Op } from "sequelize";

import cst from '@/const';
import utils from '@/utils/general-utils';

export default class Server extends Model {
  public id!: string;
  public setup!: boolean;

  public channelId!: string;
  public lastReadMessageId!: string;
  public message!: string;
  public messageAttachment!: string | null;

  public lastProcessed!: number;
  public delayHours!: number;

  public greetedCount: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  get intChannelId() {
    return BigInt(this.channelId);
  }

  get intLastReadMsgId() {
    return BigInt(this.lastReadMessageId);
  }

  isSetup(): boolean {
    return (this.intChannelId > 0)
      && (this.intLastReadMsgId > 0)
      && (this.message != null)
      && (this.message.length >= cst.msgMinLength);
  }

  updateIsSetup() {
    this.setup = this.isSetup();
  }

  static create2(
    id: string, setup: boolean, channelId: string,
    lastReadMsgId: string, lastProcessed: number,
    delayHours: number, message: string, messageAttachment: string | null) {
      return Server.create({
        id: id,
        setup: setup,
        channelId: channelId,
        lastReadMessageId: lastReadMsgId,
        lastProcessed: lastProcessed,
        delayHours: delayHours,
        message: message,
        messageAttachment: messageAttachment,
        greetedCount: 0
      });
    }

  static async findSinceElapsed(hours: number, cb: (s: Server) => Promise<void>) {
    let pageIdx = 0;
    let count = 0;

    do {
      const serversAndCount = await Server.findAndCountAll({
        where: {
          [Op.and]: [
            { setup: true },
            Sequelize.literal(`lastProcessed + delayHours <= ${hours}`)
          ]
        },
        limit: cst.sqlPageSize,
        offset: pageIdx * cst.sqlPageSize,
      });

      await utils.asyncForEach(serversAndCount.rows, cb);

      count = serversAndCount.count;
    } while (++pageIdx * cst.sqlPageSize < count);
  }

  static findByServerId(id: string) {
    return Server.findByPk(id);
  }
}

export function init(db: Sequelize) {
  return Server.init<Server>(
    {
      id: {
        type: DataTypes.STRING(20),
        autoIncrement: false,
        primaryKey: true
      },
      setup: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      channelId: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      lastReadMessageId: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      lastProcessed: {
        type: DataTypes.INTEGER.UNSIGNED
      },
      delayHours: {
        type: DataTypes.TINYINT.UNSIGNED
      },
      message: {
        type: new DataTypes.STRING(2000),
        allowNull: false
      },
      messageAttachment: {
        type: new DataTypes.STRING(255),
        allowNull: true
      },
      greetedCount: {
        type: DataTypes.INTEGER.UNSIGNED,
        defaultValue: 0
      }
    },
    {
      tableName: 'servers',
      sequelize: db,
      indexes: [ { fields: [ 'setup' ] } ]
    }
  );
}
