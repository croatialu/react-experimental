import * as ws from 'lib0/websocket'
import * as map from 'lib0/map'
import * as error from 'lib0/error'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import { ObservableV2 } from 'lib0/observable'
import * as logging from 'lib0/logging'
import * as promise from 'lib0/promise'
import * as bc from 'lib0/broadcastchannel'
import * as buffer from 'lib0/buffer'
import { createMutex } from 'lib0/mutex'

import {
  default as _Peer
  // @ts-expect-error ...
} from 'simple-peer/simplepeer.min.js';
import type { SimplePeer as Peer, Instance as PeerInstance } from 'simple-peer'

const Peer = _Peer as Peer

import * as cryptoutils from './crypto'
import { nanoid } from 'nanoid'

const log = logging.createModuleLogger('rxdb-webrtc')

const messageSync = 0
const messageQueryAwareness = 3
const messageAwareness = 1
const messageBcPeerId = 4

const signalingConns = new Map<string, SignalingConn>()
const rooms = new Map<string, Room>()

const checkIsSynced = (room: Room) => {
  let synced = true
  room.webrtcConns.forEach(peer => {
    if (!peer.synced) {
      synced = false
    }
  })
  if ((!synced && room.synced) || (synced && !room.synced)) {
    room.synced = synced
    log('synced ', logging.BOLD, room.name, logging.UNBOLD, ' with all peers')
  }
}

const readMessage = (room: Room, buf: Uint8Array, syncedCallback: () => void) => {
  const decoder = decoding.createDecoder(buf)
  const encoder = encoding.createEncoder()
  const messageType = decoding.readVarUint(decoder)
  if (room === undefined) {
    return null
  }

  let sendReply = false
  switch (messageType) {
    case messageSync: {
      encoding.writeVarUint(encoder, messageSync)
      // const syncMessageType = syncProtocol.readSyncMessage(decoder, encoder, doc, room)
      // if (syncMessageType === syncProtocol.messageYjsSyncStep2 && !room.synced) {
      //   syncedCallback()
      // }
      // if (syncMessageType === syncProtocol.messageYjsSyncStep1) {
      //   sendReply = true
      // }
      break
    }
    case messageQueryAwareness:
      // encoding.writeVarUint(encoder, messageAwareness)
      // encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys())))
      sendReply = true
      break
    case messageAwareness:
      // awarenessProtocol.applyAwarenessUpdate(awareness, decoding.readVarUint8Array(decoder), room)
      break
    case messageBcPeerId: {
      const add = decoding.readUint8(decoder) === 1
      const peerName = decoding.readVarString(decoder)
      if (peerName !== room.peerId && ((room.bcConns.has(peerName) && !add) || (!room.bcConns.has(peerName) && add))) {
        const removed = []
        const added = []
        if (add) {
          room.bcConns.add(peerName)
          added.push(peerName)
        } else {
          room.bcConns.delete(peerName)
          removed.push(peerName)
        }
        room.provider.emit('peers', [{
          added,
          removed,
          webrtcPeers: Array.from(room.webrtcConns.keys()),
          bcPeers: Array.from(room.bcConns)
        }])
        broadcastBcPeerId(room)
      }
      break
    }
    default:
      console.error('Unable to compute message')
      return encoder
  }
  if (!sendReply) {
    // nothing has been written, no answer created
    return null
  }
  return encoder
}

/**
 * @param {WebrtcConn} peerConn
 * @param {Uint8Array} buf
 * @return {encoding.Encoder?}
 */
const readPeerMessage = (peerConn: WebrtcConn, buf: Uint8Array) => {
  const room = peerConn.room
  log('received message from ', logging.BOLD, peerConn.remotePeerId, logging.GREY, ' (', room.name, ')', logging.UNBOLD, logging.UNCOLOR)
  return readMessage(room, buf, () => {
    peerConn.synced = true
    log('synced ', logging.BOLD, room.name, logging.UNBOLD, ' with ', logging.BOLD, peerConn.remotePeerId)
    checkIsSynced(room)
  })
}

/**
 * @param {WebrtcConn} webrtcConn
 * @param {encoding.Encoder} encoder
 */
const sendWebrtcConn = (webrtcConn: WebrtcConn, encoder: encoding.Encoder) => {
  log('send message to ', logging.BOLD, webrtcConn.remotePeerId, logging.UNBOLD, logging.GREY, ' (', webrtcConn.room.name, ')', logging.UNCOLOR)
  try {
    webrtcConn.peer.send(encoding.toUint8Array(encoder))
  } catch (e) { }
}


const broadcastWebrtcConn = (room: Room, m: Uint8Array) => {
  log('broadcast message in ', logging.BOLD, room.name, logging.UNBOLD)
  room.webrtcConns.forEach(conn => {
    try {
      conn.peer.send(m)
    } catch (e) { }
  })
}

