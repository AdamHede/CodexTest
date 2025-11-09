const GRID_SIZE = 100;
const BASE_MOVE_COST = 4;
const BASE_VISION = 1;
const BASE_FUNDING = 180;

const BIOME_LABELS = {
  plain: "Plain",
  mountain: "Ridge",
  desert: "Dune",
  jungle: "Jungle",
  tundra: "Tundra",
  swamp: "Swamp",
  lava: "Lava",
  ocean: "Ocean",
  river: "River"
};

const BIOME_CODES = {
  plain: "PL",
  mountain: "MT",
  desert: "DS",
  jungle: "JG",
  tundra: "TD",
  swamp: "SW",
  lava: "LV",
  ocean: "OC",
  river: "RV"
};

const BIOME_COLORS = {
  plain: "#6e8fff",
  mountain: "#5c647f",
  desert: "#d6b267",
  jungle: "#4d7a59",
  tundra: "#7f9bb7",
  swamp: "#556f58",
  lava: "#aa302f",
  ocean: "#37598d",
  river: "#4a7fb3"
};

const RESOURCE_VALUES = {
  none: 0,
  iron: 12,
  crystal: 18,
  bio: 9
};

const RESOURCE_LABELS = {
  none: "None detected",
  iron: "Iron ore",
  crystal: "Crystalline deposits",
  bio: "Organic samples"
};

const locomotionModules = [
  {
    id: "wheels",
    name: "All-Terrain Wheels",
    description: "Balanced movers. Efficient on plains and dunes but slowed in deep jungle and swamps.",
    baseMultiplier: 1,
    cost: 0,
    modifiers: {
      jungle: 1.2,
      swamp: 1.25,
      mountain: 1.3,
      lava: 2.2,
      ocean: Infinity
    }
  },
  {
    id: "treads",
    name: "Larva Treads",
    description: "Heavy treads shrug off rough or icy ground at the cost of higher baseline energy use.",
    baseMultiplier: 1.2,
    cost: 35,
    modifiers: {
      mountain: 0.85,
      tundra: 0.85,
      jungle: 0.95,
      lava: 1.5,
      ocean: Infinity
    }
  },
  {
    id: "skimmer",
    name: "Hydro Skimmer",
    description: "Hovercraft that glides over water and wetlands. Struggles in steep or rocky terrain.",
    baseMultiplier: 1.15,
    cost: 45,
    modifiers: {
      swamp: 0.7,
      ocean: 0.65,
      river: 0.65,
      mountain: 1.8,
      lava: Infinity
    }
  }
];

const powerModules = [
  {
    id: "compact",
    name: "Compact Core",
    description: "Reliable power pack suited for short sorties.",
    energy: 120,
    cost: 0
  },
  {
    id: "expansion",
    name: "Expansion Cells",
    description: "Additional battery racks that extend the mission clock.",
    energy: 165,
    cost: 30
  },
  {
    id: "fusion",
    name: "Fusion Capsule",
    description: "Prototype power plant enabling long-range expeditions.",
    energy: 210,
    cost: 55
  }
];

const cargoModules = [
  {
    id: "satchel",
    name: "Survey Satchel",
    description: "Lightweight container that fits a handful of samples.",
    capacity: 5,
    cost: 0
  },
  {
    id: "bay",
    name: "Modular Cargo Bay",
    description: "Balanced hold for extended runs without overburdening the rover.",
    capacity: 8,
    cost: 20
  },
  {
    id: "vault",
    name: "Cryo Vault",
    description: "Cryogenic vault for delicate resources. Heavy but cavernous.",
    capacity: 11,
    cost: 45
  }
];

const utilityModules = [
  {
    id: "none",
    name: "Basic Optics",
    description: "Standard sensors with limited range.",
    visionBonus: 0,
    scanRange: 0,
    scanCost: 0,
    resourceBonus: 0,
    cost: 0
  },
  {
    id: "scanner",
    name: "Survey Scanner",
    description: "Reveal a larger area and ping nearby terrain using focused scans.",
    visionBonus: 1,
    scanRange: 2,
    scanCost: 6,
    resourceBonus: 0,
    cost: 25
  },
  {
    id: "excavator",
    name: "Excavation Arm",
    description: "Automated sampling arm that extracts cleaner yields from deposits.",
    visionBonus: 0,
    scanRange: 1,
    scanCost: 5,
    resourceBonus: 3,
    cost: 30
  }
];

