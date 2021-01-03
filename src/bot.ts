import { Client, Command, CommandMessage, Discord, Guard, On } from '@typeit/discord';
import cron from 'node-cron';
import { join } from 'path';

import utils from '@/utils/general-utils';
import db from '@/db/db';

import isAdmin from "@/guards/is-admin";
import isInit from "@/guards/is-initialized";

import welcomeTask from '@/tasks/welcome';

import Server from '@/models/server';

@Discord('wb!', {
  import: [ join(__dirname, 'commands', '*.ts') ]
})
export abstract class Bot {
  @On('ready')
  async initialize(client: Client) {
    console.log('Bot logged in.');

    await db.init();
    await this.scheduleWelcome();

    await client.user?.setStatus('online');

    global.botInitialized = true;
  }

  private async scheduleWelcome() {
    cron.schedule('0,30 * * * *', this.tick);
  }

  private tick() {
    const elapsedHours = utils.getElapsedTime();

    return Server.findSinceElapsed(elapsedHours, async (s) => {
      await welcomeTask(s, global.client)
      return;
    });
  }
}
