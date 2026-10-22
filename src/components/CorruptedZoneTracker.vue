<template>
  <main class="rw-ZonePage" aria-labelledby="zone-page-title">
    <a href="#" class="rw-Header-link inline-flex items-center min-h-[44px] mb-4">← Back to runewords</a>
    <h1 id="zone-page-title" tabindex="-1" class="text-[#e9bf40] text-2xl font-bold mb-3">Corrupted Zones</h1>
    <p class="text-[#b4ac92] mb-6">Follow the rotation and get notified when your favorite farming zones become active.</p>
    <div class="rw-ZoneCurrent border border-[#51452e] rounded bg-[#17130e] p-4 mb-6">
      <div>
        <p class="text-xs text-[#b4ac92] mb-1">Active now</p>
        <p class="text-[#d5b0f3] text-lg font-bold mb-0">{{ current.name }}</p>
      </div>
      <div class="rw-ZoneClock">
        <span class="text-xs text-[#b4ac92]">Changes in</span>
        <span class="text-[#e9bf40] text-lg font-bold" role="timer" aria-label="Time until next corrupted zone">{{ countdown(current.endsAt) }}</span>
      </div>
    </div>
    <div class="rw-ZonePage-grid">
      <section class="border border-[#51452e] rounded bg-[#17130e] p-4" aria-labelledby="upcoming-title">
        <h2 id="upcoming-title" class="text-[#e9bf40] font-bold mb-2">Upcoming zones</h2>
        <p class="text-sm text-[#b4ac92] mb-3">Changes every 15 minutes. Times shown in your local time.</p>
        <ol class="rw-ZoneSchedule">
          <li v-for="zone in upcoming" :key="zone.startsAt">
            <span class="text-[#a0c6ff]">{{ zone.name }}</span>
            <span class="text-sm text-[#b4ac92]">{{ localTime(zone.startsAt) }}</span>
          </li>
        </ol>
      </section>
      <section class="border border-[#51452e] rounded bg-[#17130e] p-4" aria-labelledby="alerts-title">
        <h2 id="alerts-title" class="text-[#e9bf40] font-bold mb-2">Your zone alerts</h2>
        <p class="text-sm text-[#b4ac92] mb-3">Choose zones below, then enable browser notifications. Alerts appear when a selected zone becomes active, including the current zone if selected.</p>
        <p class="text-sm text-[#b4ac92] mb-4">Keep this site open in a tab. Alerts also work while browsing runewords; closing the site stops alerts. Sleeping devices and suspended tabs can delay them.</p>
        <p v-if="!state.supported" class="text-sm text-[#e4b67c] mb-3">Browser notifications are unavailable here. Open the HTTPS site in a browser that supports notifications.</p>
        <div class="flex flex-wrap gap-3 items-center mb-3">
          <button v-if="state.enabled" type="button" class="rwf-btn min-h-[44px]" @click="pauseAlerts">Pause notifications</button>
          <button v-if="!state.enabled || state.permissionBlocked" type="button" class="rwf-btn min-h-[44px]" :disabled="!state.supported || !state.selected.length || state.busy" @click="enableAlerts">{{ state.busy ? 'Enabling…' : 'Enable notifications' }}</button>
          <span class="text-sm text-[#b4ac92]">{{ state.selected.length }} selected · {{ state.enabled ? (state.permissionBlocked ? 'Permission needed' : 'Alerts on') : 'Alerts off' }}</span>
        </div>
        <p v-if="state.message" role="status" class="text-sm text-[#e4b67c] mb-3">{{ state.message }}</p>
        <p v-if="state.lastNotification" class="text-xs text-[#b4ac92] mb-3">Last alert sent to browser: {{ state.lastNotification }}</p>
        <div class="rw-ZoneAlertOptions">
          <label><input type="checkbox" :checked="state.advanceEnabled" @change="changeAdvance" /><span>Also alert me 5 minutes before a selected zone starts</span></label>
          <div class="text-sm text-[#b4ac92] border-l-2 border-[#8a8062] pl-3 leading-relaxed" aria-label="Reminder schedule status">
            <p v-if="!state.enabled" class="mb-0">Reminders paused — enable notifications above.</p>
            <p v-else-if="state.permissionBlocked" class="mb-0">Reminders blocked — allow browser notifications above.</p>
            <p v-else-if="!state.advanceEnabled" class="mb-0">Five-minute reminders are off.</p>
            <p v-else-if="!nextReminder" class="mb-0">Select a zone to schedule a reminder.</p>
            <template v-else>
              <p class="mb-1">Next selected zone: <span class="text-[#a0c6ff]">{{ nextReminder.name }}</span> at {{ localTime(nextReminder.startsAt) }}.</p>
              <p class="mb-0">Reminder: {{ reminderScheduleStatus }}.</p>
            </template>
            <p class="text-xs mb-0 mt-2">Last scheduler check: {{ new Date(state.now).toLocaleTimeString() }}. A minimized or sleeping tab may delay or miss reminders. Dependable background delivery requires server-sent push notifications.</p>
            <p v-if="state.schedulerMessage" role="status" class="text-[#e4b67c] mt-2 mb-0">{{ state.schedulerMessage }}</p>
          </div>
          <label><input type="checkbox" :checked="state.soundEnabled" @change="changeSound" /><span>Play a sound with alerts</span></label>
          <div class="flex flex-wrap items-center gap-3">
            <button type="button" class="rwf-btn min-h-[44px]" @click="testAlertSound">Test sound</button>
            <span class="text-xs text-[#b4ac92]">{{ state.soundEnabled ? (state.soundReady ? 'Site chime ready' : 'Browser sound enabled') : 'Alert sound off' }}</span>
          </div>
          <p v-if="state.soundMessage" role="status" class="text-xs text-[#b4ac92] mb-0">{{ state.soundMessage }}</p>
          <p class="text-xs text-[#b4ac92] mb-0">Visible tabs use the site chime after notification delivery. Background alerts request your browser’s notification sound. Device volume, browser settings, and Do Not Disturb can silence it. Test sound activates the site chime after a refresh.</p>
        </div>
        <details class="mb-5 text-sm">
          <summary class="rw-Header-link cursor-pointer min-h-[44px] flex items-center">Recent real alerts</summary>
          <p v-if="!state.history.length" class="text-[#b4ac92]">No alerts recorded yet.</p>
          <ul class="text-[#b4ac92] leading-relaxed">
            <li v-for="entry in state.history" :key="`${entry.startsAt}-${entry.name}-${entry.advance}`" class="py-2 border-b border-[#382e20]">
              {{ entry.name }} · {{ entry.advance ? '5-minute reminder' : 'zone start' }} · {{ entry.status === 'sent' ? 'sent to browser' : entry.status === 'missed' ? 'missed while page checks were paused' : 'delivery failed' }} · {{ localTime(entry.checkedAt) }}<span v-if="entry.status === 'sent' && entry.sound"> · {{ entry.sound === 'chime' ? 'site chime started' : entry.sound === 'browser' ? 'browser sound requested' : entry.sound === 'off' ? 'sound off' : 'sound unavailable' }}</span>
            </li>
          </ul>
        </details>
        <label for="zone-search" class="block text-sm text-[#b4ac92] mb-2">Search zones</label>
        <input id="zone-search" v-model="search" type="search" class="rw-ZoneSelect mb-3" placeholder="Pit, cows, Chaos…" />
        <button type="button" class="rw-Header-link text-sm underline min-h-[44px] mb-2" :disabled="!state.selected.length" @click="clearAlertZones">Clear selected zones</button>
        <p v-if="!filteredZones.length" class="text-sm text-[#b4ac92]">No zones match your search.</p>
        <div class="rw-ZoneChoices">
          <fieldset v-for="group in zoneGroups" :key="group.title" class="min-w-0 mb-4">
            <legend class="text-[#e9bf40] font-bold pt-2 pb-1">{{ group.title }}</legend>
            <label v-for="zone in group.zones" :key="zone" class="rw-ZoneChoice">
              <input type="checkbox" :checked="state.selected.includes(zone)" @change="toggleZone(zone, $event)" />
              <span>
                <span class="block text-[#a0c6ff]">{{ zone }}</span>
                <span class="block text-xs text-[#b4ac92] mt-1">{{ nextTime(zone) }}</span>
              </span>
            </label>
          </fieldset>
        </div>
      </section>
    </div>
    <p class="text-xs text-[#b4ac92] mt-6 mb-0 leading-relaxed">
      Predicted from the published time-based rotation, using your device clock.
      Calculation by <a href="https://exiledagain.github.io/past-dinosaurs/" target="_blank" rel="noopener" class="rw-Header-link underline">exiledagain</a>;
      inspired by <a href="https://pd2.tools/tools/corrupted-zone-tracker" target="_blank" rel="noopener" class="rw-Header-link underline">pd2.tools</a>.
      Alert preferences are saved in this browser.
    </p>
  </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { corruptedZones, nextOccurrence, upcomingZones, zoneAt } from "@/data/corrupted-zones";
