<template>
  <section id="lod-farming" class="rw-FarmingGuide mt-6 border border-[#51452e] rounded bg-[#17130e] overflow-hidden" aria-labelledby="farming-title">
    <div class="p-4">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 id="farming-title" class="text-[#e9bf40] font-bold mb-0">LoD Hell Farming Guide</h3>
      </div>
      <p class="text-sm text-[#b4ac92] mb-3">Pick your main damage type to find a farming route.</p>
      <div class="rw-FarmingTypes" role="group" aria-label="Farming damage type">
        <button v-for="guide in guides" :key="guide.type" type="button" :aria-pressed="selectedType === guide.type" :style="{ color: guide.color }" @click="selectedType = guide.type">{{ guide.type }}</button>
      </div>
      <p class="text-sm text-[#b4ac92] mt-3 mb-3" aria-live="polite">{{ selectedGuide.summary }}</p>
      <ol class="rw-FarmingPreview">
        <li v-for="area in selectedGuide.areas.slice(0, 3)" :key="area.name">
          <span class="text-[#a0c6ff]">{{ area.name }}</span>
          <span class="text-xs text-[#b4ac92]">Act {{ area.act }} · Area {{ area.level }}</span>
        </li>
      </ol>
      <button type="button" class="rwf-btn w-full justify-center min-h-[44px] mt-4" aria-haspopup="dialog" @click="openGuide">View {{ selectedType.toLowerCase() }} farming guide</button>
    </div>

    <dialog ref="guideDialog" class="rw-CraftingDialog rw-ChangelogDialog" aria-labelledby="farming-dialog-title" @click="onBackdropClick">
      <div class="flex items-center justify-between gap-3 p-4 border-b border-[#51452e]">
        <h2 id="farming-dialog-title" class="text-[#e9bf40] font-bold mb-0">LoD Hell Farming Guide</h2>
        <button type="button" class="rwf-btn min-h-[44px]" @click="closeGuide">Close</button>
      </div>
      <div class="rw-ChangelogBody p-4">
        <p class="text-sm text-[#b4ac92] mb-3">PD2 campaign areas before maps. Suggestions assume you cannot reliably break immunities.</p>
        <div class="rw-FarmingTypes" role="group" aria-label="Guide damage type">
          <button v-for="guide in guides" :key="guide.type" type="button" :aria-pressed="dialogType === guide.type" :style="{ color: guide.color }" @click="dialogType = guide.type">{{ guide.type }}</button>
        </div>
        <p class="text-[#a0c6ff] my-4" aria-live="polite">{{ dialogGuide.summary }}</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <article v-for="area in dialogGuide.areas" :key="area.name" class="border border-[#444] rounded p-4">
            <h3 class="text-[#e9bf40] font-bold mb-1">{{ area.name }}</h3>
            <p class="text-xs text-[#b4ac92] mb-3">Act {{ area.act }} · Hell area level {{ area.level }}</p>
            <p class="text-sm text-[#a0c6ff] mb-3">{{ area.benefit }}</p>
            <p class="text-sm mb-3"><strong class="text-[#bab197]">Getting there:</strong> {{ area.access }}</p>
            <p class="text-sm mb-0"><strong class="text-[#e4b67c]">Watch for:</strong> {{ area.caution }}</p>
          </article>
        </div>
        <div class="mt-6 border-t border-[#444] pt-4 text-sm">
          <h3 class="text-[#e9bf40] font-bold mb-2">Choosing a route</h3>
          <p>Favor comfortable clears over a higher area level. Unique monsters can gain extra immunities; skip a bad pack or use another damage source. These are community starting points, not a guarantee for every build.</p>
          <p>Corrupted Zones can add level 85 farming options and increased Worldstone Shard / Tier 1 map drops. Check whether the active zone suits your damage type. Lower Kurast super-chest routes from vanilla guides do not apply: PD2 removed those super chests.</p>
          <details>
            <summary class="text-[#bab197] cursor-pointer py-3">Sources and scope</summary>
            <p class="mt-2">Zone levels and immunities checked on October 20, 2026. Community recommendations span older seasons; clear speed depends on your build and gear.</p>
            <ul class="list-disc pl-5 leading-relaxed">
              <li><a href="https://wiki.projectdiablo2.com/wiki/Zones" target="_blank" rel="noopener" class="rw-Header-link underline">PD2 wiki: zone levels, immunities, and Corrupted Zones</a></li>
              <li v-for="source in dialogGuide.sources" :key="source.url"><a :href="source.url" target="_blank" rel="noopener" class="rw-Header-link underline">{{ source.title }}</a></li>
            </ul>
          </details>
        </div>
      </div>
    </dialog>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { damageGuides, DamageType } from "@/data/farming-guide";

type TGuideDialog = HTMLDialogElement & { showModal(): void; close(): void };

export default defineComponent({
  name: "FarmingGuide",
  data() {
    return { guides: damageGuides, selectedType: "Fire" as DamageType, dialogType: "Fire" as DamageType };
  },
  computed: {
    selectedGuide(): typeof damageGuides[number] {
      return damageGuides.find((guide) => guide.type === this.selectedType) || damageGuides[0];
    },
    dialogGuide(): typeof damageGuides[number] {
      return damageGuides.find((guide) => guide.type === this.dialogType) || damageGuides[0];
    },
  },
  methods: {
    async openGuide() {
      this.dialogType = this.selectedType;
      await this.$nextTick();
      const dialog = this.$refs.guideDialog as TGuideDialog;
      dialog.showModal();
      const body = dialog.querySelector('.rw-ChangelogBody');
      if (body) body.scrollTop = 0;
    },
    closeGuide() {
      (this.$refs.guideDialog as TGuideDialog).close();
    },
    onBackdropClick(event: MouseEvent) {
      if (event.target === this.$refs.guideDialog) this.closeGuide();
    },
  },
});
</script>
