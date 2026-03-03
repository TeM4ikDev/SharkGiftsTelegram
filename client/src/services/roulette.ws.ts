import { getTokenFromLocalStorage } from "@/utils/localstorage";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const getBaseUrl = () => {
    if (import.meta.env.DEV) return "http://localhost:8080";
    return "";
};

export const connectRouletteWS = () => {
    if (socket) return socket;
    const token = getTokenFromLocalStorage();
    socket = io(`${getBaseUrl()}/roulette`, {
        transports: ["websocket"],
        auth: token ? { token } : undefined,
    });
    return socket;
};

export const disconnectRouletteWS = () => {
    if (!socket) return;
    socket.disconnect();
    socket = null;
};
