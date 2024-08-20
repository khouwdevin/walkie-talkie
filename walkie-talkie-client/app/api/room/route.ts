import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";
import crypto from "crypto"

export async function POST() {
    try {
        const username = crypto.randomBytes(48).toString("hex")
        const roomName = "walkie-talkie"
  
        const at = new AccessToken(
          process.env.LIVEKIT_API_KEY,
          process.env.LIVEKIT_API_SECRET,
          {
            identity: username,
          },
        )
        at.addGrant({ roomJoin: true, room: roomName })
  
        const token = await at.toJwt()
  
        return NextResponse.json({ token })
    } catch (e) {
        return NextResponse.json({ error: e })
    }
}