export class WebrtcConn {
  initiator = false
  room: Room
  remotePeerId: string
  glareToken: number | undefined = undefined
  closed = false
  connected = false
  synced = false
  peer: PeerInstance
  /**
   * @param {SignalingConn} signalingConn
   * @param {boolean} initiator
   * @param {string} remotePeerId
   * @param {Room} room
   */
  constructor(signalingConn: SignalingConn, initiator: boolean, remotePeerId: string, room: Room) {
    log('establishing connection to ', logging.BOLD, remotePeerId)
    this.room = room
    this.remotePeerId = remotePeerId

    this.peer = new Peer({ initiator })
    this.peer.on('signal', signal => {
      if (this.glareToken === undefined) {
        // add some randomness to the timestamp of the offer
        this.glareToken = Date.now() + Math.random()
      }

      if (remotePeerId === room.peerId) return

      publishSignalingMessage(
        signalingConn,
        room,
        {
          to: remotePeerId,
          from: room.peerId,
          type: 'signal',
          token: this.glareToken,
          signal
        })
    })

    this.peer.on('connect', () => {
      // log('connected to ', logging.BOLD, remotePeerId)
      console.log('connect')
      this.connected = true
      // send sync step 1
      // const encoder = encoding.createEncoder()
      // encoding.writeVarUint(encoder, messageSync)
      // syncProtocol.writeSyncStep1(encoder, doc)
      // sendWebrtcConn(this, encoder)
      // const awarenessStates = awareness.getStates()
      // if (awarenessStates.size > 0) {
      //   const encoder = encoding.createEncoder()
      //   encoding.writeVarUint(encoder, messageAwareness)
      //   encoding.writeVarUint8Array(
      //     encoder,
      //     awarenessProtocol.encodeAwarenessUpdate(
      //       awareness,
      //       Array.from(awarenessStates.keys())
      //     ))
      //   sendWebrtcConn(this, encoder)
      // }
    })
    this.peer.on('close', () => {
      console.log('close')
      this.connected = false
      this.closed = true
      if (room.webrtcConns.has(this.remotePeerId)) {
        room.webrtcConns.delete(this.remotePeerId)
      }
      checkIsSynced(room)
      this.peer.destroy()
      log('closed connection to ', logging.BOLD, remotePeerId)
      announceSignalingInfo(room)
    })
    this.peer.on('error', err => {
      console.log('simple-peer error', err)
      log('Error in connection to ', logging.BOLD, remotePeerId, ': ', err)
      announceSignalingInfo(room)
    })
    this.peer.on('data', data => {
      const answer = readPeerMessage(this, data)
      if (answer !== null) {
        sendWebrtcConn(this, answer)
      }
    })
  }

  destroy() {
    this.peer.destroy()
  }
}

/**
 * @param {Room} room
 * @param {Uint8Array} m
 */
const broadcastBcMessage = (room: Room, m: Uint8Array) => cryptoutils.encrypt(m, room.key).then(data =>
  room.mux(() =>
    bc.publish(room.name, data)
  )
)

/**
 * @param {Room} room
 * @param {Uint8Array} m
 */
const broadcastRoomMessage = (room: Room, m: Uint8Array) => {
  if (room.bcConnected) {
    broadcastBcMessage(room, m)
  }
  broadcastWebrtcConn(room, m)
}

/**
 * @param {Room} room
 */
const announceSignalingInfo = (room: Room) => {
  signalingConns.forEach(conn => {
    // only subscribe if connection is established, otherwise the conn automatically subscribes to all rooms
    if (conn.connected) {
      conn.send({ type: 'subscribe', topics: [room.name] })
      // if (room.webrtcConns.size < room.provider.maxConns) {
      publishSignalingMessage(conn, room, { type: 'announce', from: room.peerId })
      // }
    }
  })
}

/**
 * @param {Room} room
 */
const broadcastBcPeerId = (room: Room) => {
  // if (room.provider.filterBcConns) {
  // broadcast peerId via broadcastchannel
  const encoderPeerIdBc = encoding.createEncoder()
  encoding.writeVarUint(encoderPeerIdBc, messageBcPeerId)
  encoding.writeUint8(encoderPeerIdBc, 1)
  encoding.writeVarString(encoderPeerIdBc, room.peerId)
  broadcastBcMessage(room, encoding.toUint8Array(encoderPeerIdBc))
  // }
}

export class Room {
  peerId = nanoid(21)
  synced = false
  name: string
  key: CryptoKey | undefined
  bcConns = new Set<string>()
  mux = createMutex()
  bcConnected = false
  provider: WebrtcProvider
  webrtcConns: Map<string, WebrtcConn> = new Map()


