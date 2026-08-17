"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "@/providers/AuthProvider";

const ChatSocketContext = createContext(null);

const getSocketBaseUrl = () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
  return backendUrl.replace(/\/api\/?$/, "");
};

export function ChatSocketProvider({ children }) {
  const auth = useContext(AuthContext);
  const isAuthenticated = !!auth?.employee;
  const authLoading = auth?.loading ?? false;

  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineEmployeeIds, setOnlineEmployeeIds] = useState(new Set());
  const socketRef = useRef(null);

  // Connect only once there's an authenticated session — same rule as
  // TimeZoneProvider/PermissionsProvider: this provider wraps the whole app
  // including the public login page, and a chat socket has no business
  // opening before login.
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
        setOnlineEmployeeIds(new Set());
      }
      return;
    }

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("authToken") || localStorage.getItem("token")
        : null;
    if (!token) return;

    const instance = io(`${getSocketBaseUrl()}/chat`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    instance.on("connect", () => setConnected(true));
    instance.on("disconnect", () => setConnected(false));

    instance.on("presence:list", ({ onlineEmployeeIds: ids }) => {
      setOnlineEmployeeIds(new Set(ids || []));
    });
    instance.on("presence:online", ({ employeeId }) => {
      setOnlineEmployeeIds((prev) => new Set(prev).add(employeeId));
    });
    instance.on("presence:offline", ({ employeeId }) => {
      setOnlineEmployeeIds((prev) => {
        const next = new Set(prev);
        next.delete(employeeId);
        return next;
      });
    });

    socketRef.current = instance;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial connection setup on mount/auth change, not a cascading render
    setSocket(instance);

    return () => {
      instance.disconnect();
      socketRef.current = null;
    };
  }, [authLoading, isAuthenticated]);

  const sendMessage = useCallback(
    (receiverId, content) =>
      new Promise((resolve, reject) => {
        if (!socketRef.current) {
          reject(new Error("Chat is not connected"));
          return;
        }
        socketRef.current.emit("message:send", { receiverId, content }, (response) => {
          if (response?.error) reject(new Error(response.error));
          else resolve(response);
        });
      }),
    []
  );

  const markSeen = useCallback((partnerId) => {
    socketRef.current?.emit("message:seen", { partnerId });
  }, []);

  const sendTyping = useCallback((receiverId) => {
    socketRef.current?.emit("typing", { receiverId });
  }, []);

  const isOnline = useCallback((employeeId) => onlineEmployeeIds.has(employeeId), [onlineEmployeeIds]);

  const value = useMemo(
    () => ({ socket, connected, onlineEmployeeIds, isOnline, sendMessage, markSeen, sendTyping }),
    [socket, connected, onlineEmployeeIds, isOnline, sendMessage, markSeen, sendTyping]
  );

  return <ChatSocketContext.Provider value={value}>{children}</ChatSocketContext.Provider>;
}

export function useChatSocket() {
  const ctx = useContext(ChatSocketContext);
  if (!ctx) {
    return {
      socket: null,
      connected: false,
      onlineEmployeeIds: new Set(),
      isOnline: () => false,
      sendMessage: async () => {
        throw new Error("Chat socket not available");
      },
      markSeen: () => { },
      sendTyping: () => { },
    };
  }
  return ctx;
}
