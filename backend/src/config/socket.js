const { Server } = require('socket.io');

let io = null;

const initSocket = (server, clientUrl) => {
  io = new Server(server, {
    cors: {
      origin: clientUrl || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Client authenticates room joining
    socket.on('join_user_room', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    socket.on('join_dept_room', (deptId) => {
      if (deptId) {
        socket.join(`dept:${deptId}`);
      }
    });

    socket.on('join_role_room', (role) => {
      if (role) {
        socket.join(`role:${role}`);
      }
    });

    socket.on('disconnect', () => {
      // socket disconnected
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

const emitToUser = (userId, event, data) => {
  if (io && userId) {
    io.to(`user:${userId.toString()}`).emit(event, data);
  }
};

const emitToDepartment = (deptId, event, data) => {
  if (io && deptId) {
    io.to(`dept:${deptId.toString()}`).emit(event, data);
  }
};

const emitToRole = (role, event, data) => {
  if (io && role) {
    io.to(`role:${role}`).emit(event, data);
  }
};

const emitGlobal = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToDepartment,
  emitToRole,
  emitGlobal,
};

