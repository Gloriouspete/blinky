"use client";
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";

export default function Home() {
  const [myPeer, setMyPeer] = useState(null);
  const [remotePeer, setRemotePeer] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socket = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socket.current = io("http://192.168.1.154:8081");

    // Handle 'ready' event to initiate the connection
    socket.current.on("ready", (id) => {
      console.log("i got ready",id)
      setRemotePeer(id);
    });

    // Handle incoming signaling data
    socket.current.on("signal", (data) => {
      if (myPeer) {
        myPeer.signal(data.signal);
      }
    });

    return () => {
      // Cleanup on component unmount
      //socket.current.disconnect();
    };
  }, [myPeer]);

  const startVideoChat = async () => {
    try {
      console.log("Started camera");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Set local video stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream,
      });

      peer.on("signal", (data) => {
        console.log("got data");
        socket.current.emit("signal", {
          signal: data,
          to: remotePeer,
        });
        console.log("got remote peer",remotePeer + "love" + myPeer);
      });

      peer.on("stream", (remoteStream) => {
        console.log("gor remote stream")
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      setMyPeer(peer);
    } catch (error) {
      console.error("Error getting media stream:", error);
      alert(error)
    }
  };

  return (
    <main className="bg-blue-500 w-screen h-screen flex items-center justify-center flex-col">
      <video
        ref={localVideoRef}
        autoPlay
        muted
        className="w-screen h-screen object-cover absolute transform scale-x-[-1]"
      ></video>
      <video
        ref={remoteVideoRef}
        autoPlay
        className="w-screen h-screen"
      ></video>
      <button
        className="w-16 h-16 rounded-full bg-red-500 border-2 border-white fixed bottom-6"
        onClick={startVideoChat}
      ></button>
    </main>
  );
}