const tileDifficulty = {
  plain: 1,
  desert: 1.15,
  jungle: 1.4,
  tundra: 1.35,
  swamp: 1.45,
  mountain: 1.75,
  lava: 2.2,
  ocean: 1.5,
  river: 1.25
};

const sliders = [
  { input: document.getElementById("ageSlider"), value: document.getElementById("ageValue") },
  { input: document.getElementById("temperatureSlider"), value: document.getElementById("temperatureValue") },
  { input: document.getElementById("humiditySlider"), value: document.getElementById("humidityValue") }
];

const selects = {
  locomotion: document.getElementById("locomotionSelect"),
  power: document.getElementById("powerSelect"),
  cargo: document.getElementById("cargoSelect"),
  utility: document.getElementById("utilitySelect")
};

const hints = {
  locomotion: document.getElementById("locomotionHint"),
  power: document.getElementById("powerHint"),
  cargo: document.getElementById("cargoHint"),
  utility: document.getElementById("utilityHint")
};

const mapElement = document.getElementById("map");
const legendElement = document.getElementById("legend");
const launchButton = document.getElementById("launchButton");
const collectButton = document.getElementById("collectButton");
const statusMessage = document.getElementById("statusMessage");
const endButton = document.getElementById("endButton");
const controlButtons = Array.from(document.querySelectorAll(".dpad button"));
const moveButton = document.getElementById("moveButton");
const addResourcesButton = document.getElementById("addResources");
const addCreditsButton = document.getElementById("addCredits");
const refillEnergyButton = document.getElementById("refillEnergy");

const tileSummary = document.getElementById("tileSummary");
const tileBiome = document.getElementById("tileBiome");
const tileResource = document.getElementById("tileResource");
const tileDistance = document.getElementById("tileDistance");
const tileCost = document.getElementById("tileCost");

const budgetValue = document.getElementById("budgetValue");

const energyStat = document.getElementById("energyStat");
const cargoStat = document.getElementById("cargoStat");
const resourcesStat = document.getElementById("resourcesStat");
const creditsStat = document.getElementById("creditsStat");
const explorationStat = document.getElementById("explorationStat");

const state = {
  grid: [],
  tiles: [],
  running: false,
  position: { x: 0, y: 0 },
  energy: 0,
  maxEnergy: 0,
  cargo: 0,
  cargoCapacity: 0,
  resources: 0,
  exploration: 0,
  credits: BASE_FUNDING,
  totalFunding: BASE_FUNDING,
  inspectedTile: null,
  modules: {
    locomotion: locomotionModules[0],
    power: powerModules[0],
    cargo: cargoModules[0],
    utility: utilityModules[0]
  },
  world: {
    age: 50,
    temperature: 50,
    humidity: 50,
    legend: new Map()
  }
};

function initialise() {
  sliders.forEach(({ input, value }) => {
    value.textContent = input.value;
    input.addEventListener("input", () => {
      value.textContent = input.value;
    });
  });

  populateSelect(selects.locomotion, locomotionModules);
  populateSelect(selects.power, powerModules);
  populateSelect(selects.cargo, cargoModules);
  populateSelect(selects.utility, utilityModules);

  launchButton.addEventListener("click", launchExpedition);
  collectButton.addEventListener("click", collectResource);
  endButton.addEventListener("click", endExpedition);
  moveButton.addEventListener("click", moveToInspectedTile);
  addResourcesButton.addEventListener("click", () => grantResources(50));
  addCreditsButton.addEventListener("click", () => grantCredits(40));
  refillEnergyButton.addEventListener("click", refillMissionEnergy);

  controlButtons.forEach(button => {
    button.addEventListener("click", () => {
      const direction = button.dataset.direction;
      if (direction === "scan") {
        performScan();
      } else {
        moveRover(direction);
      }
    });
  });

  updateUIStates(false);
  syncCreditsWithLoadout();
  updateInspector(null);
}

