const { ObjectId } = require('mongodb');
/* eslint-disable no-restricted-syntax */
module.exports = {
  async up(db) {
    const cursor = await db.collection('messages')
      .find({});
    while (await cursor.hasNext()) {
      const message = await cursor.next();
      if (message.userId instanceof ObjectId) {
        await db.collection('messages')
          .updateOne({ _id: message._id }, {
            $set: { userId: new ObjectId(message.userId) },
          });
      }
    }
  },

  async down() {
    // Nothing
  },
};
