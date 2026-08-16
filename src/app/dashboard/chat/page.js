"use client";

import React, { useState, useEffect, useRef, useMemo, useContext } from "react";
import { motion } from "framer-motion";
import { FiSearch, FiSend, FiArrowLeft, FiMessageCircle } from "react-icons/fi";
import { MdDone, MdDoneAll } from "react-icons/md";
import { AuthContext } from "@/providers/AuthProvider";
import { useChatSocket } from "@/providers/ChatSocketProvider";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import useChatApi from "@/hooks/useChatApi";
import Avatar from "@/components/Comon/Avatar";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";

// Merges an incoming socket message into the conversation-preview list: bumps
// an existing entry to the top, or creates a fresh entry the first time two
// employees ever message each other.
function upsertConversationPreview({ prev, msg, partnerId, contactsById, currentEmployeeId, isConversationActive }) {
  const lastMessage = {
    _id: msg._id,
    content: msg.content,
    sender: msg.sender,
    receiver: msg.receiver,
    seen: msg.seen,
    createdAt: msg.createdAt,
  };

  const isIncoming = msg.sender !== currentEmployeeId;
  const bumpUnread = isIncoming && !isConversationActive;
  const existing = prev.find((c) => c.partner._id === partnerId);

  let entry;
  if (existing) {
    entry = {
      ...existing,
      lastMessage,
      unreadCount: bumpUnread ? existing.unreadCount + 1 : isIncoming && isConversationActive ? 0 : existing.unreadCount,
    };
  } else {
    const partner = contactsById[partnerId];
    if (!partner) return prev;
    entry = {
      conversationId: [msg.sender, msg.receiver].sort().join("_"),
      partner: {
        _id: partner._id,
        name: partner.name,
        email: partner.email,
        photo: partner.photo,
        role: partner.role,
        department: partner.department,
      },
      lastMessage,
      unreadCount: bumpUnread ? 1 : 0,
    };
  }

  return [entry, ...prev.filter((c) => c.partner._id !== partnerId)];
}

function getDateLabel(dateStr, timeZone, formatDate) {
  const msgDate = new Date(dateStr);
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const msgDay = fmt.format(msgDate);
  const today = fmt.format(now);
  const yesterday = fmt.format(new Date(now.getTime() - 86400000));
  if (msgDay === today) return "Today";
  if (msgDay === yesterday) return "Yesterday";
  return formatDate(dateStr);
}

