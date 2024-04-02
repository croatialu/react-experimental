import type { KeyFunctionMap, RxDatabase, RxReactivityFactory } from 'rxdb'
import { addRxPlugin, createRxDatabase } from 'rxdb'
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import { Doc } from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { RxDBUpdatePlugin } from 'rxdb/plugins/update'
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump'
import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup'
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election'
import { postSchema } from './collections/post'
import { userCollectionMethods, userDocMethods, userSchema } from './collections/user'
import type { DatabaseCollections } from './collections'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
// import { getConnectionHandlerSimplePeer, replicateWebRTC } from 'rxdb/plugins/replication-webrtc'
import { replicateWebRTC, getConnectionHandlerSimplePeer } from './replication-webrtc'


addRxPlugin(RxDBLeaderElectionPlugin)
addRxPlugin(RxDBDevModePlugin)
addRxPlugin(RxDBUpdatePlugin)
addRxPlugin(RxDBJsonDumpPlugin)
addRxPlugin(RxDBCleanupPlugin)

const reactivityFactory: RxReactivityFactory<any> = {
  fromObservable(observable, initialValue: any) {
    observable.subscribe(data => {

    })
    console.log(observable, initialValue, 'fromObservable')
    return initialValue
  },
}
export async function createDatabase() {
  const database = await createRxDatabase<DatabaseCollections>({
    name: 'example_rxdb',
    storage: getRxStorageDexie(),
    multiInstance: true,
  })

  // show leadership in title
  database.waitForLeadership().then(() => {
    console.log('isLeader now')
    document.title = `♛ ${document.title}`
  })

  await database.addCollections({
    users: {
      schema: userSchema,
      methods: userDocMethods as unknown as KeyFunctionMap,
      statics: userCollectionMethods as unknown as KeyFunctionMap,
    },
    posts: {
      schema: postSchema,
    },
    
  })



  replicateWebRTC(
    {
      collection: database.users,
      topic: 'my-users-pool',
      connectionHandlerCreator: getConnectionHandlerSimplePeer({
        signalingServerUrl: 'ws://10.10.20.238:4444'
      }),
      pull: {},
      push: {
      }
    }
  );
  return database
}

export type Database = RxDatabase<DatabaseCollections, any, any, unknown>
