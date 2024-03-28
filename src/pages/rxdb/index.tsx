import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { userSchema } from './client-db/collections/user'
import type { Database } from './client-db/db'
import { createDatabase } from './client-db/db'

console.log(userSchema, 'userSchema')

function RXDBExample() {
  const [name, setName] = useState('')
  const [database, setDatabase] = useState<Database | null>(null)

  const { data: users, refetch: refetchUserList } = useQuery({
    queryKey: ['user/list'],
    async queryFn() {
      console.log('123')
      const list = await database?.users.find({
        sort: [
          {
            createAt: 'asc',
          },
        ],
      }).exec() || []
      return list.map(item => item.toJSON())
    },
    enabled: !!database,
  })

  useEffect(() => {
    if (!database)
      return

    database.users.find().$.subscribe((data) => {
      console.log(data.map(v => v.toJSON()), 'data')
    })
  }, [database])

  const { mutateAsync: addUser } = useMutation({
    mutationFn(name: string) {
      return database!.users.addUser({
        name,
      })
    },
    onSuccess() {
      refetchUserList()
    },
  })
  const { mutateAsync: updateUserName } = useMutation({
    mutationFn(payload: { nanoId: string, name: string }) {
      return database!.users.updateUserName(payload)
    },
    onSuccess() {
      refetchUserList()
    },
  })

  const initDatabase = useCallback(async () => {
    const db = await createDatabase()
    // db.users.$.subscribe(() => {
    //   refetchUserList()
    // })
    setDatabase(db)
  }, [])

  useEffect(() => {
    initDatabase()
  }, [])

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
                      <input
                        value={user.name}
                        onChange={(event) => {
                          updateUserName({
                            nanoId: user.nanoId,
                            name: event.target.value,
                          })
                        }}
                      />
                    </span>
                    <button onClick={async () => {
                      await database?.users.removeUser({
                        nanoIds: [user.nanoId],
                      })
                      refetchUserList()
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

export default RXDBExample
