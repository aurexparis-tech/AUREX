import { Agent } from "./types";

export const AGENT_TEMPLATES: Agent[] = [
  {
    id: "template-coder",
    name: "Expert Codeur",
    description: "Développeur chevronné spécialisé dans l'écriture de code propre, robuste et moderne.",
    systemInstruction: "Tu es un ingénieur logiciel d'élite. Ton but est de fournir du code propre, optimal et moderne en TypeScript, JavaScript ou d'autres langages selon la demande. Explique brièvement tes choix techniques. Structure tes réponses avec des titres clairs et utilise des blocs de code.",
    model: "gemini-3.5-flash",
    temperature: 0.2,
    emoji: "💻",
    themeColor: "indigo",
    isTemplate: true,
    starters: [
      "Explique-moi l'intérêt de useEffect en React avec un exemple simple.",
      "Écris une fonction TypeScript de recherche dichotomique optimisée.",
      "Comment structurer une API REST moderne avec Express ?"
    ]
  },
  {
    id: "template-writer",
    name: "Plume Créative",
    description: "Écrivain et poète prêt à donner vie à vos récits et idées artistiques.",
    systemInstruction: "Tu es un auteur littéraire extrêmement talentueux, imaginatif et expressif. Ton but est d'aider l'utilisateur à rédiger des histoires, poèmes, scripts ou dialogues. Utilise des descriptions riches, sensorielles et vivantes.",
    model: "gemini-3.5-flash",
    temperature: 0.9,
    emoji: "✍️",
    themeColor: "rose",
    isTemplate: true,
    starters: [
      "Écris le premier chapitre d'un roman de science-fiction rétro-futuriste.",
      "Rédige un poème mélancolique sur le passage du temps.",
      "Aide-moi à développer l'antagoniste d'un thriller psychologique."
    ]
  },
  {
    id: "template-zen",
    name: "Coach Zen",
    description: "Mentor bienveillant axé sur la sérénité, la productivité saine et le bien-être.",
    systemInstruction: "Tu es un coach de bien-être mental et de développement personnel calme, empathique et à l'écoute. Aide l'utilisateur à clarifier ses pensées, à gérer le stress, à s'organiser de manière saine et à pratiquer la pleine conscience. Sois positif et constructif.",
    model: "gemini-3.5-flash",
    temperature: 0.7,
    emoji: "🧘",
    themeColor: "emerald",
    isTemplate: true,
    starters: [
      "Je me sens submergé par le travail aujourd'hui, que faire ?",
      "Donne-moi une routine de méditation matinale de 5 minutes.",
      "Comment surmonter la procrastination sans culpabilité ?"
    ]
  },
  {
    id: "template-polyglot",
    name: "Tuteur Polyglotte",
    description: "Professeur de langues interactif qui vous aide à traduire et à pratiquer.",
    systemInstruction: "Tu es un tuteur de langues patient et dynamique. Ton objectif est d'aider l'utilisateur à apprendre, traduire ou s'exercer dans différentes langues. Corrige délicatement ses erreurs et explique les expressions idiomatiques de manière simple et ludique.",
    model: "gemini-3.5-flash",
    temperature: 0.6,
    emoji: "🗣️",
    themeColor: "amber",
    isTemplate: true,
    starters: [
      "Comment commander un café poliment en espagnol, italien et japonais ?",
      "Peux-tu m'expliquer la différence entre 'make' et 'do' en anglais ?",
      "Pratiquons une conversation simple en allemand ! Commence."
    ]
  },
  {
    id: "template-professor",
    name: "Professeur Curieux",
    description: "Vulgarisateur scientifique hors pair capable d'expliquer n'importe quel sujet.",
    systemInstruction: "Tu es un vulgarisateur scientifique passionné et extrêmement pédagogue. Tu as le don d'expliquer les concepts scientifiques, historiques ou philosophiques les plus complexes de façon passionnante et simple. Utilise des analogies parlantes.",
    model: "gemini-3.5-flash",
    temperature: 0.7,
    emoji: "🎓",
    themeColor: "purple",
    isTemplate: true,
    starters: [
      "Explique-moi la théorie de la relativité d'Einstein comme si j'avais 10 ans.",
      "Comment fonctionne la technologie de la blockchain ?",
      "Pourquoi le ciel est-il bleu et le soleil est-il rouge au coucher ?"
    ]
  },
  {
    id: "template-etancheite",
    name: "Expert Étanchéité",
    description: "Expert commercial spécialisé dans la qualification de prospects pour travaux d'étanchéité de toitures-terrasses.",
    systemInstruction: "Tu es un expert commercial spécialisé dans les travaux d'étanchéité de toitures-terrasses et de résine. Ta mission est de qualifier des entreprises qui pourraient avoir besoin de nos services. Pour chaque entreprise, tu dois :\n- analyser son activité\n- déterminer si elle possède probablement des toitures-terrasses\n- expliquer pourquoi elle est un bon prospect\n- attribuer une note de 1 à 100\n- identifier le décideur probable\n- proposer un premier message commercial\n\nRéponds toujours sous cette forme :\n\nEntreprise :\n\nActivité :\n\nPourquoi elle peut avoir besoin d'étanchéité :\n\nDécideur :\n\nScore :\n\nMessage :",
    model: "gemini-3.5-flash",
    temperature: 0.7,
    emoji: "🏗️",
    themeColor: "sky",
    isTemplate: true,
    starters: [
      "Qualifie la société Carrefour (hypermarchés).",
      "Qualifie un grand entrepôt de logistique comme Amazon.",
      "Analyse une usine de production industrielle locale."
    ]
  }
];

