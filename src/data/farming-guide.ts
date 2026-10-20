// Zone levels and immunities checked against the PD2 Zones wiki on 2026-10-20.
// Recommendations synthesize the linked PD2 community guides, not a speed ranking.
export type DamageType = "Fire" | "Cold" | "Lightning" | "Poison" | "Physical" | "Magic";

type FarmingArea = {
  name: string;
  act: number;
  level: number;
  access: string;
  benefit: string;
  caution: string;
};

const areas: Record<string, FarmingArea> = {
  stony: {
    name: "Stony Tomb 1–2", act: 2, level: 85,
    access: "Leave Lut Gholein and search the Rocky Waste for the entrance.",
    benefit: "Compact level 85 zones with boss packs and no naturally fire-immune monster types.",
    caution: "Lightning immunes are common. Cold builds should skip or use a mercenary for Creeping Feature on level 2, who is cold immune.",
  },
  maggot: {
    name: "Maggot Lair 1–3", act: 2, level: 85,
    access: "Far Oasis waypoint → find the Maggot Lair entrance.",
    benefit: "All three floors are level 85 in PD2. A fire-friendly alternative with wider passages than vanilla LoD.",
    caution: "Lightning and poison immunes are common. Narrow routes still favor skills that handle corridors well.",
  },
  tunnels: {
    name: "Ancient Tunnels", act: 2, level: 85,
    access: "Lost City waypoint → search for the trap door.",
    benefit: "A classic cold farming route: normal monster types have no cold immunity.",
    caution: "Unique modifiers can still produce cold immunes. Other damage types encounter native immunities here.",
  },
  mausoleum: {
    name: "Mausoleum", act: 1, level: 85,
    access: "Cold Plains waypoint → Burial Grounds → Mausoleum.",
    benefit: "An early Act 1 option without native fire or cold immunes among normal monster types.",
    caution: "The usual monsters are lightning immune. Travel time and spread-out packs can make runs slower.",
  },
  arcane: {
    name: "Arcane Sanctuary", act: 2, level: 79,
    access: "Arcane Sanctuary waypoint → clear a branch and its end chests.",
    benefit: "A popular lightning starter route for ghost packs, chests, and the Summoner. Worth farming even below area level 85.",
    caution: "Normal monsters are friendly to lightning, but unique modifiers can add immunity. Physical builds run into immune ghosts.",
  },
  cows: {
    name: "Secret Cow Level", act: 1, level: 81,
    access: "Enter the Hell cow portal in the Rogue Encampment.",
    benefit: "Dense packs reward strong area damage; commonly farmed for runes, bases, and charms across damage types.",
    caution: "Good clear speed matters more than the area level. Inspect the Cow King and unique packs separately; do not teleport into a herd.",
  },
  temples: {
    name: "Kurast Temples", act: 3, level: 85,
    access: "Kurast Bazaar: Ruined Temple / Disused Fane. Upper Kurast: Forgotten Reliquary.",
    benefit: "These three level 85 temples have no native lightning-immune monster types and give lightning builds another route.",
    caution: "Small rooms can be dangerous on entry. Other Kurast temples have different immunities; use only the three listed here.",
  },
  pit: {
    name: "The Pit 1–2", act: 1, level: 85,
    access: "Outer Cloister waypoint → follow the road into Tamoe Highland → find the Pit.",
    benefit: "A common poison, physical, and magic gear-farming route. Normal monster types lack immunities to those damage types.",
    caution: "Archers and dangerous unique modifiers can punish low defenses. Fire, cold, and lightning builds encounter native immunes.",
  },
  chaos: {
    name: "Chaos Sanctuary", act: 4, level: 85,
    access: "River of Flame waypoint → follow the path to the Sanctuary.",
    benefit: "A repeatable route with seal bosses and Diablo. PD2 players commonly farm it with Holy Bolt / bone magic builds and geared poison builds.",
    caution: "There are native fire, cold, and lightning immunes. Seal packs and Diablo need more damage and toughness than a comfortable Pit run.",
  },
  trav: {
    name: "Travincal Council", act: 3, level: 82,
    access: "Travincal waypoint → Council beside the Durance entrance.",
    benefit: "A short physical farming route, especially for Barbarians who can use Find Item on Council corpses.",
    caution: "More gear dependent than the area level suggests. Prepare for Hydras and dangerous unique modifiers, including physical immunity.",
  },
};

export const damageGuides: {
  type: DamageType;
  color: string;
  summary: string;
  areas: FarmingArea[];
  sources: { title: string; url: string }[];
}[] = [
  {
    type: "Fire", color: "#f6a36f",
    summary: "Start with Stony Tomb or Maggot Lair. Add Cows once your area damage clears herds comfortably.",
    areas: [areas.stony, areas.maggot, areas.cows, areas.mausoleum],
    sources: [{ title: "PD2 fire farming discussion (2024)", url: "https://www.reddit.com/r/ProjectDiablo2/comments/1gd5al8/" }],
  },
  {
    type: "Cold", color: "#91d8f5",
    summary: "Ancient Tunnels is the straightforward starting point. Stony Tomb is another option with one fixed cold-immune exception.",
    areas: [areas.tunnels, areas.stony, areas.mausoleum, areas.cows],
    sources: [{ title: "PD2 cold farming discussion (2025)", url: "https://www.reddit.com/r/ProjectDiablo2/comments/1kqnia5/" }],
  },
  {
    type: "Lightning", color: "#f5dc78",
    summary: "Arcane Sanctuary is a common early route. Cows and selected Kurast temples offer variety.",
    areas: [areas.arcane, areas.cows, areas.temples],
    sources: [
      { title: "PD2 lightning starter discussion (2026)", url: "https://www.reddit.com/r/ProjectDiablo2/comments/1sbzb12/" },
      { title: "PD2 Arcane lightning guide (2022)", url: "https://www.reddit.com/r/ProjectDiablo2/comments/yumzhu/" },
    ],
  },
  {
    type: "Poison", color: "#a6d77b",
    summary: "Begin with the Pit. Try Cows with stronger area damage, then Chaos when bosses no longer slow the run down.",
    areas: [areas.pit, areas.cows, areas.chaos],
    sources: [{ title: "PD2 poison farming guide (2020)", url: "https://www.reddit.com/r/ProjectDiablo2/comments/k6f68p/" }],
  },
  {
    type: "Physical", color: "#d9bc9b",
    summary: "Farm the Pit, Travincal, or Chaos Sanctuary as your gear allows. Travincal is especially popular for Barbarians using Find Item.",
    areas: [areas.pit, areas.trav, areas.chaos, areas.cows],
    sources: [{ title: "PD2 Whirlwind farming guide (2021)", url: "https://www.reddit.com/r/ProjectDiablo2/comments/m2dbpd/" }],
  },
  {
    type: "Magic", color: "#c6b0f7",
    summary: "The Pit offers an accessible gear farm. Chaos is a common target for Holy Bolt and bone builds; Cows suit good area coverage.",
    areas: [areas.pit, areas.chaos, areas.cows],
    sources: [{ title: "PD2 early Chaos build discussion (2022)", url: "https://www.reddit.com/r/ProjectDiablo2/comments/vg48so/" }],
  },
];
