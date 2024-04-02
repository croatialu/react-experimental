import { nanoid } from "nanoid";
import { rooms } from "./memo"
import { MiniWebRTC } from "./mini-webrtc"
import { WSAnnouncePayload, WSSignalPayload } from "./types";
import { BCConn } from "./bc-conn";
import { WebRTCConn } from "./webrtc-conn";

export class Room {

  static New = (miniWebRTC: MiniWebRTC, roomName: string) => {

    const room = rooms.get(roomName) || new Room(miniWebRTC, roomName);
    rooms.set(roomName, room);

    return room;
  }

  peerId: string
  bcConn: BCConn
  webRTCConns = new Map<string, WebRTCConn>()
  miniWebRTC: MiniWebRTC;
  roomName: string;

  constructor(miniWebRTC: MiniWebRTC, roomName: string) {
    this.bcConn = new BCConn(roomName)
    this.peerId = nanoid(21)
    this.roomName = roomName;
    this.miniWebRTC = miniWebRTC;


    this.bcConn.on('message', this.#handleBCConnMessage)
  }

  #handleBCConnMessage = (bcData: any) => {
    this.miniWebRTC.emit('message', bcData)
  }

  awaitLeadership(){
    return this.bcConn.awaitLeadership()
  }

  isLeader(){
    return this.bcConn.isLeader()
  }

  async send(data: any) {
    if (await this.bcConn.isLeader()) {
      this.webRTCConns.forEach((webRTCConn) => {
        webRTCConn.send(data)
      })
    }


    this.bcConn.send(data)
  }

  get #signaling() {
    return this.miniWebRTC.signalingConn;
  }


  resubscribe(){
    this.#signaling?.subscribe([this.roomName])
  }

  announce(payload: Omit<WSAnnouncePayload, 'type'>) {
    this.#signaling?.announce(this.roomName, payload)
  }

  publishSignal(data: Omit<WSSignalPayload, 'type'>) {
    this.#signaling?.signal(
      this.roomName,
      data
    )
  }


  destroy() {
    rooms.delete(this.roomName);
    if (rooms.size === 0) {
      this.#signaling?.destroy()
    }
  }
}