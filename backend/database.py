import sqlite3

CONST_DB_FILE = "database.db"

def connect():
    con = sqlite3.connect(CONST_DB_FILE)
    con.execute("PRAGMA foreign_keys = ON;")
    return con

def init_db():
    with connect() as con:
        cur = con.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS User (
                user_id   INTEGER PRIMARY KEY AUTOINCREMENT,
                user_name TEXT    NOT NULL
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS Achievement (
                achvmnt_id       INTEGER PRIMARY KEY AUTOINCREMENT,
                achvmnt_name     TEXT NOT NULL,
                achvmnt_progress INTEGER DEFAULT 0,
                achvmnt_target   INTEGER DEFAULT 1,
                completed        BOOLEAN DEFAULT 0, 
                user_id          INTEGER,
                FOREIGN KEY (user_id) REFERENCES User(user_id),
                UNIQUE (achvmnt_name, user_id)
            );
        """)

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

        cur.execute("""
            CREATE TABLE IF NOT EXISTS Recipe (
                recipe_id            INTEGER PRIMARY KEY AUTOINCREMENT,
                recipe_name          TEXT NOT NULL,
                cooking_duration_sec INTEGER DEFAULT 0,
                user_id              INTEGER,
                FOREIGN KEY (user_id) REFERENCES User(user_id)
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS Ingredient (
                ingredient_id   INTEGER PRIMARY KEY AUTOINCREMENT,
                ingredient_name TEXT NOT NULL
            );
        """)

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

        cur.execute("""
            CREATE TABLE IF NOT EXISTS Pinball (
                user_id INTEGER PRIMARY KEY,
                score   INTEGER DEFAULT 0,
                record  INTEGER DEFAULT 0,
                money   INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES User(user_id)
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS PinballItem (
                item_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                type    TEXT NOT NULL,
                x       INTEGER NOT NULL,
                y       INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES User(user_id)
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS SavedPizza (
                pizza_id INTEGER PRIMARY KEY AUTOINCREMENT,
                pizza_name TEXT,
                pizza_data TEXT,
                user_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES User(user_id)
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS BrickBreaker (
                user_id INTEGER PRIMARY KEY,
                high_score INTEGER DEFAULT 0,
                powerups_enabled BOOLEAN DEFAULT 0,
                breaker_max_level INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES User(user_id)
            );
        """)

    print("Database initialized! ^w^")

def destroy():
    con = sqlite3.connect(CONST_DB_FILE)
    con.execute("PRAGMA foreign_keys = OFF;")
    cur = con.cursor()

    tables = [
        "Achievement",
        "Creature",
        "RecipeIngredient",
        "Recipe",
        "Inventory",
        "Ingredient",
        "Pinball",
        "PinballItem",
        "User",
        "BrickBreaker",
        "SavedPizza"
    ]

    for table in tables:
        try:
            cur.execute(f"DROP TABLE IF EXISTS {table};")
            print(f"Dropped table {table}")
        except Exception as e:
            print(f"Failed to drop {table}: {e}")

    con.commit()
    con.close()
    print("Database wiped and ready for re-init.")

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

def remove_all_pinball_data():
    with connect() as con:
        con.execute("DELETE FROM Pinball;")

def create_creature(owner_id, clean=50, energy=50, hunger=50):
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
            INSERT INTO Creature (owner_id, clean_state, energy_state, hunger_state)
            VALUES (?, ?, ?, ?)
        """, (owner_id, clean, energy, hunger))
        return cur.lastrowid

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

def update_creature_state(creature_id, clean=None, energy=None, hunger=None):
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

def create_default_achievements(user_id):
    defaults = [
        ("First Win", 1),
        ("30 Points", 30),
        ("Perfect Run", 1),
        ("Secret Boss", 1),
        ("Nap Time", 1)
    ]
    with connect() as con:
        cur = con.cursor()
        for name, target in defaults:
            cur.execute("""
                INSERT OR IGNORE INTO Achievement (achvmnt_name, achvmnt_target, user_id)
                VALUES (?, ?, ?)
            """, (name, target, user_id))

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
        cur.execute("""
            SELECT achvmnt_id, achvmnt_name, achvmnt_progress, completed
            FROM Achievement
            WHERE user_id=?;
        """, (user_id,))
        return cur.fetchall()
    
def update_achievement_progress(achvmnt_id, new_progress):
    new_progress = max(0, min(100, new_progress))

    with connect() as con:
        cur = con.cursor()

        cur.execute("SELECT completed FROM Achievement WHERE achvmnt_id=?", (achvmnt_id,))
        old_completed = bool(cur.fetchone()[0])

        cur.execute("""
            UPDATE Achievement
            SET achvmnt_progress=?,
                completed = CASE WHEN ? >= achvmnt_target THEN 1 ELSE 0 END
            WHERE achvmnt_id=?;
        """, (new_progress, new_progress, achvmnt_id))

        cur.execute("""
            SELECT achvmnt_id, achvmnt_name, achvmnt_progress, achvmnt_target, completed
            FROM Achievement
            WHERE achvmnt_id=?;
        """, (achvmnt_id,))
        row = cur.fetchone()

        new_completed = bool(row[4])

        return {
            "id": row[0],
            "name": row[1],
            "progress": row[2],
            "target": row[3],
            "completed": new_completed,
            "newly_completed": (not old_completed and new_completed)
        }

def clean_inventory(user_id):
    with connect() as con:
        cur = con.cursor()
        con.execute("""
            DELETE FROM Inventory
            WHERE user_id = ?;
        """, (user_id,))
        return cur.rowcount

def list_ingredients():
    with connect() as con:
        cur = con.cursor()
        cur.execute("SELECT ingredient_id, ingredient_name FROM Ingredient;")
        return cur.fetchall()
    
def add_ingredient(name):
    with connect() as con:
        cur = con.cursor()
        cur.execute("INSERT OR IGNORE INTO Ingredient (ingredient_name) VALUES (?)", (name,))
        cur.execute("SELECT ingredient_id FROM Ingredient WHERE ingredient_name=?", (name,))
        row = cur.fetchone()
        return row[0] if row else None 

def get_ingredient_by_name(name):
    with connect() as con:
        cur = con.cursor()
        cur.execute("SELECT ingredient_id FROM Ingredient WHERE ingredient_name=?", (name,))
        row = cur.fetchone()
        return row[0] if row else None

def add_to_inventory(user_id, ingredient_id, amount):
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
            INSERT INTO Inventory (user_id, ingredient_id, quantity)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id, ingredient_id) DO UPDATE SET quantity = quantity + excluded.quantity;
        """, (user_id, ingredient_id, amount))

def remove_from_inventory(user_id, ingredient_id, amount):
    with connect() as con:
        con.execute("""
            UPDATE Inventory
            SET quantity = MAX(quantity - ?, 0)
            WHERE user_id=? AND ingredient_id=?;
        """, (amount, user_id, ingredient_id))
        
        con.execute("""
            DELETE FROM Inventory
            WHERE user_id=? AND ingredient_id=? AND quantity <= 0;
        """, (user_id, ingredient_id))

        cur = con.cursor()
        cur.execute("SELECT quantity FROM Inventory WHERE user_id=? AND ingredient_id=?", (user_id, ingredient_id))
        row = cur.fetchone()
        return row[0] if row else 0

def get_inventory(user_id):
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
            SELECT 
                Ingredient.ingredient_id,
                Ingredient.ingredient_name,
                Inventory.quantity
            FROM Inventory
            JOIN Ingredient ON Inventory.ingredient_id = Ingredient.ingredient_id
            WHERE Inventory.user_id=? AND Inventory.quantity > 0;
        """, (user_id,))
        
        rows = cur.fetchall()
        
        inventory_list = []
        for row in rows:
            inventory_list.append({
                "id": row[0],
                "name": row[1],
                "quantity": row[2]
            })
        return inventory_list
    
def add_recipe(user_id, name, cook_time=0):
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
            INSERT INTO Recipe (recipe_name, cooking_duration_sec, user_id)
            VALUES (?, ?, ?)
        """, (name, cook_time, user_id))
        return cur.lastrowid

def add_ingredient_to_recipe(recipe_id, ingredient_id, quantity=1):
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
            INSERT OR REPLACE INTO RecipeIngredient (recipe_id, ingredient_id, quantity)
            VALUES (?, ?, ?)
        """, (recipe_id, ingredient_id, quantity))

def list_recipes(user_id):
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
            SELECT recipe_id, recipe_name, cooking_duration_sec
            FROM Recipe
            WHERE user_id=?;
        """, (user_id,))
        return cur.fetchall()

def get_recipe_details(recipe_id):
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

# --- PINBALL FUNKCE ---

def ensure_pinball_row(user_id):
    with connect() as con:
        cur = con.cursor()
        cur.execute("INSERT OR IGNORE INTO Pinball (user_id) VALUES (?)", (user_id,))

def get_pinball_state(user_id):
    """Vrátí kompletní stav: skóre, rekord, peníze a seznam předmětů na ploše."""
    with connect() as con:
        cur = con.cursor()
        # Načtení statistik
        cur.execute("SELECT score, record, money FROM Pinball WHERE user_id=?", (user_id,))
        row = cur.fetchone()
        stats = {"score": 0, "record": 0, "money": 0}
        if row:
            stats = {"score": row[0], "record": row[1], "money": row[2]}
        
        # Načtení předmětů
        cur.execute("SELECT item_id, type, x, y FROM PinballItem WHERE user_id=?", (user_id,))
        items = []
        for r in cur.fetchall():
            items.append({"id": r[0], "type": r[1], "x": r[2], "y": r[3]})
        
        return {**stats, "items": items}

def add_pinball_money(user_id, amount):
    """Přidá peníze (pro cheat nebo výhru)."""
    with connect() as con:
        cur = con.cursor()
        cur.execute("UPDATE Pinball SET money = money + ? WHERE user_id=?", (amount, user_id))
        cur.execute("SELECT money FROM Pinball WHERE user_id=?", (user_id,))
        return cur.fetchone()[0]

def add_pinball_points(user_id, points):
    """Přidá skóre a rovnou i peníze (1 bod = 1 peníz)."""
    with connect() as con:
        cur = con.cursor()
        cur.execute("UPDATE Pinball SET score = score + ?, money = money + ? WHERE user_id=?", (points, points, user_id))
        cur.execute("SELECT score, record, money FROM Pinball WHERE user_id=?", (user_id,))
        row = cur.fetchone()
        return {"score": row[0], "record": row[1], "money": row[2]}

def pinball_ball_lost(user_id):
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
            UPDATE Pinball
               SET record = CASE WHEN score > record THEN score ELSE record END,
                   score  = 0
             WHERE user_id=?""", (user_id,))
        cur.execute("SELECT score, record, money FROM Pinball WHERE user_id=?", (user_id,))
        row = cur.fetchone()
        return {"score": row[0], "record": row[1], "money": row[2]}

