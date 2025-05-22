import { Elysia } from 'elysia';

const app = new Elysia();
const rooms = new Map();

app.ws('/ws', {
  open(ws) {
    ws.roomId = null;
  },
  message(ws, message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'create': {
        const roomId = Math.random().toString(36).slice(2, 9);
        rooms.set(roomId, [ws]);
        ws.roomId = roomId;
        ws.send(JSON.stringify({ type: 'created', roomId }));
        break;
      }
      case 'join': {
        const room = rooms.get(data.roomId);
        if (room && room.length === 1) {
          room.push(ws);
          ws.roomId = data.roomId;
          ws.send(JSON.stringify({ type: 'joined', roomId: data.roomId }));
          room[0].send(JSON.stringify({ type: 'peerJoined' }));
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Room full or does not exist' }));
        }
        break;
      }
      case 'signal': {
        const room = rooms.get(ws.roomId);
        if (room) {
          room.forEach(peer => {
            if (peer !== ws) {
              peer.send(JSON.stringify({ type: 'signal', data: data.data }));
            }
          });
        }
        break;
      }
    }
  },
  close(ws) {
    const room = rooms.get(ws.roomId);
    if (room) {
      rooms.set(ws.roomId, room.filter(p => p !== ws));
    }
  }
});

app.listen(3000);
console.log('Signaling server running on ws://localhost:3000/ws');
