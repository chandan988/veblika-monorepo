import dotenv from "dotenv";
dotenv.config();
import express, { application } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import allRouter from "./routes/allRoutes.js";
import connectDb from "./config/db.js";
import { migrateAppCredentialsIndexes } from "./models/appcredentials.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8001;

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:3001",
      "https://strengthen-sunglasses-writing-fundamental.trycloudflare.com",
      "https://technological-pillow-adsl-movers.trycloudflare.com",
      "https://precision-ralph-related-cad.trycloudflare.com"
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Files are now stored in S3, no need for local static file serving
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", allRouter);

app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

app.listen(PORT, async () => {
  await connectDb();
  // Run migration to drop old orgNo index and ensure userId index exists
  await migrateAppCredentialsIndexes();
  console.log(`Server is running on http://localhost:${PORT}`);
});
