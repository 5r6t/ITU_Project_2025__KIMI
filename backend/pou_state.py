from inventory import Inventory # Import třídy Inventory

class PouState:
    def __init__(self):
        self.hunger = 50
        self.clean = 80
        self.energy = 60
        self.inventory = Inventory() # Inicializace inventáře

    def feed(self):
        # Původní logika: Pouze pro krmení Sýrem/základní potravou
        self.hunger = min(100, self.hunger + 20)
        self.clean = max(0, self.clean - 5)
        
    def use_item(self, item_id):
        """Použije položku z inventáře a aplikuje její efekty."""
        effect = self.inventory.use_item(item_id)
        
        if effect:
            if "hunger" in effect:
                self.hunger = min(100, self.hunger + effect["hunger"])
            if "clean" in effect:
                self.clean = max(0, min(100, self.clean + effect["clean"]))
            if "energy" in effect:
                self.energy = min(100, self.energy + effect["energy"])
            return True
        return False


    def to_dict(self):
        return {
            "hunger": self.hunger,
            "clean": self.clean,
            "energy": self.energy
        }
