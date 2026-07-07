import React, { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { Plus, Sparkles, AlertCircle, Bot } from "lucide-react";
import Sidebar from "./components/Sidebar";
import AgentForm from "./components/AgentForm";
import ChatPlayground from "./components/ChatPlayground";
import { Agent, ChatSession, Message } from "./types";
import { AGENT_TEMPLATES } from "./data";

export default function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load state on mount
  useEffect(() => {
    // 1. Load Custom Agents
    const savedCustomAgents = localStorage.getItem("agent_studio_custom_agents");
    const customList: Agent[] = savedCustomAgents ? JSON.parse(savedCustomAgents) : [];
    
    // Combine templates and custom agents
    const allAgents = [...AGENT_TEMPLATES, ...customList];
    setAgents(allAgents);

    // 2. Load Chat Sessions
    const savedSessions = localStorage.getItem("agent_studio_sessions");
    const sessionList: ChatSession[] = savedSessions ? JSON.parse(savedSessions) : [];
    setSessions(sessionList);

    // 3. Set default active state if available
    if (sessionList.length > 0) {
      setActiveSessionId(sessionList[0].id);
      setActiveAgentId(sessionList[0].agentId);
    } else if (allAgents.length > 0) {
      setActiveAgentId(allAgents[0].id);
    }
  }, []);

  // Save custom agents helper
  const saveCustomAgentsList = (updatedCustoms: Agent[]) => {
    localStorage.setItem("agent_studio_custom_agents", JSON.stringify(updatedCustoms));
    setAgents([...AGENT_TEMPLATES, ...updatedCustoms]);
  };

  // Save sessions helper
  const saveSessionsList = (updatedSessions: ChatSession[]) => {
    localStorage.setItem("agent_studio_sessions", JSON.stringify(updatedSessions));
    setSessions(updatedSessions);
  };

  const handleSelectAgent = (agentId: string) => {
    const existingSession = sessions.find((s) => s.agentId === agentId);
    if (existingSession) {
      setActiveSessionId(existingSession.id);
      setActiveAgentId(agentId);
    } else {
      // Auto-create session for seamless start
      const newSession: ChatSession = {
        id: `session-${Date.now()}`,
        agentId,
        title: "Nouvelle discussion",
        messages: [],
        lastUpdated: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };
      const updated = [newSession, ...sessions];
      saveSessionsList(updated);
      setActiveSessionId(newSession.id);
      setActiveAgentId(agentId);
    }
    setIsCreatingAgent(false);
    setEditingAgent(null);
    setError(null);
    setIsSidebarOpen(false); // Close mobile sidebar
  };

  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setActiveSessionId(sessionId);
      setActiveAgentId(session.agentId);
    }
    setIsCreatingAgent(false);
    setEditingAgent(null);
    setError(null);
    setIsSidebarOpen(false); // Close mobile sidebar
  };

  const handleCreateAgentClick = () => {
    setIsCreatingAgent(true);
    setEditingAgent(null);
    setIsSidebarOpen(false);
  };

  const handleEditAgentClick = (agent: Agent) => {
    setEditingAgent(agent);
    setIsCreatingAgent(true);
    setIsSidebarOpen(false);
  };

  const handleSaveAgent = (agentData: Agent) => {
    const customList = agents.filter((a) => !a.isTemplate);
    const exists = customList.some((a) => a.id === agentData.id);
    
    let updatedCustoms: Agent[];
    if (exists) {
      updatedCustoms = customList.map((a) => (a.id === agentData.id ? agentData : a));
    } else {
      updatedCustoms = [agentData, ...customList];
    }
    
    saveCustomAgentsList(updatedCustoms);
    setIsCreatingAgent(false);
    setEditingAgent(null);
    
    // Auto select newly created/edited agent
    handleSelectAgent(agentData.id);
  };

  const handleDeleteAgent = (agentId: string) => {
    const customList = agents.filter((a) => !a.isTemplate);
    const updatedCustoms = customList.filter((a) => a.id !== agentId);
    saveCustomAgentsList(updatedCustoms);

    // Delete associated sessions
    const updatedSessions = sessions.filter((s) => s.agentId !== agentId);
    saveSessionsList(updatedSessions);

    // Recalculate active agent
    if (activeAgentId === agentId) {
      const remaining = [...AGENT_TEMPLATES, ...updatedCustoms];
      if (remaining.length > 0) {
        handleSelectAgent(remaining[0].id);
      } else {
        setActiveAgentId(null);
        setActiveSessionId(null);
      }
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    saveSessionsList(updated);

    if (activeSessionId === sessionId) {
      if (updated.length > 0) {
        handleSelectSession(updated[0].id);
      } else if (activeAgentId) {
        // Re-open empty active agent context
        setActiveSessionId(null);
      } else {
        setActiveSessionId(null);
        setActiveAgentId(null);
      }
    }
  };

  const handleClearHistory = () => {
    if (!activeSessionId) return;
    const updated = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return { ...s, messages: [], title: "Nouvelle discussion" };
      }
      return s;
    });
    saveSessionsList(updated);
    setError(null);
  };

  const handleUpdateAgentConfig = (updatedFields: Partial<Agent>) => {
    if (!activeAgentId) return;

    // Update the local agents state (can fine-tune templates and customs alike during runtime)
    const updatedAgents = agents.map((a) => {
      if (a.id === activeAgentId) {
        return { ...a, ...updatedFields };
      }
      return a;
    });
    setAgents(updatedAgents);

    // Save custom agents to local storage permanently
    const customList = updatedAgents.filter((a) => !a.isTemplate);
    localStorage.setItem("agent_studio_custom_agents", JSON.stringify(customList));
  };

  const handleSendMessage = async (content: string, overrideAgent?: Agent) => {
    if (!activeAgentId) return;
    setError(null);

    const currentAgent = overrideAgent || agents.find((a) => a.id === activeAgentId);
    if (!currentAgent) return;

    let currentSessionId = activeSessionId;
    let currentSession = sessions.find((s) => s.id === currentSessionId);

    // 1. If there's no active session, create one
    if (!currentSession) {
      if (!content) return; // Cannot trigger empty message on a new session
      currentSessionId = `session-${Date.now()}`;
      currentSession = {
        id: currentSessionId,
        agentId: activeAgentId,
        title: content.slice(0, 25) + (content.length > 25 ? "..." : ""),
        messages: [],
        lastUpdated: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };
      const updated = [currentSession, ...sessions];
      setSessions(updated);
      setActiveSessionId(currentSessionId);
    }

    // 2. Build messages list
    const timestamp = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    let updatedMessages = [...currentSession.messages];
    if (content) {
      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content,
        timestamp,
      };
      updatedMessages = [...updatedMessages, userMsg];
    }
    
    // Create assistant message placeholder
    const assistantMsgId = `msg-${Date.now() + 1}`;
    const assistantPlaceholder: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp,
      agentId: currentAgent.id,
      agentName: currentAgent.name,
      agentEmoji: currentAgent.emoji,
    };

    const sessionWithPlaceholder = {
      ...currentSession,
      title: currentSession.messages.length === 0 && content ? content.slice(0, 25) + (content.length > 25 ? "..." : "") : currentSession.title,
      messages: [...updatedMessages, assistantPlaceholder],
      lastUpdated: timestamp,
    };

    // Update UI state with typing placeholder immediately
    setSessions(
      sessions.map((s) => (s.id === currentSessionId ? sessionWithPlaceholder : s))
    );
    setIsGenerating(true);

    try {
      // Map history for Gemini so agents know who said what
      const mappedMessages = updatedMessages.map(m => {
        if (m.role === "assistant" && m.agentName) {
          return {
            role: "assistant" as const,
            content: `[De l'agent: ${m.agentName}] ${m.content}`
          };
        }
        return {
          role: m.role,
          content: m.content
        };
      });

      // Call the server-side API endpoint for streaming
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: currentAgent.systemInstruction,
          model: currentAgent.model,
          temperature: currentAgent.temperature,
          messages: mappedMessages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "La connexion avec Gemini a échoué.");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) {
        throw new Error("Impossible de lire le flux de réponse du serveur.");
      }

      let done = false;
      let accumulatedText = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6).trim();
              if (dataStr === "[DONE]") {
                done = true;
                break;
              }
              try {
                const data = JSON.parse(dataStr);
                if (data.error) {
                  throw new Error(data.error);
                }
                if (data.text) {
                  accumulatedText += data.text;
                  
                  // Update streaming content in real time
                  setSessions((prevSessions) =>
                    prevSessions.map((s) => {
                      if (s.id === currentSessionId) {
                        return {
                          ...s,
                          messages: s.messages.map((m) =>
                            m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
                          ),
                        };
                      }
                      return s;
                    })
                  );
                }
              } catch (e: any) {
                if (e.message && e.message.includes("Clé API Gemini")) {
                  throw e;
                }
              }
            }
          }
        }
      }

      // Generation successful. Save full session state to localStorage
      const finalSessions = sessions.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            title: s.messages.length === 0 && content ? content.slice(0, 25) + (content.length > 25 ? "..." : "") : s.title,
            messages: [...updatedMessages, { ...assistantPlaceholder, content: accumulatedText }],
            lastUpdated: timestamp,
          };
        }
        return s;
      });
      saveSessionsList(finalSessions);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur inconnue s'est produite.");
      
      // Remove typing placeholder upon failure
      setSessions((prevSessions) =>
        prevSessions.map((s) => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: s.messages.filter((m) => m.id !== assistantMsgId),
            };
          }
          return s;
        })
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const activeAgent = agents.find((a) => a.id === activeAgentId);
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans relative">
      {/* Ambient glass background glowing circles */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]"></div>
      </div>

      <Sidebar
        agents={agents}
        sessions={sessions}
        activeAgentId={activeAgentId}
        activeSessionId={activeSessionId}
        onSelectAgent={handleSelectAgent}
        onSelectSession={handleSelectSession}
        onCreateAgentClick={handleCreateAgentClick}
        onEditAgentClick={handleEditAgentClick}
        onDeleteAgent={handleDeleteAgent}
        onDeleteSession={handleDeleteSession}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Panel Content with Animation support */}
      <div className="flex-1 h-full flex flex-col min-w-0 relative z-10">
        <AnimatePresence mode="wait">
          {isCreatingAgent ? (
            <div key="form" className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-y-auto bg-transparent">
              <AgentForm
                onSave={handleSaveAgent}
                onCancel={() => {
                  setIsCreatingAgent(false);
                  setEditingAgent(null);
                }}
                editingAgent={editingAgent}
              />
            </div>
          ) : activeAgent ? (
            <ChatPlayground
              key={activeAgent.id + (activeSessionId || "-new")}
              agent={activeAgent}
              agents={agents}
              messages={activeSession ? activeSession.messages : []}
              onSendMessage={handleSendMessage}
              onClearHistory={handleClearHistory}
              isGenerating={isGenerating}
              error={error}
              onUpdateAgentConfig={handleUpdateAgentConfig}
            />
          ) : (
            /* Fallback Empty state */
            <div key="empty" className="flex-1 flex flex-col items-center justify-center bg-transparent p-6 text-center z-10">
              <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 md:p-12 max-w-md w-full flex flex-col items-center shadow-2xl">
                <div className="p-4 rounded-3xl bg-indigo-500/10 text-indigo-400 mb-5 animate-pulse">
                  <Bot className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-bold text-slate-100">
                  Aucun agent sélectionné
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mt-2 mb-6 leading-relaxed">
                  Créez ou sélectionnez un agent dans le panneau latéral pour commencer à expérimenter avec la puissance de Gemini.
                </p>
                <button
                  onClick={handleCreateAgentClick}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-4.5 h-4.5" /> Créer mon premier agent
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
