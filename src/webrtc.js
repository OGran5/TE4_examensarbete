
let ws;
let peerConnection;
let dataChannel;
let remoteUpdateCallback = () => {};

export function connectToSignalingServer() {
  console.log("[WebRTC] Connecting to signaling server: ws://localhost:3000/ws");
  ws = new WebSocket("ws://localhost:3000/ws");

  ws.onopen = () => {
    console.log("[WebRTC] Connected to signaling server");
  };

  ws.onmessage = async (event) => {
    console.log("[SIGNALING] Message received:", event.data);
    const msg = JSON.parse(event.data);

    if (msg.type === "created") {
      console.log("[WebRTC] Room created:", msg.roomId);
      document.getElementById("roomCodeDisplay").textContent = msg.roomId;
    }

    if (msg.type === "joined") {
      console.log("[WebRTC] Joined room:", msg.roomId);
    }

    if (msg.type === "peer-joined") {
      console.log("[WebRTC] A peer joined the room");
    }

    if (msg.type === "signal") {
      await handleSignal(msg.data);
    }
  };
}

function sendSignal(data) {
  ws.send(JSON.stringify({ type: "signal", data }));
}

export async function createRoom() {
  console.log("[WebRTC] Sending room creation request...");
  peerConnection = createPeerConnection("host");

  dataChannel = peerConnection.createDataChannel("game");
  console.log("[WebRTC] DataChannel created (host)");

  dataChannel.onopen = () => console.log("[WebRTC] Data channel open (host)");
  dataChannel.onmessage = (event) => {
    console.log("[SYNC] Received (host):", event.data);
    const data = JSON.parse(event.data);
    remoteUpdateCallback(data);
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  sendSignal({ sdp: offer });

  ws.send(JSON.stringify({ type: "create" }));
}

export async function joinRoom(roomId) {
  peerConnection = createPeerConnection("client");

  peerConnection.ondatachannel = (event) => {
    console.log("[WebRTC] ondatachannel fired");
    dataChannel = event.channel;
    console.log("[WebRTC] DataChannel assigned (client)");

    dataChannel.onopen = () => console.log("[WebRTC] Data channel open (client)");
    dataChannel.onmessage = (event) => {
      console.log("[SYNC] Received (client):", event.data);
      const data = JSON.parse(event.data);
      remoteUpdateCallback(data);
    };
  };

  ws.send(JSON.stringify({ type: "join", roomId }));
}

function createPeerConnection(role) {
  console.log("[WebRTC] Creating RTCPeerConnection as", role);
  const pc = new RTCPeerConnection();

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      sendSignal({ candidate: event.candidate });
    }
  };

  pc.onconnectionstatechange = () => {
    console.log("[WebRTC] Connection state:", pc.connectionState);
  };

  peerConnection = pc;
  return pc;
}

async function handleSignal(data) {
  if (data.sdp) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    if (data.sdp.type === "offer") {
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      sendSignal({ sdp: answer });
    }
  } else if (data.candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
}

export function onRemoteUpdate(callback) {
  remoteUpdateCallback = callback;
}

export function sendGameState(state) {
  if (dataChannel && dataChannel.readyState === "open") {
    dataChannel.send(JSON.stringify(state));
    console.log("[SYNC] Sent:", state);
  }
}
