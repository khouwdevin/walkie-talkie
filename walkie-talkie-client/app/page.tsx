'use client'

import { Box, Button, Center, Icon, IconButton, Spinner, Stack, Text } from "@chakra-ui/react";
import { Room, RoomEvent } from "livekit-client";
import { useEffect, useRef, useState } from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { MdOutlineSignalWifiStatusbar4Bar, MdOutlineSignalWifiStatusbarNull } from "react-icons/md";
import { io, Socket } from "socket.io-client";

export default function Home() {
  const [status, setStatus] = useState({
    isConnected: false,
    isLoading: true,
    isError: false,
    message: "connecting..."
  })

  const [room, setRoom] = useState<Room>()
  const [mic, setMic] = useState<boolean>(false)

  const [ws, setWs] = useState<Socket>()

  const audioRef = useRef<HTMLAudioElement>(null)

  const reconnectWs = () => {
    if (!ws) return

    ws.connect()

    setStatus({
        isLoading: true,
        isError: false,
        isConnected: false,
        message: "connecting..."
    })
  }

  const error = (message: string) => {    
    setStatus({
        isLoading: false,
        isError: true,
        isConnected: false,
        message: message
    })
  }

  useEffect(() => {
    if (!room || !audioRef.current) return

    room.on(RoomEvent.Connected, () => {
        setStatus((prev) => ({ 
            ...prev, 
            isLoading: false, 
            isConnected: true, 
            message: "connected to walkie-talkie room" 
        }))

        setTimeout(() => {
            setStatus((prev) => ({ 
                ...prev, 
                message: "connected" 
            }))
        }, 1000)
    })

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (!audioRef.current) return
        
        track.attach(audioRef.current)
    })
  }, [room])

  useEffect(() => {
    if (!ws) return

    ws.on("connect_error", (e) => error(e.message))
    ws.on("error", () => error("Error"))
    ws.on("disconnect", () => error("Disconnect"))

    ws.on("connect", () => {
        ws.emit("joinRoom", "walkie-talkie")

        setStatus((prev) => ({ 
            ...prev, 
            isLoading: true, 
            isConnected: true, 
            message: "connecting to room" 
        }))
    })
  }, [ws])

  useEffect(() => {
    const enableMic = async () => {
        if (!room) return
        const currentMicState = mic

        if (currentMicState) {
            await room.localParticipant.setMicrophoneEnabled(false)
        }
        else {
            await room.localParticipant.setMicrophoneEnabled(true)
        }
    }

    enableMic()
  }, [mic, room])

  useEffect(() => {
    const initiateRoom = async () => {
        if (!ws) return

        const username = location.hostname === "localhost" ? "host" : ws.id
        const res = await fetch(`http://192.168.0.138:3001/room/${username}`)
        const { token } = await res.json()

        const currentRoom = new Room({
            audioCaptureDefaults: {
                autoGainControl: true,
                deviceId: '',
                echoCancellation: true,
                noiseSuppression: true,
            },
            publishDefaults: {
                audioPreset: {
                    maxBitrate: 20_000
                }
            }
        })
        setRoom(currentRoom)
        await currentRoom.connect("ws://192.168.0.138:7881", token)

        await currentRoom.localParticipant.setMicrophoneEnabled(false)
    }
    
    initiateRoom()
  }, [ws])

  useEffect(() => {
    const connection = io("ws://192.168.0.138:3001", { reconnection: false, transports: ["websocket"] })
    setWs(connection)

    return () => {
      if (ws) ws.close()
    }
  }, [])

  return (
    <>
        <audio autoPlay style={{ display: "none" }} ref={audioRef}/>

        <Center height="100vh">
            <Stack alignItems="center">
            <Box>
                <IconButton aria-label="mic" icon={mic ? <FaMicrophone/> : <FaMicrophoneSlash/>} 
                borderRadius="full" boxSize={["250px", "300px"]} fontSize={["80px", "100px"]} _hover={{ boxShadow: "none" }}
                onPointerDown={() => setMic(true)} onPointerUp={() => setMic(false)} isDisabled={status.isError || status.isLoading}/>
            </Box>

            <Stack pt={4} direction="row" alignItems="center" gap={4}>
                { 
                status.isLoading ?
                    <Spinner size="lg"/>              
                :
                (
                    (status.isConnected) ? 
                    <Icon aria-label="connected" as={MdOutlineSignalWifiStatusbar4Bar} fontSize={["30px", "40px"]}/> 
                    : 
                    <Icon aria-label="not connected" as={MdOutlineSignalWifiStatusbarNull} fontSize={["30px", "40px"]}/>
                )
                }

                <Text fontWeight="bold" fontSize={[25, 35]}>{status.message}</Text>
            </Stack>

            <Box>
                {status.isError && <Button size={["md", "lg"]} onClick={reconnectWs}>Reconnect</Button>}
            </Box>
            </Stack>
        </Center>
    </>
  )
}
