import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { userSchema } from './client-db/collections/user'
import type { Database } from './client-db/db'
import { createDatabase } from './client-db/db'
import { DatabaseProvider, useDatabase, useUserActions, useUserItem, useUserList } from './client-db/composables'
import JSONData from './example.json'


const View = () => {
  const userList = useUserList()
  const database = useDatabase()

  const { addUser, removeUser } = useUserActions()

  const [text, setText] = useState('')
  const [activeNanoId, setActiveNanoId] = useState<string | null>(null)

  const item = useUserItem(activeNanoId || '')

  console.log(JSONData, 'JSONData')


  return (
    <div>
      <input value={text} onChange={e => setText(e.target.value)} type="text" placeholder="name" />
      <button onClick={() => {
        addUser(text)
      }}>add</button>
      <button onClick={async () => {
        const data = await database?.exportJSON()
        console.log(data, 'data')

      }}>Export</button>
      <button onClick={() => {
        database?.importJSON(JSONData as any)
      }}>Import</button>


      <div>
        Active: {item?.name}
      </div>
      <div>
        {
          userList.map((item) => {
            return (
              <div key={item.nanoId} onClick={() => {
                setActiveNanoId(item.nanoId)
              }}>
                {item.name}
                <button onClick={() => {
                  removeUser([item.nanoId])
                }}>remove</button>
              </div>
            )
          })
        }

      </div>

    </div>
  )
}


function RXDBExample2() {

  return (
    <div>
      <DatabaseProvider name="example2">
        <View />
      </DatabaseProvider>
    </div>
  )
}


export default RXDBExample2
