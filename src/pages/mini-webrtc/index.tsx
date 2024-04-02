import { useEffect, useMemo, useState } from 'react'
import { MiniWebRTC } from './core/mini-webrtc'

export const MiniWebRTCExample = () => {


  const miniWebrtc = useMemo(() => {
    return new MiniWebRTC(
      'example-mini-webrtc' + '_' + location.hash,
      'ws://localhost:4444'
    )
  }, [])




  const [peerId, setPeerId] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [list, setList] = useState<string[]>([])

  useEffect(() => {
    miniWebrtc.send({
      value: inputValue
    })
  }, [inputValue])

  useEffect(() => {
    miniWebrtc.on('message', (data) => {
      setInputValue(data.value)
    })
  }, [])

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