import { Client, Command, CommandMessage, CommandNotFound, Guard, Rule, Rules } from "@typeit/discord";

import cst from '@/const';
import utils from '@/utils/general-utils';
import dUtils from '@/utils/discord-utils';

import Server from "@/models/server";

import welcomeTask from '@/tasks/welcome';

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

  private async updateOrCreateServer(
    cmd: CommandMessage,
    fnUpdate: (s: Server) => void,
    fnCreate: (sId: string) => Promise<Server>
  )
  {
    const { id, s } = await this.getServerFromCommand(cmd);

    if (!id || id === '') return;
    else if (!s) {
      fnCreate(id);
    }
    else {
      fnUpdate(s);
      s.updateIsSetup();

      await s.save();
    }

    cmd.reply('Done.');
  }

  @Command('channel :channel')
  @Guard(isAdmin, isInit)
  async onSetChannel(
    cmd: CommandMessage,
    client: Client)
  {
    const channelTxt = cmd.args.channel;
    const channel = dUtils.findChannelFromText(channelTxt, client);

    if (channel == null) {
      return cmd.reply(`Channel ${channelTxt} could not be found.`);
    }

    const channelLastMsg = (await channel.messages.fetch({ limit: 1})).first();
    const channelLastMsgId = channelLastMsg?.id ?? '1';

    await this.updateOrCreateServer(cmd,
      (s) => {
        s.channelId = channel.id;
        s.lastReadMessageId = channelLastMsgId;
      },
      (sId) => Server.create2(
        sId, false, channel.id, channelLastMsgId, utils.getElapsedTime(), 24, '', null
      )
    );
  }

  @Command('delay :delay')
  @Guard(isAdmin, isInit)
  onSetDelay(cmd: CommandMessage)
  {
    const delay = Number(cmd.args.delay);

    if (delay <= 0 || delay >= cst.maxDelay) {
      return cmd.reply(`Invalid delay: ${delay}.\nPlease enter a value between 1 and ${cst.maxDelay} included, in hours. Example: \`wb!delay 48\`.`);
    }

    return this.updateOrCreateServer(cmd,
      (s) => {
        s.delayHours = delay;
      },
      (sId) => Server.create2(
        sId, false, '0', '0', utils.getElapsedTime(), delay, '', null
      )
    );
  }

  @Command()
  @Rules(Rule('message').space(/.*/))
  @Guard(isAdmin, isInit)
  onSetMessage(cmd: CommandMessage)
  {
    const txt = cmd.content.substring(cmd.content.indexOf(' ') + 1);
    const attach = cmd.attachments.first()?.url ?? null;

    if (!txt || txt.length < cst.msgMinLength) {
      return cmd.reply(`Invalid message. Minimum required length: ${cst.msgMinLength}.`);
    }

    return this.updateOrCreateServer(cmd,
      (s) => {
        s.message = txt;
        s.messageAttachment = attach;
      },
      (sId) => Server.create2(
        sId, false, '0', '0', utils.getElapsedTime(), 24, txt, attach
      )
    );
  }

  @Command('lastMsg :lastMsg')
  @Guard(isAdmin, isInit)
  async onSetLastMessage(cmd: CommandMessage, client: Client)
  {
    const { s } = await this.getServerFromCommand(cmd);

    if (!s) return;

    const ids = dUtils.getIdsFromMessageMentionText(cmd.args.lastMsg);

    if (!ids) return;

    if (ids.s !== s.id) {
      cmd.reply('You must specify a message within this server.');
      return;
    }
    else if (ids.c !== s.channelId) {
      cmd.reply('You must specify a message within the designated welcome channel.');
      return;
    }

    const channel = await client.channels.fetch(s.channelId) as TextChannel;

    if (!channel) return;

    const msg = await channel.messages.fetch(ids.m);

    if (!msg) {
      cmd.reply('The specified message could not be found.');
      return;
    }
    
    s.lastReadMessageId = msg.id;
    await s.save();
  }

  @Command('trigger')
  @Guard(isSuperAdmin, isInit)
  async onAdminTrigger(cmd: CommandMessage, client: Client)
  {
    const { s } = await this.getServerFromCommand(cmd);

    if (s) welcomeTask(s, client);
  }

  @CommandNotFound()
  @Guard(isAdmin)
  onCommandNoFound(c: CommandMessage) {
    if (!global.botInitialized) {
      return c.reply('Bot is initializing... Please retry in a few minutes.');
    }

    return c.reply('Unknown command. Usage: \
- `wb!message <message>` Sets the welcome message, limited from 2 to 2000 characters \
- `wb!delay <delay>` Sets the delay in hours between each welcome message. \
- `wb!channel <#channel>` Sets the channel to look for new users and to send the welcome messages. \
\
Example: `wb!delay 48` sets the delay to 48 hours.');
  }
}
