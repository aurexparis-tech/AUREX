import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set body parser limits for larger prompt contexts
  app.use(express.json({ limit: "10mb" }));

  // API Route for chatting with custom agents using streaming (SSE)
  app.post("/api/chat", async (req, res) => {
    const { systemInstruction, model, temperature, messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Le tableau de messages est requis." });
    }

    // Check if the API key is set
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Clé API Gemini manquante. Veuillez configurer GEMINI_API_KEY dans le panneau Secrets de l'AI Studio UI (Settings > Secrets)."
      });
    }

    // Format messages into GoogleGenAI contents structure
    const contents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Set headers for Server-Sent Events (SSE)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const selectedModel = model || "gemini-3.5-flash";

      const responseStream = await ai.models.generateContentStream({
        model: selectedModel,
        contents: contents,
        config: {
          systemInstruction: systemInstruction || "You are a helpful assistant.",
          temperature: typeof temperature === "number" ? temperature : 0.7,
        }
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      console.error("Gemini streaming error:", error);
      const errorMessage = error.message || "Une erreur est survenue lors de la génération.";
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: errorMessage });
      }
    }
  });

  // Scheduled emails in-memory database
  interface ScheduledEmailRecord {
    id: string;
    to: string;
    subject: string;
    body: string;
    sendAt: number;
    status: "pending" | "sending" | "sent" | "failed";
    error?: string;
    sentAt?: number;
    accessToken: string;
  }

  const scheduledEmails: ScheduledEmailRecord[] = [];

  // Helper to send email via Gmail API
  async function sendGmail(accessToken: string, to: string, subject: string, bodyText: string) {
    // Format email content as simple MIME message
    const emailContent = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      bodyText.replace(/\n/g, "<br/>") // Convert linebreaks to HTML
    ].join("\r\n");

    // Convert to base64url encoding
    const base64 = Buffer.from(emailContent)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        raw: base64
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gmail API: ${errText}`);
    }

    return await response.json();
  }

  // GET scheduled emails (sanitized, without tokens)
  app.get("/api/scheduled-emails", (req, res) => {
    const sanitized = scheduledEmails.map(({ accessToken, ...rest }) => rest);
    res.json(sanitized);
  });

  // POST schedule an email
  app.post("/api/schedule-email", (req, res) => {
    const { to, subject, body, sendAt, accessToken } = req.body;

    if (!to || !subject || !body || !sendAt || !accessToken) {
      return res.status(400).json({ error: "Tous les champs (to, subject, body, sendAt, accessToken) sont requis." });
    }

    const newEmail: ScheduledEmailRecord = {
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      to,
      subject,
      body,
      sendAt: Number(sendAt),
      status: "pending",
      accessToken
    };

    scheduledEmails.push(newEmail);
    
    // Log the schedule action
    console.log(`[Scheduler] Email scheduled for ${newEmail.to} at ${new Date(newEmail.sendAt).toLocaleString()}`);
    
    const { accessToken: _, ...sanitized } = newEmail;
    res.json({ success: true, email: sanitized });
  });

  // DELETE cancel a scheduled email
  app.delete("/api/scheduled-emails/:id", (req, res) => {
    const { id } = req.params;
    const index = scheduledEmails.findIndex(e => e.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Email planifié introuvable." });
    }

    // Only allow canceling if it is still pending
    const email = scheduledEmails[index];
    if (email.status !== "pending") {
      return res.status(400).json({ error: "Impossible d'annuler un email déjà envoyé ou en cours d'envoi." });
    }

    scheduledEmails.splice(index, 1);
    console.log(`[Scheduler] Cancelled scheduled email ${id}`);
    res.json({ success: true });
  });

  // Background cron check interval (checks every 5 seconds)
  setInterval(async () => {
    const now = Date.now();
    for (const email of scheduledEmails) {
      if (email.status === "pending" && email.sendAt <= now) {
        email.status = "sending";
        try {
          console.log(`[Scheduler] Delivering email to ${email.to}...`);
          await sendGmail(email.accessToken, email.to, email.subject, email.body);
          email.status = "sent";
          email.sentAt = Date.now();
          console.log(`[Scheduler] Success! Email sent to ${email.to}`);
        } catch (err: any) {
          console.error(`[Scheduler] Error sending email to ${email.to}:`, err);
          email.status = "failed";
          email.error = err.message || "Erreur de transmission Gmail API";
        }
      }
    }
  }, 5000);

  // Serve static files / Vite dev middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
