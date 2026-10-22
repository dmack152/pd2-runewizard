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
              aria-haspopup="dialog"
              aria-controls="season-14-changelog"
              @click="openChangelog"
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
              @click.prevent="isHelpVisible = !isHelpVisible"
            >
              <icon-chevron-down
                class="ux-icon ux-icon--fw"
                :class="{
                  'transform rotate-180': isHelpVisible,
                }"
              /><span class="ml-1">{{ "Help" }}</span>
            </a>

            <a href="https://www.projectdiablo2.com/" class="rw-Header-link mr-6">
              <span>Trade</span>
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

    <dialog
      id="season-14-changelog"
      ref="changelogDialog"
      class="rw-CraftingDialog rw-ChangelogDialog"
      aria-labelledby="changelog-title"
      @close="isChangelogVisible = false"
      @click="onChangelogBackdropClick"
    >
      <div class="flex items-center justify-between gap-3 p-4 border-b border-[#51452e]">
        <span class="text-[#e9bf40] font-bold">Season 14 Changes</span>
        <button type="button" class="rwf-btn min-h-[44px]" @click="closeChangelog">Close</button>
      </div>
      <div class="rw-ChangelogBody">
        <season-changelog />
      </div>
    </dialog>

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

type TChangelogDialog = HTMLDialogElement & {
  showModal(): void;
  close(): void;
};

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

  methods: {
    openChangelog() {
      this.isHelpVisible = false;
      (this.$refs.changelogDialog as TChangelogDialog).showModal();
      this.isChangelogVisible = true;
      const body = (this.$refs.changelogDialog as HTMLElement).querySelector('.rw-ChangelogBody');
      if (body) body.scrollTop = 0;
    },
    closeChangelog() {
      (this.$refs.changelogDialog as TChangelogDialog).close();
    },
    onChangelogBackdropClick(event: MouseEvent) {
      if (event.target === this.$refs.changelogDialog) this.closeChangelog();
    },
  },
});
</script>
