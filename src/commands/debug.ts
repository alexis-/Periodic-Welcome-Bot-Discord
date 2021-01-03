import { Client, Command, CommandMessage, CommandNotFound, Guard, Rule, Rules } from "@typeit/discord";

import Server from "@/models/server";

import utils from '@/utils/general-utils';

import welcomeTask, { welcomeUsers } from '@/tasks/welcome';

import isAdmin from "@/guards/is-admin";
import isSuperAdmin from "@/guards/is-super-admin";
import isInit from "@/guards/is-initialized";
import { TextChannel } from "discord.js";

export default abstract class AdminCmd {
  private async getServerFromCommand(cmd: CommandMessage)
  : Promise<{ id: string, s: Server | null }>
  {
    const g = cmd.guild;

    if (!g) {
      cmd.reply('Error: guild is null.');
      return { id: '', s: null };
    }

    const sId = g.id;

    return { id: sId, s: await Server.findByServerId(sId) };
  }

  @Command('dbg info')
  @Guard(isSuperAdmin, isInit)
  async onDbgInfo(cmd: CommandMessage) {
    const s = await this.getServerFromCommand(cmd);
    const info = JSON.stringify(s.s);

    return cmd.reply(info);
  }

  @Command('dbg test')
  @Guard(isAdmin, isInit)
  async onDbgTest(cmd: CommandMessage) {
    const s = await this.getServerFromCommand(cmd);

    if (!s.s || !cmd.member) {
      cmd.reply('An error occured.');
      return;
    }
    
    return welcomeUsers(s.s, cmd.channel as TextChannel, [ cmd.member ]);
  }

  @Command('dbg trigger')
  @Guard(isSuperAdmin, isInit)
  async onDbgTrigger(cmd: CommandMessage, client: Client) {
    const s = await this.getServerFromCommand(cmd);

    if (!s.s || !cmd.member) {
      cmd.reply('An error occured.');
      return;
    }
    
    const res = await welcomeTask(s.s, client, cmd.channel as TextChannel, false);

    if (typeof res === typeof Error) cmd.reply(res);
    else cmd.reply(`Greeted ${res} users`);
  }

  @Command('dbg when')
  @Guard(isAdmin, isInit)
  async onDbgWhen(cmd: CommandMessage) {
    const s = await this.getServerFromCommand(cmd);

    if (!s.s) {
      cmd.reply('An error occured.');
      return;
    }
    
    const elapsedHours = utils.getElapsedTime();
    const remainingHours = (s.s.lastProcessed + s.s.delayHours - elapsedHours).toFixed(2);
    
    return cmd.reply(`Next welcome message in ${remainingHours} hours.`);
  }
}
