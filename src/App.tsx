import './App.css'
import { userSchema } from './pages/rxdb/client-db/collections/user'

console.log(userSchema, 'userSchema')

function App() {
  return (
    <div>
      <h1>App</h1>

      <ol>
        <li>
          <a href="/rxdb">rxdb</a>
        </li>
        <li>
          <a href="/sqljs">drizzle orm + sql.js</a>
        </li>
      </ol>
    </div>
  )
}

export default App
