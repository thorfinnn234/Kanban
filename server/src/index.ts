import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

// Returns the trimmed title from the request body, or null if it's missing,
// empty, or not a string. `req.body` can be undefined when no JSON was sent.
function readTitle(req: Request): string | null {
  const title: unknown = req.body?.title;
  if (typeof title !== "string" || title.trim() === "") return null;
  return title.trim();
}

// List all boards
app.get("/boards", async (_req, res) => {
  res.json(await db.board.findMany({ orderBy: { createdAt: "asc" } }));
});

// Create a board
app.post("/boards", async (req, res) => {
  const title = readTitle(req);
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const board = await db.board.create({ data: { title } });
  res.status(201).json(board);
});

// Get one board with its columns and cards (in order)
app.get("/boards/:id", async (req, res) => {
  const board = await db.board.findUnique({
    where: { id: req.params.id },
    include: {
      columns: {
        orderBy: { position: "asc" },
        include: { cards: { orderBy: { position: "asc" } } },
      },
    },
  });
  if (!board) {
    res.status(404).json({ error: "Board not found" });
    return;
  }
  res.json(board);
});

// Add a column to the end of a board
app.post("/boards/:id/columns", async (req, res) => {
  const title = readTitle(req);
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const board = await db.board.findUnique({ where: { id: req.params.id } });
  if (!board) {
    res.status(404).json({ error: "Board not found" });
    return;
  }
  const last = await db.column.findFirst({
    where: { boardId: board.id },
    orderBy: { position: "desc" },
  });
  const column = await db.column.create({
    data: {
      title,
      boardId: board.id,
      position: (last?.position ?? 0) + 1000,
    },
  });
  res.status(201).json(column);
});

// Add a card to the end of a column
app.post("/columns/:id/cards", async (req, res) => {
  const title = readTitle(req);
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const column = await db.column.findUnique({ where: { id: req.params.id } });
  if (!column) {
    res.status(404).json({ error: "Column not found" });
    return;
  }
  const last = await db.card.findFirst({
    where: { columnId: column.id },
    orderBy: { position: "desc" },
  });
  const card = await db.card.create({
    data: {
      title,
      columnId: column.id,
      position: (last?.position ?? 0) + 1000,
    },
  });
  res.status(201).json(card);
});

// Error handler: Express recognises it by its 4 arguments. In Express 5, an
// error thrown inside an async route lands here automatically.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // express.json() marks bad JSON with status 400: that's the client's mistake.
  if (err instanceof SyntaxError && "status" in err && err.status === 400) {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(4000, () => console.log("API running on http://localhost:4000"));