def buy_pinball_item(user_id, item_type, x, y, price):
    """Zkontroluje peníze, odečte je a vloží předmět."""
    with connect() as con:
        cur = con.cursor()
        # 1. Kontrola peněz
        cur.execute("SELECT money FROM Pinball WHERE user_id=?", (user_id,))
        row = cur.fetchone()
        current_money = row[0] if row else 0
        
        if current_money < price:
            return None # Nemá dost peněz
        
        # 2. Odečtení peněz
        cur.execute("UPDATE Pinball SET money = money - ? WHERE user_id=?", (price, user_id))
        
        # 3. Vložení předmětu
        cur.execute("INSERT INTO PinballItem (user_id, type, x, y) VALUES (?, ?, ?, ?)", (user_id, item_type, x, y))
        new_item_id = cur.lastrowid
        
        # 4. Vrácení nového stavu
        cur.execute("SELECT money FROM Pinball WHERE user_id=?", (user_id,))
        new_money = cur.fetchone()[0]
        
        return {"success": True, "money": new_money, "item": {"id": new_item_id, "type": item_type, "x": x, "y": y}}

def move_pinball_item(user_id, item_id, x, y):
    """Aktualizuje pozici předmětu."""
    with connect() as con:
        con.execute("UPDATE PinballItem SET x=?, y=? WHERE item_id=? AND user_id=?", (x, y, item_id, user_id))
        return True

