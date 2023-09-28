import clientPromise from '../../lib/mongodb';

export default async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db('futurum');
    const { title, content } = req.body;
    // const templates=await collection.find({}).toArray();

    const post = await db
      .collection('templates')
      .find({})
      .sort({ _id: -1 })
      .toArray();

    res.json(post);
  } catch (e) {
    console.error(e);
    throw new Error(e).message;
  }
};
