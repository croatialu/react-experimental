import type { Room } from "./room";
import type { SignalingConn } from "./signaling-conn";

export const signalingConns = new Map<string, SignalingConn>();
export const rooms = new Map<string, Room>();
