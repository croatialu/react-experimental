import type {
  SimplePeer as Peer,
  Instance as PeerInstance,
  SignalData as PeerSignalData,
} from "simple-peer";
// @ts-ignore
import { default as _Peer } from "simple-peer/simplepeer.min.js";

import { Room } from "./room";
import { Observable } from "./observer";

const Peer = _Peer as Peer;


type WebRTCCoonEvents = {
  message: (data: any) => void
  connect: () => void
  close: () => void
}

export class WebRTCConn extends Observable<WebRTCCoonEvents> {

  static New = (room: Room, initiator: boolean, remotePeerId: string) => {
    const webRTCCoon = room.webRTCConns.get(remotePeerId) || new WebRTCConn(room, initiator, remotePeerId);
    room.webRTCConns.set(remotePeerId, webRTCCoon);
    return webRTCCoon;
  }

  room: Room;
  peer: PeerInstance;
  remotePeerId: string;
  glareToken: number | undefined;
  constructor(
    room: Room,
    initiator: boolean,
    remotePeerId: string,
  ) {
    super()

    this.room = room
    this.remotePeerId = remotePeerId;

    const peer = this.peer = new Peer({
      initiator,
    });

    peer.on('connect', this.#handlePeerConnect)
    peer.on('signal', this.#handlePeerSignal)
    peer.on('close', this.#handlePeerClose)
    peer.on('data', this.#handlePeerData)
  }

  get connected() {
    return this.peer.connected;
  }

  async send(data: any) {

    // if (!this.connected) {
    //   throw new Error('Not connected')
    // }

    console.log('send', {
      data,
      senderPeerId: this.room.peerId,
      receiverPeerId: this.remotePeerId,
    })
    this.peer.send(
      JSON.stringify(data)
    )
  }

  resetGlareToken() {
    this.glareToken = undefined
  }

  #handlePeerData = (data: any) => {
    this.room.miniWebRTC.emit('message', JSON.parse(data))
  }

  #handlePeerSignal = (signal: PeerSignalData) => {
    if (this.glareToken === undefined) {
      this.glareToken = Date.now() + Math.random()
    }

    this.room.publishSignal({
      from: this.room.peerId,
      to: this.remotePeerId,
      token: this.glareToken,
      signal
    })
  }

  #handlePeerConnect = () => {
    console.log('connect~~~', {
      from: this.room.peerId,
      to: this.remotePeerId,
    })
    this.emit('connect')
  }

  #handlePeerClose = () => {
    this.emit('close')
  
    this.destroy()
  }


  destroy(): void {
    this.room.webRTCConns.has(this.remotePeerId) && this.room.webRTCConns.delete(this.remotePeerId)
    this.peer.destroy()
    super.destroy()
    this.room.resubscribe()
  }
}