function populateSelect(selectElement, modules) {
  const slot = selectElement.id.replace("Select", "");
  selectElement.innerHTML = "";
  modules.forEach(module => {
    const option = document.createElement("option");
    option.value = module.id;
    option.textContent = `${module.name} — ${module.cost}¢`;
    selectElement.append(option);
  });

  const defaultModule = modules[0];
  selectElement.value = defaultModule.id;
  state.modules[slot] = defaultModule;
  updateModuleHint(slot, defaultModule);

  selectElement.addEventListener("change", () => {
    const selectedModule = modules.find(module => module.id === selectElement.value);
    handleModuleSelection(slot, selectedModule, selectElement);
  });
}

function updateModuleHint(slot, module) {
  hints[slot].textContent = `${module.description} Cost: ${module.cost} credits.`;
}

function handleModuleSelection(slot, selectedModule, selectElement) {
  const previousModule = state.modules[slot];
  state.modules[slot] = selectedModule;
  const spent = calculateLoadoutCost();
  if (spent > state.totalFunding) {
    state.modules[slot] = previousModule;
    selectElement.value = previousModule.id;
    updateModuleHint(slot, previousModule);
    setStatus(`Budget exceeded by ${spent - state.totalFunding} credits. Add funding or choose a cheaper module.`);
    return;
  }
  updateModuleHint(slot, selectedModule);
  syncCreditsWithLoadout();
}

function calculateLoadoutCost() {
  return Object.values(state.modules).reduce((total, module) => total + (module?.cost ?? 0), 0);
}

function syncCreditsWithLoadout() {
  const remaining = Math.max(0, state.totalFunding - calculateLoadoutCost());
  state.credits = remaining;
  updateBudgetDisplay();
  updateStats();
}

function updateBudgetDisplay() {
  if (!budgetValue) return;
  const remaining = Math.max(0, state.totalFunding - calculateLoadoutCost());
  budgetValue.textContent = `${remaining}`;
}

function grantResources(amount) {
  state.resources += amount;
  updateStats();
  setStatus(`Testing: granted ${amount} resource units.`);
}

function grantCredits(amount) {
  state.totalFunding += amount;
  syncCreditsWithLoadout();
  setStatus(`Testing: outfitting budget increased by ${amount} credits.`);
}

function refillMissionEnergy() {
  if (!state.running) {
    setStatus("No active expedition. Launch to activate the rover before refilling energy.");
    return;
  }
  state.energy = state.maxEnergy;
  updateStats();
  setStatus("Testing: rover energy fully replenished.");
  inspectTile(getCurrentTile());
}

function moveToInspectedTile() {
  if (!state.running || !state.inspectedTile) return;
  const tile = state.inspectedTile;
  const dx = tile.x - state.position.x;
  const dy = tile.y - state.position.y;
  if (Math.abs(dx) + Math.abs(dy) !== 1) {
    setStatus("Select an adjacent tile to move the rover.");
    return;
  }
  const direction = dx === 1 ? "right" : dx === -1 ? "left" : dy === 1 ? "down" : "up";
  moveRover(direction);
}

function inspectTile(tile) {
  state.inspectedTile = tile;
  updateInspector(tile);
}

function updateInspector(tile) {
  if (!tile) {
    tileSummary.textContent = "Tap a charted tile to inspect its biome and hazards.";
    tileBiome.textContent = "—";
    tileResource.textContent = "—";
    tileDistance.textContent = "—";
    tileCost.textContent = "—";
    moveButton.disabled = true;
    updateTileStates();
    return;
  }

  const discovered = tile.discovered;
  const currentTile = state.running ? getCurrentTile() : null;
  if (!discovered) {
    tileSummary.textContent = "Sensors have not mapped this region yet.";
    tileBiome.textContent = "Unknown";
    tileResource.textContent = "Unknown";
    tileDistance.textContent = `${Math.abs(tile.x - state.position.x) + Math.abs(tile.y - state.position.y)} tiles`;
    tileCost.textContent = "?";
    moveButton.disabled = true;
  } else {
    const distance = Math.abs(tile.x - state.position.x) + Math.abs(tile.y - state.position.y);
    const cost = calculateMovementCost(tile);
    tileSummary.textContent = tile === currentTile ? "Rover location." : "Projected traversal data ready.";
    tileBiome.textContent = BIOME_LABELS[tile.biome] ?? tile.biome;
    const resourceLabel = RESOURCE_LABELS[tile.resource] ?? tile.resource;
    tileResource.textContent = resourceLabel;
    tileDistance.textContent = `${distance} tile${distance === 1 ? "" : "s"}`;
    tileCost.textContent = Number.isFinite(cost) ? `${cost} energy` : "Impassable";
    const canMove = state.running && distance === 1 && Number.isFinite(cost) && state.energy >= cost;
    moveButton.disabled = !canMove;
  }

  updateTileStates();
}

