import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { SQLJsDatabase } from 'drizzle-orm/sql-js'
import { drizzle } from 'drizzle-orm/sql-js'
import initSqlJs from 'sql.js'
import { user } from '../../../db/schema'

async function initSql() {
  const sql = await initSqlJs({
    locateFile: file => `/lib/sqljs/${file}`,
  })

  function loadBinaryFile(path: any, success: any) {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', path, true)
    xhr.responseType = 'arraybuffer'
    xhr.onload = function () {
      const data = new Uint8Array(xhr.response)
      const arr = []
      for (let i = 0; i !== data.length; ++i) arr[i] = String.fromCharCode(data[i])
      success(arr.join(''))
    }
    xhr.send()
  };

  return new Promise<SQLJsDatabase>((resolve) => {
    loadBinaryFile('/db/example.sqlite', (data: any) => {
      const sqldb = new sql.Database(data)
      // Database is ready
      const database = drizzle(sqldb)
      resolve(database)
    })
  })
}

function SqlJSExample() {
  const [name, setName] = useState('')
  const [database, setDatabase] = useState<SQLJsDatabase | null>(null)

  const { data: users, refetch: refetchUserList } = useQuery({
    queryKey: ['user/list'],
    async queryFn() {
      console.log('123')
      return await database?.select().from(user) || []
    },
    enabled: !!database,
  })

  const { mutateAsync: addUser } = useMutation({
    async mutationFn(name: string) {
      return database?.insert(user).values({
        name,
      })
    },
    onSuccess() {
      refetchUserList()
    },
  })

  const { mutateAsync: removeUser } = useMutation({
    async mutationFn(nanoId: string) {
      return database?.delete(user).values({
        nanoId,
      })
    },
    onSuccess() {
      refetchUserList()
    },
  })

  const initDatabase = useCallback(async () => {
    const db = await initSql()

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
              addUser(name)
            }}
            >
              Create
            </button>
          </div>

          <div>
            {
              users?.map((user) => {
                return (
                  <div
                    key={user.nanoId}
                    className="flex justify-between items-center p-[4px]"
                  >
                    <span>
                      {user.id}
                      {' '}
                      -
                      {' '}
                      {user.name}
                    </span>
                    <button onClick={async () => {
                      await removeUser(user.nanoId)
                    }}
                    >
                      Delete
                    </button>
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>
    </>
  )
}

export default SqlJSExample
