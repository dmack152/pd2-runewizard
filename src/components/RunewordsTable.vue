<template>
  <runeword-popup ref="popup" />

  <div class="rw-MobileSort">
    <label for="runeword-sort">Sort by</label>
    <select id="runeword-sort" v-model="sortKey" @change="sortAsc = true">
      <option value="level">Level</option>
      <option value="title">Name</option>
      <option value="ttypes">Item type</option>
    </select>
    <button type="button" class="rwf-btn" :aria-label="sortAsc ? 'Sort descending' : 'Sort ascending'" @click="sortAsc = !sortAsc">
      {{ sortAsc ? 'Ascending' : 'Descending' }}
    </button>
  </div>

  <table class="rw-Table w-full">
    <thead>
      <tr>
        <th
          v-for="col in tableHeads"
          :key="col.key"
          class="rw-Table-th cursor-pointer"
          :class="{
            'is-sortCol': isSortKey(col.key),
            'text-left': col.textLeft,
          }"
          @click="onSortBy(col.key)"
        >
          {{ col.label }}
          <span v-if="isSortKey(col.key) && sortAsc" class="rw-Table-thIcon">
            <icon-arrow-down class="ux-icon ux-icon--fw" />
          </span>
          <span v-if="isSortKey(col.key) && !sortAsc" class="rw-Table-thIcon">
            <icon-arrow-up class="ux-icon ux-icon--fw" />
          </span>
        </th>
      </tr>
    </thead>
    <tbody>
      <template v-for="(item, i) in itemsBySort" :key="i">
        <template v-if="pinnedRunewords.size && i === 0">
          <tr class="rw-Table-tr rw-Table-sectionRow">
            <td class="rw-Table-td" colspan="9">
              <div class="text-center mt-6 py-2 relative">
                <span class="text-md text-gold tracking-[.2em]">PINNED RUNEWORDS</span>
                <a class="rw-Runes-clear absolute right-0 top-1" href="#" @click.prevent="unpinAll">
                  <icon-cancel class="ux-icon ux-icon--fw rw-Runes-clearIcon text-[#da0000] mr-1" />unpin all
                </a>
              </div>
            </td>
          </tr>
        </template>

        <template v-if="pinnedRunewords.size && i === pinnedRunewords.size">
          <tr class="rw-Table-tr rw-Table-sectionRow">
            <td class="rw-Table-td" colspan="9">
              <div class="text-center text-md text-gold tracking-[.2em] mt-6 py-2">ALL RUNEWORDS</div>
            </td>
          </tr>
        </template>

        <tr
          class="rw-Table-tr"
          :class="cssCompleteRuneword(item)"
          :style="{
            display: item.filterMatch ? '' : 'none',
          }"
        >
          <td class="rw-Table-td rw-Table-tdTitle p-0 text-left relative min-w-[10em]">
            <button
              type="button"
              class="rw-Table-tdTitleSpan cursor-pointer"
              @mouseenter="onEnterRuneword($event, item)"
              @mouseleave="onLeaveRuneword()"
              @click="onEnterRuneword($event, item)"
            >{{ item.title }}</button>
            <span v-if="item.ladder" class="rw-Md-ladder" title="Ladder Only">L</span>
            <span v-if="item.version" class="rw-Table-tdTitlePatch" title="Patch version">{{ item.version }}</span>

            <button
              v-if="pinnedRunewords.has(item.title)"
              type="button"
              :aria-label="`Unpin ${item.title}`"
              class="rw-Table-pin is-pinned"
              @click="onTogglePin(item.title)"
            >
              <icon-check-on class="rw-Table-pinIcon" />
            </button>
            <button v-else type="button" :aria-label="`Pin ${item.title}`" class="rw-Table-pin" @click="onTogglePin(item.title)">
              <icon-check-off class="rw-Table-pinIcon" />
            </button>
          </td>
          <td class="rw-MobileRecipe">
            <span v-for="(rune, index) in item.runes" :key="index" :class="{ 'is-active': haveRunes[rune] }">{{ rune }}</span>
          </td>
          <td class="rw-Table-td is-rune" :class="cssActiveRune(item.runes[0])">
            {{
              item.runes[0]
            }}
          </td>
          <td class="rw-Table-td is-rune" :class="cssActiveRune(item.runes[1])">
            {{
              item.runes[1]
            }}
          </td>
          <td class="rw-Table-td is-rune" :class="cssActiveRune(item.runes[2])">
            {{
              item.runes[2]
            }}
          </td>
          <td class="rw-Table-td is-rune" :class="cssActiveRune(item.runes[3])">
            {{
              item.runes[3]
            }}
          </td>
          <td class="rw-Table-td is-rune" :class="cssActiveRune(item.runes[4])">
            {{
              item.runes[4]
            }}
          </td>
          <td class="rw-Table-td is-rune" :class="cssActiveRune(item.runes[5])">
            {{
              item.runes[5]
            }}
          </td>
          <td class="rw-Table-td rw-Table-tdType min-w-[10em]" v-html="getTypeCellHtml(item)"></td>
          <td class="rw-Table-td rw-Table-level"><span class="rw-MobileOnly">Level&nbsp;</span>{{ item.level }}</td>
        </tr>
      </template>
    </tbody>
  </table>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

import itemTypesData from "@/data/item-types";
import store from "@/store";

