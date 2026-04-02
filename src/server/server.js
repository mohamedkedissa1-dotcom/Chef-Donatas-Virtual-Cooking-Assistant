import express from "express";
import cors from "cors";
const app = express();
import recipeRoutes from "./routes/recipes.js";
import authRoutes from "./routes/auth.js";

app.use(cors());
app.use(express.json());

app.use("/api/recipes", recipeRoutes);
app.use("/api/auth", authRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
