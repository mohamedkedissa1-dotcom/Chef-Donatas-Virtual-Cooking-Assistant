export const fetchRecipes = async (tag = '') => {
  try {
    const res = await fetch(`http://localhost:3001/api/recipes?tag=${tag}`);
    const data = await res.json();
    console.log("Fetched recipes:", data);
    return data;
  } catch (err) {
    console.error("Failed to fetch recipes:", err);
    return [];
  }
};

export const logDescriptions = async (name) => {
  const recipes = await fetchRecipes(name);
  const descriptions = recipes.map(r => r.description);
  console.log(descriptions); // ✅ array of descriptions
};