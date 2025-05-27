import { Elysia } from 'elysia';

const app = new Elysia();
const rooms = new Map();

app.ws('/ws', {
  open(ws) {
    console.log("[SIGNALING] New client connected");
    ws.roomId = null;
  },

  message(ws, rawMessage) {
    console.log("[SIGNALING] Message received:", rawMessage);

    let data;
    try {
      data = typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage;
    } catch (err) {
      console.error("[SIGNALING] Failed to parse message:", err);
      return;
    }

    switch (data.type) {
      case 'create': {
        const roomId = Math.random().toString(36).slice(2, 9);
        console.log("[SIGNALING] Creating room:", roomId);
        rooms.set(roomId, [ws]);
        ws.roomId = roomId;
        ws.send({ type: 'created', roomId });
        break;
      }

      case 'join': {
        const room = rooms.get(data.roomId);
        if (room && room.length === 1) {
          room.push(ws);
          ws.roomId = data.roomId;
          ws.send({ type: 'joined', roomId: data.roomId });
          room[0].send({ type: 'peerJoined' });
        } else {
          ws.send({ type: 'error', message: 'Room full or does not exist' });
        }
        break;
      }

      case 'signal': {
        const room = rooms.get(ws.roomId);
        if (room) {
          room.forEach(peer => {
            if (peer !== ws) {
              peer.send({ type: 'signal', data: data.data });
            }
          });
        }
        break;
      }

      default:
        console.warn("[SIGNALING] Unknown message type:", data.type);
        break;
    }
  },

  close(ws) {
    console.log("[SIGNALING] Client disconnected");
    const room = rooms.get(ws.roomId);
    if (room) {
      rooms.set(
        ws.roomId,
        room.filter(client => client !== ws)
      );
    }
  }
});

app.listen(3000);
console.log("✅ Signaling server running on ws://localhost:3000/ws");
