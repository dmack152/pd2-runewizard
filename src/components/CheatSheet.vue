<template>
  <aside id="cheat-sheet" class="rw-CheatSheet" aria-labelledby="cheat-sheet-title">
    <h2 id="cheat-sheet-title" class="rw-Title-h2 mb-4">Cheat Sheet</h2>
    <a href="#runewords" class="rw-MobileOnly rw-Header-link mb-4">Back to runewords ↑</a>
    <section class="border border-[#51452e] rounded bg-[#17130e] overflow-hidden">
      <div class="p-4">
        <h3 class="text-[#e9bf40] font-bold mb-1">Crafting Recipes</h3>
        <p class="text-sm text-[#b4ac92] mb-0">Season 14 Alliance</p>
      </div>
      <button type="button" class="relative block w-full cursor-zoom-in" aria-label="Enlarge Season 14 crafting matrix" @click="openChart">
        <img :src="craftingChart" alt="Season 14 crafting comparison matrix for Blood, Caster, Hitpower, Safety, Vampiric, Bountiful, and Brilliant recipes" class="block w-full h-auto" />
        <span aria-hidden="true" class="absolute bottom-3 right-3 rounded border border-[#8a8062] bg-[#000208] px-3 py-1 text-sm text-[#e9bf40]">Click to enlarge</span>
      </button>
      <div class="p-4">
        <p class="text-sm text-[#b4ac92] mb-3">Compare rune and gem recipes, crafting bonuses, and infusions.</p>
        <button type="button" class="rwf-btn w-full justify-center" @click="openChart">View crafting matrix</button>
      </div>
    </section>

    <section class="mt-6 border border-[#51452e] rounded bg-[#17130e] overflow-hidden">
      <div class="p-4">
        <h3 class="text-[#e9bf40] font-bold mb-0">Tomb Symbols</h3>
      </div>
      <a :href="tombSymbols" target="_blank" rel="noopener" aria-label="Open tomb symbols image full size" class="block cursor-zoom-in">
        <img :src="tombSymbols" alt="Reference image of the seven tomb symbols" class="block w-full h-auto" />
      </a>
    </section>

    <section class="mt-6 border border-[#51452e] rounded bg-[#17130e] overflow-hidden">
      <div class="p-4">
        <h3 class="text-[#e9bf40] font-bold mb-0">Power Leveling</h3>
      </div>
      <a :href="powerLeveling" target="_blank" rel="noopener" aria-label="Open power leveling chart full size" class="block p-4 pt-0 cursor-zoom-in">
        <img :src="powerLeveling" alt="Power leveling reference chart with level ranges and suggested leveling areas" class="block w-full max-w-[416px] h-auto mx-auto [image-rendering:pixelated]" />
      </a>
    </section>

    <farming-guide />

    <dialog ref="chartDialog" class="rw-CraftingDialog" aria-labelledby="crafting-dialog-title" @click="onDialogClick">
      <div class="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-[#51452e]">
        <h2 id="crafting-dialog-title" class="text-[#e9bf40] font-bold mb-0">Crafting Recipes — Season 14</h2>
        <div class="flex items-center gap-4">
          <a :href="craftingChart" target="_blank" rel="noopener" class="rw-Header-link text-sm">Open full size</a>
          <button type="button" class="rwf-btn" @click="closeChart">Close</button>
        </div>
      </div>
      <div class="overflow-auto max-h-[80vh]">
        <img :src="craftingChart" alt="Season 14 crafting comparison matrix showing all crafting recipes and bonuses" class="block w-full h-auto" />
      </div>
    </dialog>
  </aside>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import craftingChart from "@assets/images/crafting-comparison-season14.png";
import tombSymbols from "@assets/images/tomb-symbols.png";
import powerLeveling from "@assets/images/power-leveling.png";
import FarmingGuide from "@/components/FarmingGuide.vue";

type TChartDialog = HTMLDialogElement & {
  showModal(): void;
  close(): void;
};

export default defineComponent({
  name: "CheatSheet",
  components: { FarmingGuide },

  data() {
    return { craftingChart, tombSymbols, powerLeveling };
  },

  methods: {
    openChart() {
      (this.$refs.chartDialog as TChartDialog).showModal();
    },
    closeChart() {
      (this.$refs.chartDialog as TChartDialog).close();
    },
    onDialogClick(event: MouseEvent) {
      if (event.target === this.$refs.chartDialog) this.closeChart();
    },
  },
});
</script>