import { zoneState, zoneCountdown, selectAlertZone, clearAlertZones, enableAlerts, pauseAlerts, setAlertSound, testAlertSound, setAdvanceAlert, loadZoneSettings, reminderWasSent } from "@/store/corrupted-zones";

type Zone = ReturnType<typeof zoneAt>;
const popularZones = ["Cow Level", "Arcane Sanctuary", "Tamoe Highland and the Pit", "Chaos Sanctuary"];
export default defineComponent({
  name: "CorruptedZoneTracker",
  data() { return { state: zoneState, search: "", sortedZones: [...corruptedZones].sort((a, b) => a.localeCompare(b)) }; },
  computed: {
    current(): Zone { return zoneAt(this.state.now); },
    upcoming(): Zone[] { return upcomingZones(this.state.now); },
    nextReminder(): Zone | null {
      return this.state.selected.map(name => nextOccurrence(name, this.current.endsAt)).filter((zone): zone is Zone => zone !== null).sort((a, b) => a.startsAt - b.startsAt)[0] || null;
    },
    reminderScheduleStatus(): string {
      if (!this.nextReminder) return "no zone selected";
      if (reminderWasSent(this.nextReminder.name, this.nextReminder.startsAt)) return "already sent to browser for this appearance";
      const dueAt = this.nextReminder.startsAt - 5 * 60000;
      return dueAt <= this.state.now ? "due now" : `armed for ${this.localTime(dueAt)}`;
    },
    filteredZones(): string[] { return this.sortedZones.filter(zone => zone.toLowerCase().includes(this.search.trim().toLowerCase())); },
    zoneGroups(): { title: string; zones: string[] }[] {
      return [
        { title: "Popular zones", zones: popularZones.filter(zone => this.filteredZones.includes(zone)) },
        { title: "Other zones", zones: this.filteredZones.filter(zone => !popularZones.includes(zone)) },
      ].filter(group => group.zones.length);
    },
  },
  created() { loadZoneSettings(); },
  methods: {
    countdown: zoneCountdown,
    clearAlertZones,
    enableAlerts,
    pauseAlerts,
    reminderWasSent,
    testAlertSound,
    changeSound(event: Event) { void setAlertSound((event.target as HTMLInputElement).checked); },
    changeAdvance(event: Event) { setAdvanceAlert((event.target as HTMLInputElement).checked); },
    localTime(timestamp: number): string {
      const date = new Date(timestamp);
      const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      return date.toDateString() === new Date(this.state.now).toDateString() ? time : `${date.toLocaleDateString([], { weekday: "short" })} ${time}`;
    },
    nextTime(name: string): string {
      const zone = nextOccurrence(name, this.state.now);
      if (!zone) return "Not found in the next week";
      return zone.startsAt <= this.state.now ? "Active now" : `Next at ${this.localTime(zone.startsAt)}`;
    },
    toggleZone(name: string, event: Event) { selectAlertZone(name, (event.target as HTMLInputElement).checked); },
  },
});
</script>
