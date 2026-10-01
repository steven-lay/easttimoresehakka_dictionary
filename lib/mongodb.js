import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI. Add it to .env.local");
}

const dbName = process.env.MONGODB_DB || "dictionary";
const collectionName = process.env.MONGODB_COLLECTION || "englishhakka";

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getCollection() {
  const connected = await clientPromise;
  return connected.db(dbName).collection(collectionName);
}
