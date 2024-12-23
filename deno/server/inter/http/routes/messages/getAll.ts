import { Res, Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";

function findCursors(messages: any[]) {
  return messages.reduce(({ oldest, newest }, message) => {
    const date = new Date(message.createdAt);
    return {
      oldest: date < oldest ? date : oldest,
      newest: date > newest ? date : newest,
    };
  }, { oldest: Infinity, newest: -Infinity });
}

export default (core: Core) =>
  new Route({
    method: "GET",
    url: "/",
    schema: {
      params: {
        type: "object",
        required: ["channelId"],
        properties: {
          channelId: { type: "string", format: "entity-id" },
          messageId: { type: "string", format: "entity-id" },
        },
      },
      query: {
        type: "object",
        properties: {
          parentId: {
            oneOf: [{ type: "string", format: "entity-id" }, {
              type: "string",
              pattern: "^null$",
            }],
          },
          pinned: { type: "boolean" },
          before: { type: "string" },
          after: { type: "string" },
          limit: { type: "number" },
          offset: { type: "number" },
          order: { type: "string", enum: ["asc", "desc"] },
          q: { type: "string" },
        },
      },
    },
    handler: async (req) => {
      const parentId = req.query.parentId === "null"
        ? null
        : req.query.parentId;
      const messages = await core.message.getAll({
        userId: req.state.user.id,
        query: {
          channelId: req.params.channelId,
          parentId: req.params.messageId || parentId,
          pinned: req.query.pinned,
          before: req.query.before,
          after: req.query.after,
          limit: req.query.limit,
          offset: req.query.offset,
          search: req.query.q,
          order: req.query.order
            ? (
              req.query.order === "asc" ? 1 : -1
            )
            : undefined,
        },
      });
      const cursor = findCursors(messages);
      return Res.json({
        results: messages,
        pagination: {
          older: { ...req.query, before: cursor.oldest?.toISOString?.() },
          newer: { ...req.query, after: cursor.newest?.toISOString?.() },
        },
      });
    },
  });
