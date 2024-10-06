import { Agent } from "@planigale/testing";
import { assert, assertEquals } from "@std/assert";
import { createApp } from "../../__tests__/app.ts";
import { Chat } from "../../__tests__/chat.ts";

const { app, repo } = createApp();

Deno.test("PUT /api/messages/:messageId/react - sending reacts to messages", async (t) => {
  await Agent.test(app, { type: "handler" }, async (agent) => {
    const admin = Chat.init(repo, agent);
    const member = Chat.init(repo, agent);
    await member.login("member");
    await admin.login("admin")
      .createChannel({
        name: "test-messages-reactions",
        users: [member.userIdR],
      })
      .sendMessage({ flat: "Hello" }, (msg, { state }) => {
        state.messageId = msg.id;
      });

    await admin.openChannel("test-messages-reactions");
    await member.openChannel("test-messages-reactions");

    await t.step("creating forst reaction", async () => {
      await admin.reactToMessage(({ state }) => ({
        messageId: state.messageId,
        reaction: ":thumbsup:",
      }))
        .getMessages({}, (messages: any) => {
          assertEquals(messages[0].reactions.length, 1);
          assertEquals(messages[0].reactions[0], {
            userId: admin.userId,
            reaction: ":thumbsup:",
          });
        });
    });

    await t.step("checking reactions by second user", async () => {
      await member.getMessages({}, (messages: any, { state }) => {
        state.messageId = messages[0].id;
      });
    });

    await t.step(
      "creating second and third reaction by different user",
      async () => {
        await member.reactToMessage(({ state }) => ({
          messageId: state.messageId,
          reaction: ":thumbsdown:",
        }))
          .reactToMessage(({ state }) => ({
            messageId: state.messageId,
            reaction: ":thumbsup:",
          }))
          .getMessages({}, (messages: any) => {
            assertEquals(messages[0].reactions.length, 3);
            assertEquals(messages[0].reactions[0], {
              userId: admin.userId,
              reaction: ":thumbsup:",
            });
            assertEquals(messages[0].reactions[1], {
              userId: member.userId,
              reaction: ":thumbsdown:",
            });
            assertEquals(messages[0].reactions[2], {
              userId: member.userId,
              reaction: ":thumbsup:",
            });
          });
      },
    );

    await t.step("removing reaction", async () => {
      await member.reactToMessage(({ state }) => ({
        messageId: state.messageId,
        reaction: ":thumbsup:",
      }))
        .getMessages({}, (messages: any) => {
          assertEquals(messages[0].reactions.length, 2);
          assertEquals(messages[0].reactions[0], {
            userId: admin.userId,
            reaction: ":thumbsup:",
          });
          assertEquals(messages[0].reactions[1], {
            userId: member.userId,
            reaction: ":thumbsdown:",
          });
        });
    });

    await member.end();
    await admin.end();
  });
});
Deno.test("PUT /api/messages/:messageId/react - SSR about reactions", async (t) => {
  await Agent.test(app, { type: "handler" }, async (agent) => {
    const admin = Chat.init(repo, agent);
    const member = Chat.init(repo, agent);
    await member.login("member");
    await admin.login("admin")
      .createChannel({
        name: "test-messages-reactions",
        users: [member.userIdR],
      })
      .sendMessage({ flat: "Hello" }, (msg, { state }) => {
        state.messageId = msg.id;
      });

    await admin.openChannel("test-messages-reactions");
    await member.openChannel("test-messages-reactions")
      .connectSSE();

    await t.step("creating reaction and listening for SSE", async () => {
      await admin.login("admin")
        .reactToMessage(({ state }) => ({
          messageId: state.messageId,
          reaction: ":thumbsup:",
        }));
      await member.nextEvent((event: any) => {
        assertEquals(event.type, "message");
        assertEquals(event.reactions.length, 1);
        assertEquals(event.reactions[0], {
          userId: admin.userId,
          reaction: ":thumbsup:",
        });
      });
    });
    await t.step("removing reaction and listening for SSE", async () => {
      await admin.login("admin")
        .reactToMessage(({ state }) => ({
          messageId: state.messageId,
          reaction: ":thumbsup:",
        }));
      await member.nextEvent((event: any) => {
        assertEquals(event.type, "message");
        assertEquals(event.reactions.length, 0);
      });
    });

    await member.end();
    await admin.end();
  });
});
