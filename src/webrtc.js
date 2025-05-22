let ws;
let peerConnection;
let dataChannel;
let isHost = false;
let remoteUpdateCallback = () => {};

const signalingServerUrl = 'ws://localhost:3000/ws';

export function connectToSignalingServer() {
  ws = new WebSocket(signalingServerUrl);
  ws.onopen = () => console.log('[WebRTC] Connected to signaling server');

  ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    switch (data.type) {
      case 'created':
        console.log('[WebRTC] Room created:', data.roomId);
        isHost = true;
        setupPeerConnection();
        dataChannel = peerConnection.createDataChannel('game');
        setupDataChannel();
        window.startConnection && startConnection();
        if (window.roomCallback) window.roomCallback(data.roomId);
        break;
      case 'joined':
        console.log('[WebRTC] Joined room:', data.roomId);
        setupPeerConnection();
        break;
      case 'peerJoined':
        console.log('[WebRTC] A peer joined the room');
        startConnection();
        break;
      case 'signal':
        await handleSignal(data.data);
        break;
      case 'error':
        console.error('[WebRTC]', data.message);
        break;
    }
  };
}

export function createRoom(callback) {
  window.roomCallback = callback;
  ws.send(JSON.stringify({ type: 'create' }));
}

export function joinRoom(roomId) {
  ws.send(JSON.stringify({ type: 'join', roomId }));
}

function setupPeerConnection() {
  peerConnection = new RTCPeerConnection();

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      ws.send(JSON.stringify({ type: 'signal', data: { candidate: event.candidate } }));
    }
  };

  peerConnection.ondatachannel = (event) => {
    dataChannel = event.channel;
    setupDataChannel();
  };
}

function setupDataChannel() {
  dataChannel.onopen = () => console.log('[WebRTC] Data channel open');
  dataChannel.onmessage = (event) => {
    const data = JSON.parse(event.data);
    remoteUpdateCallback(data);
  };
}

async function handleSignal(data) {
  if (data.sdp) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    if (data.sdp.type === 'offer') {
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      ws.send(JSON.stringify({ type: 'signal', data: { sdp: answer } }));
    }
  } else if (data.candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
}

export async function startConnection() {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  ws.send(JSON.stringify({ type: 'signal', data: { sdp: offer } }));
}

export function sendGameState(state) {
  if (dataChannel && dataChannel.readyState === 'open') {
    dataChannel.send(JSON.stringify(state));
  }
}

export function setRemoteUpdateCallback(callback) {
  remoteUpdateCallback = callback;
}