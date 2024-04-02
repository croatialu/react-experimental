import { Observable } from "./observer";
import { Room } from "./room";
import { SignalingConn } from "./signaling-conn";

export class MiniWebRTC extends Observable<{ message: (data: any) => void }> {
  room: Room;
  signalingConn?: SignalingConn;
  constructor(roomName: string, signalingUrl: string) {
    super()
    this.room = Room.New(this, roomName);


    this.room.awaitLeadership().then(() => {
      document.title = 'Leader'
      this.signalingConn = SignalingConn.New(signalingUrl);
    })
  }

  send(data: any) {
    this.room.send(data)
  }

  destroy(): void {
    this.room.destroy()
    this.signalingConn?.destroy()
  }
}