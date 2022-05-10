module.exports = {
  async up(db) {
    const users = await db.collection('users').find({}).toArray();
    await db.collection('channels').insertOne({
      cid: 'main',
      name: 'main',
      users: users.map((u) => u._id),
      createdAt: new Date(),
    });
    await Promise.all(users.map((u) => db.collection('channels').insertOne({
      cid: u._id.toHexString(),
      name: u.name,
      users: [u._id],
      private: true,
      createdAt: new Date(),
    })));
  },

  async down(db) {
    return db.collection('channels').deleteMany({});
  },
};
