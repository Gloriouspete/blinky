"use client";
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import { Md3P } from "react-icons/md";
export default function Home() {
  const [mypeer, setMypeer] = useState(null);
  const [remotePeer, setRemotePeer] = useState(null);
  const localvideoRef = useRef(null);
  const remoteRef = useRef(null);
  const socket = useRef(null);

  useEffect(() => {
    socket.current = io("http://localhost:8081");
    socket.current.on("ready", (id) => {
      setRemotePeer(id);
    });

    socket.current.on("signal", (data) => {
      if (mypeer) {
        mypeer.signal(data.signal);
      }
    });
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: null,
    });

    peer.on("signal", (data) => {
      socket.current.emit("signal", {
        signal: data,
        to: remotePeer,
      });
    });

    peer.on("stream", (stream) => {
      remoteRef.current.srcObject = stream;
      console.log("received camera");
    });

    setMypeer(peer);

    return () => {
      socket.current.disconnect();
    };
  }, []);

  const startVideoChat = async () => {
    try {
      console.log("started camera");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localvideoRef.current.srcObject = stream;
      const initiatorPeer = new Peer({
        initiator: true,
        trickle: false,
        stream,
      });
      console.log("got to initiate", initiatorPeer);
      initiatorPeer.on("signal", (data) => {
        console.log("got data");
        socket.current.emit("signal", {
          signal: data,
          to: remotePeer,
        });
        console.log(data, "got data");
      });

      initiatorPeer.on("stream", (stream) => {
        remoteVideoRef.current.srcObject = stream;
      });
      console.log("end");
      setMypeer(initiatorPeer);
    } catch (error) {
      console.error("Error getting media stream:", error);
    }
  };
  return (
    <>
      <main className="bg-blue-500 w-screen h-screen flex items-center justify-center flex-col">
        {
          //localvideoRef.current && (
          <video
            ref={localvideoRef}
            autoPlay
            muted
            className="w-screen h-screen object-cover absolute transform scale-x-[-1]"
          ></video>
        }

        {remoteRef.current && (
          <video ref={remoteRef} autoPlay className="w-screen h-screen"></video>
        )}
        <button
          className="w-16 h-16 rounded-full bg-red-500 border-2 border-white fixed bottom-6"
          onClick={startVideoChat}
        ></button>
      </main>
    </>
  );
}
