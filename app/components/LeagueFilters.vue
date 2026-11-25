<script setup lang="ts">
// `type="search"` keeps the search keyboard on phones; the browser's own clear button is hidden
// because ours (below) looks and works the same in every browser.
const SEARCH_UI = {
  base: 'min-h-11 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
  trailing: 'pe-1',
}
/** The select primitive rejects an empty-string value, so "All sports" needs a sentinel. */
const ALL_SPORTS = '__all__'

const leagues = useLeaguesStore()
const list = useLeagueListStore()

// The one allowed local copy of URL state: typing shows at once, the URL follows debounced.
const draft = ref(list.query)
// What this component last wrote to the URL: its arrival must not re-sync the draft.
let ownWrite: string | undefined

const writeQuery = useDebounceFn((text: string) => {
  ownWrite = text
  void list.setQuery(text)
}, 250)

function onInput(text: string) {
  draft.value = text
  void writeQuery(text)
}

function clear() {
  onInput('')
  void writeQuery.flush()
}

// `q` changed from outside (Back, Forward): take it and drop the pending write. Synchronous, so
// the arrival of our own write is recognised before anything else can change `q`.
watch(() => list.query, (value) => {
  const isOwnWrite = value === ownWrite
  ownWrite = undefined
  if (isOwnWrite) return
  writeQuery.cancel()
  draft.value = value
}, { flush: 'sync' })

// "Reset filters" / "Clear filters" may leave `q` as it is (already empty) with a write pending.
// Pinia removes this subscription when the component unmounts.
list.$onAction(({ name, after }) => {
  if (name !== 'reset') return
  writeQuery.cancel()
  after(() => {
    draft.value = ''
  })
})

// VueUse does not cancel a pending debounced call on unmount.
onBeforeUnmount(() => writeQuery.cancel())

const sportItems = computed(() => [
  { label: `All sports (${leagues.leagues.length})`, value: ALL_SPORTS },
  ...leagues.sportOptions.map(({ sport, count }) => ({ label: `${sport} (${count})`, value: sport })),
])

// Always shown, so the filter is discoverable. With one sport there is nothing to choose: it is
// disabled with a note (the brief asks for filtering when several sports appear, R4).
const sportDisabled = computed(() => leagues.sportOptions.length < 2)
const onlySport = computed(() => sportDisabled.value ? leagues.sportOptions[0]?.sport : undefined)

function onSport(value: string) {
  void list.setSport(value === ALL_SPORTS ? undefined : value)
}
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <div class="min-w-0 grow-3 basis-64">
      <label
        for="league-search"
        class="sr-only"
      >Search leagues</label>
      <UInput
        id="league-search"
        :model-value="draft"
        type="search"
        placeholder="Search leagues…"
        icon="i-lucide-search"
        size="xl"
        autocomplete="off"
        class="w-full"
        :ui="SEARCH_UI"
        @update:model-value="onInput"
      >
        <template
          v-if="draft !== ''"
          #trailing
        >
          <UButton
            color="neutral"
            variant="link"
            icon="i-lucide-x"
            aria-label="Clear search"
            class="size-11 justify-center"
            @click="clear"
          />
        </template>
      </UInput>
    </div>
    <div class="min-w-0 grow basis-40">
      <USelect
        :model-value="list.sport ?? ALL_SPORTS"
        :items="sportItems"
        :disabled="sportDisabled"
        aria-label="Sport"
        :aria-describedby="onlySport ? 'sport-note' : undefined"
        size="xl"
        class="min-h-11 w-full"
        @update:model-value="onSport"
      />
      <p
        v-if="onlySport"
        id="sport-note"
        class="mt-1 text-xs text-muted"
      >
        Only {{ onlySport }} leagues in the data
      </p>
    </div>
  </div>
</template>
