import { useEffect, useState } from "react"
import { useDatabase } from ".."
import { UserDocType } from "../../collections/user"

export const useUserItem = (nanoId: string) => {
  const database = useDatabase()

  const [userItem, setUserItem] = useState<UserDocType | null>(null)

  useEffect(() => {
    if (!database) return

    const sub = database.users.findOne({ selector: {
      nanoId,
    } }).$.subscribe(user => {
      setUserItem(user ? user.toJSON() : null)
    })

    return () => {
      sub.unsubscribe()
    }
  }, [database, nanoId])

  return userItem

}

export const useUserList = () => {
  const database = useDatabase()

  const [userList, setUserList] = useState<UserDocType[]>([])


  useEffect(() => {
    if (!database) return

    const sub = database.users.find({
      sort: [
        {
          createAt: 'asc',
        },
      ],
    }).$.subscribe(users => {
      setUserList(users.map(item => item.toJSON()))
    })

    return () => {
      sub.unsubscribe()
    }
  }, [database])


  return userList
}

export const useUserActions = () => {
  const database = useDatabase()

  const addUser = async (name: string) => {
    await database?.users.addUser({
      name,
    })
  }

  const updateUserName = async (nanoId: string, name: string) => {
    await database?.users.updateUserName({
      nanoId,
      name,
    })
  }

  const removeUser = async (nanoIds: string[]) => {
    await database?.users.removeUser({
      nanoIds,
    })
  }

  return {
    addUser,
    updateUserName,
    removeUser,
  }
}