
import { rooms, signalingConns } from "./memo";
import { Observable } from "./observer";
import { WSSubscribePayload, WSPublishPayload, WSAnnouncePayload, WSSignalPayload } from "./types";
import { WebRTCConn } from "./webrtc-conn";

type SignalingConnMessagePayload = WSSubscribePayload | WSPublishPayload<WSSignalPayload | WSAnnouncePayload>



function createSubscribePayload(topics: string[]): WSSubscribePayload {
  return {
    type: 'subscribe',
    topics
  }
}

function createAnnouncePayload(roomName: string, { from }: { from: string }): WSPublishPayload<WSAnnouncePayload> {
  return {
    type: 'publish',
    topic: roomName,
    data: {
      type: 'announce',
      from,
    }
  }
}

function createSignalPayload(
  roomName: string, data: Omit<WSSignalPayload, 'type'>): WSPublishPayload<WSSignalPayload> {
  return {
    type: 'publish',
    topic: roomName,
    data: {
      ...data,
      type: 'signal',
    }
  }
}


type SignalingConnEvents = {
  open: () => void
  close: () => void
}


export class SignalingConn extends Observable<SignalingConnEvents> {
  static New = (url: string) => {
    const signalingConn = signalingConns.get(url) || new SignalingConn(url)
    signalingConns.set(url, signalingConn)
    return signalingConn
  }

  url: string
  ws: WebSocket

  constructor(
    url: string
  ) {
    super()
    this.url = url

    const ws = this.ws = new WebSocket(url)


    ws.addEventListener('open', this.#handleOpen)
    ws.addEventListener('message', this.#handleMessage)
    ws.addEventListener('close', this.#handleClose)
  }

  async awaitWSReady() {
    return new Promise((resolve) => {
      this.ws.addEventListener('open', () => {
        resolve(true)
      })
    })
  }


  #handleOpen = () => {
    console.log('open~~~')
    this.subscribe(Array.from(rooms.keys()))

    rooms.forEach(room =>
      room.announce({
        from: room.peerId
      })
    )

    this.emit('open')
  }

  #handleMessage = (message: MessageEvent<string>) => {
    const data = JSON.parse(message.data) as SignalingConnMessagePayload;

    if (data.type !== 'publish') return
    const roomName = data.topic
    const room = rooms.get(roomName)
    if (room == null || typeof roomName !== 'string') {
      return
    }
    const peerId = room.peerId

    const payload = data.data

    switch (payload.type) {
      case 'announce': {
        if (payload.from === room.peerId) return
        WebRTCConn.New(room, true, payload.from)
        break;
      }
      case 'signal': {
        const { from, to, signal, token, } = payload
        if (from === peerId || (to !== undefined && to !== peerId)) {
          // ignore messages that are not addressed to this conn, or from clients that are connected via broadcastchannel
          return
        }

        switch (signal.type) {
          case 'answer': {
            const existingConn = room.webRTCConns.get(from)
            existingConn?.resetGlareToken()
          }
            break;
          case 'offer': {
            const existingConn = room.webRTCConns.get(from)
            if (!existingConn) break
            const localToken = existingConn.glareToken
            if (token && localToken && localToken > token) {
              existingConn.peer.signal(signal)
              return
            }

            existingConn.resetGlareToken()
          }
            break;
        }


        if (to === peerId) {
          const webRTCConn = WebRTCConn.New(room, false, from)
          webRTCConn.peer.signal(signal)
        }
      }
        break;
    }

  }

  #handleClose = () => {
    this.emit('close')
  }

  async #send(data: unknown) {
    // await this.awaitWSReady()
    this.ws.send(
      JSON.stringify(data)
    )
  }

  subscribe(roomNames: string[]) {
    this.#send(
      createSubscribePayload(roomNames)
    )
  }

  announce(roomName: string, { from }: Omit<WSAnnouncePayload, 'type'>) {
    this.#send(
      createAnnouncePayload(roomName, { from })
    )
  }

  signal(roomName: string, data: Omit<WSSignalPayload, 'type'>) {
    this.#send(
      createSignalPayload(roomName, data)
    )
  }


  destroy(): void {
    this.ws.close()
    signalingConns.delete(this.url)
    super.destroy()


  }

}