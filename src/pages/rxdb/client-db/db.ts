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
    console.log(observable, initialValue, 'fromObservable')
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
  console.log(database, 'database')
  return database
}

export type Database = RxDatabase<DatabaseCollections, any, any, unknown>