def remove_pinball_item(user_id, item_id, refund_price):
    """Odstraní předmět a vrátí peníze."""
    with connect() as con:
        cur = con.cursor()
        # 1. Smazat
        cur.execute("DELETE FROM PinballItem WHERE item_id=? AND user_id=?", (item_id, user_id))
        if cur.rowcount > 0:
            # 2. Vrátit peníze
            cur.execute("UPDATE Pinball SET money = money + ? WHERE user_id=?", (refund_price, user_id))
            cur.execute("SELECT money FROM Pinball WHERE user_id=?", (user_id,))
            return {"success": True, "money": cur.fetchone()[0]}
        return {"success": False}

# --- FUNKCE PRO BRICK BREAKER ---

def ensure_breaker_row(user_id):
    with connect() as con:
        cur = con.cursor()
        cur.execute("INSERT OR IGNORE INTO BrickBreaker (user_id) VALUES (?)", (user_id,))

def get_breaker_stats(user_id):
    ensure_breaker_row(user_id)
    with connect() as con:
        cur = con.cursor()
        cur.execute("SELECT high_score FROM BrickBreaker WHERE user_id=?", (user_id,))
        row = cur.fetchone()
        return {"highScore": row[0] if row else 0}

def update_breaker_score(user_id, score):
    ensure_breaker_row(user_id)
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
            UPDATE BrickBreaker 
            SET high_score = ? 
            WHERE user_id=? AND ? > high_score
        """, (score, user_id, score))
        return get_breaker_stats(user_id)

def set_breaker_powerups(user_id: int, enabled: bool):
    ensure_breaker_row(user_id)
    with connect() as con:
        cur = con.cursor()
        val = 1 if enabled else 0
        cur.execute("UPDATE BrickBreaker SET powerups_enabled=? WHERE user_id=?", (val, user_id))
        return {"powerups_enabled": bool(enabled)}

def get_breaker_powerups(user_id: int):
    ensure_breaker_row(user_id)
    with connect() as con:
        cur = con.cursor()
        cur.execute("SELECT powerups_enabled FROM BrickBreaker WHERE user_id=?", (user_id,))
        row = cur.fetchone()
        val = row[0] if row else 0
        return {"powerups_enabled": bool(val)}

def get_breaker_progress(user_id: int):
    ensure_breaker_row(user_id)
    with connect() as con:
        cur = con.cursor()
        cur.execute("SELECT breaker_max_level FROM BrickBreaker WHERE user_id=?", (user_id,))
        row = cur.fetchone()
        val = row[0] if row else 0
        return {"maxUnlockedWorld": val}

def update_breaker_progress(user_id: int, new_level: int):
    ensure_breaker_row(user_id)
    with connect() as con:
        cur = con.cursor()
        cur.execute("""
            UPDATE BrickBreaker 
            SET breaker_max_level = ? 
            WHERE user_id=? AND ? > breaker_max_level
        """, (new_level, user_id, new_level))
        
    # FIX: We return the progress OUTSIDE the 'with' block.
    # This ensures the transaction above is committed before we read from the DB.
    return get_breaker_progress(user_id)

def save_pizza(user_id, pizza_name, pizza_json):
    with connect() as con:
        cur = con.cursor()
        cur.execute(
            "INSERT INTO SavedPizza (pizza_name, pizza_data, user_id) VALUES (?, ?, ?)",
            (pizza_name, pizza_json, user_id)
        )
        return cur.lastrowid

def list_saved_pizzas(user_id):
    with connect() as con:
        cur = con.cursor()
        cur.execute("SELECT pizza_id, pizza_name, pizza_data, created_at FROM SavedPizza WHERE user_id=? ORDER BY created_at DESC", (user_id,))
        rows = cur.fetchall()
        return [ {"pizza_id": r[0], "pizza_name": r[1], "pizza_data": r[2], "created_at": r[3]} for r in rows ]

def get_saved_pizza(pizza_id):
    with connect() as con:
        cur = con.cursor()
        cur.execute("SELECT pizza_id, pizza_name, pizza_data, user_id, created_at FROM SavedPizza WHERE pizza_id=?", (pizza_id,))
        r = cur.fetchone()
        if not r:
            return None
        return {"pizza_id": r[0], "pizza_name": r[1], "pizza_data": r[2], "user_id": r[3], "created_at": r[4]}