function launchExpedition() {
  if (calculateLoadoutCost() > state.totalFunding) {
    setStatus('Cannot launch while outfitting budget is exceeded.');
    return;
  }

  const age = Number(selectors.ageSlider.value);
  const temperature = Number(selectors.temperatureSlider.value);
  const humidity = Number(selectors.humiditySlider.value);

  state.world = { age, temperature, humidity, legend: new Map() };

  state.modules.locomotion = locomotionModules.find(module => module.id === selects.locomotion.value);
  state.modules.power = powerModules.find(module => module.id === selects.power.value);
  state.modules.cargo = cargoModules.find(module => module.id === selects.cargo.value);
  state.modules.utility = utilityModules.find(module => module.id === selects.utility.value);
  syncCreditsWithLoadout();

  state.energy = state.modules.power.energy;
  state.maxEnergy = state.modules.power.energy;
  state.cargo = 0;
  state.cargoCapacity = state.modules.cargo.capacity;
  state.resources = 0;
  state.exploration = 0;
  state.running = true;

  const generation = generateWorld(age, temperature, humidity);
  state.grid = generation.grid;
  state.tiles = generation.tiles;
  state.world.legend = generation.legend;
  state.position = { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) };
  state.inspectedTile = null;

  renderLegend(state.world.legend);
  buildMap();
  revealArea(state.position.x, state.position.y, BASE_VISION + state.modules.utility.visionBonus);
  inspectTile(getCurrentTile());
  updateStats();
  updateUIStates(true);
  setStatus("Expedition launched. Chart the unknown and recover resources.");
}

const selectors = {
  get ageSlider() {
    return document.getElementById("ageSlider");
  },
  get temperatureSlider() {
    return document.getElementById("temperatureSlider");
  },
  get humiditySlider() {
    return document.getElementById("humiditySlider");
  }
};

