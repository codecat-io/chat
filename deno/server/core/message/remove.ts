import { repo } from "../../infra/mod.ts";
import { Id } from "../types.ts";
import { createQuery } from "../query.ts";
import * as v from "valibot";
import { bus } from "../bus.ts";
import { NotOwner, ResourceNotFound } from "../errors.ts";

export default createQuery({
  type: "message:remove",
  body: v.required(v.object({
    userId: Id,
    messageId: Id,
  })),
}, async ({userId, messageId}) => {
    const message = await repo.message.get({ id: messageId });
    if (!message) throw new ResourceNotFound("Message not found");

    if (userId.neq(message.userId)) throw new NotOwner();

    const channel = await repo.channel.get({ id: message.channelId });
    await repo.message.remove({ id: messageId });
    bus.group(channel?.users ?? [], {
      id: messageId,
      type: 'message',
      channelId: message.channelId,
      message: [],
      user: {
        name: 'System',
      },
      notifType: 'warning',
      notif: 'Message removed',
    });
});
