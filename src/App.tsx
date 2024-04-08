import './App.css'

// @ts-expect-error 2333
window.process = {
  nextTick: (fn, ...args) => setTimeout(() => fn(...args), 3000),
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
          <a href="/rxdb2">rxdb example 2</a>
        </li>
        <li>
          <a href="/sqljs">drizzle orm + sql.js</a>
        </li>
        <li>
          <a href="/webrtc">webrtc</a>
        </li>
        <li>
          <a href="/mini-webrtc">mini-webrtc</a>
        </li>
      </ol>
    </div>
  )
}

export default App
