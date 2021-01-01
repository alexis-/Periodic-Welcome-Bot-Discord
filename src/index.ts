import { Client } from "@typeit/discord";
const config: WBConfig = require('config');

// https://discord.com/oauth2/authorize?client_id=794400281348538401&scope=bot
export class Main {
  private static _client: Client;

  static get Client(): Client {
    return this._client;
  }

  static start(): void {
    global.cfg = config;
    
    this._client = new Client();
    global.client = this._client;

    this._client.login(
      config.discordToken,
      `${__dirname}/*.ts`,
      `${__dirname}/*.js`,
    );
  }
}

Main.start();
