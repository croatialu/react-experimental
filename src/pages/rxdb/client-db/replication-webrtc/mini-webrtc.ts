// @ts-ignore
import { default as _Peer } from "simple-peer/simplepeer.min.js";
import { BroadcastChannel, LeaderElector, createLeaderElection } from 'broadcast-channel';

import type {
  SimplePeer as Peer,
  Instance as PeerInstance,
  SignalData as PeerSignalData,
} from "simple-peer";
import { nanoid } from "nanoid";

const Peer = _Peer as Peer;


interface WSSubscribePayload {
  type: 'subscribe'
  topics: string[]
}

interface WSPublishPayload<Data = any> {
  type: 'publish'
  topic: string
  data: Data
}

interface WSSignalPayload {
  type: 'signal'
  signal: PeerSignalData
  from: string
  to: string
  token: number
}

interface WSAnnouncePayload {
  type: 'announce'
  from: string
}

type SignalingConnMessagePayload = WSSubscribePayload | WSPublishPayload<WSSignalPayload | WSAnnouncePayload>

const rooms = new Map<string, Room>();
const webrtcConns = new Map<string, WebrtcConn>();



class SignalingConn {
  wsUrl: string
  ws?: WebSocket;
  #channel?: BroadcastChannel;
  #elector?: LeaderElector

  constructor(roomName: string, url: string) {
    this.wsUrl = url;


  }

  initWebSocket() {
    const ws = this.ws = new WebSocket(this.wsUrl);
    ws.addEventListener('message', this.#handleWSMessage);
    ws.addEventListener('open', this.#handleWSOpen);
    ws.addEventListener('close', this.#handleWSClose);
  }

  destroyWebSocket() {
    this.ws?.close()
    this.ws = undefined
  }

  initBC(roomName: string) {
    if (this.#channel) return
    const channel = this.#channel = new BroadcastChannel(roomName);
    const elector = this.#elector = createLeaderElection(channel);

    elector.awaitLeadership().then(() => {
      document.title = `👑 MiniWebrtc - ${roomName} - Leader`
    });
  }

  destroyBC() {
    this.#channel?.close()
    this.#channel = undefined
    this.#elector?.die()
    this.#elector = undefined
  }

  #handleWSMessage = (message: MessageEvent<string>) => {
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
        if (payload.from === peerId) return
        const webrtc = webrtcConns.get(payload.from);
        if (!webrtc) {
          const webrtc = new WebrtcConn(this, true, payload.from, room);
          webrtcConns.set(payload.from, webrtc)
        }
        break;
      }
      case 'signal': {
        const { from, to, signal, token, } = payload
        if (from === peerId || (to !== undefined && to !== peerId)) {
          // ignore messages that are not addressed to this conn, or from clients that are connected via broadcastchannel
          return
        }

        console.log(peerId, from, to, 'peerId')


        switch (signal.type) {
          case 'answer': {
            const existingConn = webrtcConns.get(from)
            existingConn?.resetGlareToken()
          }
            break;
          case 'offer': {
            const existingConn = webrtcConns.get(from)
            if (!existingConn) break
            const localToken = existingConn.glareToken
            if (token && localToken && localToken > token) {
              existingConn.peer.signal(signal)
              return
            }

            existingConn.resetGlareToken()
          }

            break;
          // existingConn.glareToken = undefined
        }


        if (to === peerId) {
          let webrtc = webrtcConns.get(from);
          if (!webrtc) {
            webrtc = new WebrtcConn(this, false, from, room);
            webrtcConns.set(payload.from, webrtc)
          }
          webrtc.peer.signal(signal)
        }
      }
        break;
    }



    console.log(data, 'message')
  }

  #handleWSOpen = () => {
    this.send({
      type: 'subscribe',
      topics: Array.from(rooms.keys())
    })

    rooms.forEach(room =>
      room.announce({
        from: room.peerId
      })
    )

    console.log('open')
  }

  #handleWSClose = () => {
    console.log('close')
  }

  send(data: any) {
    this.ws.send(JSON.stringify(data))
  }

  publish(roomName: string, data: Record<string, unknown>) {
    this.send({
      type: 'publish',
      topic: roomName,
      data
    })
  }

  publishSignal(roomName: string, data: { from: string, to: string, token: number, signal: PeerSignalData }) {

    this.publish(roomName, {
      ...data,
      type: 'signal',
    })

  }


}

class Room {
  #signaling: SignalingConn;
  peerId = nanoid(21)
  roomName: string
  constructor(signalingConn: SignalingConn, roomName: string) {
    this.roomName = roomName;
    this.#signaling = signalingConn;



  }

  publish(data: Record<string, unknown>) {
    this.#signaling.send({
      type: 'publish',
      topic: this.roomName,
      data
    })
  }

  get isElectorLeader() {
    return this.#elector.isLeader
  }



  announce(payload: Record<string, any>) {
    this.publish({
      ...payload,
      type: 'announce',
    })
  }

}

class WebrtcConn {
  #signaling: SignalingConn;
  peer: PeerInstance;
  remotePeerId: string;
  room: Room
  glareToken: number | undefined;
  constructor(
    signalingConn: SignalingConn,
    initiator: boolean,
    remotePeerId: string,
    room: Room
  ) {
    this.#signaling = signalingConn

    this.remotePeerId = remotePeerId;
    this.room = room;
    const peer = this.peer = new Peer({
      initiator,
    });

    peer.on('connect', this.#handlePeerConnect)
    peer.on('signal', this.#handlePeerSignal)

  }

  get connected() {
    return this.peer.connected;
  }


  resetGlareToken() {
    this.glareToken = undefined
  }

  #handlePeerSignal = (signal: PeerSignalData) => {
    if (this.glareToken === undefined) {
      // add some randomness to the timestamp of the offer
      this.glareToken = Date.now() + Math.random()
    }

    this.#signaling.publishSignal(this.room.roomName, {
      from: this.room.peerId,
      to: this.remotePeerId,
      token: this.glareToken,
      signal
    })
  }

  #handlePeerConnect = () => {
    console.log('connected')
  }

  #handlePeerClose = () => {
    console.log('closed')
  }

}


export class MiniWebrtc {
  room: Room;
  signalingConn: SignalingConn;
  constructor(roomName: string, signalingUrl: string) {
    this.signalingConn = new SignalingConn(signalingUrl);
    this.room = new Room(this.signalingConn, roomName);
    rooms.set(roomName, this.room);
  }

}