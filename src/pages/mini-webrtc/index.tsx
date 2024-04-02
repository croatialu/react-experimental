import { useEffect, useMemo, useState } from 'react'
import { MiniWebrtc } from '../rxdb/client-db/replication-webrtc/mini-webrtc'

export const MiniWebRTCExample = () => {

  
  const miniWebrtc = useMemo(() => {
    return new MiniWebrtc(
      'example-mini-webrtc' + '_' + location.hash,
      'ws://yjs-server.lukunhe.soft.sr'
    )
  }, [])
  const [peerId, setPeerId] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [list, setList] = useState<string[]>([])



  console.log(miniWebrtc, 'miniWebrtc')

  return (
    <div>
      <h1>Mini WebRTC</h1>
      peerId: {peerId}
      <br />

      <input
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
      />
      <button onClick={() => {
        12312
      }}>Create</button>
      <div>
        {
          list.map((item) => {
            return (
              <div key={item}>
                {item}
              </div>
            )
          })
        }
      </div>
    </div>
  )
}