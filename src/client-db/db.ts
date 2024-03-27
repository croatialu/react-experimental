import { RxDatabase, addRxPlugin, createRxDatabase } from "rxdb";
import { getRxStorageMemory } from "rxdb/plugins/storage-memory";
import { DatabaseCollections } from "./collections";
import { userCollectionMethods, userDocMethods, userSchema } from "./collections/user";
import { postSchema } from "./collections/post";
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
addRxPlugin(RxDBDevModePlugin);

export const createDatabase = async () => {
  const database = await createRxDatabase<DatabaseCollections>({
    name: 'example',
    storage: getRxStorageMemory(),
    ignoreDuplicate: true,
  });

  await database.addCollections({
    users: {
      schema: userSchema,
      methods: userDocMethods,
      statics: userCollectionMethods  
    },
    posts: {
      schema: postSchema
    }
  })


  return database
}

export type Database = RxDatabase<DatabaseCollections, any, any, unknown>;