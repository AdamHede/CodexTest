const GRID_SIZE = 10;
const BASE_MOVE_COST = 4;
const BASE_VISION = 1;

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

const RESOURCE_VALUES = {
  none: 0,
  iron: 12,
  crystal: 18,
  bio: 9
};

const locomotionModules = [
  {
    id: "wheels",
    name: "All-Terrain Wheels",
    description: "Balanced movers. Efficient on plains and dunes but slowed in deep jungle and swamps.",
    baseMultiplier: 1,
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
    energy: 52
  },
  {
    id: "expansion",
    name: "Expansion Cells",
    description: "Additional battery racks that extend the mission clock.",
    energy: 70
  },
  {
    id: "fusion",
    name: "Fusion Capsule",
    description: "Prototype power plant enabling long-range expeditions.",
    energy: 88
  }
];

const cargoModules = [
  {
    id: "satchel",
    name: "Survey Satchel",
    description: "Lightweight container that fits a handful of samples.",
    capacity: 5
  },
  {
    id: "bay",
    name: "Modular Cargo Bay",
    description: "Balanced hold for extended runs without overburdening the rover.",
    capacity: 8
  },
  {
    id: "vault",
    name: "Cryo Vault",
    description: "Cryogenic vault for delicate resources. Heavy but cavernous.",
    capacity: 11
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
    resourceBonus: 0
  },
  {
    id: "scanner",
    name: "Survey Scanner",
    description: "Reveal a larger area and ping nearby terrain using focused scans.",
    visionBonus: 1,
    scanRange: 2,
    scanCost: 6,
    resourceBonus: 0
  },
  {
    id: "excavator",
    name: "Excavation Arm",
    description: "Automated sampling arm that extracts cleaner yields from deposits.",
    visionBonus: 0,
    scanRange: 1,
    scanCost: 5,
    resourceBonus: 3
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

const energyStat = document.getElementById("energyStat");
const cargoStat = document.getElementById("cargoStat");
const resourcesStat = document.getElementById("resourcesStat");
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

  populateSelect(selects.locomotion, locomotionModules, module => module.name, module => module.description);
  populateSelect(selects.power, powerModules, module => module.name, module => module.description);
  populateSelect(selects.cargo, cargoModules, module => module.name, module => module.description);
  populateSelect(selects.utility, utilityModules, module => module.name, module => module.description);

  launchButton.addEventListener("click", launchExpedition);
  collectButton.addEventListener("click", collectResource);
  endButton.addEventListener("click", endExpedition);

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
  updateStats();
}

function populateSelect(selectElement, modules, labelGetter, descriptionGetter) {
  selectElement.innerHTML = "";
  modules.forEach(module => {
    const option = document.createElement("option");
    option.value = module.id;
    option.textContent = labelGetter(module);
    selectElement.append(option);
  });

  selectElement.value = modules[0].id;
  hints[selectElement.id.replace("Select", "")].textContent = descriptionGetter(modules[0]);

  selectElement.addEventListener("change", () => {
    const selectedModule = modules.find(module => module.id === selectElement.value);
    const hintKey = selectElement.id.replace("Select", "");
    hints[hintKey].textContent = descriptionGetter(selectedModule);
    state.modules[hintKey] = selectedModule;
  });

  state.modules[selectElement.id.replace("Select", "")] = modules[0];
}

function launchExpedition() {
  const age = Number(selectors.ageSlider.value);
  const temperature = Number(selectors.temperatureSlider.value);
  const humidity = Number(selectors.humiditySlider.value);

  state.world = { age, temperature, humidity, legend: new Map() };

  state.modules.locomotion = locomotionModules.find(module => module.id === selects.locomotion.value);
  state.modules.power = powerModules.find(module => module.id === selects.power.value);
  state.modules.cargo = cargoModules.find(module => module.id === selects.cargo.value);
  state.modules.utility = utilityModules.find(module => module.id === selects.utility.value);

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

  renderLegend(state.world.legend);
  buildMap();
  revealArea(state.position.x, state.position.y, BASE_VISION + state.modules.utility.visionBonus);
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

  for (let y = 0; y < GRID_SIZE; y += 1) {
    const row = [];
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const tile = createTile(x, y, age, temperature, humidity, seed);
      row.push(tile);
      tiles.push(tile);
      legend.set(tile.biome, (legend.get(tile.biome) ?? 0) + 1);
    }
    grid.push(row);
  }

  return { grid, tiles, legend };
}

