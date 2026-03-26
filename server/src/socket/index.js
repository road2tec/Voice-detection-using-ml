let ioInstance = null;

const initializeSocket = (io) => {
  ioInstance = io;
};

const getSocket = () => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized.');
  }

  return ioInstance;
};

module.exports = {
  initializeSocket,
  getSocket,
};
