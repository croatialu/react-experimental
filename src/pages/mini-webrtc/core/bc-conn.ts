import { LeaderElector, createLeaderElection, BroadcastChannel } from "broadcast-channel";
import { Observable } from "./observer";

type BCConnEvents = {
  message: (data: any) => void
  leader: () => void
}

export class BCConn extends Observable<BCConnEvents> {

  #channel: BroadcastChannel;
  #elector: LeaderElector

  constructor(
    roomName: string
  ) {
    super()
    const channel = this.#channel = new BroadcastChannel(roomName);
    const elector = this.#elector = createLeaderElection(channel);


    channel.addEventListener('message', this.#handleMessage)

    elector.awaitLeadership().then(() => {
      this.emit('leader')
    })
  }


  #handleMessage = (data: any) => {
    this.emit('message', JSON.parse(data))
  }

  awaitLeadership(){
    return this.#elector.awaitLeadership()
  }

  async isLeader() {
    await this.#elector.hasLeader()
    return this.#elector.isLeader
  }

  async send(data: unknown) {
    await this.#elector.hasLeader()
    this.#channel.postMessage(
      JSON.stringify(data)
    )
  }



  destroy(): void {
    this.#channel.close()
    this.#elector.die()

    super.destroy()
  }
}