<template>
  <section class="px-4 py-6 border-b border-[#444] text-[#a0c6ff]" aria-labelledby="changelog-title">
    <h2 id="changelog-title" class="text-xl text-gold font-bold mb-2">Season 14 Alliance — Runeword Changelog</h2>
    <p class="mb-6 text-sm">Four new runewords and six updates from the Season 14 patch notes.</p>

    <h3 class="text-lg text-gold font-bold mb-3">New runewords</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <article v-for="word in newRunewords" :key="word.title" class="border border-[#444] rounded p-4 bg-[#17130e]">
        <h4 class="text-gold font-bold mb-1">{{ word.title }}</h4>
        <p class="text-[#e9bf40] text-sm mb-1">{{ word.runes.join(' → ') }}</p>
        <p class="text-sm text-[#b4ac92] mb-3">
          {{ word.runes.length }} sockets · {{ word.ttypes.join(' / ') }}<span v-if="word.tinfos"> ({{ word.tinfos }})</span> · Level {{ word.level }}
        </p>
        <ul class="list-disc pl-5 text-sm leading-relaxed">
          <li v-for="stat in word.stats" :key="stat">{{ stat }}</li>
        </ul>
      </article>
    </div>

    <h3 class="text-lg text-gold font-bold mb-3">Updated runewords</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <article v-for="word in updatedRunewords" :key="word.title" class="border border-[#444] rounded p-4">
        <h4 class="text-gold font-bold mb-2">{{ word.title }}</h4>
        <ul class="list-disc pl-5 text-sm leading-relaxed">
          <li v-for="change in word.changes" :key="change">{{ change }}</li>
        </ul>
      </article>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import runewords from "@/data/runewords";
import descriptions from "@/data/runewords-descriptions";

export default defineComponent({
  name: "SeasonChangelog",

  data() {
    return {
      updatedRunewords: [
        {
          title: "Gloom",
          changes: [
            "Added +1 to maximum curses.",
            "Removed 5% damage taken gained as mana.",
            "Faster hit recovery: 20–40% → 20%.",
            "Curse resistance: 20% → 30–40%.",
          ],
        },
        {
          title: "Famine",
          changes: [
            "Enemy fire resistance reduction: −10–15% → −15–20%.",
            "Enemy lightning resistance reduction: −10–15% → −15–20%.",
            "Enemy cold resistance reduction: −10–15% → −15–20%.",
          ],
        },
        {
          title: "Hand of Justice",
          changes: ["Holy Fire aura when equipped: level 12 → level 14."],
        },
        {
          title: "Eternity",
          changes: ["Revive: +4 → +12."],
        },
        {
          title: "Delirium",
          changes: [
            "Added +1 to Delirium Form (oskill).",
            "While in Delirium Form, abilities cannot be used; grants −10% to enemy physical resistance and Ignore Target’s Defense.",
          ],
        },
        {
          title: "Epiphany",
          changes: [
            "Faster cast rate: 20% → 35%.",
            "Added lightning damage: 1–750 → 1–1250.",
          ],
        },
      ],
    };
  },

  computed: {
    newRunewords() {
      return runewords.filter((word) => word.version === "S14 New").map((word) => ({
        ...word,
        stats: descriptions[word.title].replace(/<[^>]*>/g, "").trim().split("\n").map((line) => line.trim()).filter(Boolean),
      }));
    },
  },
});
</script>
