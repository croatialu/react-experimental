// @ts-ignore
import { default as _Peer } from "simple-peer/simplepeer.min.js";
import { BroadcastChannel, LeaderElector, createLeaderElection } from 'broadcast-channel';

import type {
  SimplePeer as Peer,
  Instance as PeerInstance,
  SignalData as PeerSignalData,
} from "simple-peer";
import { nanoid } from "nanoid";
import { ObservableV2 } from "lib0/observable.js";

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

const signalingConns = new Map<string, SignalingConn>();
const rooms = new Map<string, Room>();
const webrtcConns = new Map<string, WebrtcConn>();


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
  roomName: string, { from, to, signal, token }: Omit<WSSignalPayload, 'type'>): WSPublishPayload<WSSignalPayload> {
  return {
    type: 'publish',
    topic: roomName,
    data: {
      type: 'signal',
      from,
      to,
      signal,
      token
    }
  }
}

class SignalingConn {
  static New = (url: string) => {
    const signalingConn = signalingConns.get(url) || new SignalingConn(url)
    signalingConns.set(url, signalingConn)
    return signalingConn
  }
  ws?: WebSocket;
  wsUrl?: string;
  isWebSocketReady: Promise<boolean>
  #wsReadyResolve = () => { }

  constructor(url?: string) {
    this.wsUrl = url;

    this.isWebSocketReady = new Promise((resolve) => {
      this.#wsReadyResolve = () => resolve(true)
    })
  }

  initWebSocket() {
    if (!this.wsUrl || this.ws) return
    const ws = this.ws = new WebSocket(this.wsUrl);

    ws.addEventListener('message', this.#handleWSMessage);
    ws.addEventListener('open', this.#handleWSOpen);
    ws.addEventListener('close', this.#handleWSClose);
  }

  destroyWebSocket() {
    if (!this.ws) return
    this.ws.close()
    this.ws = undefined
    this.wsUrl = undefined
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
    this.#wsReadyResolve()
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

  async send(data: any) {
    await this.isWebSocketReady
    this.ws?.send(JSON.stringify(data))
  }

  publish(roomName: string, data: Record<string, unknown>) {
    this.send({
      type: 'publish',
      topic: roomName,
      data
    })
  }

  announce(roomName: string, payload: { from: string }) {
    this.publish(roomName, {
      ...payload,
      type: 'announce',
    })
  }

  publishSignal(roomName: string, data: { from: string, to: string, token: number, signal: PeerSignalData }) {
    this.publish(roomName, {
      ...data,
      type: 'signal',
    })
  }


  destroy() {
    signalingConns.delete(this.wsUrl!)
    if (signalingConns.size === 0) {
      this.destroyWebSocket()
    }
  }
}

class Room {

  static New = (signalingConn: SignalingConn, roomName: string) => {
    const room = rooms.get(roomName) || new Room(signalingConn, roomName)
    rooms.set(roomName, room)
    return room
  }

  #signaling: SignalingConn;
  #channel: BroadcastChannel;
  #elector: LeaderElector
  peerId = nanoid(21)
  roomName: string


  constructor(signalingConn: SignalingConn, roomName: string) {
    this.roomName = roomName;
    this.#signaling = signalingConn;


    const channel = this.#channel = new BroadcastChannel(roomName);
    this.#elector = createLeaderElection(channel);

    this.#channel.addEventListener('message', (data) => {
      console.log('message', data)
    })

    this.initRoom()
  }


  async initRoom() {
    await this.#elector.awaitLeadership()
    this.#signaling.initWebSocket()
  }


  async sendSocketMsg(data: any){
    this.#signaling.send(data)
  }

  async send(data: any) {
    await this.#elector.hasLeader()
    console.log('send room', data)
    if (this.#elector.isLeader) {
      this.#signaling.send(data)
    } else {
      this.#channel.postMessage(data)
    }
  }

  async announce(payload: { from: string }) {
    const value = createAnnouncePayload(this.roomName, payload)
    this.sendSocketMsg(value)
  }

  async publishSignal(payload: Omit<WSSignalPayload, 'type'>): Promise<void> {
    await this.#elector.hasLeader()
    if (!this.#elector.isLeader) return

    const value = createSignalPayload(this.roomName, payload)
    this.sendSocketMsg(value)
  }


  destroy() {
    this.#channel.close();
    this.#elector.die();
    rooms.delete(this.roomName)

    if (rooms.size === 0) {
      this.#signaling.ws?.close()
    }

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
    peer.on('data', this.#handlePeerData)
  }

  get connected() {
    return this.peer.connected;
  }


  resetGlareToken() {
    this.glareToken = undefined
  }

  #handlePeerData = (data: any) => {
    console.log('data', data)
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


export class MiniWebrtc extends ObservableV2<{ message: (data: any) => void }> {
  room: Room;
  signalingConn: SignalingConn;
  constructor(roomName: string, signalingUrl: string) {
    super()
    const signalingConn = SignalingConn.New(signalingUrl);
    this.signalingConn = signalingConn;
    const room = Room.New(signalingConn, roomName);
    this.room = room;
  }

  send(data: any){
    this.room.send(data)
  }

  destroy() {
    this.room.destroy()
  }
}