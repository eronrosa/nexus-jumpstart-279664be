import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowLeft, Send, Search, Plus, Users, Paperclip,
  Phone, Video, MoreVertical, Check, CheckCheck, Smile, X,
  MessageCircle, Reply, Heart
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday } from "date-fns";


interface Conversation {
  id: string;
  type: "private" | "group";
  name: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  members?: Member[];
  other_user?: { display_name: string | null; avatar_url: string | null; user_id: string };
}

interface Member {
  id: string;
  conversation_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: { display_name: string | null; avatar_url: string | null };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: string;
  media_url: string | null;
  created_at: string;
  read_by: string[];
  reply_to_id: string | null;
  sender_profile?: { display_name: string | null; avatar_url: string | null };
  reactions?: { emoji: string; user_id: string }[];
}

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
  reacted: boolean;
}

interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

function formatMessageTime(dateStr: string) {
  const d = new Date(dateStr);
  return format(d, "HH:mm");
}

function formatConversationDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Ontem";
  return format(d, "dd/MM/yy");
}

export default function ZuuChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgText, setMsgText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [profilesCache, setProfilesCache] = useState<Record<string, UserProfile>>({});
  const [presenceMap, setPresenceMap] = useState<Record<string, { status: string; last_seen: string; typing_in: string | null }>>({});
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [reactionsMap, setReactionsMap] = useState<Record<string, { emoji: string; user_id: string }[]>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const QUICK_EMOJIS = ["❤️", "😂", "👍", "😮", "😢", "🔥", "🎉", "👏"];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ─── Presence: set online + heartbeat ───
  useEffect(() => {
    if (!user) return;
    const upsertPresence = async (status: string) => {
      await supabase.from("user_presence").upsert({
        user_id: user.id,
        status,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    };
    upsertPresence("online");
    const interval = setInterval(() => upsertPresence("online"), 30000);
    const handleBeforeUnload = () => {
      navigator.sendBeacon?.(""); // best-effort
      upsertPresence("offline");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      upsertPresence("offline");
    };
  }, [user]);

  // ─── Subscribe to presence changes ───
  useEffect(() => {
    if (!user) return;
    // Load initial presence
    const loadPresence = async () => {
      const { data } = await supabase.from("user_presence").select("*");
      if (data) {
        const map: typeof presenceMap = {};
        data.forEach(p => { map[p.user_id] = { status: p.status, last_seen: p.last_seen, typing_in: p.typing_in }; });
        setPresenceMap(map);
      }
    };
    loadPresence();

    const channel = supabase
      .channel("user-presence-changes")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "user_presence",
      }, (payload) => {
        const row = payload.new as any;
        if (row?.user_id) {
          setPresenceMap(prev => ({
            ...prev,
            [row.user_id]: { status: row.status, last_seen: row.last_seen, typing_in: row.typing_in },
          }));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ─── Typing indicator ───
  const setTyping = useCallback(async (convId: string | null) => {
    if (!user) return;
    await supabase.from("user_presence").upsert({
      user_id: user.id,
      typing_in: convId,
      updated_at: new Date().toISOString(),
      status: "online",
      last_seen: new Date().toISOString(),
    }, { onConflict: "user_id" });
  }, [user]);

  const handleTyping = useCallback(() => {
    if (!activeConv) return;
    setTyping(activeConv.id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTyping(null), 3000);
  }, [activeConv, setTyping]);

  // Get typing users for current conversation
  const typingUsers = activeConv
    ? Object.entries(presenceMap)
        .filter(([uid, p]) => p.typing_in === activeConv.id && uid !== user?.id)
        .map(([uid]) => profilesCache[uid]?.display_name || "Alguém")
    : [];

  const getPresenceStatus = (userId: string) => {
    const p = presenceMap[userId];
    if (!p) return "offline";
    if (p.status === "online") {
      const lastSeen = new Date(p.last_seen).getTime();
      if (Date.now() - lastSeen > 60000) return "offline";
      return "online";
    }
    return "offline";
  };

  const formatLastSeen = (userId: string) => {
    const p = presenceMap[userId];
    if (!p || !p.last_seen) return "";
    const d = new Date(p.last_seen);
    if (isToday(d)) return `visto hoje às ${format(d, "HH:mm")}`;
    if (isYesterday(d)) return `visto ontem às ${format(d, "HH:mm")}`;
    return `visto ${format(d, "dd/MM HH:mm")}`;
  };

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data: memberships } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (!memberships?.length) { setConversations([]); setLoading(false); return; }

    const convIds = memberships.map(m => m.conversation_id);
    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .in("id", convIds)
      .order("updated_at", { ascending: false });

    if (!convs) { setLoading(false); return; }

    // Get members + profiles for each conversation
    const { data: allMembers } = await supabase
      .from("conversation_members")
      .select("*")
      .in("conversation_id", convIds);

    const memberUserIds = [...new Set((allMembers || []).map(m => m.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", memberUserIds);

    const profileMap: Record<string, UserProfile> = {};
    (profiles || []).forEach(p => { profileMap[p.user_id] = p; });
    setProfilesCache(prev => ({ ...prev, ...profileMap }));

    // Get last message per conversation
    const enriched: Conversation[] = await Promise.all(convs.map(async (c) => {
      const members = (allMembers || [])
        .filter(m => m.conversation_id === c.id)
        .map(m => ({ ...m, profile: profileMap[m.user_id] }));

      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at, message_type")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const otherMember = members.find(m => m.user_id !== user.id);
      const otherUser = otherMember?.profile || null;

      return {
        ...c,
        members,
        last_message: lastMsg?.message_type !== "text"
          ? lastMsg ? "📎 Mídia" : ""
          : lastMsg?.content || "",
        last_message_at: lastMsg?.created_at || c.created_at,
        other_user: otherUser ? { ...otherUser, user_id: otherMember!.user_id } : undefined,
        unread_count: 0,
      } as Conversation;
    }));

    enriched.sort((a, b) =>
      new Date(b.last_message_at || b.updated_at).getTime() -
      new Date(a.last_message_at || a.updated_at).getTime()
    );

    setConversations(enriched);
    setLoading(false);
  }, [user]);

  // Load messages for active conversation
  const loadMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (data) {
      // Enrich with profiles
      const senderIds = [...new Set(data.map(m => m.sender_id))];
      const missing = senderIds.filter(id => !profilesCache[id]);
      if (missing.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", missing);
        if (profs) {
          const newCache: Record<string, UserProfile> = {};
          profs.forEach(p => { newCache[p.user_id] = p; });
          setProfilesCache(prev => ({ ...prev, ...newCache }));
        }
      }
      const msgIds = data.map(m => m.id);
      // Load reactions
      let reactionsData: { message_id: string; emoji: string; user_id: string }[] = [];
      if (msgIds.length) {
        const { data: rxns } = await supabase
          .from("message_reactions")
          .select("message_id, emoji, user_id")
          .in("message_id", msgIds);
        if (rxns) reactionsData = rxns;
      }
      const rxnMap: Record<string, { emoji: string; user_id: string }[]> = {};
      reactionsData.forEach(r => {
        if (!rxnMap[r.message_id]) rxnMap[r.message_id] = [];
        rxnMap[r.message_id].push(r);
      });
      setReactionsMap(rxnMap);

      setMessages(data.map(m => ({
        ...m,
        read_by: (m.read_by as string[]) || [],
        reply_to_id: (m as any).reply_to_id || null,
        sender_profile: profilesCache[m.sender_id],
        reactions: rxnMap[m.id] || [],
      })));
    }
  }, [profilesCache]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv.id);
    }
  }, [activeConv?.id]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!activeConv) return;
    const channel = supabase
      .channel(`messages-${activeConv.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${activeConv.id}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        newMsg.read_by = (newMsg.read_by as any) || [];
        newMsg.sender_profile = profilesCache[newMsg.sender_id];
        setMessages(prev => [...prev, newMsg]);
        scrollToBottom();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConv?.id, profilesCache]);

  // Send message
  const sendMessage = async (type = "text", mediaUrl?: string) => {
    if (!activeConv || !user) return;
    if (type === "text" && !msgText.trim()) return;

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: activeConv.id,
      sender_id: user.id,
      content: type === "text" ? msgText.trim() : null,
      message_type: type,
      media_url: mediaUrl || null,
    });

    if (error) {
      toast({ title: "Erro ao enviar mensagem", variant: "destructive" });
    } else {
      setMsgText("");
      setTyping(null);
      // Update conversation timestamp
      await supabase.from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeConv.id);
    }
    setSending(false);
  };

  // Upload media
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-media")
      .upload(path, file);

    if (uploadError) {
      toast({ title: "Erro no upload", variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(path);
    const isImage = file.type.startsWith("image/");
    const isAudio = file.type.startsWith("audio/");
    await sendMessage(isImage ? "image" : isAudio ? "audio" : "file", urlData.publicUrl);
    e.target.value = "";
  };

  // Create private conversation
  const startPrivateChat = async (otherUserId: string) => {
    if (!user) return;

    // Check if conversation already exists
    const { data: myConvs } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (myConvs) {
      for (const mc of myConvs) {
        const { data: otherMember } = await supabase
          .from("conversation_members")
          .select("user_id")
          .eq("conversation_id", mc.conversation_id)
          .eq("user_id", otherUserId)
          .single();

        if (otherMember) {
          const { data: conv } = await supabase
            .from("conversations")
            .select("*")
            .eq("id", mc.conversation_id)
            .eq("type", "private")
            .single();

          if (conv) {
            const existing = conversations.find(c => c.id === conv.id);
            if (existing) {
              setActiveConv(existing);
              setShowMobileChat(true);
              setShowNewChat(false);
              return;
            }
          }
        }
      }
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({ type: "private", created_by: user.id })
      .select()
      .single();

    if (error || !newConv) {
      toast({ title: "Erro ao criar conversa", variant: "destructive" });
      return;
    }

    // Add both members
    await supabase.from("conversation_members").insert([
      { conversation_id: newConv.id, user_id: user.id, role: "admin" },
      { conversation_id: newConv.id, user_id: otherUserId, role: "member" },
    ]);

    setShowNewChat(false);
    await loadConversations();
    const found = conversations.find(c => c.id === newConv.id);
    if (found) { setActiveConv(found); setShowMobileChat(true); }
    else {
      // Reload and select
      const { data: freshConv } = await supabase.from("conversations").select("*").eq("id", newConv.id).single();
      if (freshConv) {
        const otherProfile = profilesCache[otherUserId];
        setActiveConv({
          ...freshConv,
          other_user: otherProfile ? { ...otherProfile, user_id: otherUserId } : undefined,
          last_message: "",
          last_message_at: freshConv.created_at,
        } as Conversation);
        setShowMobileChat(true);
      }
    }
  };

  // Create group
  const createGroup = async () => {
    if (!user || !groupName.trim() || selectedUsers.length < 1) return;

    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({ type: "group", name: groupName.trim(), created_by: user.id })
      .select()
      .single();

    if (error || !newConv) {
      toast({ title: "Erro ao criar grupo", variant: "destructive" });
      return;
    }

    const members = [
      { conversation_id: newConv.id, user_id: user.id, role: "admin" },
      ...selectedUsers.map(uid => ({ conversation_id: newConv.id, user_id: uid, role: "member" })),
    ];

    await supabase.from("conversation_members").insert(members);

    setShowNewGroup(false);
    setGroupName("");
    setSelectedUsers([]);
    await loadConversations();
  };

  // Load all users for search
  const loadUsers = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .neq("user_id", user.id)
      .limit(100);
    if (data) setAllUsers(data);
  }, [user]);

  useEffect(() => {
    if (showNewChat || showNewGroup) loadUsers();
  }, [showNewChat, showNewGroup, loadUsers]);

  const filteredUsers = allUsers.filter(u =>
    (u.display_name || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = c.type === "private"
      ? (c.other_user?.display_name || "")
      : (c.name || "");
    return name.toLowerCase().includes(q);
  });

  const getConversationName = (c: Conversation) => {
    if (c.type === "group") return c.name || "Grupo";
    return c.other_user?.display_name || "Usuário";
  };

  const getConversationAvatar = (c: Conversation) => {
    if (c.type === "group") return c.avatar_url;
    return c.other_user?.avatar_url;
  };

  const getConversationInitial = (c: Conversation) => {
    return getConversationName(c).charAt(0).toUpperCase();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <MessageCircle className="w-16 h-16 text-primary mx-auto" />
          <h2 className="text-xl font-bold text-foreground">ZuuChat</h2>
          <p className="text-muted-foreground">Faça login para acessar o chat</p>
          <Button onClick={() => navigate("/auth")}>Entrar</Button>
        </div>
      </div>
    );
  }

  // ───────── Chat Area (right panel) ─────────
  const ChatArea = () => {
    if (!activeConv) {
      return (
        <div className="flex-1 flex items-center justify-center bg-muted/20">
          <div className="text-center space-y-3">
            <MessageCircle className="w-20 h-20 text-muted-foreground/30 mx-auto" />
            <h3 className="text-lg font-semibold text-muted-foreground">ZuuChat</h3>
            <p className="text-sm text-muted-foreground/60">Selecione uma conversa ou inicie uma nova</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col bg-background h-full">
        {/* Chat Header */}
        <div className="h-16 border-b border-border flex items-center px-4 gap-3 bg-card shrink-0">
          <button onClick={() => { setShowMobileChat(false); setActiveConv(null); }} className="md:hidden mr-1">
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={getConversationAvatar(activeConv) || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {getConversationInitial(activeConv)}
              </AvatarFallback>
            </Avatar>
            {activeConv.type === "private" && activeConv.other_user && (
              <span className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card",
                getPresenceStatus(activeConv.other_user.user_id) === "online"
                  ? "bg-emerald-500"
                  : "bg-muted-foreground/40"
              )} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{getConversationName(activeConv)}</p>
            <p className="text-xs text-muted-foreground">
              {typingUsers.length > 0
                ? <span className="text-primary animate-pulse">
                    {typingUsers.length === 1
                      ? `${typingUsers[0]} está digitando...`
                      : `${typingUsers.length} pessoas digitando...`}
                  </span>
                : activeConv.type === "group"
                  ? `${activeConv.members?.length || 0} membros`
                  : activeConv.other_user
                    ? getPresenceStatus(activeConv.other_user.user_id) === "online"
                      ? "online"
                      : formatLastSeen(activeConv.other_user.user_id)
                    : "offline"
              }
            </p>
          </div>
          <div className="flex gap-1">
            <button className="p-2 rounded-full hover:bg-muted"><Phone size={18} className="text-muted-foreground" /></button>
            <button className="p-2 rounded-full hover:bg-muted"><Video size={18} className="text-muted-foreground" /></button>
            <button className="p-2 rounded-full hover:bg-muted"><MoreVertical size={18} className="text-muted-foreground" /></button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-1">
            {messages.map((msg, i) => {
              const isMe = msg.sender_id === user.id;
              const showAvatar = activeConv.type === "group" && !isMe &&
                (i === 0 || messages[i - 1].sender_id !== msg.sender_id);
              const senderProfile = msg.sender_profile || profilesCache[msg.sender_id];

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-2", isMe ? "justify-end" : "justify-start")}
                >
                  {!isMe && activeConv.type === "group" && (
                    <div className="w-8 shrink-0">
                      {showAvatar && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={senderProfile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {(senderProfile?.display_name || "?").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-3 py-2 shadow-sm",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border rounded-bl-md"
                  )}>
                    {!isMe && activeConv.type === "group" && showAvatar && (
                      <p className="text-xs font-semibold text-primary mb-1">
                        {senderProfile?.display_name || "Usuário"}
                      </p>
                    )}
                    {msg.message_type === "image" && msg.media_url && (
                      <img src={msg.media_url} className="rounded-lg max-w-full max-h-60 object-cover mb-1" alt="imagem" />
                    )}
                    {msg.message_type === "audio" && msg.media_url && (
                      <audio controls src={msg.media_url} className="max-w-full mb-1" />
                    )}
                    {msg.message_type === "file" && msg.media_url && (
                      <a href={msg.media_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 underline text-sm">
                        <Paperclip size={14} /> Arquivo
                      </a>
                    )}
                    {msg.content && (
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                    <div className={cn("flex items-center gap-1 mt-0.5", isMe ? "justify-end" : "justify-start")}>
                      <span className={cn("text-[10px]", isMe ? "text-primary-foreground/60" : "text-muted-foreground")}>
                        {formatMessageTime(msg.created_at)}
                      </span>
                      {isMe && (
                        <CheckCheck size={12} className="text-primary-foreground/60" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="px-4 py-1 bg-card border-t border-border/50">
            <p className="text-xs text-primary animate-pulse">
              {typingUsers.length === 1
                ? `${typingUsers[0]} está digitando...`
                : `${typingUsers.length} pessoas digitando...`}
            </p>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-3 bg-card shrink-0">
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-muted" onClick={() => fileInputRef.current?.click()}>
              <Paperclip size={20} className="text-muted-foreground" />
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload}
              accept="image/*,audio/*,.pdf,.doc,.docx,.txt" />
            <div className="flex-1 relative">
              <Input
                value={msgText}
                onChange={e => { setMsgText(e.target.value); handleTyping(); }}
                placeholder="Mensagem..."
                className="pr-10 rounded-full bg-muted/50 border-0"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2">
                <Smile size={18} className="text-muted-foreground" />
              </button>
            </div>
            <Button
              size="icon"
              className="rounded-full shrink-0"
              onClick={() => sendMessage()}
              disabled={sending || !msgText.trim()}
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ───────── Conversation List (left panel) ─────────
  const ConversationList = () => (
    <div className={cn(
      "w-full md:w-[380px] border-r border-border flex flex-col bg-card h-full",
      showMobileChat ? "hidden md:flex" : "flex"
    )}>
      {/* Header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-muted md:hidden">
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">ZuuChat</h1>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShowNewGroup(true)} className="p-2 rounded-full hover:bg-muted" title="Novo grupo">
            <Users size={20} className="text-muted-foreground" />
          </button>
          <button onClick={() => setShowNewChat(true)} className="p-2 rounded-full hover:bg-muted" title="Nova conversa">
            <Plus size={20} className="text-primary" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 shrink-0">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar conversa..."
            className="pl-9 rounded-full bg-muted/50 border-0 h-9"
          />
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
            <Button size="sm" variant="outline" onClick={() => setShowNewChat(true)}>
              <Plus size={14} className="mr-1" /> Iniciar conversa
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredConversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => { setActiveConv(conv); setShowMobileChat(true); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left",
                  activeConv?.id === conv.id && "bg-primary/5"
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={getConversationAvatar(conv) || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {getConversationInitial(conv)}
                    </AvatarFallback>
                  </Avatar>
                  {conv.type === "private" && conv.other_user && (
                    <span className={cn(
                      "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card",
                      getPresenceStatus(conv.other_user.user_id) === "online"
                        ? "bg-emerald-500"
                        : "bg-muted-foreground/40"
                    )} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {getConversationName(conv)}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {conv.last_message_at ? formatConversationDate(conv.last_message_at) : ""}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground truncate pr-2">
                      {conv.last_message || (conv.type === "group" ? "Grupo criado" : "Conversa iniciada")}
                    </p>
                    {conv.type === "group" && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        <Users size={10} className="inline mr-0.5" />
                        {conv.members?.length || 0}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // ───────── User Selection List ─────────
  const UserListModal = ({ isGroup }: { isGroup: boolean }) => (
    <Dialog open={isGroup ? showNewGroup : showNewChat} onOpenChange={isGroup ? setShowNewGroup : setShowNewChat}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isGroup ? "Criar Grupo" : "Nova Conversa"}</DialogTitle>
          <DialogDescription>
            {isGroup ? "Dê um nome ao grupo e selecione os membros" : "Selecione um usuário para conversar"}
          </DialogDescription>
        </DialogHeader>
        {isGroup && (
          <Input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="Nome do grupo"
            className="mb-2"
          />
        )}
        <div className="relative mb-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            placeholder="Buscar usuário..."
            className="pl-8 h-9"
          />
        </div>
        {isGroup && selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {selectedUsers.map(uid => {
              const u = allUsers.find(x => x.user_id === uid);
              return (
                <span key={uid} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                  {u?.display_name || "Usuário"}
                  <button onClick={() => setSelectedUsers(prev => prev.filter(id => id !== uid))}>
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
        <ScrollArea className="max-h-60">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">Nenhum usuário encontrado</p>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map(u => (
                <button
                  key={u.user_id}
                  onClick={() => {
                    if (isGroup) {
                      setSelectedUsers(prev =>
                        prev.includes(u.user_id)
                          ? prev.filter(id => id !== u.user_id)
                          : [...prev, u.user_id]
                      );
                    } else {
                      startPrivateChat(u.user_id);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors",
                    isGroup && selectedUsers.includes(u.user_id) && "bg-primary/10"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                      {(u.display_name || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{u.display_name || "Usuário"}</span>
                  {isGroup && selectedUsers.includes(u.user_id) && (
                    <Check size={16} className="ml-auto text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        {isGroup && (
          <Button onClick={createGroup} disabled={!groupName.trim() || selectedUsers.length < 1} className="w-full mt-2">
            Criar grupo ({selectedUsers.length} selecionados)
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <ConversationList />
      <div className={cn(
        "flex-1 flex-col h-full",
        showMobileChat ? "flex" : "hidden md:flex"
      )}>
        <ChatArea />
      </div>

      <UserListModal isGroup={false} />
      <UserListModal isGroup={true} />
    </div>
  );
}
