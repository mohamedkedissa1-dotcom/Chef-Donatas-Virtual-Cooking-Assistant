// server/routes/recipes.js
import express from "express";
import db from "../db.js";

const router = express.Router();

// Get recipes (with optional ?tag= filter)
router.get("/", (req, res) => {
  const { tag } = req.query;

  let sql = "SELECT id, recipe_name, ingredients_column, description FROM recipes";
  let values = [];

  if (tag) {
    sql += " WHERE recipe_name LIKE ?";
    const searchTerm = `%${tag}%`;
    values = searchTerm;
  }

  db.query(sql, values, (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch recipes" });
    res.json(results);
  });
});


// Add recipe
router.post("/", (req, res) => {
  console.log("POST /api/recipes body:", req.body);
  const { name, ingredients, description } = req.body;
  const query = "INSERT INTO recipes (recipe_name, ingredients_column, description) VALUES (?, ?, ?)";
  db.query(query, [name, ingredients, description], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to add recipe" });
    res.json({ id: result.insertId, recipe_name: name, ingredients, description });
  });
});

// Delete recipe
router.delete("/:id", (req, res) => {
  console.log("DELETE /api/recipes/:id id=", req.params.id);
  const { id } = req.params;
  const query = "DELETE FROM recipes WHERE id = ?";
  db.query(query, [id], (err) => {
    if (err) return res.status(500).json({ error: "Failed to delete recipe" });
    res.json({ success: true });
  });
});

export default router;