import IconArrowUp from "@/icons/IconArrowUp.vue";
import IconArrowDown from "@/icons/IconArrowDown.vue";
import IconCancel from "@/icons/IconCancel.vue";
import IconCheckOn from "@/icons/IconCheckOn.vue";
import IconCheckOff from "@/icons/IconCheckOff.vue";
import RunewordPopup from "@/components/RunewordPopup.vue";

type TRunewordPopup = TVueInstanceOf<typeof RunewordPopup>;

export default defineComponent({
  name: "RunewordsTable",

  components: {
    IconArrowDown,
    IconArrowUp,
    IconCancel,
    IconCheckOn,
    IconCheckOff,
    RunewordPopup,
  },

  props: {
    items: { type: Array as PropType<TRunewordItem[]>, required: true, },
  },

  data() {
    return {
      haveRunes: store.state.haveRunes,
      pinnedRunewords: store.state.pinned,

      // this is our default sort
      sortKey: "level",
      sortAsc: true,

      tableHeads: [
        { key: "title", label: "Runeword", textLeft: true },
        { key: "rune0", label: "Rune" },
        { key: "rune1", label: "Rune" },
        { key: "rune2", label: "Rune" },
        { key: "rune3", label: "Rune" },
        { key: "rune4", label: "Rune" },
        { key: "rune5", label: "Rune" },
        { key: "ttypes", label: "Item Types" },
        { key: "level", label: "Level" },
      ],
    };
  },

  computed: {
    /** @return {number} */
    // availableCount() {
    //   let count = 0;
    //   this.runewordIsComplete.forEach((isComplete) => isComplete && count++);
    //   return count;
    //},

    runewordIsComplete(): Map<string, boolean> {
      // console.log("*** runewordIsComplete()");

      /** @type {Map<string, boolean>} */
      const map = new Map();

      this.items.forEach((runeword) => {
        map.set(
          runeword.title,
          runeword.runes.every((runeId) => this.haveRunes[runeId])
        );
      });

      return map;
    },

    itemsBySort(): TRunewordItem[] {
      const list = this.items.slice();

      // let compareFn: ((a: TRuneword, b: TRuneword) => number) | undefined;
      let compareFn: ((a: TRuneword, b: TRuneword) => number) | undefined;

      if (this.sortKey === "title") {
        compareFn = ({ title: a }, { title: b }) =>
          a === b ? 0 : a > b ? 1 : -1;
      } else if (this.sortKey === "level") {
        compareFn = ({ level: a }, { level: b }) =>
          a === b ? 0 : a > b ? 1 : -1;
      } else if (this.sortKey === "ttypes") {
        compareFn = ({ ttypes: a }, { ttypes: b }) =>
          a[0] === b[0] ? 0 : a[0] > b[0] ? 1 : -1;
      } else if (/rune(\d)/.test(this.sortKey)) {
        const runeNr = parseInt(RegExp.$1);

        compareFn = ({ runes: runesA }, { runes: runesB }) => {
          const a = runesA[runeNr];
          const b = runesB[runeNr];
          return a === b ? 0 : a > b ? 1 : -1;
        };
      }

      compareFn && list.sort(compareFn);

      !this.sortAsc && list.reverse();

      // move completed items to the top
      const list2 = [
        ...list.filter((word) => this.runewordIsComplete.get(word.title)),
        ...list.filter((word) => !this.runewordIsComplete.get(word.title))
      ];

      //
      const list3 = [
        ...list2.filter((word) => this.pinnedRunewords.has(word.title)),
        ...list2.filter((word) => !this.pinnedRunewords.has(word.title))
      ];

      return list3;
    },

    refPopup(): TRunewordPopup {
      return this.$refs.popup as TRunewordPopup;
    },
  },

  methods: {
    cssActiveRune(runeId: TRuneId) {
      return this.haveRunes[runeId] ? "is-active" : "";
    },

    cssCompleteRuneword(word: TRuneword) {
      return this.runewordIsComplete.get(word.title) ? "is-complete" : "";
    },

    getTypeCellHtml(word: TRuneword) {
      // could do additional formatting here
      let cellHtml = word.ttypes
        .map((type) => {
          const typeHtml = type.replace(" ", "&nbsp;");
          if (itemTypesData[type].url)
            return `<a href="${itemTypesData[type].url}" target="_blank">${typeHtml}</a>`;
          return typeHtml;
        })
        .join("&nbsp;/&nbsp;");

      if (word.tinfos) {
        cellHtml += `<br><span class="rw-Table-tdTypeClass">${word.tinfos}</span>`;
      }

      return cellHtml;
    },

    isSortKey(key: string) {
      return key === this.sortKey;
    },

    onEnterRuneword(ev: Event, runeword: TRuneword) {
      if (ev.type === "mouseenter" && window.matchMedia("(max-width: 767px)").matches) return;
      // paranoia
      if (!ev.target) return;

      this.refPopup.showRuneword(runeword, ev.target as HTMLElement);
    },

    onLeaveRuneword() {
      if (window.matchMedia("(max-width: 767px)").matches) return;
      this.refPopup.setVisible(false);
    },

    onSortBy(key: string) {
      this.sortAsc = this.sortKey === key ? !this.sortAsc : true;
      this.sortKey = key;
    },

    onTogglePin(id: TRunewordId) {
      const state = store.isPinned(id);
      store.setPinned([id], !state);
      store.saveState();
    },

    unpinAll() {
      const ids = store.getPinned();
      store.setPinned(ids, false);
      store.saveState();
    },
  },
});
</script>
