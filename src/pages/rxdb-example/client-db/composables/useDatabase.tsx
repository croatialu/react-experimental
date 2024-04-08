import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from "react"
import { Database, createDatabase } from "../db"


const DatabaseContext = createContext<Database | null>(null)


export const DatabaseProvider = ({ children, name }: PropsWithChildren<{ name: string }>) => {
  const [database, setDatabase] = useState<Database | null>(null)
  useEffect(() => {
    if (!name) return

    let _db: Database | null = null
    createDatabase(name).then(db => {
      _db = db
      setDatabase(db)
    })

    return () => {
      _db?.destroy()
    }
  }, [name])

  if(!database) return <div>loading...</div>


  return (
    <DatabaseContext.Provider value={database}>
      {children}
    </DatabaseContext.Provider>
  )
}

export const useDatabase = () => {
  return useContext(DatabaseContext) as Database
}