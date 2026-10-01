import { MongoClient } from "mongodb";

const dbName = process.env.MONGODB_DB || "dictionary";
const collectionName = process.env.MONGODB_COLLECTION || "englishhakka";

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 8000,
};

function getClientPromise() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "Missing MONGODB_URI. Add it in Vercel Project Settings → Environment Variables.",
    );
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri, options).connect();
    }
    return global._mongoClientPromise;
  }

  // Reuse across warm serverless invocations on Vercel.
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri, options).connect();
  }
  return global._mongoClientPromise;
}

export async function getCollection() {
  const connected = await getClientPromise();
  return connected.db(dbName).collection(collectionName);
}
