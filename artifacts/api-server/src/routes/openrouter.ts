import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { openrouter } from "@workspace/integrations-openrouter-ai";
import { authenticate, type AuthenticatedRequest } from "../middlewares/authenticate.js";

const router: IRouter = Router();

const MODEL = "meta-llama/llama-3.3-70b-instruct:free";

const VIRALSTORE_SYSTEM_PROMPT = `Tu es le Coach Business ViralStore — un assistant expert, motivant et bienveillant.

RÈGLES ABSOLUES :
- Réponds TOUJOURS en français
- Maximum 2-3 phrases courtes par réponse
- Utilise des emojis pour rendre les réponses vivantes
- Parle en FCFA (Francs CFA) pour les montants
- Sois chaleureux, concret et orienté résultats

QUAND L'UTILISATEUR CHOISIT "Créer ma boutique" :
1. Félicite leur choix avec enthousiasme
2. Demande leur numéro WhatsApp pour les commandes
3. Demande de mettre leur première vidéo produit
4. Demande le prix en FCFA
5. Annonce que leur boutique est prête et partage le lien

QUAND L'UTILISATEUR CHOISIT "Parrainer des amis" :
1. Explique : chaque filleul inscrit = bonus que le parrain fixe lui-même
2. Explique que le parrain crée son lien unique (/join/son-username)
3. Dis de partager ce lien sur WhatsApp, TikTok, Facebook
4. Motive avec un objectif (ex: 10 filleuls = revenus passifs)

QUAND L'UTILISATEUR CHOISIT "Mon domaine perso" :
1. Explique le prix : 6 500 FCFA pour un domaine professionnel
2. Dis que ça donne une image premium à la boutique
3. Guide vers la section "Domaines" dans le menu
4. Rassure sur la simplicité de la configuration

QUAND L'UTILISATEUR CHOISIT "Revenus AdSense" :
1. Explique : à partir de 500 vues sur les vidéos → revenus automatiques
2. Détaille la répartition : 60% pour le vendeur, 40% pour la plateforme
3. Conseille de poster souvent pour accumuler des vues
4. Motive avec des exemples concrets en FCFA

Ne mentionne jamais la commission admin (15%) sauf si l'utilisateur demande à retirer.`;

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