function createTile(x, y, age, temperature, humidity, seed) {
  const ageNorm = age / 100;
  const tempNorm = temperature / 100;
  const humidityNorm = humidity / 100;
  const reliefScale = 1.2 + (1 - ageNorm) * 1.3;
  const elevationNoise = layeredNoise(x, y, reliefScale, seed);
  const moistureNoise = layeredNoise(x + 13, y + 7, 1.4, seed * 0.7 + 113);
  const tempNoise = layeredNoise(x + 3, y + 19, 0.9, seed * 1.1 + 37);

  const elevation = Math.pow(elevationNoise, 0.65 + ageNorm * 0.8);
  const moisture = Math.min(1, humidityNorm * 0.55 + moistureNoise * 0.7);
  const tempValue = Math.min(1, tempNorm * 0.5 + tempNoise * 0.7);

  let biome = "plain";

  if (elevation < 0.18) {
    biome = humidityNorm > 0.5 ? "river" : "ocean";
  } else if (elevation > 0.82 && tempValue > 0.6 && ageNorm < 0.4) {
    biome = "lava";
  } else if (elevation > 0.72) {
    biome = "mountain";
  } else if (moisture > 0.7 && tempValue > 0.6) {
    biome = "jungle";
  } else if (moisture > 0.68) {
    biome = "swamp";
  } else if (tempValue < 0.28) {
    biome = "tundra";
  } else if (moisture < 0.28 && tempValue > 0.55) {
    biome = "desert";
  } else {
    biome = "plain";
  }

  const resource = determineResource(biome, moisture, elevation, tempValue, seed, x, y);

  return {
    x,
    y,
    biome,
    resource,
    discovered: false,
    element: null
  };
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

function buildMap() {
  mapElement.innerHTML = "";
  const fragment = document.createDocumentFragment();
  state.grid.forEach(row => {
    row.forEach(tile => {
      const tileElement = document.createElement("div");
      tileElement.className = "tile";
      tileElement.dataset.state = "hidden";
      tileElement.dataset.biome = tile.biome;
      tileElement.dataset.resource = "none";
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
  const dx = tile.x - state.position.x;
  const dy = tile.y - state.position.y;
  const isAdjacent = Math.abs(dx) + Math.abs(dy) === 1;
  if (isAdjacent) {
    moveRover(dx === 1 ? "right" : dx === -1 ? "left" : dy === 1 ? "down" : "up");
  }
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
  tile.element.textContent = BIOME_LABELS[tile.biome];
}

function updateTileStates() {
  state.grid.forEach(row => {
    row.forEach(tile => {
      if (!tile.discovered) {
        tile.element.dataset.state = "hidden";
        tile.element.textContent = "";
        tile.element.dataset.resource = "none";
      } else {
        tile.element.textContent = BIOME_LABELS[tile.biome];
        tile.element.dataset.state = tile === getCurrentTile() ? "current" : "revealed";
        tile.element.dataset.resource = tile.resource;
      }
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
  updateTileStates();
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
  updateTileStates();
  updateStats();
}

function updateStats() {
  energyStat.textContent = `${state.energy} / ${state.maxEnergy}`;
  cargoStat.textContent = `${state.cargo} / ${state.cargoCapacity}`;
  resourcesStat.textContent = `${state.resources}`;
  explorationStat.textContent = `${state.exploration}`;
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function renderLegend(legend) {
  legendElement.innerHTML = "";
  const entries = Array.from(legend.entries()).sort((a, b) => b[1] - a[1]);
  entries.forEach(([biome, count]) => {
    const item = document.createElement("li");
    item.textContent = `${BIOME_LABELS[biome] ?? biome}: ${count}`;
    legendElement.append(item);
  });
}

function endExpedition() {
  if (!state.running) {
    return;
  }
  state.running = false;
  updateUIStates(false);
  setStatus(`Mission concluded. Recovered resources valued at ${state.resources} units.`);
}

function updateUIStates(isRunning) {
  controlButtons.forEach(button => {
    button.disabled = !isRunning;
  });
  collectButton.disabled = !isRunning;
  endButton.disabled = !isRunning;
  launchButton.disabled = false;
}

initialise();
