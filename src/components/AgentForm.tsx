import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, Plus, Trash2, Check, Settings2, Info } from "lucide-react";
import { Agent } from "../types";
import { THEME_COLORS_MAP } from "../data";

interface AgentFormProps {
  onSave: (agent: Agent) => void;
  onCancel: () => void;
  editingAgent?: Agent | null;
}

const AVAILABLE_EMOJIS = [
  "🤖", "💻", "✍️", "🧘", "🗣️", "🎓", "🕵️", "🎨", "🧪", "🩺", 
  "🚀", "🧭", "💬", "🎮", "⚖️", "📈", "🥘", "🔑", "🍿", "🌱"
];

const AVAILABLE_THEMES: Array<keyof typeof THEME_COLORS_MAP> = [
  "slate", "indigo", "emerald", "rose", "purple", "amber", "sky", "violet"
];

export default function AgentForm({ onSave, onCancel, editingAgent }: AgentFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemInstruction, setSystemInstruction] = useState("");
  const [model, setModel] = useState("gemini-3.5-flash");
  const [temperature, setTemperature] = useState(0.7);
  const [emoji, setEmoji] = useState("🤖");
  const [themeColor, setThemeColor] = useState<keyof typeof THEME_COLORS_MAP>("indigo");
  const [starters, setStarters] = useState<string[]>(["", ""]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (editingAgent) {
      setName(editingAgent.name);
      setDescription(editingAgent.description);
      setSystemInstruction(editingAgent.systemInstruction);
      setModel(editingAgent.model);
      setTemperature(editingAgent.temperature);
      setEmoji(editingAgent.emoji);
      setThemeColor(editingAgent.themeColor);
      setStarters(editingAgent.starters || ["", ""]);
    } else {
      setName("");
      setDescription("");
      setSystemInstruction("");
      setModel("gemini-3.5-flash");
      setTemperature(0.7);
      setEmoji("🤖");
      setThemeColor("indigo");
      setStarters(["", ""]);
    }
    setErrors({});
  }, [editingAgent]);

  const handleAddStarter = () => {
    setStarters([...starters, ""]);
  };

  const handleRemoveStarter = (index: number) => {
    const updated = starters.filter((_, i) => i !== index);
    setStarters(updated.length > 0 ? updated : [""]);
  };

  const handleStarterChange = (index: number, value: string) => {
    const updated = [...starters];
    updated[index] = value;
    setStarters(updated);
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = "Le nom de l'agent est requis.";
    if (!description.trim()) newErrors.description = "La description est requise.";
    if (!systemInstruction.trim()) newErrors.systemInstruction = "Les instructions système sont requises.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const filteredStarters = starters.filter((s) => s.trim() !== "");

    const agentData: Agent = {
      id: editingAgent?.id || `agent-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      systemInstruction: systemInstruction.trim(),
      model,
      temperature,
      emoji,
      themeColor,
      isTemplate: false,
      starters: filteredStarters.length > 0 ? filteredStarters : undefined,
    };

    onSave(agentData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full mx-auto text-slate-100"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-sans font-semibold text-lg text-slate-100">
              {editingAgent ? "Modifier l'Agent" : "Créer un Nouvel Agent"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Définissez l'identité, le comportement et les paramètres de votre IA.
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(100vh-250px)] space-y-6">
        {/* Row 1: Identity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200">Avatar Emoji</label>
            <div className="grid grid-cols-5 gap-1.5 p-2 border border-white/10 rounded-xl bg-white/5 max-h-36 overflow-y-auto">
              {AVAILABLE_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`h-9 w-9 text-xl rounded-lg flex items-center justify-center transition-all ${
                    emoji === e
                      ? "bg-indigo-600 text-white scale-105 shadow-md"
                      : "hover:bg-white/10 text-slate-300"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-200">
                Nom de l'agent <span className="text-indigo-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Assistant Rédaction, CodeMaster"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white/5 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${
                  errors.name ? "border-red-500/40 focus:ring-red-500/25" : "border-white/10 focus:border-indigo-500/50"
                }`}
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-200">
                Description courte <span className="text-indigo-400">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex. Rédige des articles SEO optimisés pour votre blog"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white/5 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${
                  errors.description ? "border-red-500/40 focus:ring-red-500/25" : "border-white/10 focus:border-indigo-500/50"
                }`}
              />
              {errors.description && <p className="text-xs text-red-400">{errors.description}</p>}
            </div>
          </div>
        </div>

        {/* Theme Color Selector */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-200">Thème Visuel</label>
          <div className="flex flex-wrap gap-2.5">
            {AVAILABLE_THEMES.map((theme) => {
              const details = THEME_COLORS_MAP[theme];
              return (
                <button
                  key={theme}
                  type="button"
                  onClick={() => setThemeColor(theme)}
                  className={`relative flex items-center justify-center py-2 px-3 rounded-xl border text-xs capitalize font-semibold transition-all gap-1.5 ${
                    themeColor === theme
                      ? "border-indigo-500/50 text-indigo-400 bg-white/10 shadow-md"
                      : "border-white/10 hover:bg-white/5 text-slate-300"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${details.gradient}`} />
                  {theme}
                  {themeColor === theme && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Core Behavior: System Instruction */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              Instructions Système (Prompte de comportement) <span className="text-indigo-400">*</span>
            </label>
            <div className="group relative flex items-center text-slate-400 hover:text-slate-200">
              <Info className="w-4 h-4 cursor-help" />
              <div className="absolute right-0 bottom-6 hidden group-hover:block w-72 bg-slate-800 text-white text-xs p-2.5 rounded-lg shadow-lg z-20 font-sans font-normal leading-relaxed">
                Ce texte définit le rôle, le ton, les règles et l'expertise de votre agent. C'est l'âme de l'IA.
              </div>
            </div>
          </div>
          <textarea
            value={systemInstruction}
            onChange={(e) => setSystemInstruction(e.target.value)}
            rows={5}
            placeholder="Ex. Tu es un tuteur d'anglais ultra-dynamique. Ton but est de corriger chaque erreur de grammaire de l'utilisateur avec gentillesse, de lui proposer du vocabulaire enrichi et de toujours finir tes phrases par un encouragement."
            className={`w-full px-3.5 py-2.5 rounded-xl border bg-white/5 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-sans leading-relaxed ${
              errors.systemInstruction ? "border-red-500/40 focus:ring-red-500/25" : "border-white/10 focus:border-indigo-500/50"
            }`}
          />
          {errors.systemInstruction && <p className="text-xs text-red-400">{errors.systemInstruction}</p>}
        </div>

        {/* Row 2: Advanced Model Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-5 rounded-2xl border border-white/10">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200">Modèle d'Intelligence</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 transition-all"
            >
              <option value="gemini-3.5-flash">Gemini 3.5 Flash (Rapide, Recommandé)</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Créativité & Raisonnement complexe)</option>
            </select>
            <p className="text-xs text-slate-400">
              Flash offre une réponse quasi-instantanée. Pro excelle sur la logique pointue.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-200">
                Température: <span className="font-mono text-indigo-400 font-bold">{temperature}</span>
              </label>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                {temperature <= 0.3 ? "Précis / Rigide" : temperature >= 1.2 ? "Créatif / Farfelu" : "Équilibré"}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="2.0"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0.0 (Précis)</span>
              <span>1.0</span>
              <span>2.0 (Créatif)</span>
            </div>
          </div>
        </div>

        {/* Conversation Starters */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-200">
              Suggestions de questions (Conversation starters)
            </label>
            <button
              type="button"
              onClick={handleAddStarter}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold bg-white/10 border border-white/10 py-1.5 px-3 rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>
          <div className="space-y-2">
            {starters.map((starter, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={starter}
                  onChange={(e) => handleStarterChange(index, e.target.value)}
                  placeholder={`Suggestion n°${index + 1} (Ex. Comment m'améliorer ?)`}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveStarter(index)}
                  className="p-2.5 rounded-xl text-slate-400 hover:bg-white/10 hover:text-red-400 transition-colors border border-white/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-5 border-t border-white/10 flex items-center justify-end gap-3 bg-transparent">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-semibold text-slate-300 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-xl shadow-indigo-600/25 flex items-center gap-1.5 hover:scale-102 active:scale-98 cursor-pointer"
          >
            <Check className="w-4 h-4" /> Enregistrer l'Agent
          </button>
        </div>
      </form>
    </motion.div>
  );
}
