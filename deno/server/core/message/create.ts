import * as v from "valibot";
import { createCommand } from "../command.ts";
import { Id, IdArr } from "../types.ts";
import { InvalidMessage, ResourceNotFound } from "../errors.ts";
import { flatten } from "./flatten.ts";
import { EntityId } from "../../types.ts";

function filterUndefined(data:any){
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined),
  );
}


export default createCommand({
  type: "message:create",
  body: v.required(
    v.object({
      userId: Id,
      message: v.optional(v.any()),
      channelId: Id,
      parentId: v.optional(Id),
      flat: v.optional(v.string()),
      pinned: v.optional(v.boolean()),
      clientId: v.optional(v.string()),
      emojiOnly: v.optional(v.boolean(), false),
      debug: v.optional(v.string()),
      links: v.optional(v.array(v.string()), []),
      mentions: v.optional(IdArr, []),
      attachments: v.optional(
        v.array(v.object({
          id: v.string(),
          fileName: v.string(),
          contentType: v.optional(v.string(), "application/octet-stream"),
        })),
        [],
      ),
    }),
    ["userId", "channelId"],
  ),
}, async (msg, core) => {
  const { repo, services, bus } = core;
  const channel = await repo.channel.get({
    id: msg.channelId,
    userId: msg.userId,
  });
  if (!channel) {
    throw new ResourceNotFound("Channel not found");
  }

  if (!msg.message && !msg.flat) {
    throw new InvalidMessage("Message or flat must be provided");
  }

  if (!msg.message && msg.flat) {
    msg.message = { text: msg.flat };
  }
  if (msg.message && !msg.flat) {
    msg.flat = flatten(msg.message);
  }

  if (!msg.clientId) {
    msg.clientId = crypto.randomUUID();
  }
  const message = filterUndefined({
    message: msg.message,
    flat: msg.flat,
    pinned: msg.pinned,
    channelId: channel.id,
    parentId: msg.parentId,
    channel: channel.cid,
    clientId: msg.clientId,
    emojiOnly: msg.emojiOnly,
    userId: msg.userId,
    links: msg.links,
    mentions: msg.mentions,
    attachments: msg.attachments?.map((file: any) => ({
      id: file.id,
      fileName: file.fileName,
      contentType: file.contentType,
    })),
    createdAt: new Date(),
  });

  const id: EntityId = await (async ()=>{
    const existing = await repo.message.get({
      channelId: channel.id,
      userId: msg.userId,
      clientId: msg.clientId,
    });
    if(existing) {
      await repo.message.update({id: existing.id}, message);
    } else {
      return await repo.message.create(message);
    }
    return existing.id;
  })()


  await core.dispatch({
    type: 'channel:join',
    body: {
      channelId: msg.channelId.toString(),
      userIds: msg.mentions.filter((m: any) =>
        !channel.users.some(u=>u.eq(m))
      ).map(u=>u.toString()),
    }
  });

  if (id && msg.parentId) {
    await repo.message.updateThread({
      id,
      parentId: msg.parentId,
      userId: msg.userId,
    });
    const parent = await repo.message.get({ id: msg.parentId });
    bus.group(channel.users, { type: "message", ...parent });
  }

  const created = await repo.message.get({ id });
  bus.group(channel.users, { type: "message", ...created });
  await services.badge.messageSent({
    channelId: channel.id,
    parentId: msg.parentId,
    messageId: id,
    userId: msg.userId,
  });

  // await services.notifications.send(created, res);
  return id; // { id, duplicate: dup };
  /*
    if (msg.links?.length) {
      services.link.addPreview(
        { messageId: id, links: msg.links },
        { bus: res.bus },
      );
    }
    */
});
