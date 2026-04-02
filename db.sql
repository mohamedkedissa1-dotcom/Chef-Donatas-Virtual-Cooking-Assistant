CREATE DATABASE IF NOT EXISTS recipes_db;
USE recipes_db;

CREATE TABLE IF NOT EXISTS recipes (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    recipe_name VARCHAR(255) NOT NULL,
    description TEXT,
    ingredients_column VARCHAR(255) NOT NULL  -- Store all ingredients in this column
);

-- 10 recipes query with the description :


INSERT INTO recipes (recipe_name, description, ingredients_column) VALUES
('Cake', 
'1. Preheat the oven to 350°F (175°C).\n2. Mix the dry ingredients: Sugar, Flour, and Baking Powder in a bowl.\n3. In a separate bowl, whisk the eggs, milk, and melted butter.\n4. Combine the wet and dry ingredients, and mix until smooth.\n5. Pour the batter into a greased cake pan and bake for 30 minutes.\n6. Let the cake cool for 10 minutes, then serve.',
'Sugar Flour Eggs Butter Milk'),

('Spaghetti Bolognese', 
'1. Cook the spaghetti according to the package instructions.\n2. Heat olive oil in a pan and cook diced onions and garlic until soft.\n3. Add ground beef to the pan and cook until browned.\n4. Add tomato sauce, salt, and pepper, and simmer for 15 minutes.\n5. Drain the spaghetti and combine with the sauce.\n6. Serve with grated Parmesan cheese.',
'Spaghetti GroundBeef TomatoSauce Onion Garlic OliveOil Parmesan'),

('Chicken Salad', 
'1. Grill chicken breasts and slice them into strips.\n2. Wash and chop lettuce, tomatoes, and cucumbers.\n3. In a bowl, combine the lettuce, tomatoes, cucumbers, and sliced chicken.\n4. Add your favorite dressing and toss the salad.\n5. Serve chilled.',
'Chicken Lettuce Tomatoes Cucumbers Dressing'),

('Pancakes', 
'1. In a large bowl, mix flour, sugar, baking powder, and salt.\n2. In another bowl, whisk eggs, milk, and melted butter.\n3. Combine the wet and dry ingredients and stir until smooth.\n4. Heat a non-stick pan and cook the pancakes until bubbles form on the surface.\n5. Flip and cook the other side.\n6. Serve with syrup and butter.',
'Flour Sugar BakingPowder Salt Eggs Milk Butter Syrup'),

('Tacos', 
'1. Cook ground beef with taco seasoning.\n2. Warm up taco shells in the oven.\n3. Dice tomatoes, lettuce, and onions.\n4. Fill each taco shell with ground beef and top with diced vegetables.\n5. Add cheese, sour cream, and salsa.\n6. Serve immediately.',
'GroundBeef TacoShells Tomatoes Lettuce Onion Cheese SourCream Salsa'),

('Vegetable Stir Fry', 
'1. Heat vegetable oil in a pan.\n2. Add chopped carrots, bell peppers, and broccoli.\n3. Stir fry the vegetables until tender.\n4. Add soy sauce, garlic, and ginger.\n5. Cook for another 2 minutes and serve over rice.',
'Carrots BellPeppers Broccoli SoySauce Garlic Ginger Rice'),

('Beef Stew', 
'1. Brown the beef cubes in a pot.\n2. Add diced onions, carrots, and potatoes.\n3. Pour in beef broth and bring to a boil.\n4. Lower the heat and simmer for 1.5 hours.\n5. Season with salt, pepper, and thyme.\n6. Serve hot with bread.',
'Beef Carrots Potatoes Onion BeefBroth Salt Pepper Thyme Bread'),

('Caesar Salad', 
'1. Wash and chop Romaine lettuce.\n2. Toast some croutons.\n3. Toss the lettuce with Caesar dressing.\n4. Add the croutons and grated Parmesan cheese.\n5. Serve with a lemon wedge on the side.',
'Lettuce Croutons CaesarDressing Parmesan Lemon'),

('Grilled Cheese Sandwich', 
'1. Butter two slices of bread.\n2. Place a slice of cheese between the bread slices.\n3. Heat a pan and grill the sandwich on both sides until golden brown.\n4. Serve with a bowl of tomato soup.',
'Bread Cheese Butter TomatoSoup'),

('Margarita Pizza', 
'1. Preheat the oven to 475°F (245°C).\n2. Roll out pizza dough on a floured surface.\n3. Spread tomato sauce over the dough.\n4. Add fresh mozzarella and basil leaves.\n5. Drizzle with olive oil.\n6. Bake for 10-12 minutes or until the crust is golden brown.',
'PizzaDough TomatoSauce Mozzarella Basil OliveOil'),

('Chocolate Chip Cookies', 
'1. Preheat the oven to 350°F (175°C).\n2. Cream butter and sugar in a bowl.\n3. Add eggs and vanilla extract.\n4. Mix in flour, baking soda, and salt.\n5. Stir in chocolate chips.\n6. Drop spoonfuls of dough onto a baking sheet.\n7. Bake for 10 minutes or until golden brown.',
'Butter Sugar Eggs VanillaExtract Flour BakingSoda Salt ChocolateChips');


CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- Insert default admin user
INSERT INTO users (username, password) VALUES ('admin', 'full');
