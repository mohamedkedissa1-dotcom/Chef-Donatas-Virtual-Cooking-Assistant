import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import "./ManageRecipes.css";

export default function ManageRecipes() {
    const [recipes, setRecipes] = useState([]);
    const [form, setForm] = useState({ name: "", ingredients: "", description: "" });
    const [loginForm, setLoginForm] = useState({ username: "", password: "" });
    const [loggedIn, setLoggedIn] = useState(false);
    const [loginError, setLoginError] = useState("");

    useEffect(() => {
        if (loggedIn) {
            axios.get("http://localhost:3001/api/recipes").then((res) => setRecipes(res.data));
        }
    }, [loggedIn]);

    const handleLoginChange = (e) => {
        setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
    };

    const handleLogin = async () => {
        try {
            const res = await axios.post("http://localhost:3001/api/auth/login", loginForm);
            if (res.data.success) {
                setLoggedIn(true);
                setLoginError("");
            }
        } catch (err) {
            setLoginError("Invalid username or password");
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAdd = async () => {
        if (!form.name) return;
        try {
            const res = await axios.post("http://localhost:3001/api/recipes", form);
            setRecipes([...recipes, res.data]);
            setForm({ name: "", ingredients: "", description: "" });
        } catch (err) {
            console.error("Add error:", err.response?.data || err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!id) return;
        try {
            await axios.delete(`http://localhost:3001/api/recipes/${id}`);
            setRecipes(recipes.filter((r) => r.id !== id));
        } catch (err) {
            console.error("Delete error:", err.response?.data || err.message);
        }
    };

    if (!loggedIn) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <h1 className="login-title">Login to Manage Recipes</h1>
                    <input
                        type="text"
                        name="username"
                        value={loginForm.username}
                        onChange={handleLoginChange}
                        placeholder="Username"
                        className="login-input"
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    />
                    <input
                        type="password"
                        name="password"
                        value={loginForm.password}
                        onChange={handleLoginChange}
                        placeholder="Password"
                        className="login-input"
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    />
                    <button onClick={handleLogin} className="login-button">Login</button>
                    {loginError && <p className="login-error">{loginError}</p>}
                </div>
            </div>

        );
    }

    return (
        <div className="manage-recipes-container">
            <div className="back-button-container">
                <Link to="/" className="back-button">← Back</Link>
            </div>

            <h1 className="page-title"><span className="plus-sign">＋</span> Manage Recipes</h1>

            <div className="recipe-form">
                <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Recipe Name"
                    className="form-input"
                />
                <textarea
                    name="ingredients"
                    value={form.ingredients}
                    onChange={handleChange}
                    placeholder="Ingredients"
                    className="form-input"
                />
                <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Description"
                    className="form-input"
                />
                <button onClick={handleAdd} className="add-button">Add Recipe</button>
            </div>

            <div className="existing-recipes">
                <h2 className="existing-title">📋 Existing Recipes</h2>
                <ul className="recipe-list">
                    {recipes.map((r) => (
                        <li key={r.id} className="recipe-item">
                            <span className="recipe-name">{r.recipe_name}</span>
                            <button
                                onClick={() => handleDelete(r.id)}
                                className="delete-button"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
