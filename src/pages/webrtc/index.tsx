import { useEffect, useMemo, useState } from 'react'
import {
  default as Peer
  //@ts-expect-error 233
} from 'simple-peer/simplepeer.min.js';
import { WebrtcProvider } from '../rxdb/client-db/replication-webrtc/webrtc';

export const WebRTCExample = () => {

  const webrtcProvider = useMemo(() => {
    return new WebrtcProvider('example-webrtc', {
      signaling: ['ws://yjs-server.lukunhe.soft.sr'],
    })
  }, [])
  const [peerId, setPeerId] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [list, setList] = useState<string[]>([])

  useEffect(() => {
    webrtcProvider.on('synced', (data) => {
      console.log('synced', data)
    })

    webrtcProvider.on('status', (data) => {
      console.log('status', data)
    })
    webrtcProvider.on('peers', (data) => {
      console.log('peers', data)
      setPeerId(webrtcProvider.room?.peerId || '')
    })

    return () => {
      webrtcProvider.destroy()
    }
  }, [])


  console.log(webrtcProvider, 'webrtcProvider')

  return (
    <div>
      peerId: {peerId}
      <br />

      <input
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
      />
      <button onClick={() => {
        webrtcProvider.room
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