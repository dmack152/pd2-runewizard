// Schedule published by exiledagain (public domain / Unlicense).
// https://github.com/exiledagain/past-dinosaurs/blob/main/index.html
export const corruptedZones: string[] = [
  "Blood Moor and Den of Evil",
  "Cold Plains and the Cave",
  "Stony Field and Tristram",
  "Dark Wood and the Underground Passage",
  "Black Marsh and the Hole",
  "Tamoe Highland and the Pit",
  "Burial Ground and Mausoleum",
  "Forgotten Tower",
  "Outer Cloister and Barracks",
  "Jail, Inner Cloister, and Cathedral",
  "Catacombs",
  "Cow Level",
  "Rocky Waste and the Stony Tomb",
  "Dry Hills and the Halls of the Dead",
  "Far Oasis and the Maggot Lair",
  "Lost City, Ancient Tunnels, and Claw Viper Temple",
  "Canyon of the Magi and Tal Rasha's Tomb",
  "Lut Gholein Sewers and the Palace Cellars",
  "Arcane Sanctuary",
  "Spider Forest, Arachnid Lair, and Spider Cavern",
  "Great Marsh and the Swampy Pit",
  "Flayer Jungle and the Flayer Dungeon",
  "Lower Kurast and the Kurast Sewers",
  "Kurast Bazaar, Ruined Temple, and Disused Fane",
  "Upper Kurast, the Forgotten Reliquary, and Forgotten Temple",
  "Travincal, the Ruined Fane, and Disused Reliquary",
  "Durance of Hate",
  "Outer Steppes and the Plains of Despair",
  "City of the Damned and the River of Flame",
  "Chaos Sanctuary",
  "Bloody Foothills and the Frigid Highlands",
  "Arreat Plateau, Crystalline Passage, and Frozen River",
  "Glacial Trail, Drifter Cavern, and Frozen Tundra",
  "Ancients' Way and the Icy Cellar",
  "Nihlathak's Temple",
  "Abaddon, the Pit of Acheron, and the Infernal Pit",
  "Worldstone Keep and Throne of Destruction",
];

export const ZONE_INTERVAL = 15 * 60 * 1000;

export function zoneAt(timestamp: number) {
  const startsAt = Math.floor(timestamp / ZONE_INTERVAL) * ZONE_INTERVAL;
  const seed = Math.floor(startsAt / ZONE_INTERVAL) + Math.floor(startsAt / 86400000);
  // The published 15-bit PRNG result; arithmetic stays within safe integer range.
  const index = (Math.floor((seed * 214013 + 2531011) / 65536) % 32768) % corruptedZones.length;
  return { name: corruptedZones[index], startsAt, endsAt: startsAt + ZONE_INTERVAL };
}

export function upcomingZones(now: number, count = 12) {
  const start = zoneAt(now).endsAt;
  return Array.from({ length: count }, (_, offset) => zoneAt(start + offset * ZONE_INTERVAL));
}

export function nextOccurrence(name: string, now: number) {
  // Search a full week; return null rather than guess if a zone is absent.
  for (let offset = 0; offset < 7 * 24 * 4; offset++) {
    const zone = zoneAt(now + offset * ZONE_INTERVAL);
    if (zone.name === name) return zone;
  }
  return null;
}
