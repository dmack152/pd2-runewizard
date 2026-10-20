<template>
  <div class="relative">
    <div class="flex justify-between items-center mb-2">
      <h2 class="rw-Title-h2 mb-0">Runes</h2>

      <div class="-mt-2px" :class="{ invisible: !isAnyRuneSelected }">
        <a class="rw-Runes-clear" href="#" @click.prevent="onClearRunes">
          <icon-cancel class="ux-icon ux-icon--fw rw-Runes-clearIcon text-[#da0000] mr-1" />clear
        </a>
      </div>
    </div>

    <div class="rw-Runes flex justify-between w-[130px] select-none">
      <div v-for="(runesTier, i) in runesByTier" :key="i" class="w-1/3">
        <!-- a single rune -->
        <button
          v-for="rune in runesTier"
          :key="rune.name"
          type="button"
          :aria-label="`${rune.name} rune`"
          :aria-pressed="!!haveRunes[rune.name]"
          class="rw-Rune mx-auto"
          :class="{
            'is-selected': haveRunes[rune.name],
          }"
          @click="onToggleRune(rune.name)"
        >
          <span class="mx-auto my-auto">{{ rune.name }}</span>
        </button>
      </div>
    </div>
    <div v-if="isAnyRuneSelected" class="rw-RuneFilter mt-4 w-[130px]">
      <button
        type="button"
        class="rwf-btn w-full justify-center whitespace-normal"
        :class="{ 'rwf-btn--active': isRuneFilterActive }"
        :aria-pressed="isRuneFilterActive"
        @click="onToggleRuneFilter"
      >
        {{ isRuneFilterActive ? 'Show all runewords' : 'Filter by runes' }}
      </button>
      <p class="mt-2 text-xs text-center text-[#979797]">Contains any selected rune.</p>
    </div>
    <p v-else class="rw-RuneFilter mt-4 w-[130px] text-xs text-center text-[#979797]">
      Select a rune to filter by
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import runesData, { ERuneTier } from "@/data/runes";
import store from "@/store";

import IconCancel from "@/icons/IconCancel.vue";

export default defineComponent({
  name: "Runes",

  components: {
    IconCancel,
  },

  data() {
    return {
      haveRunes: store.state.haveRunes,
      runes: runesData,
    };
  },

  computed: {
    isRuneFilterActive(): boolean {
      return store.state.filterBySelectedRunes;
    },

    isAnyRuneSelected(): boolean {
      return store.getRunes().length > 0;
    },

    runesByTier(): TRuneDef[][] {
      const tiers = [
        this.runes.filter((rune) => rune.tier === ERuneTier.COMMON),
        this.runes.filter((rune) => rune.tier === ERuneTier.SEMIRARE),
        this.runes.filter((rune) => rune.tier === ERuneTier.RARE),
      ];

      // console.log(tiers);

      return tiers;
    },
  },

  methods: {
    onToggleRuneFilter() {
      store.state.filterBySelectedRunes = !store.state.filterBySelectedRunes;
    },

    onClearRunes() {
      store.clearRunes();
      store.saveState();
    },

    onToggleRune(runeId: TRuneId) {
      const state = store.hasRune(runeId);

      store.setRunes([runeId], !state);
      store.saveState();
    },
  },
});
</script>
