import './App.css'

// @ts-expect-error 2333
window.process = {
  nextTick: (fn, ...args) => setTimeout(() => fn(...args)),
}

window.global = window
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