function generateWorld(age, temperature, humidity) {
  const grid = [];
  const tiles = [];
  const legend = new Map();
  const seed = Math.floor(Date.now() + age * 31 + temperature * 97 + humidity * 131);
  const ageNorm = age / 100;
  const tempNorm = temperature / 100;
  const humidityNorm = humidity / 100;

  const elevationField = [];
  const moistureField = [];
  const temperatureField = [];

  for (let y = 0; y < GRID_SIZE; y += 1) {
    const elevationRow = [];
    const moistureRow = [];
    const temperatureRow = [];
    const latitude = y / (GRID_SIZE - 1);
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const reliefScale = 1.4 + (1 - ageNorm) * 1.1;
      const elevationNoise = layeredNoise(x, y, reliefScale, seed);
      const elevation = Math.pow(elevationNoise, 0.65 + ageNorm * 0.7);

      const moistureNoise = layeredNoise(x + 13, y + 7, 1.45, seed * 0.7 + 113);
      const equatorMoistureBias = 1 - Math.abs(latitude - 0.5) * 1.2;
      const moisture = clamp(humidityNorm * 0.45 + moistureNoise * 0.55 + equatorMoistureBias * 0.08, 0, 1);

      const tempNoise = layeredNoise(x + 3, y + 19, 0.95, seed * 1.1 + 37);
      const polarBias = Math.abs(latitude - 0.5);
      const temperatureValue = clamp(tempNorm * 0.5 + tempNoise * 0.45 + (1 - polarBias) * 0.12 - polarBias * 0.15, 0, 1);

      elevationRow.push(elevation);
      moistureRow.push(moisture);
      temperatureRow.push(temperatureValue);
    }
    elevationField.push(elevationRow);
    moistureField.push(moistureRow);
    temperatureField.push(temperatureRow);
  }

  const seaLevel = 0.23 - ageNorm * 0.04 + (0.5 - humidityNorm) * 0.03;
  const oceanMask = floodFillOceans(elevationField, seaLevel);
  const ridgeField = buildRidgeField(elevationField, seed);

  let biomeGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill("plain"));

  for (let y = 0; y < GRID_SIZE; y += 1) {
    const latitude = y / (GRID_SIZE - 1);
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const elevation = elevationField[y][x];
      const moisture = moistureField[y][x];
      const tempValue = temperatureField[y][x];
      const nearOcean = hasOceanNeighbor(oceanMask, x, y);

      let biome = "plain";
      if (oceanMask[y][x]) {
        biome = "ocean";
      } else if (ridgeField[y][x] > 1.18) {
        biome = "mountain";
      } else if (elevation > 0.84 && tempValue > 0.6 && ageNorm < 0.45) {
        biome = "lava";
      } else if (elevation <= seaLevel + 0.02 && (nearOcean || moisture > 0.68)) {
        biome = "river";
      } else if (moisture > 0.75 && tempValue > 0.58) {
        biome = "jungle";
      } else if (moisture > 0.7 && (nearOcean || elevation < seaLevel + 0.08)) {
        biome = "swamp";
      } else if (tempValue < 0.3 || latitude < 0.12 || latitude > 0.88) {
        biome = "tundra";
      } else if (moisture < 0.28 && tempValue > 0.52) {
        biome = "desert";
      }

      biomeGrid[y][x] = biome;
    }
  }

  biomeGrid = smoothBiomes(biomeGrid, new Set(["ocean", "mountain", "lava"]));
  carveRivers(biomeGrid, elevationField, moistureField, seaLevel, oceanMask);
  spreadWetlands(biomeGrid, moistureField, oceanMask);

  for (let y = 0; y < GRID_SIZE; y += 1) {
    const row = [];
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const biome = oceanMask[y][x] ? "ocean" : biomeGrid[y][x];
      const elevation = elevationField[y][x];
      const moisture = moistureField[y][x];
      const tempValue = temperatureField[y][x];
      const tile = {
        x,
        y,
        biome,
        resource: determineResource(biome, moisture, elevation, tempValue, seed, x, y),
        discovered: false,
        element: null
      };
      row.push(tile);
      tiles.push(tile);
      legend.set(tile.biome, (legend.get(tile.biome) ?? 0) + 1);
    }
    grid.push(row);
  }

  return { grid, tiles, legend };
}

function layeredNoise(x, y, scale, seed) {
  const nx = (x / GRID_SIZE) * scale;
  const ny = (y / GRID_SIZE) * scale;
  const a = noise(nx, ny, seed);
  const b = noise(nx * 2.7, ny * 2.7, seed + 71) * 0.5;
  const c = noise(nx * 5.1, ny * 5.1, seed + 143) * 0.25;
  return Math.min(1, Math.max(0, (a + b + c) / 1.75));
}

function noise(x, y, seed) {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 0.01) * 43758.5453;
  return s - Math.floor(s);
}

function determineResource(biome, moisture, elevation, tempValue, seed, x, y) {
  const chanceNoise = noise(x + 11.3, y + 17.9, seed + 311);
  if (biome === "mountain" && chanceNoise > 0.68) {
    return "crystal";
  }
  if (biome === "lava" && chanceNoise > 0.54) {
    return "crystal";
  }
  if ((biome === "river" || biome === "ocean") && chanceNoise > 0.76) {
    return "bio";
  }
  if (biome === "jungle" && chanceNoise > 0.6) {
    return "bio";
  }
  if (biome === "plain" && chanceNoise > 0.7) {
    return moisture < 0.45 ? "iron" : "bio";
  }
  if (biome === "desert" && chanceNoise > 0.64) {
    return "iron";
  }
  if (biome === "tundra" && chanceNoise > 0.66) {
    return "iron";
  }
  return "none";
}

