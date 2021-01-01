import { Client, Command, CommandMessage, CommandNotFound, Guard, Rule, Rules } from "@typeit/discord";

import cst from '@/const';
import utils from '@/utils/general-utils';
import dUtils from '@/utils/discord-utils';

import Server from "@/models/server";

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

  private async updateOrCreateServer(
    message: CommandMessage,
    fnUpdate: (s: Server) => void,
    fnCreate: (sId: string) => Promise<Server>
  )
  {
    const { id, s } = await this.getServerFromCommand(message);

    if (!id || id === '') return;
    else if (!s) {
      return fnCreate(id);
    }
    else {
      fnUpdate(s);
      s.updateIsSetup();

      return s.save();
    }
  }

  @Command('channel :channel')
  @Guard(isAdmin, isInit)
  async onSetChannel(
    message: CommandMessage,
    client: Client)
  {
    const channelTxt = message.args.channel;
    const channel = dUtils.findChannelFromText(channelTxt, client);

    if (channel == null) {
      return message.reply(`Channel ${channelTxt} could not be found.`);
    }

    const channelLastMsg = (await channel.messages.fetch({ limit: 1})).first();
    const channelLastMsgId = channelLastMsg?.id ?? '1';

    await this.updateOrCreateServer(message,
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
  onSetDelay(message: CommandMessage)
  {
    const delay = Number(message.args.delay);

    if (delay <= 0 || delay >= cst.maxDelay) {
      return message.reply(`Invalid delay: ${delay}.\nPlease enter a value between 1 and ${cst.maxDelay} included, in hours. Example: \`wb!delay 48\`.`);
    }

    return this.updateOrCreateServer(message,
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
  onSetMessage(message: CommandMessage)
  {
    const txt = message.content.substring(message.content.indexOf(' ') + 1);
    const attach = message.attachments.first()?.url ?? null;

    if (!txt || txt.length < cst.msgMinLength) {
      return message.reply(`Invalid message. Minimum required length: ${cst.msgMinLength}.`);
    }

    return this.updateOrCreateServer(message,
      (s) => {
        s.message = txt;
        s.messageAttachment = attach;
      },
      (sId) => Server.create2(
        sId, false, '0', '0', utils.getElapsedTime(), 24, txt, attach
      )
    );
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
