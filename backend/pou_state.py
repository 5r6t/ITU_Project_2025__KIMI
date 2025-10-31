class PouState:
    def __init__(self):
        self.hunger = 50
        self.clean = 80
        self.energy = 60

    def feed(self):
        self.hunger = min(100, self.hunger + 20)
        self.clean = max(0, self.clean - 5)

    def to_dict(self):
        return {
            "hunger": self.hunger,
            "clean": self.clean,
            "energy": self.energy
        }
