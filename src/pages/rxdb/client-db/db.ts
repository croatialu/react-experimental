import type { RxDatabase } from 'rxdb'
import { addRxPlugin, createRxDatabase } from 'rxdb'
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import type { DatabaseCollections } from './collections'
import { userCollectionMethods, userDocMethods, userSchema } from './collections/user'
import { postSchema } from './collections/post'

addRxPlugin(RxDBDevModePlugin)

export async function createDatabase() {
  const database = await createRxDatabase<DatabaseCollections>({
    name: 'example',
    storage: getRxStorageMemory(),
    ignoreDuplicate: true,
  })

  await database.addCollections({
    users: {
      schema: userSchema,
      methods: userDocMethods,
      statics: userCollectionMethods,
    },
    posts: {
      schema: postSchema,
    },
  })

  return database
}

export type Database = RxDatabase<DatabaseCollections, any, any, unknown>
