# Project "Rover Explorer" Design Document

## 1. High-Level Concept

Project "Rover Explorer" is a grid-based, roguelike exploration game. Players iteratively design procedurally generated worlds, customize a rover tailored to those worlds, explore within a limited energy budget, and reinvest recovered resources into future upgrades. Mastery stems from understanding how world-generation rules influence terrain and resource placement rather than from reflex-driven play.

## 2. Core Gameplay Loop

1. **Hangar (Meta-Progression Hub):** Spend recovered resources to research, unlock, and purchase rover components and additional world-generation parameters.
2. **World Configuration:** Adjust world parameters—initially basic sliders such as Age and Temperature, expanding over time—to determine the next planet's conditions.
3. **Rover Configuration:** Assemble the rover by selecting unlocked modules (locomotion, power, cargo, utilities) that best address the chosen world parameters.
4. **The Expedition:** Deploy into the generated grid. Reveal tiles, collect resources, and observe environmental patterns while managing the rover's finite energy.
5. **End of Run & Return:** When energy is exhausted, bank gathered resources and knowledge, then return to the Hangar to begin the loop anew.

## 3. Key Systems & Mechanics

### 3.1 Procedural World Generation

* **Player-Controlled Parameters:**
  * **Geological Age:** New worlds feature jagged peaks and volcanic activity; old worlds are flatter with eroded landscapes and broad river deltas.
  * **Climate Sliders:** Temperature (Hot ↔ Cold) and Humidity (Dry ↔ Wet) combine to establish the world's climate profile.
* **Layered Generation Pipeline:**
  1. **Geological Layer:** Establish baseline elevation, chasms, and mountains influenced by the Age parameter.
  2. **Hydrological Simulation:** Apply long-term weathering using climate sliders to carve rivers, lakes, and erosion patterns.
  3. **Biome Assignment:** Determine biome per tile based on final elevation, temperature, and humidity (e.g., Cold + Flat + Dry → Tundra; Hot + Wet + Old → Dense Jungle).
* **Resource Distribution:** Resources spawn according to deterministic rules tied to geology and biomes (e.g., iron near ancient riverbeds, rare crystals in old, rain-swept regions). Players learn these correlations over repeated runs, reducing reliance on scanners.

### 3.2 Rover Customization

* **Component Slots:**
  * **Locomotion:** Wheels excel on plains but struggle in jungles; treads ("Larva Feet") are slower overall yet reliable on rough or dense terrain.
  * **Power Source:** Controls starting energy; larger batteries extend expeditions but may introduce trade-offs such as weight or reduced cargo.
  * **Cargo Hold:** Sets the number of resource units the rover can extract before needing to return.
  * **Utility/Sensors:** Optional modules such as resource scanners or enhanced vision suites augment exploration.
* **Progression:** Start with basic modules; unlock advanced parts in the Hangar by spending expedition resources.

### 3.3 Exploration & Movement

* **Grid-Based Map:** Navigate tile by tile.
* **Energy Costs:** Moving or acting consumes energy based on terrain type and locomotion module.
* **High Mobility & Vision:** The rover boasts a generous sight radius (~10+ tiles) and substantial movement range to emphasize swift reconnaissance and discovery over slow tactical play.
* **Exploration Rewards:** Revealing tiles grants exploration points, reinforcing the incentive to scout efficiently.

## 4. Player Experience & Motivation

* **Joy of Discovery:** Core appeal is uncovering the unknown and mapping emergent worlds.
* **Knowledge as Power:** Players leverage learned generation rules to plan future runs, enabling smarter component choices.
* **Overcoming Challenges:** Revisiting previously daunting worlds with improved gear (e.g., swapping wheels for treads) delivers tangible progression.
* **Strategic Planning:** Success hinges on aligning rover builds with anticipated world challenges, turning preparation into a satisfying puzzle.

## 5. Art Style & Presentation

* **Abstract & Functional:** Clean, symbolic visuals—potentially ASCII-inspired—prioritize readability of terrain, resources, and status information.
* **Top-Down Perspective:** 2D overhead view complements the grid-based layout.
* **UI/UX Focus:** Clear interfaces for world and rover configuration ensure players can grasp strategic implications of their choices quickly.
