import type {
  SignalData as PeerSignalData,
} from "simple-peer";

export interface WSSubscribePayload {
  type: 'subscribe'
  topics: string[]
}

export interface WSPublishPayload<Data = any> {
  type: 'publish'
  topic: string
  data: Data
}

export interface WSSignalPayload {
  type: 'signal'
  signal: PeerSignalData
  from: string
  to: string
  token: number
}

export interface WSAnnouncePayload {
  type: 'announce'
  from: string
}
