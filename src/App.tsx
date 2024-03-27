import { useCallback, useEffect, useMemo, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import initSqlJs, { SqlValue } from 'sql.js';
import DrizzleORM, { eq } from 'drizzle-orm';
import { SQLJsDatabase, drizzle } from 'drizzle-orm/sql-js';
import { useQuery } from '@tanstack/react-query'
import { createRxDatabase } from 'rxdb'
import {
  getRxStorageMemory
} from 'rxdb/plugins/storage-memory';
import './App.css'
import { userSchema } from './client-db/collections/user';
import { postSchema } from './client-db/collections/post';
import { Database, createDatabase } from './client-db/db';

console.log(userSchema, 'userSchema')



function App() {
  const [name, setName] = useState('')
  const [database, setDatabase] = useState<Database | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])


  const initDatabase = useCallback(async () => {
    const db = await createDatabase()


    const userList = await db.users.find().exec()
    console.log(userList, 'userList')
    setDatabase(db)
  }, [])

  useEffect(() => {
    initDatabase()
  }, [initDatabase])

  return (
    <>
      <div className="h-dvh flex flex-col justify-center items-center">
        <div className="p-[12px] flex flex-col border border-solid border-gray-700">
          <div className="space-x-[4px]">
            <input value={name} onChange={e => setName(e.target.value)} />
            <button onClick={async () => {
              const result = await database?.users.add({
                name: name
              })
              console.log(result, 'result')
            }}>Create</button>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
