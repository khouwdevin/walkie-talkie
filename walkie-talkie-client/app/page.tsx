'use client'

import { Box, Center, Icon, IconButton, Spinner, Stack, Text } from "@chakra-ui/react";
import { Room, RoomEvent } from "livekit-client";
import { useEffect, useRef, useState } from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { MdOutlineSignalWifiStatusbar4Bar, MdOutlineSignalWifiStatusbarNull } from "react-icons/md";

export default function Home() {
    const [status, setStatus] = useState({
        isConnected: false,
        isLoading: true,
        isError: false,
        message: "connecting..."
    })

    const [room, setRoom] = useState<Room>()

    const [mic, setMic] = useState<boolean>(false)    

    const audioRef = useRef<HTMLAudioElement>(null)

    const error = (message: string) => {    
        setStatus({
            isLoading: false,
            isError: true,
            isConnected: false,
            message: message
        })
    }

    const enableMic = async () => {
        if (status.isError || status.isLoading) return
        if (!room) return

        const currentMicState = !mic

        await room.localParticipant.setMicrophoneEnabled(!mic)

        setMic(currentMicState)
    }

    useEffect(() => {
        if (!room || !audioRef.current) return

        room.on(RoomEvent.Connected, () => {
            setStatus({ 
                isError: false, 
                isLoading: false, 
                isConnected: true, 
                message: "walkie talkie room"
            })

            setTimeout(() => {
                setStatus((prev) => ({ 
                    ...prev, 
                    message: "connected" 
                }))
            }, 1000)
        })

        room.on(RoomEvent.Disconnected, async (reason) => {
            setStatus({ 
                isError: true, 
                isLoading: false, 
                isConnected: false, 
                message: "disconnected"
            })
        })

        room.on(RoomEvent.Reconnecting, () => {
            setStatus({
                isError: false,
                isLoading: true,
                isConnected: false,
                message: "reconnecting"
            })
        })

        room.on(RoomEvent.Reconnected, () => {
            setStatus({ 
                isError: false, 
                isLoading: false,
                isConnected: true,
                message: "reconnected to room" 
            })

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

        room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
            if (!audioRef.current) return

            track.detach(audioRef.current)
        })
    }, [room])

    useEffect(() => {
        const getRoom = async () => {
            try {
                const res = await fetch("/api/room", {
                    method: "POST"
                })
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
    
                await currentRoom.connect(process.env.LIVEKIT_URL as string, token)
                await currentRoom.localParticipant.setMicrophoneEnabled(false)
            } catch {
                error("room error")
            }
        }

        getRoom()
    }, [])

    useEffect(() => {
        if (!ws) return

        ws.on("connect_error", (e) => error(e.message))
        ws.on("error", () => error("error"))
        ws.on("disconnect", () => error("disconnected"))

        ws.on("connect", () => {
            ws.emit("joinRoom", "walkie-talkie")

            setStatus((prev) => ({ 
                ...prev, 
                isLoading: true, 
                isConnected: true, 
                message: "connecting to room" 
            }))

            if (room === undefined)
                initiateRoom()
        })
    }, [ws])

    useEffect(() => {
        const connection = io("https://192.168.0.138:3001", { reconnection: false, transports: ["websocket"] })
        setWs(connection)

        return () => {
            if (ws) ws.close()
        }
    }, [])
    
    return (
        <>
            <audio style={{ display: "none" }} ref={audioRef}/>

            <Center height="100vh">
                <Stack alignItems="center">
                    <Box>
                        <IconButton aria-label="mic" icon={mic ? <FaMicrophone/> : <FaMicrophoneSlash/>} 
                        borderRadius="full" boxSize={["250px", "300px"]} fontSize={["80px", "100px"]} _hover={{ boxShadow: "none" }}
                        onPointerDown={enableMic} isDisabled={status.isError || status.isLoading}/>
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
                </Stack>
            </Center>
        </>
    )
}
