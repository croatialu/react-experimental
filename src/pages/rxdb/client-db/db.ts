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
import { getConnectionHandlerSimplePeer } from './plugins/connection-handler-simple-peer'
import { replicateWebRTC } from 'rxdb/plugins/replication-webrtc'


addRxPlugin(RxDBLeaderElectionPlugin)
addRxPlugin(RxDBDevModePlugin)
addRxPlugin(RxDBUpdatePlugin)
addRxPlugin(RxDBJsonDumpPlugin)
addRxPlugin(RxDBCleanupPlugin)

const ydoc = new Doc()
const map = ydoc.getMap('example')

const webrtcProvider = new WebrtcProvider('example/aaa', ydoc, {
  signaling: ['ws://yjs-server.lukunhe.soft.sr'],
})
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
    name: 'example',
    storage: getRxStorageMemory(),
    ignoreDuplicate: true,
    multiInstance: true,
    reactivity: reactivityFactory,
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

  // database.users.$.subscribe((data) => {
  //   data.
  //   map.set('users', data.map(v => v.toJSON()))
  // })

  database.$.subscribe(async (data) => {
    console.log(data, 'subscribe')

    // const users = await database.users.find().exec()
    // map.set('users', users.map(v => v.toJSON()))

    // const allJSON = await database.exportJSON()

    // console.log(allJSON, 'allJSON')

    // map.set('ALL_JSON', allJSON)
  })

  // map.observeDeep(async () => {
  //   const { ALL_JSON } = map.toJSON() || {}
  //   if(!ALL_JSON) return
  //   console.log(ALL_JSON, 'ALL_JSON')
  //   await database.users.cleanup()
  //   database.importJSON(ALL_JSON)
  // })

  replicateWebRTC(
    {
      collection: database.users,
      // The topic is like a 'room-name'. All clients with the same topic
      // will replicate with each other. In most cases you want to use
      // a different topic string per user.
      topic: 'my-users-pool',
      /**
       * You need a collection handler to be able to create WebRTC connections.
       * Here we use the simple peer handler which uses the 'simple-peer' npm library.
       * To learn how to create a custom connection handler, read the source code,
       * it is pretty simple.
       */
      connectionHandlerCreator: getConnectionHandlerSimplePeer({
        // Set the signaling server url.
        // You can use the server provided by RxDB for tryouts,
        // but in production you should use your own server instead.
        // signalingServerUrl: 'wss://signaling.rxdb.info/',
        signalingServerUrl: 'ws://10.10.20.238:4444'

      }),
      pull: {},
      push: {}
    }
  );
  console.log(database, 'database')
  return database
}

export type Database = RxDatabase<DatabaseCollections, any, any, unknown>
