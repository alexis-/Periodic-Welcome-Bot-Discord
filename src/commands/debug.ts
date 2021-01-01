import { Client, Command, CommandMessage, CommandNotFound, Guard, Rule, Rules } from "@typeit/discord";

import Server from "@/models/server";

import utils from '@/utils/general-utils';

import { welcomeUsers } from '@/tasks/welcome';

import isAdmin from "@/guards/is-admin";
import isInit from "@/guards/is-initialized";
import { TextChannel } from "discord.js";

export default abstract class AdminCmd {
  private async getServerFromCommand(message: CommandMessage)
  : Promise<{ id: string, s: Server | null }>
  {
    const g = message.guild;

    if (!g) {
      message.reply('Error: guild is null.');
      return { id: '', s: null };
    }

    const sId = g.id;

    return { id: sId, s: await Server.findByServerId(sId) };
  }

  @Command('dbg info')
  @Guard(isAdmin, isInit)
  async onDbgInfo(message: CommandMessage) {
    const s = await this.getServerFromCommand(message);
    const info = JSON.stringify(s.s);

    console.debug(info);
    return message.reply(info);
  }

  @Command('dbg test')
  @Guard(isAdmin, isInit)
  async onDbgTest(message: CommandMessage) {
    const s = await this.getServerFromCommand(message);

    if (!s.s || !message.member) {
      message.reply('An error occured.');
      return;
    }
    
    return welcomeUsers(s.s, message.channel as TextChannel, [ message.member ], null);
  }

  @Command('dbg when')
  @Guard(isAdmin, isInit)
  async onDbgWhen(message: CommandMessage) {
    const s = await this.getServerFromCommand(message);

    if (!s.s) {
      message.reply('An error occured.');
      return;
    }
    
    const elapsedHours = utils.getElapsedTime();
    const remainingHours = (s.s.lastProcessed + s.s.delayHours - elapsedHours).toFixed(2);
    
    return message.reply(`Next welcome message in ${remainingHours} hours.`);
  }
}
