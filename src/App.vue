<template>
  <app-header v-if="useLayoutHeader" />

  <div v-if="zoneState.notice" class="rw-ZoneNotice" role="alert">
    <a href="#corrupted-zones" class="rw-Header-link"><strong>{{ zoneState.notice.name }}</strong> {{ zoneState.notice.advance ? `becomes corrupted in ${Math.max(1, Math.ceil((zoneState.notice.startsAt - zoneState.now) / 60000))} minutes.` : 'is now corrupted.' }} View schedule →</a>
    <button type="button" class="rwf-btn min-h-[44px]" aria-label="Dismiss corrupted zone alert" @click="dismissZoneNotice">Dismiss</button>
  </div>

  <corrupted-zone-tracker v-if="isZonePage" />
  <div v-show="!isZonePage" class="rw-Workspace">
    <main class="rw-Layout-rowContainer rw-Main py-4 flex mb-24">
      <div class="rw-RunePicker mr-16">
        <runes />
      </div>
      <div id="runewords" class="rw-Results overflow-auto flex-1">
        <runewords />
      </div>
    </main>
    <cheat-sheet />
  </div>

  <app-footer />
</template>

<script lang="ts">
import { defineComponent } from "vue";

import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import Runes from "@/components/Runes.vue";
import Runewords from "@/components/Runewords.vue";
import CheatSheet from "@/components/CheatSheet.vue";
import CorruptedZoneTracker from "@/components/CorruptedZoneTracker.vue";
import { zoneState, dismissZoneNotice } from "@/store/corrupted-zones";

export default defineComponent({
  name: "App",

  components: {
    AppHeader,
    AppFooter,
    Runes,
    Runewords,
    CheatSheet,
    CorruptedZoneTracker,
  },

  data() { return { zoneState, isZonePage: window.location.hash === "#corrupted-zones" }; },

  computed: {
    useLayoutHeader(): boolean {
      return import.meta.env.VITE_LAYOUT_HEADER === "true";
    },
  },
  mounted() {
    window.addEventListener("hashchange", this.updatePage);
    if (this.isZonePage) void this.updatePage();
  },
  beforeUnmount() {
    window.removeEventListener("hashchange", this.updatePage);
  },
  methods: {
    dismissZoneNotice,
    async updatePage() {
      const wasZonePage = this.isZonePage;
      this.isZonePage = window.location.hash === "#corrupted-zones";
      await this.$nextTick();
      if (this.isZonePage) {
        window.scrollTo(0, 0);
        (document.getElementById("zone-page-title") as HTMLElement | null)?.focus({ preventScroll: true });
      } else if (!window.location.hash || window.location.hash === "#") {
        window.scrollTo(0, 0);
      } else if (wasZonePage) {
        document.querySelector(window.location.hash === "#cheat-sheet" ? "#cheat-sheet" : "#runewords")?.scrollIntoView();
      }
    },
  },
});
</script>