export default function ChatPage() {
  const { employee, user } = useContext(AuthContext);
  const currentEmployeeId = (employee || user)?._id;

  const { socket, isOnline, sendMessage, markSeen, sendTyping } = useChatSocket();
  const { getContacts, getConversations, getMessages } = useChatApi();
  const { timeZone, formatDate, formatTime } = useSystemTimeZone();

  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");

  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typingActive, setTypingActive] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const activePartnerIdRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentRef = useRef(0);

  const contactsById = useMemo(() => {
    const map = {};
    contacts.forEach((c) => {
      map[c._id] = c;
    });
    return map;
  }, [contacts]);

  // Initial load: every employee (for the contact list) + existing conversations.
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingList(true);
      try {
        const [contactsData, conversationsData] = await Promise.all([getContacts(), getConversations()]);
        if (!active) return;
        setContacts(contactsData);
        setConversations(conversationsData);
      } catch (err) {
        console.error("Failed to load chat contacts/conversations:", err);
      } finally {
        if (active) setLoadingList(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    activePartnerIdRef.current = activePartner?._id || null;
  }, [activePartner]);

  // Live socket events: new messages, seen receipts, typing pings.
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      const partnerId = msg.sender === currentEmployeeId ? msg.receiver : msg.sender;
      const isActive = activePartnerIdRef.current === partnerId;

      setConversations((prev) =>
        upsertConversationPreview({ prev, msg, partnerId, contactsById, currentEmployeeId, isConversationActive: isActive }),
      );

      if (isActive) {
        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
        if (msg.sender !== currentEmployeeId) {
          markSeen(partnerId);
        }
      }
    };

    const handleSeen = ({ by, conversationId }) => {
      if (activePartnerIdRef.current === by) {
        setMessages((prev) =>
          prev.map((m) => (m.sender === currentEmployeeId && !m.seen ? { ...m, seen: true, seenAt: new Date().toISOString() } : m)),
        );
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === conversationId && c.lastMessage?.sender === currentEmployeeId
            ? { ...c, lastMessage: { ...c.lastMessage, seen: true } }
            : c,
        ),
      );
    };

    const handleTyping = ({ from }) => {
      if (activePartnerIdRef.current !== from) return;
      setTypingActive(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingActive(false), 3000);
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:seen", handleSeen);
    socket.on("typing", handleTyping);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:seen", handleSeen);
      socket.off("typing", handleTyping);
    };
  }, [socket, currentEmployeeId, markSeen, contactsById]);

  // Load history for the selected conversation and mark it seen.
  useEffect(() => {
    if (!activePartner) return;
    let active = true;
    (async () => {
      setLoadingMessages(true);
      setMessages([]);
      setPage(1);
      try {
        const result = await getMessages(activePartner._id, 1);
        if (!active) return;
        setMessages(result.data);
        setHasMore(result.currentPage < result.totalPages);
        markSeen(activePartner._id);
        setConversations((prev) => prev.map((c) => (c.partner._id === activePartner._id ? { ...c, unreadCount: 0 } : c)));
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        if (active) setLoadingMessages(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePartner?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSelectPartner = (contact) => {
    setActivePartner(contact);
    setShowMobileList(false);
  };

  const handleLoadOlder = async () => {
    if (!activePartner || loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    const container = messagesContainerRef.current;
    const prevHeight = container?.scrollHeight || 0;
    try {
      const nextPage = page + 1;
      const result = await getMessages(activePartner._id, nextPage);
      setMessages((prev) => [...result.data, ...prev]);
      setPage(nextPage);
      setHasMore(result.currentPage < result.totalPages);
      requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight - prevHeight;
      });
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleScroll = (e) => {
    if (e.target.scrollTop < 60 && hasMore && !loadingOlder) {
      handleLoadOlder();
    }
  };

  const handleSend = async () => {
    const content = messageInput.trim();
    if (!content || !activePartner || sending) return;
    setMessageInput("");
    setSending(true);
    try {
      await sendMessage(activePartner._id, content);
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessageInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    if (activePartner) {
      const now = Date.now();
      if (now - lastTypingSentRef.current > 2000) {
        sendTyping(activePartner._id);
        lastTypingSentRef.current = now;
      }
    }
  };

  const combinedList = useMemo(() => {
    const conversationByPartnerId = {};
    conversations.forEach((c) => {
      conversationByPartnerId[c.partner._id] = c;
    });

    const withConvo = [];
    const withoutConvo = [];
    contacts.forEach((contact) => {
      const convo = conversationByPartnerId[contact._id];
      if (convo) {
        withConvo.push({
          ...contact,
          _lastMessage: convo.lastMessage,
          _unreadCount: convo.unreadCount,
          _conversationId: convo.conversationId,
        });
      } else {
        withoutConvo.push({ ...contact, _lastMessage: null, _unreadCount: 0 });
      }
    });
    withConvo.sort((a, b) => new Date(b._lastMessage.createdAt) - new Date(a._lastMessage.createdAt));
    withoutConvo.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return [...withConvo, ...withoutConvo];
  }, [contacts, conversations]);

  const filteredList = useMemo(() => {
    if (!search.trim()) return combinedList;
    const q = search.trim().toLowerCase();
    return combinedList.filter(
      (c) => c.name?.toLowerCase().includes(q) || c.department?.toLowerCase().includes(q),
    );
  }, [combinedList, search]);

  const groupedMessages = useMemo(() => {
    const groups = [];
    messages.forEach((msg) => {
      const label = getDateLabel(msg.createdAt, timeZone, formatDate);
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.label === label) {
        lastGroup.items.push(msg);
      } else {
        groups.push({ label, items: [msg] });
      }
    });
    return groups;
  }, [messages, timeZone, formatDate]);

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <Mtitle title="Employee Chat" subtitle="Message any colleague in real time" />

      <div className="flex-1 flex bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm overflow-hidden">
        {/* Contact / conversation list */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-brand-beige/50 dark:border-brand-dark-grey/50 flex-col ${
            showMobileList ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="p-4 border-b border-brand-beige/50 dark:border-brand-dark-grey/50">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark-grey text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employees..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey/60 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="p-4">
                <SkeletonLoading variant="pulse" />
              </div>
            ) : filteredList.length === 0 ? (
              <div className="p-8 text-center text-sm text-brand-dark-grey">No employees found</div>
            ) : (
              filteredList.map((contact) => {
                const online = isOnline(contact._id);
                const isActive = activePartner?._id === contact._id;
                return (
                  <button
                    key={contact._id}
                    onClick={() => handleSelectPartner(contact)}
                    className={`w-full flex items-center gap-3 p-3.5 border-b border-brand-beige/30 dark:border-brand-dark-grey/30 text-left transition-colors cursor-pointer ${
                      isActive ? "bg-brand-primary/10" : "hover:bg-brand-offwhite dark:hover:bg-brand-midnight"
                    }`}
                  >
                    <Avatar src={contact.photo} name={contact.name} size={11} showStatus online={online} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-brand-black dark:text-brand-white truncate">{contact.name}</span>
                        {contact._lastMessage && (
                          <span className="text-[10px] text-brand-dark-grey shrink-0">
                            {formatTime(contact._lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-brand-dark-grey dark:text-brand-sage truncate">
                          {contact._lastMessage
                            ? `${contact._lastMessage.sender === currentEmployeeId ? "You: " : ""}${contact._lastMessage.content}`
                            : contact.jobPosition || contact.department || contact.role}
                        </p>
                        {contact._unreadCount > 0 && (
                          <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center">
                            {contact._unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Active conversation */}
        <div className={`flex-1 flex-col ${showMobileList ? "hidden md:flex" : "flex"}`}>
          {!activePartner ? (
            <div className="flex-1 flex flex-col items-center justify-center text-brand-dark-grey gap-3">
              <FiMessageCircle className="text-5xl opacity-30" />
              <p className="text-sm font-medium">Select an employee to start chatting</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-brand-beige/50 dark:border-brand-dark-grey/50">
                <button onClick={() => setShowMobileList(true)} className="md:hidden text-brand-dark-grey cursor-pointer">
                  <FiArrowLeft className="text-xl" />
                </button>
                <Avatar src={activePartner.photo} name={activePartner.name} size={10} showStatus online={isOnline(activePartner._id)} />
                <div>
                  <h3 className="font-bold text-sm text-brand-black dark:text-brand-white">{activePartner.name}</h3>
                  <p className="text-xs text-brand-dark-grey">
                    {typingActive ? (
                      <span className="text-brand-primary font-semibold">typing...</span>
                    ) : isOnline(activePartner._id) ? (
                      "Online"
                    ) : (
                      "Offline"
                    )}
                  </p>
                </div>
              </div>

              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-1 bg-brand-offwhite/40 dark:bg-brand-midnight/40"
              >
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <span className="loading loading-spinner loading-md text-brand-primary"></span>
                  </div>
                ) : (
                  <>
                    {loadingOlder && (
                      <div className="flex justify-center py-2">
                        <span className="loading loading-spinner loading-xs text-brand-primary"></span>
                      </div>
                    )}
                    {groupedMessages.map((group) => (
                      <div key={group.label}>
                        <div className="flex justify-center my-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-beige/60 dark:bg-brand-dark-grey/60 text-brand-dark-grey dark:text-brand-sage">
                            {group.label}
                          </span>
                        </div>
                        {group.items.map((msg) => {
                          const isOwn = msg.sender === currentEmployeeId;
                          return (
                            <motion.div
                              key={msg._id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1.5`}
                            >
                              <div
                                className={`max-w-[75%] sm:max-w-[60%] px-3.5 py-2 rounded-2xl text-sm ${
                                  isOwn
                                    ? "bg-brand-primary text-white rounded-br-sm"
                                    : "bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 text-brand-black dark:text-brand-white rounded-bl-sm"
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                                  <span className={`text-[10px] ${isOwn ? "text-white/70" : "text-brand-dark-grey"}`}>
                                    {formatTime(msg.createdAt)}
                                  </span>
                                  {isOwn &&
                                    (msg.seen ? (
                                      <MdDoneAll className="text-[13px] text-blue-200" />
                                    ) : (
                                      <MdDone className="text-[13px] text-white/70" />
                                    ))}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="p-3 border-t border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-end gap-2">
                <textarea
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 resize-none px-4 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey/60 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 max-h-28"
                />
                <button
                  onClick={handleSend}
                  disabled={!messageInput.trim() || sending}
                  className="shrink-0 w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-secondary transition-colors cursor-pointer"
                >
                  <FiSend className="text-base" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