function floodFillOceans(elevationField, seaLevel) {
  const mask = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
  const visited = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
  const queue = [];
  let head = 0;
  const threshold = seaLevel + 0.035;

  for (let x = 0; x < GRID_SIZE; x += 1) {
    if (!visited[0][x] && elevationField[0][x] <= seaLevel) {
      queue.push({ x, y: 0 });
      visited[0][x] = true;
    }
    if (!visited[GRID_SIZE - 1][x] && elevationField[GRID_SIZE - 1][x] <= seaLevel) {
      queue.push({ x, y: GRID_SIZE - 1 });
      visited[GRID_SIZE - 1][x] = true;
    }
  }

  for (let y = 0; y < GRID_SIZE; y += 1) {
    if (!visited[y][0] && elevationField[y][0] <= seaLevel) {
      queue.push({ x: 0, y });
      visited[y][0] = true;
    }
    if (!visited[y][GRID_SIZE - 1] && elevationField[y][GRID_SIZE - 1] <= seaLevel) {
      queue.push({ x: GRID_SIZE - 1, y });
      visited[y][GRID_SIZE - 1] = true;
    }
  }

  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  while (head < queue.length) {
    const { x, y } = queue[head];
    head += 1;
    mask[y][x] = true;
    directions.forEach(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) {
        return;
      }
      if (visited[ny][nx]) {
        return;
      }
      if (elevationField[ny][nx] <= threshold) {
        visited[ny][nx] = true;
        queue.push({ x: nx, y: ny });
      }
    });
  }

  return mask;
}

function hasOceanNeighbor(oceanMask, x, y) {
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) continue;
      if (oceanMask[ny][nx]) return true;
    }
  }
  return false;
}

function buildRidgeField(elevationField, seed) {
  const ridgeField = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    const row = [];
    const latitude = y / (GRID_SIZE - 1);
    const latBand = Math.exp(-Math.pow((latitude - 0.25) / 0.18, 2)) + Math.exp(-Math.pow((latitude - 0.75) / 0.2, 2));
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const ridgeNoise = layeredNoise(x + 71, y + 91, 0.55, seed * 1.37 + 211);
      const plateNoise = layeredNoise(x + 191, y + 17, 0.35, seed * 0.93 + 503);
      const base = elevationField[y][x] * 1.1 + ridgeNoise * 0.3 + plateNoise * 0.2 + latBand * 0.35;
      row.push(base);
    }
    ridgeField.push(row);
  }
  return ridgeField;
}

function smoothBiomes(grid, preserve) {
  let working = grid.map(row => row.slice());
  for (let iteration = 0; iteration < 2; iteration += 1) {
    const snapshot = working.map(row => row.slice());
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        const current = snapshot[y][x];
        if (preserve.has(current)) continue;
        const counts = new Map();
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) continue;
            const biome = snapshot[ny][nx];
            counts.set(biome, (counts.get(biome) ?? 0) + 1);
          }
        }
        let bestBiome = current;
        let bestCount = counts.get(current) ?? 0;
        counts.forEach((count, biome) => {
          if (count > bestCount && !preserve.has(biome)) {
            bestBiome = biome;
            bestCount = count;
          }
        });
        working[y][x] = bestBiome;
      }
    }
  }
  return working;
}

function carveRivers(biomeGrid, elevationField, moistureField, seaLevel, oceanMask) {
  const candidates = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (oceanMask[y][x]) continue;
      const elevation = elevationField[y][x];
      const moisture = moistureField[y][x];
      if (elevation > seaLevel + 0.05 && moisture > 0.74) {
        candidates.push({ x, y, score: moisture + elevation });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const riverCount = Math.max(4, Math.floor(GRID_SIZE / 12));

  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  for (let i = 0; i < Math.min(riverCount, candidates.length); i += 1) {
    let { x, y } = candidates[i];
    const visited = new Set();
    let steps = 0;
    while (steps < GRID_SIZE * 3) {
      const key = `${x},${y}`;
      if (visited.has(key)) break;
      visited.add(key);

      if (!oceanMask[y][x] && biomeGrid[y][x] !== "mountain" && biomeGrid[y][x] !== "lava") {
        biomeGrid[y][x] = "river";
      }
      if (oceanMask[y][x] || elevationField[y][x] <= seaLevel) {
        break;
      }

      let next = null;
      let lowest = elevationField[y][x];
      directions.forEach(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return;
        const neighborElevation = elevationField[ny][nx];
        if (neighborElevation < lowest || oceanMask[ny][nx]) {
          lowest = neighborElevation;
          next = { x: nx, y: ny };
        }
      });

      if (!next) {
        break;
      }
      x = next.x;
      y = next.y;
      steps += 1;
    }
  }
}

