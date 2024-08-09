'use client'

import { Box, Button, Center, Icon, IconButton, Spinner, Stack, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { MdOutlineSignalWifiStatusbar4Bar, MdOutlineSignalWifiStatusbarNull } from "react-icons/md";
import { io, Socket } from "socket.io-client";

export default function Home() {
  const [ws, setWs] = useState<Socket | null>(null)

  const [isActive, setIsActive] = useState<boolean>(false)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isError, setIsError] = useState<boolean>(false)

  const [message, setMessage] = useState<string>("Connecting...")

  const audioRef = useRef<HTMLAudioElement>(null)

  const micRef = useRef<MediaRecorder>()
  const timeoutRef = useRef<NodeJS.Timeout>()

  const setMic = (status: boolean) => {
    if (isError) return

    setIsActive(status)
  }

  const reconnectWs = () => {
    if (!ws) return

    ws.connect()

    setIsLoading(true)
    setIsError(false)
    setIsConnected(false)
    setMessage("Connecting...")
  }

  const sendAudio = (audio: Blob) => {
    if (!ws) return

    ws.emit("message", { room: "abc", data: audio })
  }

  const error = (message: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    
    setIsConnected(false)
    setIsLoading(false)

    setMessage(message)
    setIsError(true)
  }

  useEffect(() => {
    if (!ws || !micRef.current) return

    if (isActive) {
      micRef.current.start(1)
    }
    else {
      micRef.current.stop()
    }
    
  }, [isActive])

  useEffect(() => {
    if (!ws) return

    ws.on("connect_error", () => error("Connection error"))
    ws.on("error", () => error("Error"))
    ws.on("disconnect", () => error("Disconnect"))

    ws.on("connect", () => {
      ws.emit("joinRoom", "abc")

      setIsConnected(true)
      setIsLoading(false)

      setMessage("Connected to speaker")

      timeoutRef.current = setTimeout(() => {
        setMessage("connected")
      }, 500)
    })

    ws.on("message", (data) => {
      console.log(data)
    })

    ws.on("chat", async (data) => {
      if (!audioRef.current) return
      if (data.user === ws.id) return

      try {
        const audioContext = new AudioContext()

        const buffer = await audioContext.decodeAudioData(data.message)

        const destination = audioContext.createMediaStreamDestination()

        const source = audioContext.createBufferSource()
        source.buffer = buffer
        source.connect(destination)
        source.start()

        const src = destination.stream

        audioRef.current.srcObject = src
        audioRef.current.play()
      } catch {}
    })

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      micRef.current = new MediaRecorder(stream);
      micRef.current.addEventListener("dataavailable", (event) => sendAudio(event.data))
    })

    return () => {
      if (micRef.current) micRef.current.removeEventListener("dataavailable", (event) => sendAudio(event.data))
    }
  }, [ws])

  useEffect(() => {
    const wss = io("http://localhost:3001", { reconnection: false })
    setWs(wss)

    return () => {
      if (ws) ws.close()
    }
  }, [])

  return (
    <>
      <audio ref={audioRef} style={{ display: "none" }}/>

      <Center height="100vh">
        <Stack alignItems="center">
          <Box>
            <IconButton aria-label="mic" icon={isActive ? <FaMicrophone/> : <FaMicrophoneSlash/>} 
              borderRadius="full" boxSize={["250px", "300px"]} fontSize={["80px", "100px"]} _hover={{ boxShadow: "none" }}
              onPointerDown={() => setMic(true)} onPointerUp={() => setMic(false)} isDisabled={isError || isLoading}/>
          </Box>

          <Stack pt={4} direction="row" alignItems="center" gap={4}>
            { 
              isLoading ?
                <Spinner size="lg"/>              
              :
              (
                (isConnected) ? 
                <Icon aria-label="connected" as={MdOutlineSignalWifiStatusbar4Bar} fontSize={["30px", "40px"]}/> 
                : 
                <Icon aria-label="not connected" as={MdOutlineSignalWifiStatusbarNull} fontSize={["30px", "40px"]}/>
              )
            }

            <Text fontWeight="bold" fontSize={[25, 35]}>{message}</Text>
          </Stack>

          <Box>
            {isError && <Button size={["md", "lg"]} onClick={reconnectWs}>Reconnect</Button>}
          </Box>
        </Stack>
      </Center>
    </>
  )
}
