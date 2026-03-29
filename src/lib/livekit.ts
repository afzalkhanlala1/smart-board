import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;

export async function createToken(
  roomName: string,
  participantName: string,
  participantId: string,
  isTeacher: boolean
) {
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantId,
    name: participantName,
    ttl: "6h",
  });

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: isTeacher,
    canSubscribe: true,
    canPublishData: true,
  });

  return await at.toJwt();
}

export function generateRoomName(lectureId: string): string {
  return `lecture-${lectureId}`;
}
