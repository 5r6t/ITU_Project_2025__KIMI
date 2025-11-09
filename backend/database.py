import sqlite3

CONST_DB_FILE = "database.db"

# guess we will use just one default user, maybe admin on init -> create_default_user function
# Create tables
import sqlite3

CONST_DB_FILE = "database.db"

def connect():
    con = sqlite3.connect(CONST_DB_FILE)
    con.execute("PRAGMA foreign_keys = ON;")
    return con

#### Initialize Databaze ####
def init_db():
    with connect() as con:
        cur = con.cursor()

        # User table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS User (
                user_id   INTEGER PRIMARY KEY AUTOINCREMENT,
                user_name TEXT    NOT NULL
            );
        """)

        # Achievements linked to user
        cur.execute("""
            CREATE TABLE IF NOT EXISTS Achievement (
                achvmnt_id       INTEGER PRIMARY KEY AUTOINCREMENT,
                achvmnt_name     TEXT NOT NULL,
                achvmnt_progress INTEGER DEFAULT 0,
                achvmnt_target   INTEGER DEFAULT 1,
                completed        BOOLEAN DEFAULT 0, 
                user_id          INTEGER,
                FOREIGN KEY (user_id) REFERENCES User(user_id)
            );
        """)

        # Creature linked to owner
        cur.execute("""
            CREATE TABLE IF NOT EXISTS Creature (
                creature_id     INTEGER PRIMARY KEY AUTOINCREMENT,
                clean_state     INTEGER DEFAULT 0,
                energy_state    INTEGER DEFAULT 0,
                hunger_state    INTEGER DEFAULT 0,
                owner_id        INTEGER,
                FOREIGN KEY (owner_id) REFERENCES User(user_id)
            );
        """)

        # Recipes and Ingredients
        cur.execute("""
            CREATE TABLE IF NOT EXISTS Recipe (
                recipe_id            INTEGER PRIMARY KEY AUTOINCREMENT,
                recipe_name          TEXT NOT NULL,
                cooking_duration_sec INTEGER DEFAULT 0,
                user_id              INTEGER,
                FOREIGN KEY (user_id) REFERENCES User(user_id)
            );
        """)

        # Ingredient
        cur.execute("""
            CREATE TABLE IF NOT EXISTS Ingredient (
                ingredient_id   INTEGER PRIMARY KEY AUTOINCREMENT,
                ingredient_name TEXT NOT NULL
            );
        """)

        # Recipe <-> Ingredient relation (many-to-many)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS RecipeIngredient (
                recipe_id     INTEGER,
                ingredient_id INTEGER,
                quantity      INTEGER DEFAULT 1,
                PRIMARY KEY (recipe_id, ingredient_id),
                FOREIGN KEY (recipe_id) REFERENCES Recipe(recipe_id),
                FOREIGN KEY (ingredient_id) REFERENCES Ingredient(ingredient_id)
            );
        """)

        # Inventory — what the user currently owns only ingredients for now
        cur.execute("""
            CREATE TABLE IF NOT EXISTS Inventory (
                inventory_id  INTEGER PRIMARY KEY AUTOINCREMENT,
                ingredient_id INTEGER,
                quantity      INTEGER DEFAULT 0,
                user_id       INTEGER,
                UNIQUE (user_id, ingredient_id),
                FOREIGN KEY (ingredient_id) REFERENCES Ingredient(ingredient_id),
                FOREIGN KEY (user_id) REFERENCES User(user_id)
            );
        """)

    print("Database initialized! ^w^")

#### Delete functions ####
def destroy():
    with connect() as con:
        cur = con.cursor()

        cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cur.fetchall()

        for (table,) in tables:
            cur.execute(f"DROP TABLE IF EXISTS {table}")


def remove_all_achievements():
    with connect() as con:
        con.execute("DELETE FROM Achievement;")

def remove_all_creatures():
    with connect() as con:
        con.execute("DELETE FROM Creature;")

def remove_all_ingredients():
    with connect() as con:
        con.execute("DELETE FROM Ingredient;")

def remove_all_recipes():
    with connect() as con:
        con.execute("DELETE FROM Recipe;")

def remove_whole_inventory():
    with connect() as con:
        con.execute("DELETE FROM Inventory;")

#### CREATURE ####
def create_creature(owner_id, clean=50, energy=50, hunger=50):
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
            INSERT INTO Creature (owner_id, clean_state, energy_state, hunger_state)
            VALUES (?, ?, ?, ?)
        """, (owner_id, clean, energy, hunger))
        return cur.lastrowid # return creature id

def get_creature(creature_id):
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
            SELECT clean_state, energy_state, hunger_state
            FROM Creature WHERE creature_id=?;
        """, (creature_id,))
        row = cur.fetchone()
        if not row:
                return None
        return {
            "clean": row[0],
            "energy": row[1],
            "hunger": row[2],
        }

