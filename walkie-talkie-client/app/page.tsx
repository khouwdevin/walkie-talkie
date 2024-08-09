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

  const bufferRef = useRef<AudioBuffer>()
  const bufferIndexRef = useRef<number>(0);
  const bufferLengthRef = useRef<number>(0);

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

    ws.emit("message", { audio })
  }

  const error = (message: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    
    setIsConnected(false)
    setIsLoading(false)

    setMessage(message)
    setIsError(true)
  }

  // const decodeAudio = (buffer: ArrayBuffer) => {
  //   if (!bufferRef.current || !audioRef.current) return
  //   const audioContext = new AudioContext()
  //   const data = new Float32Array(buffer)

  //   bufferRef.current.getChannelData(0).set(data, bufferIndexRef.current)
  //   bufferLengthRef.current += data.length

  //   if (audioRef.current.buffered.length < 16384) {
  //     if (audioRef.current) {
  //       audioRef.current.pause()
  //     }
  //     audioRef.current = audioContext.createBufferSource()
  //     audioRef.current.buffer = audioBuffer
  //     audioRef.current.src = audioContext.destination
  //     audioRef.current.connect(audioContext.current.destination)
  //     audioRef.current.play()
  //   }

  //     bufferIndexRef.current = (bufferIndexRef.current + data.length) % 16384;
  // }

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
      setIsConnected(true)
      setIsLoading(false)

      setMessage("Connected to speaker")

      timeoutRef.current = setTimeout(() => {
        setMessage("connected")
      }, 2000)
    })

    ws.on("message", (data) => {
      console.log(data)
    })

    ws.on("chat", (data) => {
      if (data.user === ws.id) return
      console.log(data.message.audio)
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

    bufferRef.current = new AudioBuffer({ length: 16384, numberOfChannels: 1, sampleRate: 44100 }) 

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
