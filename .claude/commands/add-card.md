# Add Card Command

Add a new card to the Naruto Mythos database.

## Usage
`/add-card [card details]`

## Instructions

When invoked, follow these steps:

1. **Parse the card details** from the user input. Expected format:
   - ID (e.g., KS-042)
   - English name
   - French name
   - Type (CHARACTER / MISSION / JUTSU)
   - Rarity (C / UC / R / AR / S / L)
   - Chakra cost (for CHARACTER/JUTSU)
   - Power (for CHARACTER)
   - Keywords (comma-separated)
   - Group/Village
   - Effect (EN)
   - Effect (FR)

2. **Validate** the card data:
   - ID must follow format `{SET}-{NUMBER}` (e.g., KS-042)
   - ID must not already exist in the database
   - Type must be a valid CardType enum value
   - Rarity must be a valid Rarity enum value
   - CHARACTER cards must have chakra and power
   - All text fields must have both EN and FR versions

3. **Add to seed data** in `prisma/data/cards.json`

4. **Add to database** by running:
   ```bash
   pnpm db:seed
   ```

5. **Verify** by running:
   ```bash
   pnpm typecheck && pnpm lint
   ```

6. **Report** the result to the user with the card details.

## Example
```
/add-card KS-042 "Rock Lee" "Rock Lee" CHARACTER UC 2 2000 ["Taijutsu","Genin"] "Leaf Village" "When attacking: +1000 Power this turn." "Lors de l'attaque : +1000 Puissance ce tour."
```
