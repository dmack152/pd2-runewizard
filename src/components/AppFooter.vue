<template>
  <footer class="rw-Footer min-h-[200px]">
    <div class="rw-Layout-goldBarSeparator opacity-50 mb-6"></div>

    <div class="text-center text-lg text-gold leading-1">
      <div>
        Forked from
        <a href="https://github.com/kvothed2/pd2-runewizard/" class="rw-Footer-link ml-2">
          <icon-github class="ux-icon ux-icon--fw mr-1 mt-[-0.2em]" />
          <span>kvothed2/pd2-runewizard</span>
        </a>
      </div>
      <br>
      <div>
        Original
        <a :href="'https://github.com/fabd/diablo2-runewizard'" class="rw-Footer-link ml-2">
          <icon-github class="ux-icon ux-icon--fw mr-1 mt-[-0.2em]" />
          <span class>{{ "fabd/diablo2-runewizard" }}</span>
        </a>
      </div>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import IconGithub from "@/icons/IconGithub.vue";

export default defineComponent({
  name: "AppFooter",

  components: {
    IconGithub,
  },

});
</script>
