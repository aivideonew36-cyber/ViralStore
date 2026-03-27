import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { openrouter } from "@workspace/integrations-openrouter-ai";
import { authenticate, type AuthenticatedRequest } from "../middlewares/authenticate.js";

const router: IRouter = Router();

const MODEL = "meta-llama/llama-3.3-70b-instruct:free";

const VIRALSTORE_SYSTEM_PROMPT = `Tu es l'assistant ViralStore, un Coach Business expert. Tu aides les utilisateurs à créer et gérer leur boutique TikTok-scroll pour vendre en ligne.

Règles importantes :
- Réponds toujours en français
- Maximum 2 phrases par réponse
- Utilise des emojis pour rendre les réponses vivantes
- Parle en FCFA (Francs CFA)
- Tu es motivant, amical, et orienté résultats business
- Guide l'utilisateur pas à pas pour configurer sa boutique
- Ne parle jamais des commissions admin (15%) sauf quand l'utilisateur demande à retirer ses gains

Flux d'onboarding si l'utilisateur n'a pas encore de produit :
1. Accueil chaleureux et invitation à lancer la boutique
2. Demander le numéro WhatsApp
3. Demander la vidéo du premier produit
4. Demander le prix en FCFA
5. Féliciter et partager le lien boutique`;

router.get("/conversations", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const convs = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, req.userId!));

    res.json(convs);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/conversations", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { title } = req.body as { title: string };

    const [conv] = await db
      .insert(conversations)
      .values({ title, userId: req.userId! })
      .returning();

    res.status(201).json(conv);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/conversations/:id", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);

    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));

    res.json({ ...conv, messages: msgs });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/conversations/:id", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);

    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));

    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/conversations/:id/messages", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));

    res.json(msgs);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/conversations/:id/messages", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { content } = req.body as { content: string };

    await db.insert(messages).values({
      conversationId: id,
      role: "user",
      content,
    });

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));

    const chatMessages = [
      { role: "system" as const, content: VIRALSTORE_SYSTEM_PROMPT },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    const stream = await openrouter.chat.completions.create({
      model: MODEL,
      max_tokens: 8192,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    await db.insert(messages).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error(err);
    res.write(`data: ${JSON.stringify({ error: "AI error" })}\n\n`);
    res.end();
  }
});

export default router;
