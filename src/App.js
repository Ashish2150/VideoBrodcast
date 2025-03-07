import React, { useEffect, useRef, useState } from 'react';
import { Peer } from 'peerjs';

export default function VideoApp() {
  const [peerId, setPeerId] = useState(null);
  const [remoteId, setRemoteId] = useState('');
  const [peer, setPeer] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    const newPeer = new Peer();
    newPeer.on('open', (id) => setPeerId(id));
    newPeer.on('call', (call) => {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          call.answer(stream);
          localVideoRef.current.srcObject = stream;
          call.on('stream', (remoteStream) => {
            remoteVideoRef.current.srcObject = remoteStream;
          });
        });
    });
    setPeer(newPeer);
    return () => newPeer.destroy();
  }, []);

  const startBroadcast = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
      });
  };

  const connectToPeer = () => {
    if (!peer || !remoteId) return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        const call = peer.call(remoteId, stream);
        call.on('stream', (remoteStream) => {
          remoteVideoRef.current.srcObject = remoteStream;
        });
      });
  };

  const startRecording = () => {
    if (!localVideoRef.current.srcObject) return;
    const stream = localVideoRef.current.srcObject;
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    recordedChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recorded-video.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    mediaRecorder.start();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="p-6 flex flex-col items-center bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-4">📹 Video Call App</h1>
      <p className="mb-2">Your Peer ID: <span className="font-mono bg-gray-700 px-2 py-1 rounded">{peerId}</span></p>
      <div className="flex gap-2 mb-4">
        <button onClick={startBroadcast} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded">Start Broadcasting</button>
        <input type="text" placeholder="Enter Peer ID to Connect" value={remoteId} onChange={(e) => setRemoteId(e.target.value)} className="border p-2 text-black rounded" />
        <button onClick={connectToPeer} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded">Connect</button>
      </div>
      <div className="flex gap-4 w-full max-w-3xl">
        <video ref={localVideoRef} autoPlay muted className="w-1/2 border-4 border-blue-500 rounded-lg shadow-lg" />
        <video ref={remoteVideoRef} autoPlay className="w-1/2 border-4 border-green-500 rounded-lg shadow-lg" />
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={startRecording} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded">Start Recording</button>
        <button onClick={stopRecording} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded">Stop Recording</button>
      </div>
    </div>
  );
}