  constructor(provider: WebrtcProvider, name: string, key: CryptoKey | undefined) {
    this.name = name
    this.provider = provider
    // @todo make key secret by scoping
    this.key = key


    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.#beforeUnloadHandler)
    } else if (typeof process !== 'undefined') {
      process.on('exit', this.#beforeUnloadHandler)
    }
  }

  #bcSubscriber = (data: ArrayBuffer) => {
    cryptoutils.decrypt(new Uint8Array(data), this.key).then(m =>
      this.mux(() => {
        const reply = readMessage(this, m!, () => { })
        if (reply) {
          broadcastBcMessage(this, encoding.toUint8Array(reply))
        }
      }))
  }

  #beforeUnloadHandler = () => {
    console.log('disconnect')
    // awarenessProtocol.removeAwarenessStates(this.awareness, [doc.clientID], 'window unload')
    rooms.forEach(room => {
      room.disconnect()
    })
  }
  connect() {
    // this.doc.on('update', this._docUpdateHandler)
    // signal through all available signaling connections
    announceSignalingInfo(this)
    const roomName = this.name
    bc.subscribe(roomName, this.#bcSubscriber)
    this.bcConnected = true
    // broadcast peerId via broadcastchannel
    broadcastBcPeerId(this)
  }

  disconnect() {
    // signal through all available signaling connections
    signalingConns.forEach(conn => {
      if (conn.connected) {
        conn.send({ type: 'unsubscribe', topics: [this.name] })
      }
    })
    // broadcast peerId removal via broadcastchannel
    const encoderPeerIdBc = encoding.createEncoder()
    encoding.writeVarUint(encoderPeerIdBc, messageBcPeerId)
    encoding.writeUint8(encoderPeerIdBc, 0) // remove peerId from other bc peers
    encoding.writeVarString(encoderPeerIdBc, this.peerId)
    broadcastBcMessage(this, encoding.toUint8Array(encoderPeerIdBc))

    bc.unsubscribe(this.name, this.#bcSubscriber)
    this.bcConnected = false
    this.webrtcConns.forEach(conn => conn.destroy())
  }

  destroy() {
    this.disconnect()
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.#beforeUnloadHandler)
    } else if (typeof process !== 'undefined') {
      process.off('exit', this.#beforeUnloadHandler)
    }
  }
}

const openRoom = (provider: WebrtcProvider, name: string, key?: CryptoKey) => {
  // there must only be one room
  if (rooms.has(name)) {
    throw error.create(`A Yjs Doc connected to room "${name}" already exists!`)
  }
  const room = new Room(provider, name, key)
  rooms.set(name, /** @type {Room} */(room))
  return room
}

/**
 * @param {SignalingConn} conn
 * @param {Room} room
 * @param {any} data
 */
const publishSignalingMessage = (conn: SignalingConn, room: Room, data: any) => {
  if (room.key) {
    cryptoutils.encryptJson(data, room.key).then(data => {
      conn.send({ type: 'publish', topic: room.name, data: buffer.toBase64(data!) })
    })
  } else {
    conn.send({ type: 'publish', topic: room.name, data })
  }
}

export class SignalingConn extends ws.WebsocketClient {
  providers = new Set<WebrtcProvider>()
  constructor(url: string) {
    super(url)
    /**
     * @type {Set<WebrtcProvider>}
     */
    this.on('connect', () => {
      log(`connected (${url})`)
      const topics = Array.from(rooms.keys())
      this.send({ type: 'subscribe', topics })
      rooms.forEach(room =>
        publishSignalingMessage(this, room, { type: 'announce', from: room.peerId })
      )
    })
    this.on('message', (m: any) => {
      // console.log('SignalingConn message', m)
      switch (m.type) {
        case 'publish': {
          const roomName = m.topic
          const room = rooms.get(roomName)
          if (room == null || typeof roomName !== 'string') {
            return
          }
          const execMessage = (data: any) => {
            const webrtcConns = room.webrtcConns
            const peerId = room.peerId
            if (data == null || data.from === peerId || (data.to !== undefined && data.to !== peerId) || room.bcConns.has(data.from)) {
              // ignore messages that are not addressed to this conn, or from clients that are connected via broadcastchannel
              return
            }
            console.log(data.from, peerId, data.from === peerId, 'execMessage')

            const emitPeerChange = webrtcConns.has(data.from)
              ? () => { }
              : () =>
                room.provider.emit('peers', [{
                  removed: [],
                  added: [data.from],
                  webrtcPeers: Array.from(room.webrtcConns.keys()),
                  bcPeers: Array.from(room.bcConns)
                }])

            switch (data.type) {
              case 'announce':
                map.setIfUndefined(
                  webrtcConns,
                  data.from,
                  () => new WebrtcConn(this, true, data.from, room)
                )
                emitPeerChange()
                break
              case 'signal':
                if (data.signal.type === 'offer') {
                  const existingConn = webrtcConns.get(data.from)
                  if (existingConn) {
                    const remoteToken = data.token
                    const localToken = existingConn.glareToken
                    if (localToken && localToken > remoteToken) {
                      log('offer rejected: ', data.from)
                      return
                    }
                    // if we don't reject the offer, we will be accepting it and answering it
                    existingConn.glareToken = undefined
                  }
                }
                if (data.signal.type === 'answer') {
                  log('offer answered by: ', data.from)
                  const existingConn = webrtcConns.get(data.from)
                  if (existingConn) {
                    existingConn.glareToken = undefined
                  }
                }
                if (data.to === peerId) {
                  map.setIfUndefined(
                    webrtcConns,
                    data.from,
                    () => new WebrtcConn(this, false, data.from, room)
                  ).peer.signal(data.signal)
                  emitPeerChange()
                }
                break
            }
          }
          if (room.key) {
            if (typeof m.data === 'string') {
              cryptoutils.decryptJson(buffer.fromBase64(m.data), room.key).then(execMessage)
            }
          } else {
            execMessage(m.data)
          }
        }
      }
    })
    this.on('disconnect', () => log(`disconnect (${url})`))
  }
}

/**
 * @typedef {Object} ProviderOptions
 * @property {Array<string>} [signaling]
 * @property {string} [password]
 * @property {awarenessProtocol.Awareness} [awareness]
 * @property {number} [maxConns]
 * @property {boolean} [filterBcConns]
 * @property {any} [peerOpts]
 */

/**
 * @param {WebrtcProvider} provider
 */
const emitStatus = (provider: WebrtcProvider) => {
  provider.emit('status', [{
    connected: provider.connected
  }])
}


interface WebrtcProviderEvents {
  status: (event: { connected: boolean }) => void
  synced: (event: { synced: boolean }) => void
  peers: (event: { added: string[], removed: string[], webrtcPeers: string[], bcPeers: string[] }) => void
  message: (event: { peerId: string, data: Uint8Array }) => void
}

export class WebrtcProvider extends ObservableV2<WebrtcProviderEvents> {
  room: Room | null = null
  roomName: string
  shouldConnect = false
  signalingConns: SignalingConn[]
  signalingUrls: string[]
  key: Promise<CryptoKey | undefined>
  constructor(
    roomName: string,
    {
      signaling = ['wss://y-webrtc-eu.fly.dev'],
      password = null,
    } = {}
  ) {
    super()
    this.roomName = roomName
    /**
     * @type {awarenessProtocol.Awareness}
     */
    this.shouldConnect = false
    this.signalingUrls = signaling
    this.signalingConns = []
    /**
     * @type {PromiseLike<CryptoKey | null>}
     */
    this.key = (password ? cryptoutils.deriveKey(password, roomName) : (promise.resolve(undefined))) as Promise<CryptoKey | undefined>

    this.key.then(key => {
      this.room = openRoom(this, roomName, key)
      if (this.shouldConnect) {
        this.room.connect()
      } else {
        this.room.disconnect()
      }
      emitStatus(this)
    })
    this.connect()
    this.destroy = this.destroy.bind(this)
  }

  /**
   * Indicates whether the provider is looking for other peers.
   *
   * Other peers can be found via signaling servers or via broadcastchannel (cross browser-tab
   * communication). You never know when you are connected to all peers. You also don't know if
   * there are other peers. connected doesn't mean that you are connected to any physical peers
   * working on the same resource as you. It does not change unless you call provider.disconnect()
   *
   * `this.on('status', (event) => { console.log(event.connected) })`
   *
   * @type {boolean}
   */
  get connected() {
    return this.room !== null && this.shouldConnect
  }

  connect() {
    this.shouldConnect = true
    this.signalingUrls.forEach(url => {
      const signalingConn = map.setIfUndefined(signalingConns, url, () => new SignalingConn(url))

      this.signalingConns.push(signalingConn)
      signalingConn.providers.add(this)
    })
    if (this.room) {
      this.room.connect()
      emitStatus(this)
    }
  }

  disconnect() {
    this.shouldConnect = false
    this.signalingConns.forEach(conn => {
      conn.providers.delete(this)
      if (conn.providers.size === 0) {
        conn.destroy()
        signalingConns.delete(conn.url)
      }
    })
    if (this.room) {
      this.room.disconnect()
      emitStatus(this)
    }
  }

  destroy() {
    // need to wait for key before deleting room
    this.key.then(() => {
      this.room?.destroy()
      rooms.delete(this.roomName)
    })
    super.destroy()
  }
}
