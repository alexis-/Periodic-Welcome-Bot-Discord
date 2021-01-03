import { Client } from '@typeit/discord';
import { GuildMember, MessageAttachment, TextChannel } from 'discord.js';

import cst from '@/const';
import utils from '@/utils/general-utils';
import dUtils from '@/utils/discord-utils';

import Server from '@/models/server';

const errSetup = Error('Server is not setup')
const errChannel = Error('No such channel');

export default async function welcomeTask(
  s: Server,
  client: Client,
  destChannel: TextChannel | null = null,
  save: boolean = true) {
  try {
    if (s.setup !== true) return errSetup;

    const welcomeChannel = await client.channels.fetch(s.channelId) as TextChannel;

    if (!welcomeChannel) return errChannel;
    
    const messages = await dUtils.fetchAllMessagesSince(welcomeChannel, s.lastReadMessageId);

    const newUsers: GuildMember[] = [];
    let lastMsgId: string | null = null;

    await utils.asyncForEach(messages.array(), async (m, id) => {
      lastMsgId = m.id;

      if (m.type !== 'GUILD_MEMBER_JOIN') return;
      
      try {
        const member = await welcomeChannel.guild.members.fetch(m.author.id);

        if (m.author.bot === false
            && m.member != null
            && member.deleted === false) {
          newUsers.push(member);
        }
      } catch (ex) {}
    });

    const nbGreeted = await welcomeUsers(s, destChannel ?? welcomeChannel, newUsers);

    if (!save) return nbGreeted;

    if (lastMsgId !== null) {
      await updateServer(s, lastMsgId, nbGreeted);
    }
    else if (nbGreeted > 0) {
      console.error('lastMsgId was null but nbGreeted was positive');
    }

    return nbGreeted;
  } catch (ex) {
    console.error('Error while executing welcome task', ex);
    return typeof ex === typeof Error
      ? ex
      : Error(ex);
  }
}

export async function welcomeUsers(s: Server, c: TextChannel, users: GuildMember[]) {
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

  return users.length;
}

function updateServer(s: Server, lastMsgId: string, nbGreeted: number) {
  s.lastProcessed = utils.getElapsedTime();

  s.greetedCount += nbGreeted;
  s.lastReadMessageId = lastMsgId;

  return s.save();
}
