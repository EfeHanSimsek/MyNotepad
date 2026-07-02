/// <reference types="vite/client" />

interface Window {
  atlasDesktop?: {
    platform: NodeJS.Platform;
    versions: {
      electron: string;
      chrome: string;
      node: string;
    };
  };
}
