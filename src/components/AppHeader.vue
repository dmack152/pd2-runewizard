<template>
  <!-- optional header to decorate the stand alone version -->
  <header class="rw-SiteHeader">
    <div class="rw-Header-content rw-Layout-rowContainer h-[106px] flex">
      <div class="rw-Header-icon pr-[20px] pt-[17px]">
        <img
          src="@assets/images/ber-rune.webp"
          alt="Ber rune, original art (c) BLIZZARD ENTERTAINMENT"
          class="w-[69px] h-[67px] object-contain"
        />
      </div>
      <div class="rw-Header-brand flex-1">
        <h1 class="rw-Header-logo text-black text-[0px] mt-[19px] mb-[5px] w-[301px] h-[32px]">
          <img
            src="@assets/images/logo-text-runewizard.png"
            alt="PD2 Runewizard"
            class="block w-full h-full"
          />
        </h1>
        <div class="rw-Header-meta flex justify-between items-center">
          <div class="rw-Header-version text-lg text-[#e9bf40]">
            for <span class="text-[#e9bf40] font-bold">{{ envGameName }}</span>
            <span class="ml-2 text-[#90b7ff]">{{ envGameVersion }}</span>
          </div>

          <div class="rw-Header-nav flex items-center text-[#514f4a]">
            <button
              type="button"
              class="rw-HelpLink mr-6 whitespace-nowrap"
              :aria-expanded="isChangelogVisible"
              aria-controls="season-14-changelog"
              @click="isChangelogVisible = !isChangelogVisible; isHelpVisible = false"
            >
              <icon-chevron-down
                class="ux-icon ux-icon--fw"
                :class="{ 'transform rotate-180': isChangelogVisible }"
              />
              <span class="ml-1">Season 14 Changes</span>
            </button>
            <a
              href="#"
              class="rw-HelpLink mr-6"
              @click.prevent="isHelpVisible = !isHelpVisible; isChangelogVisible = false"
            >
              <icon-chevron-down
                class="ux-icon ux-icon--fw"
                :class="{
                  'transform rotate-180': isHelpVisible,
                }"
              /><span class="ml-1">{{ "Help" }}</span>
            </a>

            <a href="https://wiki.projectdiablo2.com/" class="rw-Header-link">
              <span>Wiki</span>
            </a>
            <a href="#cheat-sheet" class="rw-HelpLink rw-CheatSheetJump">Cheat Sheet</a>
          </div>
        </div>
      </div>
    </div>

    <!-- separator between header and main content, div simply extends to edges -->
    <div class="rw-Layout-goldBarSeparator mb-2"></div>

    <transition name="fadein">
      <div v-if="isChangelogVisible" id="season-14-changelog" class="rw-Layout-rowContainer mb-4">
        <season-changelog />
      </div>
    </transition>

    <transition name="fadein">
      <div v-if="isHelpVisible" class="rw-Layout-rowContainer mb-4">
        <help-box />
      </div>
    </transition>
  </header>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import HelpBox from "@/components/HelpBox.vue";
import SeasonChangelog from "@/components/SeasonChangelog.vue";
import IconChevronDown from "@/icons/IconChevronDown.vue";

export default defineComponent({
  name: "AppHeader",

  components: {
    HelpBox,
    SeasonChangelog,
    IconChevronDown,
  },

  data() {
    return {
      isHelpVisible: false,
      isChangelogVisible: false,

      envGameName: /**@type {string}*/ (import.meta.env.VITE_GAME_NAME),
      envGameVersion: /**@type {string}*/ (import.meta.env.VITE_GAME_VERSION),
      envGithubRepoUrl: /**@type {string}*/ (import.meta.env
        .VITE_URL_GITHUB_REPO),
    };
  },
});
</script>