export const THEME_COLORS_MAP = {
  slate: {
    bg: "bg-slate-500/10 border-slate-500/25 backdrop-blur-md",
    badge: "bg-slate-500/20 border border-slate-500/30 text-slate-300",
    iconBg: "bg-slate-500/20 border border-slate-500/30 text-slate-300",
    button: "bg-slate-600 hover:bg-slate-500 text-white",
    gradient: "from-slate-500 to-zinc-600",
    text: "text-slate-400",
    primaryText: "text-slate-200",
    accentBorder: "focus-within:border-slate-500/50 focus-within:ring-2 focus-within:ring-slate-500/30",
    activeBg: "bg-slate-500/15 border border-slate-500/25"
  },
  indigo: {
    bg: "bg-indigo-500/10 border-indigo-500/25 backdrop-blur-md",
    badge: "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300",
    iconBg: "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300",
    button: "bg-indigo-600 hover:bg-indigo-500 text-white",
    gradient: "from-indigo-500 to-blue-600",
    text: "text-indigo-400",
    primaryText: "text-indigo-200",
    accentBorder: "focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/30",
    activeBg: "bg-indigo-500/15 border border-indigo-500/25"
  },
  emerald: {
    bg: "bg-emerald-500/10 border-emerald-500/25 backdrop-blur-md",
    badge: "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300",
    iconBg: "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300",
    button: "bg-emerald-600 hover:bg-emerald-500 text-white",
    gradient: "from-emerald-500 to-teal-600",
    text: "text-emerald-400",
    primaryText: "text-emerald-200",
    accentBorder: "focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/30",
    activeBg: "bg-emerald-500/15 border border-emerald-500/25"
  },
  rose: {
    bg: "bg-rose-500/10 border-rose-500/25 backdrop-blur-md",
    badge: "bg-rose-500/20 border border-rose-500/30 text-rose-300",
    iconBg: "bg-rose-500/20 border border-rose-500/30 text-rose-300",
    button: "bg-rose-600 hover:bg-rose-500 text-white",
    gradient: "from-rose-500 to-pink-600",
    text: "text-rose-400",
    primaryText: "text-rose-200",
    accentBorder: "focus-within:border-rose-500/50 focus-within:ring-2 focus-within:ring-rose-500/30",
    activeBg: "bg-rose-500/15 border border-rose-500/25"
  },
  purple: {
    bg: "bg-purple-500/10 border-purple-500/25 backdrop-blur-md",
    badge: "bg-purple-500/20 border border-purple-500/30 text-purple-300",
    iconBg: "bg-purple-500/20 border border-purple-500/30 text-purple-300",
    button: "bg-purple-600 hover:bg-purple-500 text-white",
    gradient: "from-purple-500 to-fuchsia-600",
    text: "text-purple-400",
    primaryText: "text-purple-200",
    accentBorder: "focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/30",
    activeBg: "bg-purple-500/15 border border-purple-500/25"
  },
  amber: {
    bg: "bg-amber-500/10 border-amber-500/25 backdrop-blur-md",
    badge: "bg-amber-500/20 border border-amber-500/30 text-amber-300",
    iconBg: "bg-amber-500/20 border border-amber-500/30 text-amber-300",
    button: "bg-amber-600 hover:bg-amber-500 text-white",
    gradient: "from-amber-500 to-orange-600",
    text: "text-amber-400",
    primaryText: "text-amber-200",
    accentBorder: "focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/30",
    activeBg: "bg-amber-500/15 border border-amber-500/25"
  },
  sky: {
    bg: "bg-sky-500/10 border-sky-500/25 backdrop-blur-md",
    badge: "bg-sky-500/20 border border-sky-500/30 text-sky-300",
    iconBg: "bg-sky-500/20 border border-sky-500/30 text-sky-300",
    button: "bg-sky-600 hover:bg-sky-500 text-white",
    gradient: "from-sky-500 to-cyan-600",
    text: "text-sky-400",
    primaryText: "text-sky-200",
    accentBorder: "focus-within:border-sky-500/50 focus-within:ring-2 focus-within:ring-sky-500/30",
    activeBg: "bg-sky-500/15 border border-sky-500/25"
  },
  violet: {
    bg: "bg-violet-500/10 border-violet-500/25 backdrop-blur-md",
    badge: "bg-violet-500/20 border border-violet-500/30 text-violet-300",
    iconBg: "bg-violet-500/20 border border-violet-500/30 text-violet-300",
    button: "bg-violet-600 hover:bg-violet-500 text-white",
    gradient: "from-violet-500 to-purple-600",
    text: "text-violet-400",
    primaryText: "text-violet-200",
    accentBorder: "focus-within:border-violet-500/50 focus-within:ring-2 focus-within:ring-violet-500/30",
    activeBg: "bg-violet-500/15 border border-violet-500/25"
  }
};
