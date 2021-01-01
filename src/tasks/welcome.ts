import { Client } from '@typeit/discord';
import { GuildMember, MessageAttachment, TextChannel } from 'discord.js';

import cst from '@/const';
import utils from '@/utils/general-utils';
import dUtils from '@/utils/discord-utils';

import Server from '@/models/server';

const welcomeTask = async function(s: Server, client: Client) {
  try {
    if (s.setup !== true) return;

    const channel = await client.channels.fetch(s.channelId) as TextChannel;

    if (!channel) return;
    
    const messages = await channel.messages.fetch({
      after: s.lastReadMessageId
    });
    
    const newUsers: GuildMember[] = [];
    let lastMsgId: string | null = null;

    messages.forEach((m, id) => {
      if (m.type === 'GUILD_MEMBER_JOIN'
          && m.author.bot === false
          && m.member != null
          && m.member.deleted === false) {
        newUsers.push(m.member);
      }

      lastMsgId = id;
    });

    const nbGreeted = await welcomeUsers(s, channel, newUsers);

    if (lastMsgId !== null) {
      await updateServer(s, lastMsgId, nbGreeted);
    }
    else if (nbGreeted > 0) {
      console.error('lastMsgId was null but nbGreeted was positive');
    }
  } catch (ex) {
    console.error('Error while executing welcome task', ex);
  }
}

const welcomeUsers = async function(s: Server, c: TextChannel, users: GuildMember[]) {
  if (users.length == 0) return -1;

  let msgUsersTemplate = `Welcome ${cst.msgUserPlaceholder}!`;
  let msgUsers = users.join(' ');
  let msgBody = s.message;
  const usersPhIdx = msgBody.indexOf(cst.msgUserPlaceholder);

  if (usersPhIdx >= 0) {
    const usersPhNlIdx = s.message.indexOf('\n', usersPhIdx + cst.msgUserPlaceholder.length);

    msgUsersTemplate = s.message.substring(0, usersPhNlIdx);
    msgBody = s.message.substring(usersPhNlIdx + 1);
  }

  msgUsers = msgUsersTemplate.replace(cst.msgUserPlaceholder, msgUsers);

  const msgArr = dUtils.splitMessageWithinLimit(msgUsers);

  await utils.asyncForEach(msgArr, async (m) => {
    await c.send(m);
  });

  if (s.messageAttachment == null) {
    c.send(msgBody.trim());
  }
  else {
    const msgBodyAttachment = new MessageAttachment(s.messageAttachment);

    c.send(msgBody.trim(), msgBodyAttachment);
  }

  return msgUsers.length;
}

const updateServer = (s: Server, lastMsgId: string, nbGreeted: number) => {
  s.lastProcessed = utils.getElapsedTime();

  s.greetedCount += nbGreeted;
  s.lastReadMessageId = lastMsgId;

  return s.save();
}

export default welcomeTask;
export { welcomeUsers };
