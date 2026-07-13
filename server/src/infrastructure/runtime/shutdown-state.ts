let shuttingDown = false;

export const shutdownState = {
  isShuttingDown() {
    return shuttingDown;
  },

  startShutdown() {
    shuttingDown = true;
  },
};