function spreadWetlands(biomeGrid, moistureField, oceanMask) {
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (biomeGrid[y][x] !== "plain") continue;
      if (moistureField[y][x] < 0.63) continue;
      const nearWater = hasOceanNeighbor(oceanMask, x, y) || hasNeighborBiome(biomeGrid, x, y, "river");
      if (nearWater) {
        biomeGrid[y][x] = "swamp";
      }
    }
  }
}

function hasNeighborBiome(grid, x, y, biome) {
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) continue;
      if (grid[ny][nx] === biome) return true;
    }
  }
  return false;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function buildMap() {
  mapElement.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const tileSize = Math.max(6, Math.floor(520 / GRID_SIZE));
  mapElement.style.setProperty("--grid-size", GRID_SIZE);
  mapElement.style.setProperty("--tile-size", `${tileSize}px`);
  state.grid.forEach(row => {
    row.forEach(tile => {
      const tileElement = document.createElement("div");
      tileElement.className = "tile";
      tileElement.dataset.state = "hidden";
      tileElement.dataset.biome = tile.biome;
      tileElement.dataset.resource = "none";
      tileElement.dataset.inspected = "false";
      tileElement.textContent = "";
      tile.element = tileElement;
      tileElement.addEventListener("click", () => handleTileTap(tile));
      fragment.append(tileElement);
    });
  });
  mapElement.append(fragment);
}

function handleTileTap(tile) {
  if (!state.running) return;
  inspectTile(tile);
}

function revealArea(cx, cy, radius) {
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) continue;
      revealTile(x, y);
    }
  }
  updateTileStates();
}

function revealTile(x, y) {
  const tile = state.grid[y][x];
  if (!tile.discovered) {
    tile.discovered = true;
    state.exploration += 1;
  }
  tile.element.dataset.state = "revealed";
  tile.element.textContent = BIOME_CODES[tile.biome] ?? tile.biome.slice(0, 2).toUpperCase();
}

function updateTileStates() {
  state.grid.forEach(row => {
    row.forEach(tile => {
      const isCurrent = state.running && tile === getCurrentTile();
      const isInspected = state.inspectedTile === tile;
      if (!tile.discovered) {
        tile.element.dataset.state = "hidden";
        tile.element.textContent = "";
        tile.element.dataset.resource = "none";
      } else {
        tile.element.textContent = BIOME_CODES[tile.biome] ?? tile.biome.slice(0, 2).toUpperCase();
        tile.element.dataset.state = isCurrent ? "current" : "revealed";
        tile.element.dataset.resource = tile.resource;
      }
      tile.element.dataset.inspected = isInspected ? "true" : "false";
    });
  });
}

function getCurrentTile() {
  return state.grid[state.position.y][state.position.x];
}

function moveRover(direction) {
  if (!state.running) return;
  const deltas = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 }
  };

  const delta = deltas[direction];
  if (!delta) return;

  const targetX = state.position.x + delta.dx;
  const targetY = state.position.y + delta.dy;

  if (targetX < 0 || targetY < 0 || targetX >= GRID_SIZE || targetY >= GRID_SIZE) {
    setStatus("The rover's navigation suite warns of sheer cliffs. Choose another path.");
    return;
  }

  const targetTile = state.grid[targetY][targetX];
  const cost = calculateMovementCost(targetTile);
  if (!Number.isFinite(cost)) {
    setStatus("The rover cannot traverse that terrain with the current locomotion module.");
    return;
  }

  if (state.energy < cost) {
    setStatus("Insufficient energy reserves for that maneuver.");
    return;
  }

  state.energy -= cost;
  state.position = { x: targetX, y: targetY };
  revealArea(targetX, targetY, BASE_VISION + state.modules.utility.visionBonus);
  inspectTile(targetTile);
  updateStats();
  describeTile(targetTile);

  if (state.energy <= 0) {
    setStatus("Energy depleted. The expedition must return home.");
    endExpedition();
  }
}

