import { Client } from '@typeit/discord';
import { GuildMember, MessageAttachment, TextChannel } from 'discord.js';

import cst from '@/const';
import utils from '@/utils/general-utils';
import dUtils from '@/utils/discord-utils';

import Server from '@/models/server';

const welcomeTask = async function(s: Server, client: Client) {
  const channel = await client.channels.fetch(s.channelId) as TextChannel;

  if (!channel) return;
  
  const messages = await channel.messages.fetch({
    after: s.lastReadMessageId
  });

  const newUsers = messages
    .filter((m) => m.type === 'GUILD_MEMBER_JOIN'
      && m.member != null
      && m.author.bot === false
      && m.member.deleted === false)
    .map((m) => m.member!);

  return welcomeUsers(s, channel, newUsers, messages.last()!.id);
}

const welcomeUsers = async function(s: Server, c: TextChannel, users: GuildMember[], lastMsgId: string | null) {
  if (users.length == 0) return;
  
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
  
  s.lastProcessed = utils.getElapsedTime();
  s.greetedCount += msgUsers.length;

  if (lastMsgId) s.lastReadMessageId = lastMsgId;

  await s.save();
}

export default welcomeTask;
export { welcomeUsers };
