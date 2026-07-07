import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bot, 
  Plus, 
  Search, 
  MessageSquare, 
  Trash2, 
  Settings, 
  Library, 
  Menu, 
  X,
  Compass,
  Edit2
} from "lucide-react";
import { Agent, ChatSession } from "../types";
import { THEME_COLORS_MAP } from "../data";

interface SidebarProps {
  agents: Agent[];
  sessions: ChatSession[];
  activeAgentId: string | null;
  activeSessionId: string | null;
  onSelectAgent: (agentId: string) => void;
  onSelectSession: (sessionId: string) => void;
  onCreateAgentClick: () => void;
  onEditAgentClick: (agent: Agent) => void;
  onDeleteAgent: (agentId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export default function Sidebar({
  agents,
  sessions,
  activeAgentId,
  activeSessionId,
  onSelectAgent,
  onSelectSession,
  onCreateAgentClick,
  onEditAgentClick,
  onDeleteAgent,
  onDeleteSession,
  isOpen,
  onToggleOpen
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const templates = agents.filter((a) => a.isTemplate);
  const customAgents = agents.filter((a) => !a.isTemplate);

  const filterAgents = (list: Agent[]) => {
    return list.filter(
      (a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredTemplates = filterAgents(templates);
  const filteredCustoms = filterAgents(customAgents);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-2xl border-r border-white/10 text-slate-100 font-sans">
      {/* Branding Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-base leading-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Agent Studio
            </h1>
            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
              Playground d'IA
            </p>
          </div>
        </div>
        <button
          onClick={onToggleOpen}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Action */}
      <div className="p-4">
        <button
          onClick={onCreateAgentClick}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-semibold transition-all duration-150 shadow-xl shadow-indigo-500/20"
        >
          <Plus className="w-4.5 h-4.5" />
          Créer un Custom Agent
        </button>
      </div>

      {/* Search Input */}
      <div className="px-4 mb-2">
        <div className="relative flex items-center bg-white/5 border border-white/10 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/30 rounded-xl px-3.5 py-2 transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un agent..."
            className="bg-transparent border-none text-xs text-white focus:outline-none w-full placeholder-slate-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="text-[10px] text-slate-400 hover:text-white"
            >
              Vider
            </button>
          )}
        </div>
      </div>

      {/* Navigation Lists */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        
        {/* Templates Section */}
        {filteredTemplates.length > 0 && (
          <div className="space-y-1">
            <h2 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" /> Modèles Intégrés ({filteredTemplates.length})
            </h2>
            <div className="space-y-0.5">
              {filteredTemplates.map((agent) => {
                const isActive = activeAgentId === agent.id && !activeSessionId;
                const themeDetails = THEME_COLORS_MAP[agent.themeColor] || THEME_COLORS_MAP.indigo;
                return (
                  <button
                    key={agent.id}
                    onClick={() => onSelectAgent(agent.id)}
                    className={`w-full group text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all relative ${
                      isActive
                        ? "bg-white/15 border border-white/20 shadow-md"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <span className="text-xl bg-white/5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/10">
                      {agent.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold truncate text-white">
                          {agent.name}
                        </span>
                        <span className="text-[9px] scale-90 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-medium">
                          Template
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 truncate mt-0.5 font-normal">
                        {agent.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Agents Section */}
        <div className="space-y-1">
          <h2 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Library className="w-3.5 h-3.5" /> Mes Custom Agents ({filteredCustoms.length})
          </h2>
          {filteredCustoms.length === 0 ? (
            <p className="px-3 py-2 text-[10px] text-slate-500 italic">
              {searchQuery ? "Aucun agent trouvé." : "Aucun agent personnalisé créé."}
            </p>
          ) : (
            <div className="space-y-0.5">
              {filteredCustoms.map((agent) => {
                const isActive = activeAgentId === agent.id && !activeSessionId;
                return (
                  <div
                    key={agent.id}
                    className={`w-full group rounded-xl flex items-center gap-2 pr-2 transition-all relative ${
                      isActive
                        ? "bg-white/15 border border-white/20 shadow-md"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <button
                      onClick={() => onSelectAgent(agent.id)}
                      className="flex-1 text-left px-3 py-2.5 flex items-center gap-3 min-w-0"
                    >
                      <span className="text-xl bg-white/5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/10">
                        {agent.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold truncate text-white block">
                          {agent.name}
                        </span>
                        <p className="text-[10px] text-slate-300 truncate mt-0.5 font-normal">
                          {agent.description}
                        </p>
                      </div>
                    </button>
                    
                    {/* Hover Actions for custom agents */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditAgentClick(agent);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-400 rounded hover:bg-white/10"
                        title="Modifier l'agent"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteAgent(agent.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-white/10"
                        title="Supprimer l'agent"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat History Section */}
        <div className="space-y-1 pt-3 border-t border-white/10">
          <h2 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Discussions Récentes ({sessions.length})
          </h2>
          {sessions.length === 0 ? (
            <p className="px-3 py-2 text-[10px] text-slate-500 italic">
              Aucune discussion active.
            </p>
          ) : (
            <div className="space-y-0.5">
              {sessions.map((session) => {
                const associatedAgent = agents.find((a) => a.id === session.agentId);
                const isActive = activeSessionId === session.id;
                return (
                  <div
                    key={session.id}
                    className={`w-full group rounded-xl flex items-center gap-2 pr-2 transition-all ${
                      isActive
                        ? "bg-white/15 border border-white/20 shadow-md"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <button
                      onClick={() => onSelectSession(session.id)}
                      className="flex-1 text-left px-3 py-2 flex items-center gap-3 min-w-0"
                    >
                      <span className="text-base h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                        {associatedAgent?.emoji || "💬"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium truncate block text-slate-200">
                          {session.title || "Nouvelle discussion"}
                        </span>
                        <p className="text-[9px] text-slate-400 font-normal">
                          {associatedAgent?.name || "Agent inconnu"}
                        </p>
                      </div>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 rounded hover:bg-white/10 shrink-0 transition-all"
                      title="Supprimer la discussion"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between text-[11px] text-slate-400">
        <span>Statut : Connecté</span>
        <span className="font-mono text-[9px] bg-indigo-500/10 text-indigo-400 py-0.5 px-1.5 rounded border border-indigo-500/20">
          Gemini SDK
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar trigger */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <button
          onClick={onToggleOpen}
          className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-slate-100 shadow-2xl focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop view */}
      <div className="hidden md:block w-72 h-screen flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer view */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={onToggleOpen}
              className="md:hidden fixed inset-0 bg-black z-40"
            />
            {/* Sidebar Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.2 }}
              className="md:hidden fixed inset-y-0 left-0 w-72 z-50 h-full shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
