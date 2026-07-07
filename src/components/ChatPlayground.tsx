import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { 
  Send, 
  Bot, 
  User, 
  Trash2, 
  ChevronRight, 
  Cpu, 
  Sliders, 
  Sparkles, 
  AlertTriangle,
  Clipboard,
  Check,
  Mail,
  Calendar,
  Clock,
  LogOut,
  X,
  Inbox,
  AlertCircle
} from "lucide-react";
import { Agent, Message, ScheduledEmail } from "../types";
import { THEME_COLORS_MAP } from "../data";
import { googleSignIn, logout, initAuth } from "../firebaseAuth";
import { User as FirebaseUser } from "firebase/auth";

interface ChatPlaygroundProps {
  agent: Agent;
  agents: Agent[];
  messages: Message[];
  onSendMessage: (content: string, overrideAgent?: Agent) => void;
  onClearHistory: () => void;
  isGenerating: boolean;
  error: string | null;
  onUpdateAgentConfig: (updatedFields: Partial<Agent>) => void;
}

export default function ChatPlayground({
  agent,
  agents,
  messages,
  onSendMessage,
  onClearHistory,
  isGenerating,
  error,
  onUpdateAgentConfig
}: ChatPlaygroundProps) {
  const [inputValue, setInputValue] = useState("");
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Multi-agent debate states
  const [debateParticipants, setDebateParticipants] = useState<Agent[]>([agent]);
  const [isAutoDebating, setIsAutoDebating] = useState(false);
  const [debateRounds, setDebateRounds] = useState(0);
  const maxDebateRounds = 12; // safety limit

  // Update participants if the primary agent changes
  useEffect(() => {
    setDebateParticipants([agent]);
    setIsAutoDebating(false);
    setDebateRounds(0);
  }, [agent]);

  const toggleParticipant = (targetAgent: Agent) => {
    if (targetAgent.id === agent.id) return; // Primary agent always participates
    if (debateParticipants.some(p => p.id === targetAgent.id)) {
      setDebateParticipants(debateParticipants.filter(p => p.id !== targetAgent.id));
    } else {
      setDebateParticipants([...debateParticipants, targetAgent]);
    }
  };

  // Track last isGenerating state to detect completion transition
  const prevIsGeneratingRef = useRef(isGenerating);

  useEffect(() => {
    if (prevIsGeneratingRef.current && !isGenerating && isAutoDebating && debateParticipants.length > 1) {
      if (debateRounds >= maxDebateRounds) {
        setIsAutoDebating(false);
        setDebateRounds(0);
        return;
      }

      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.role === "assistant") {
          const lastAgentId = lastMsg.agentId;
          const currentIndex = debateParticipants.findIndex(p => p.id === lastAgentId);
          
          // Calculate next index (round robin among participants)
          const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % debateParticipants.length;
          const nextAgent = debateParticipants[nextIndex];

          const timer = setTimeout(() => {
            setDebateRounds(prev => prev + 1);
            onSendMessage("", nextAgent);
          }, 2500);

          return () => clearTimeout(timer);
        }
      }
    }
    prevIsGeneratingRef.current = isGenerating;
  }, [isGenerating, isAutoDebating, debateParticipants, messages, debateRounds, onSendMessage]);

  // Gmail & Scheduling states
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [activeSchedulingMsgId, setActiveSchedulingMsgId] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [scheduledDelay, setScheduledDelay] = useState("1");
  const [isSchedulingEmail, setIsSchedulingEmail] = useState(false);
  const [showSchedulerDashboard, setShowSchedulerDashboard] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = THEME_COLORS_MAP[agent.themeColor] || THEME_COLORS_MAP.indigo;

  // Fetch scheduled emails list
  const fetchScheduledEmails = async () => {
    try {
      const response = await fetch("/api/scheduled-emails");
      if (response.ok) {
        const data = await response.json();
        setScheduledEmails(data);
      }
    } catch (err) {
      console.error("Failed to fetch scheduled emails:", err);
    }
  };

  // Auto-scroll and Auth Initialization
  useEffect(() => {
    // Check initial auth state
    const unsubscribe = initAuth(
      (usr, token) => {
        setUser(usr);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    fetchScheduledEmails();
    const interval = setInterval(fetchScheduledEmails, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setAuthErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
      } else {
        setAuthErrorMessage("Connexion annulée par l'utilisateur.");
        setTimeout(() => setAuthErrorMessage(null), 5000);
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setAuthErrorMessage("La connexion a échoué. Veuillez réessayer.");
      setTimeout(() => setAuthErrorMessage(null), 5000);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
  };

  const handleScheduleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!recipientEmail) return;

    setIsSchedulingEmail(true);
    try {
      const delayMinutes = parseInt(scheduledDelay);
      const sendAt = Date.now() + delayMinutes * 60 * 1000;

      const response = await fetch("/api/schedule-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmail,
          subject: emailSubject,
          body: emailBody,
          sendAt,
          accessToken,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Une erreur s'est produite lors de la planification.");
      }

      fetchScheduledEmails();
      setActiveSchedulingMsgId(null);
      setShowSchedulerDashboard(true);
    } catch (err: any) {
      console.error("Failed to schedule:", err);
    } finally {
      setIsSchedulingEmail(false);
    }
  };

  const handleCancelEmail = async (id: string) => {
    const confirmed = window.confirm("Êtes-vous sûr de vouloir annuler cet envoi planifié ?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/scheduled-emails/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchScheduledEmails();
      } else {
        const data = await response.json();
        alert(data.error || "Impossible d'annuler cet envoi.");
      }
    } catch (err: any) {
      console.error("Failed to cancel email:", err);
    }
  };

  const handleOpenScheduler = (messageId: string, content: string) => {
    const lines = content.split("\n");
    let entreprise = "";
    let decideurName = "";
    let emailDraft = "";
    
    let inMessage = false;
    for (const line of lines) {
      const cleanLine = line.trim();
      if (cleanLine.toLowerCase().startsWith("entreprise :")) {
        entreprise = cleanLine.replace(/entreprise\s*:/i, "").trim();
      } else if (cleanLine.toLowerCase().startsWith("décideur :")) {
        decideurName = cleanLine.replace(/décideur\s*:/i, "").trim();
      } else if (cleanLine.toLowerCase().startsWith("message :")) {
        inMessage = true;
        emailDraft = cleanLine.replace(/message\s*:/i, "").trim() + "\n";
      } else if (inMessage) {
        emailDraft += line + "\n";
      }
    }

    const sanitizedEnt = entreprise.toLowerCase().replace(/[^a-z0-9]/g, "");
    const domain = sanitizedEnt ? `${sanitizedEnt}.fr` : "prospect.com";
    const guessedEmail = decideurName 
      ? `${decideurName.toLowerCase().split(" ")[0].replace(/[^a-z]/g, "") || "contact"}@${domain}`
      : `contact@${domain}`;

    setRecipientEmail(guessedEmail);
    setEmailSubject(entreprise ? `Opportunité Étanchéité - ${entreprise}` : "Proposition commerciale étanchéité");
    setEmailBody(emailDraft.trim() || content);
    setScheduledDelay("1"); // Default to 1 minute for rapid testing!
    setActiveSchedulingMsgId(messageId);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isGenerating) return;
    onSendMessage(inputValue.trim());
    setInputValue("");
  };

  const handleStarterClick = (text: string) => {
    if (isGenerating) return;
    onSendMessage(text);
  };

  const handleCopyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent font-sans relative overflow-hidden">
      
      {/* Top Banner Header */}
      <div className="px-6 py-4 bg-white/5 backdrop-blur-md border-b border-white/10 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="text-3.5xl h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-md shrink-0">
            {agent.emoji}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-sans font-bold text-base text-slate-100 truncate">
                {agent.name}
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badge} shrink-0`}>
                {agent.model === "gemini-3.5-flash" ? "Flash" : "Pro"}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5 font-normal">
              {agent.description}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {authErrorMessage && (
            <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full animate-pulse">
              ⚠️ {authErrorMessage}
            </span>
          )}

          {/* Gmail Auth Button */}
          {user ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-xs font-medium text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="max-w-[120px] truncate hidden md:inline">{user.email}</span>
              <span className="md:hidden">Gmail</span>
              <button 
                onClick={handleGoogleLogout}
                className="ml-1 text-slate-400 hover:text-red-400 transition-colors"
                title="Déconnecter Gmail"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white border border-red-500/25 hover:border-red-400 rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-red-500/10"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{isLoggingIn ? "Connexion..." : "Connecter Gmail"}</span>
            </button>
          )}

          {/* Scheduled list button */}
          <button
            onClick={() => setShowSchedulerDashboard(!showSchedulerDashboard)}
            className={`p-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all relative ${
              showSchedulerDashboard ? "bg-white/15 text-white border-indigo-500/30" : ""
            }`}
            title="Envois planifiés"
          >
            <Calendar className="w-4 h-4" />
            {scheduledEmails.filter(e => e.status === "pending").length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-[8px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                {scheduledEmails.filter(e => e.status === "pending").length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className={`px-3 py-1.5 bg-white/10 backdrop-blur border border-white/10 hover:bg-white/15 rounded-full text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5 ${
              showConfigDrawer ? "bg-white/20 border-white/30 text-white" : ""
            }`}
            title="Paramètres de l'agent"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ajuster l'IA</span>
          </button>
          
          <button
            onClick={onClearHistory}
            disabled={messages.length === 0}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            title="Effacer la conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main chat log & configuration layout */}
      <div className="flex-1 flex h-full min-h-0 relative">
        
        {/* Chat log wrapper */}
        <div className="flex-1 flex flex-col justify-between h-full min-w-0">
          
          {/* Scrollable messages list */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:p-8 space-y-6">
            
            {messages.length === 0 ? (
              /* Welcome screen for empty chat */
              <div className="max-w-2xl mx-auto py-12 px-4 flex flex-col items-center text-center space-y-8">
                <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 md:p-12 w-full flex flex-col items-center shadow-xl">
                  <div className={`p-4 rounded-3xl ${theme.bg} border shrink-0 relative animate-pulse mb-4`}>
                    <Bot className={`w-12 h-12 ${theme.text}`} />
                    <span className="absolute -top-1 -right-1 text-2xl">{agent.emoji}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-100">
                      Discutez avec {agent.name}
                    </h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                      Cet agent est guidé par des instructions spécifiques. Utilisez l'un des déclencheurs ci-dessous pour démarrer instantanément la discussion !
                    </p>
                  </div>

                  {/* Conversation starters */}
                  {agent.starters && agent.starters.length > 0 && (
                    <div className="w-full max-w-xl space-y-3 pt-6 border-t border-white/10 mt-6">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                        Suggestions de départ
                      </p>
                      <div className="grid grid-cols-1 gap-2.5">
                        {agent.starters.map((starter, index) => (
                          <button
                            key={index}
                            onClick={() => handleStarterClick(starter)}
                            disabled={isGenerating}
                            className="w-full text-left p-3.5 text-xs font-medium text-slate-200 bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 rounded-2xl shadow-sm transition-all flex items-center justify-between group"
                          >
                            <span className="truncate">{starter}</span>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-indigo-400 transition-all shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Conversation Log */
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((message, idx) => {
                  const isUser = message.role === "user";
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {/* Avatar */}
                      {!isUser && (
                        <span className="text-xl h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-sm shrink-0" title={message.agentName || agent.name}>
                          {message.agentEmoji || agent.emoji}
                        </span>
                      )}

                      {/* Bubble */}
                      <div className="max-w-[85%] space-y-1">
                        <div
                          className={`px-4.5 py-3 rounded-2xl shadow-xl text-sm leading-relaxed ${
                            isUser
                              ? "bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-600/20"
                              : "bg-white/5 backdrop-blur-md border border-white/10 text-slate-100 rounded-bl-none"
                          }`}
                        >
                          {!isUser && (
                            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-indigo-400 mb-1.5 border-b border-white/5 pb-1">
                              <span>{message.agentEmoji || agent.emoji}</span>
                              <span>{message.agentName || agent.name}</span>
                            </div>
                          )}
                          {isUser ? (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          ) : (
                            <div className="markdown-body prose prose-slate dark:prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-pre:text-slate-100 prose-code:text-indigo-400 dark:prose-code:text-indigo-400">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                        
                        {/* Copy Code trigger on helper boxes */}
                        {!isUser && (
                          <div className="space-y-3 pt-1">
                            <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
                              <span>{message.timestamp}</span>
                              <button
                                onClick={() => handleCopyCode(message.content, idx)}
                                className="hover:text-indigo-400 flex items-center gap-1 transition-colors"
                              >
                                {copiedIndex === idx ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copié !</span>
                                  </>
                                ) : (
                                  <>
                                    <Clipboard className="w-3 h-3" />
                                    <span>Copier la réponse</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Planifier l'envoi automatique trigger */}
                            {message.content && (
                              <div className="flex justify-start px-1">
                                <button
                                  onClick={() => handleOpenScheduler(message.id, message.content)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 text-[11px] font-bold transition-all hover:scale-[1.01]"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>🚀 Programmer l'envoi automatique</span>
                                </button>
                              </div>
                            )}

                            {/* Active scheduling form for this specific message */}
                            {activeSchedulingMsgId === message.id && (
                              <div className="p-4 bg-slate-900/80 backdrop-blur border border-indigo-500/30 rounded-2xl space-y-4 shadow-xl text-left text-xs text-slate-200">
                                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                  <h4 className="font-bold text-indigo-400 flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Planifier l'envoi automatique (Gmail)
                                  </h4>
                                  <button
                                    onClick={() => setActiveSchedulingMsgId(null)}
                                    className="text-slate-400 hover:text-white"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>

                                {!user ? (
                                  <div className="py-2 text-center space-y-3">
                                    <p className="text-xs text-slate-300">
                                      Vous devez d'abord connecter votre compte Gmail pour programmer des envois.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={handleGoogleLogin}
                                      disabled={isLoggingIn}
                                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 shadow-lg shadow-red-500/10"
                                    >
                                      <Mail className="w-3.5 h-3.5" />
                                      <span>{isLoggingIn ? "Connexion..." : "Se connecter avec Google"}</span>
                                    </button>
                                  </div>
                                ) : (
                                  <form onSubmit={handleScheduleEmail} className="space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-slate-400 block">Email Destinataire</label>
                                        <input
                                          type="email"
                                          required
                                          placeholder="ex: contact@entreprise.fr"
                                          value={recipientEmail}
                                          onChange={(e) => setRecipientEmail(e.target.value)}
                                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-indigo-500/50"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-slate-400 block">Délai d'envoi automatique</label>
                                        <select
                                          value={scheduledDelay}
                                          onChange={(e) => setScheduledDelay(e.target.value)}
                                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-indigo-500/50"
                                        >
                                          <option value="0">Immédiatement (Direct)</option>
                                          <option value="1">Dans 1 minute (Test ⚡)</option>
                                          <option value="5">Dans 5 minutes</option>
                                          <option value="60">Dans 1 heure</option>
                                          <option value="1440">Demain (dans 24h)</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] uppercase font-bold text-slate-400 block">Sujet de l'email</label>
                                      <input
                                        type="text"
                                        required
                                        placeholder="Sujet de l'email"
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-indigo-500/50"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] uppercase font-bold text-slate-400 block">Contenu de l'email</label>
                                      <textarea
                                        required
                                        rows={5}
                                        value={emailBody}
                                        onChange={(e) => setEmailBody(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-indigo-500/50 font-sans leading-relaxed"
                                      />
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>
                                          {scheduledDelay === "0" 
                                            ? "Sera envoyé immédiatement" 
                                            : `Sera envoyé dans exactement ${scheduledDelay} minute(s)`
                                          }
                                        </span>
                                      </p>
                                      <button
                                        type="submit"
                                        disabled={isSchedulingEmail}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 hover:scale-[1.02]"
                                      >
                                        {isSchedulingEmail ? "Planification..." : "Valider et programmer"}
                                      </button>
                                    </div>
                                  </form>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {isUser && (
                          <p className="text-right text-[10px] text-slate-400 px-1">
                            {message.timestamp}
                          </p>
                        )}
                      </div>

                      {/* User Avatar */}
                      {isUser && (
                        <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 flex items-center justify-center shrink-0 shadow-sm">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Generating Loading States */}
                {isGenerating && (() => {
                  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
                  const typingEmoji = (lastMsg && lastMsg.role === "assistant" && lastMsg.agentEmoji) || agent.emoji;
                  const typingName = (lastMsg && lastMsg.role === "assistant" && lastMsg.agentName) || agent.name;
                  return (
                    <div className="flex gap-4 justify-start animate-fade-in">
                      <span className="text-xl h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-sm shrink-0 animate-bounce" title={typingName}>
                        {typingEmoji}
                      </span>
                      <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-none px-4.5 py-3 shadow-sm max-w-[85%] space-y-1">
                        <p className="text-[10px] font-bold text-indigo-400">{typingName} écrit...</p>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Errors display */}
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-start gap-3 text-red-200 max-w-2xl mx-auto">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                    <div className="text-xs space-y-1">
                      <p className="font-bold">Une erreur est survenue</p>
                      <p>{error}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom input area */}
          <div className="p-4 md:p-6 bg-white/5 backdrop-blur-md border-t border-white/10 z-10">
            {/* Multi-Agent Panel */}
            <div className="max-w-3xl mx-auto mb-4 p-3 bg-white/5 rounded-2xl border border-white/10 space-y-3 shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200">Espace Inter-Agents ({debateParticipants.length})</span>
                </div>
                
                {debateParticipants.length > 1 && (
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={isAutoDebating}
                        onChange={(e) => {
                          setIsAutoDebating(e.target.checked);
                          if (e.target.checked) setDebateRounds(0);
                        }}
                        className="rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                      />
                      <span>Enchaîner le débat automatiquement 🔄</span>
                    </label>

                    {isAutoDebating && (
                      <span className="text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20 animate-pulse font-bold">
                        Débat en cours ({debateRounds}/{maxDebateRounds})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Participant Pills */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Participants :</span>
                {debateParticipants.map((p) => (
                  <div 
                    key={p.id}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                      p.id === agent.id 
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                        : "bg-white/5 border-white/10 text-slate-200"
                    }`}
                  >
                    <span>{p.emoji}</span>
                    <span>{p.name}</span>
                    {p.id !== agent.id && (
                      <button 
                        onClick={() => toggleParticipant(p)}
                        className="text-[10px] text-slate-400 hover:text-red-400 ml-1 transition-colors"
                        title="Retirer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add participant trigger / list of other agents */}
                {agents.filter(a => !debateParticipants.some(p => p.id === a.id)).length > 0 && (
                  <div className="relative group">
                    <button 
                      type="button"
                      className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white/10 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-1"
                    >
                      <span>+ Inviter un agent</span>
                    </button>
                    
                    {/* Hover dropdown with other agents */}
                    <div className="absolute bottom-full left-0 mb-2 w-52 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl p-1.5 hidden group-hover:block hover:block z-50">
                      <p className="text-[9px] uppercase font-bold text-slate-400 px-2 py-1 border-b border-white/5 mb-1">
                        Sélectionner un agent
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {agents.filter(a => !debateParticipants.some(p => p.id === a.id)).map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => toggleParticipant(a)}
                            className="w-full text-left px-2 py-1.5 hover:bg-white/5 rounded-lg text-xs font-medium text-slate-200 hover:text-white transition-all flex items-center gap-2"
                          >
                            <span>{a.emoji}</span>
                            <div className="truncate">
                              <p className="font-bold">{a.name}</p>
                              <p className="text-[9px] text-slate-400 truncate">{a.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Reply triggers for loaded participants */}
              {debateParticipants.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center border-t border-white/5 pt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 font-sans">Faire intervenir :</span>
                  {debateParticipants.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSendMessage("", p)}
                      disabled={isGenerating}
                      className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/25 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:hover:scale-100 hover:scale-[1.02]"
                    >
                      <span>{p.emoji}</span>
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
              <div className="flex-1 relative flex items-center border border-white/10 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/30 rounded-2xl bg-white/5 px-4 py-2 transition-all">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  rows={1}
                  placeholder={`Écrire à ${agent.name}...`}
                  className="bg-transparent border-none text-sm text-slate-100 focus:outline-none w-full placeholder-slate-400 resize-none max-h-36 min-h-[20px] self-center py-1"
                />
              </div>

              <button
                type="submit"
                disabled={!inputValue.trim() || isGenerating}
                className="h-11 w-11 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/25 disabled:shadow-none transition-all cursor-pointer shrink-0 hover:scale-105 active:scale-95"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
            <p className="text-[10px] text-slate-400 text-center mt-2.5">
              Les réponses sont générées en temps réel par {agent.model}.
            </p>
          </div>

        </div>

        {/* Sliding Scheduled Emails Dashboard (Campagnes) */}
        {showSchedulerDashboard && (
          <div className="w-80 md:w-96 border-l border-white/10 bg-slate-950/95 backdrop-blur-2xl p-6 flex flex-col h-full overflow-y-auto shrink-0 z-10">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <h3 className="font-sans font-bold text-sm text-slate-100 flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-indigo-400" />
                Campagnes & Envois Planifiés
              </h3>
              <button
                onClick={() => setShowSchedulerDashboard(false)}
                className="text-xs font-semibold text-slate-400 hover:text-white"
              >
                Fermer
              </button>
            </div>

            <div className="flex-1 space-y-4">
              {scheduledEmails.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-3">
                  <Inbox className="w-10 h-10 mx-auto text-slate-600 stroke-[1.5]" />
                  <p className="text-xs">Aucun envoi planifié pour le moment.</p>
                  <p className="text-[10px] text-slate-600">Planifiez un envoi automatique à partir d'une réponse de l'expert d'étanchéité.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledEmails.map((email) => (
                    <div 
                      key={email.id} 
                      className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2 text-xs relative group"
                    >
                      {/* Cancel pending button */}
                      {email.status === "pending" && (
                        <button
                          onClick={() => handleCancelEmail(email.id)}
                          className="absolute top-3 right-3 text-slate-500 hover:text-red-400 p-1 rounded hover:bg-white/5 transition-all"
                          title="Annuler l'envoi"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 truncate pr-6">{email.to}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          email.status === "pending" ? "bg-amber-500/10 text-amber-400 border border-amber-500/25" :
                          email.status === "sending" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 animate-pulse" :
                          email.status === "sent" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" :
                          "bg-red-500/10 text-red-400 border border-red-500/25"
                        }`}>
                          {email.status === "pending" ? "Planifié" :
                           email.status === "sending" ? "Envoi..." :
                           email.status === "sent" ? "Envoyé" : "Échec"}
                        </span>
                      </div>

                      <div className="text-slate-300 font-medium truncate">{email.subject}</div>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>
                          {email.status === "sent" 
                            ? `Envoyé le : ${new Date(email.sentAt!).toLocaleTimeString("fr-FR")}`
                            : `Prévu pour : ${new Date(email.sendAt).toLocaleTimeString("fr-FR")}`
                          }
                        </span>
                      </div>

                      {email.error && (
                        <p className="text-[10px] text-red-400 bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                          {email.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 mt-6 text-[10px] text-slate-400 space-y-2">
              <p className="font-semibold text-slate-300 font-sans">💡 Comment ça marche ?</p>
              <p className="leading-relaxed">
                Le serveur d'envoi vérifie automatiquement les tâches toutes les 5 secondes et distribue les messages via votre messagerie Gmail sécurisée.
              </p>
            </div>
          </div>
        )}

        {/* Sliding configuration drawer (Live tuner panel) */}
        {showConfigDrawer && (
          <div className="w-80 border-l border-white/10 bg-white/5 backdrop-blur-2xl p-6 flex flex-col h-full overflow-y-auto shrink-0 z-10">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <h3 className="font-sans font-bold text-sm text-slate-100 flex items-center gap-2">
                <Cpu className="w-4.5 h-4.5 text-indigo-400" />
                Ajustements en temps réel
              </h3>
              <button
                onClick={() => setShowConfigDrawer(false)}
                className="text-xs font-semibold text-slate-400 hover:text-white"
              >
                Fermer
              </button>
            </div>

            <div className="space-y-6 flex-1 text-xs">
              
              {/* Parameter 1: Model select */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-300">Modèle Gemini</label>
                <select
                  value={agent.model}
                  onChange={(e) => onUpdateAgentConfig({ model: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-100 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 transition-all text-xs"
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Créativité)</option>
                </select>
              </div>

              {/* Parameter 2: Temperature slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-300">Température ({agent.temperature})</label>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.1"
                  value={agent.temperature}
                  onChange={(e) => onUpdateAgentConfig({ temperature: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>Précis (0.0)</span>
                  <span>Créatif (2.0)</span>
                </div>
              </div>

              {/* Parameter 3: System instructions */}
              <div className="space-y-2 flex-1 flex flex-col">
                <label className="font-semibold text-slate-300">Règles système (comportement)</label>
                <textarea
                  value={agent.systemInstruction}
                  onChange={(e) => onUpdateAgentConfig({ systemInstruction: e.target.value })}
                  rows={10}
                  className="w-full flex-1 px-3 py-2.5 border border-white/10 bg-white/5 text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 text-xs font-mono resize-none leading-relaxed"
                />
              </div>

            </div>

            <div className="pt-4 border-t border-white/10 mt-6 text-center text-[10px] text-slate-400">
              Ces réglages s'appliqueront uniquement sur vos prochaines questions dans ce fil de discussion.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