# handles states so that they don't overflow, returns states
def update_creature_state(creature_id, clean=None, energy=None, hunger=None):
    """Update creature states; automatically clamps values between 0–100."""
    with connect() as con:
        cur = con.cursor()

        if clean is not None:
            clean = max(0, min(100, clean))
            cur.execute("UPDATE Creature SET clean_state=? WHERE creature_id=?", (clean, creature_id))
        if energy is not None:
            energy = max(0, min(100, energy))
            cur.execute("UPDATE Creature SET energy_state=? WHERE creature_id=?", (energy, creature_id))
        if hunger is not None:
            hunger = max(0, min(100, hunger))
            cur.execute("UPDATE Creature SET hunger_state=? WHERE creature_id=?", (hunger, creature_id))
        # fetch updated values before returning
        cur.execute("""
            SELECT clean_state, energy_state, hunger_state
            FROM Creature WHERE creature_id=?;
        """, (creature_id,))
        row = cur.fetchone()

        if not row:
            return None

        return {
            "clean": row[0],
            "energy": row[1],
            "hunger": row[2]
        }
## DEFAULT ######################################## >>w<<
DEFAULT_ID = 1

def create_default_creature():
    with connect() as con:
        cur = con.cursor()
        cur.execute(
            "INSERT OR IGNORE INTO Creature (owner_id) VALUES (?)",
            (DEFAULT_ID,)
        )
    return DEFAULT_ID

def create_default_user():
    with connect() as con:
        cur = con.cursor()
        cur.execute(
            "INSERT OR IGNORE INTO User (user_id, user_name) VALUES (?, ?)",
            (DEFAULT_ID, "Admin")
        )

#### ACHIEVEMENTS ####
def add_achievement(user_id, name, target=1, progress=0):
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
            INSERT INTO Achievement (achvmnt_name, achvmnt_target, achvmnt_progress, user_id)
            VALUES (?, ?, ?, ?)
        """, (name, target, progress, user_id))
        return cur.lastrowid

def list_achievements(user_id):
    with connect() as con:
        cur = con.cursor()
        cur.execute("SELECT achvmnt_id, achvmnt_name, achvmnt_progress FROM Achievement WHERE user_id=?", (user_id,))
        return cur.fetchall()

# sorry, achievement popups only after the game >w<
def update_achievement_progress(achvmnt_id, new_progress):
    new_progress = max(0, min(100, new_progress))
    with connect() as con:
        con.execute("""
            UPDATE Achievement 
            SET achvmnt_progress=?, 
                completed = CASE WHEN ? >= achvmnt_target THEN 1 ELSE 0 END
            WHERE achvmnt_id=?;
        """, (new_progress, achvmnt_id))

#### INVENTORY ####
def add_ingredient(name):
    """Add a new ingredient type."""
    with connect() as con:
        cur = con.cursor()
        cur.execute("INSERT INTO Ingredient (ingredient_name) VALUES (?)", (name,))
        return cur.lastrowid

def list_ingredients():
    """List all available ingredient types."""
    with connect() as con:
        cur = con.cursor()
        cur.execute("SELECT ingredient_id, ingredient_name FROM Ingredient;")
        return cur.fetchall()

def add_to_inventory(user_id, ingredient_id, amount):
    """Increase quantity of ingredient in user's inventory."""
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
            INSERT INTO Inventory (user_id, ingredient_id, quantity)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id, ingredient_id) DO UPDATE SET quantity = quantity + excluded.quantity;
        """, (user_id, ingredient_id, amount))

def remove_from_inventory(user_id, ingredient_id, amount):
    """Decrease quantity of ingredient, not below 0."""
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
            UPDATE Inventory
            SET quantity = MAX(quantity - ?, 0)
            WHERE user_id=? AND ingredient_id=?;
        """, (amount, user_id, ingredient_id))

def get_inventory(user_id):
    """Get all items and quantities in user's inventory."""
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
            SELECT Ingredient.ingredient_name, Inventory.quantity
            FROM Inventory
            JOIN Ingredient ON Inventory.ingredient_id = Ingredient.ingredient_id
            WHERE Inventory.user_id=?;
        """, (user_id,))
        return cur.fetchall()
    
#### RECIPES ####
def add_recipe(user_id, name, cook_time=0):
    """Add a recipe."""
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
            INSERT INTO Recipe (recipe_name, cooking_duration_sec, user_id)
            VALUES (?, ?, ?)
        """, (name, cook_time, user_id))
        return cur.lastrowid

def add_ingredient_to_recipe(recipe_id, ingredient_id, quantity=1):
    """Link an ingredient to a recipe (many-to-many)."""
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
            INSERT OR REPLACE INTO RecipeIngredient (recipe_id, ingredient_id, quantity)
            VALUES (?, ?, ?)
        """, (recipe_id, ingredient_id, quantity))

def list_recipes(user_id):
    """List all recipes for a user."""
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
            SELECT recipe_id, recipe_name, cooking_duration_sec
            FROM Recipe
            WHERE user_id=?;
        """, (user_id,))
        return cur.fetchall()

def get_recipe_details(recipe_id):
    """Return recipe info and its ingredients."""
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
            SELECT recipe_name, cooking_duration_sec FROM Recipe WHERE recipe_id=?;
        """, (recipe_id,))
        recipe = cur.fetchone()
        if not recipe:
            return None

        cur.execute("""
            SELECT Ingredient.ingredient_name, RecipeIngredient.quantity
            FROM RecipeIngredient
            JOIN Ingredient ON RecipeIngredient.ingredient_id = Ingredient.ingredient_id
            WHERE RecipeIngredient.recipe_id=?;
        """, (recipe_id,))
        ingredients = cur.fetchall()
        return {
            "name": recipe[0],
            "duration": recipe[1],
            "ingredients": ingredients
        }
