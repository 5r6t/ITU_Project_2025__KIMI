class Inventory:
    def __init__(self):
        # Základní inventář s několika položkami
        self.items = [
            {"id": 1, "name": "Cheese", "quantity": 12, "type": "food", "effect": {"hunger": 20, "clean": -5}},
            {"id": 2, "name": "Cheese", "quantity": 12, "type": "food", "effect": {"hunger": 20, "clean": -5}},
            {"id": 3, "name": "Soap", "quantity": 5, "type": "potion", "effect": {"clean": 30}},
            {"id": 4, "name": "Energy Drink", "quantity": 3, "type": "potion", "effect": {"energy": 40}},
        ]
        
    def get_items(self):
        """Vrátí aktuální obsah inventáře."""
        return self.items

    def use_item(self, item_id):
        """Použije položku z inventáře."""
        try:
            item_id = int(item_id)
        except ValueError:
            return None # Neplatné ID

        for item in self.items:
            if item["id"] == item_id and item["quantity"] > 0:
                item["quantity"] -= 1
                return item["effect"]

        return None # Položka nenalezena nebo není k dispozici

    def to_dict(self):
        """Převádí data inventáře do slovníku pro JSON serializaci."""
        return {"items": self.items}