function calculateMovementCost(tile) {
  const locomotion = state.modules.locomotion;
  const biomeModifier = locomotion.modifiers[tile.biome] ?? 1;
  const difficulty = tileDifficulty[tile.biome] ?? 1.1;
  return Math.ceil(BASE_MOVE_COST * difficulty * locomotion.baseMultiplier * biomeModifier);
}

function describeTile(tile) {
  if (tile.resource !== "none") {
    const resourceNames = {
      iron: "rich ferric deposits",
      crystal: "rare crystalline formations",
      bio: "bioluminescent flora"
    };
    setStatus(`Sensors highlight ${resourceNames[tile.resource]} in the ${BIOME_LABELS[tile.biome].toLowerCase()}.`);
  } else {
    setStatus(`Exploring ${BIOME_LABELS[tile.biome].toLowerCase()} terrain.`);
  }
}

function performScan() {
  if (!state.running) return;
  const { scanRange, scanCost } = state.modules.utility;
  if (scanRange <= 0) {
    setStatus("No advanced scanners installed. Upgrade the utility slot to perform scans.");
    return;
  }
  if (state.energy < scanCost) {
    setStatus("Scanning aborted. Energy reserves too low.");
    return;
  }
  state.energy -= scanCost;
  revealArea(state.position.x, state.position.y, scanRange + BASE_VISION);
  inspectTile(state.inspectedTile ?? getCurrentTile());
  updateStats();
  setStatus("Survey scan complete. Nearby tiles charted.");
}

function collectResource() {
  if (!state.running) return;
  const tile = getCurrentTile();
  if (tile.resource === "none") {
    setStatus("No recoverable resources detected on this tile.");
    return;
  }
  if (state.cargo >= state.cargoCapacity) {
    setStatus("Cargo hold is full. Return to base to offload samples.");
    return;
  }

  state.cargo += 1;
  const value = RESOURCE_VALUES[tile.resource] + state.modules.utility.resourceBonus;
  state.resources += value;
  setStatus(`Sample secured. Cargo usage: ${state.cargo}/${state.cargoCapacity}.`);
  tile.resource = "none";
  inspectTile(tile);
  updateStats();
}

function updateStats() {
  energyStat.textContent = `${state.energy} / ${state.maxEnergy}`;
  cargoStat.textContent = `${state.cargo} / ${state.cargoCapacity}`;
  resourcesStat.textContent = `${state.resources}`;
  creditsStat.textContent = `${state.credits}`;
  explorationStat.textContent = `${state.exploration}`;
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function renderLegend(legend) {
  legendElement.innerHTML = "";
  const totalTiles = GRID_SIZE * GRID_SIZE;
  const entries = Array.from(legend.entries()).sort((a, b) => b[1] - a[1]);
  entries.forEach(([biome, count]) => {
    const item = document.createElement("li");
    const percent = Math.round((count / totalTiles) * 1000) / 10;
    item.style.color = BIOME_COLORS[biome] ?? "#9cc4ff";
    const code = BIOME_CODES[biome] ?? biome.toUpperCase();
    const label = BIOME_LABELS[biome] ?? biome;
    item.innerHTML = `<span class="legend-code">${code}</span> ${label} · ${count} tiles (${percent}%)`;
    legendElement.append(item);
  });
}

function endExpedition() {
  if (!state.running) {
    return;
  }
  state.running = false;
  updateUIStates(false);
  updateInspector(null);
  setStatus(`Mission concluded. Recovered resources valued at ${state.resources} units.`);
}

function updateUIStates(isRunning) {
  controlButtons.forEach(button => {
    button.disabled = !isRunning;
  });
  collectButton.disabled = !isRunning;
  endButton.disabled = !isRunning;
  moveButton.disabled = !isRunning;
  launchButton.disabled = false;
}

initialise();
