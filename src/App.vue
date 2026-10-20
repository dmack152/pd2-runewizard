<template>
  <app-header v-if="useLayoutHeader" />

  <div class="rw-Workspace">
    <main class="rw-Layout-rowContainer rw-Main py-4 flex mb-24">
      <div class="mr-16">
        <runes />
      </div>
      <div class="overflow-auto flex-1">
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

export default defineComponent({
  name: "App",

  components: {
    AppHeader,
    AppFooter,
    Runes,
    Runewords,
    CheatSheet,
  },

  computed: {
    useLayoutHeader(): boolean {
      return import.meta.env.VITE_LAYOUT_HEADER === "true";
    },
  },
});
</script>
