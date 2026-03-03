/// <reference types="vite/client" />

declare global {
  interface Window {
    Buffer: typeof import('buffer').Buffer;
  }
}

declare module "*.lottie" {
  const content: string;
  export default content;
}
