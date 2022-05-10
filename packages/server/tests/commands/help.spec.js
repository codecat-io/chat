const {
  match,
  partial,
} = require('../helpers');

module.exports = (sys) => {
  describe('/help', () => {
    it('should respond with help message', async () => {
      match(await sys.req({ command: { name: 'help', args: [] } }), [
        partial({
          priv: true,
          user: { name: 'System' },
          message: [
            { text: '/channel <name> - change current channel' }, { br: true },
            { text: '/join - join current channel' }, { br: true },
            { text: '/leave - leave current channel' }, { br: true },

            { text: '/login <name> <password> - login to your account' }, { br: true },
            { text: '/logout - logout from your account' }, { br: true },
            { text: '/me - display user info' }, { br: true },

            { text: '/name <name> - to change your name' }, { br: true },
            { text: '/avatar <url> - to change your avatar' }, { br: true },

            { text: '/ai <question> - ask openai GPT-3' }, { br: true },

            { text: '/help - display this help' }, { br: true },
          ],
        }),
        partial({ resp: { status: 'ok' } }),
      ]);
    });
  });
};
