import { FiltrosInteracoesBar } from './FiltrosInteracoesBar';
import { ContagemPorTipoBar } from './ContagemPorTipoBar';
import { FiltrosAtivosChips } from './FiltrosAtivosChips';

interface Ficha360FilterPanelProps {
  draftDays: number;
  draftChannels: string[];
  setDraftDays: (days: number) => void;
  setDraftChannels: (channels: string[]) => void;
  clearDraftFilters: () => void;
  activeCount: number;
  filteredCount: number;
  totalCount: number;
  potentialChannelCounts: any;
  channelCountsReady: boolean;
  filtersDirty: boolean;
  applyDraftFilters: () => void;
  resetDraft: () => void;
  tipoTotals: any;
  tipoFiltered: any;
  channelCountsLoading: boolean;
  days: number;
  channels: string[];
  tags: string[];
  searchTerm: string;
  onRemoveDays: () => void;
  onRemoveChannel: (channel: string) => void;
  onRemoveTag: (tag: string) => void;
  onRemoveSearch: () => void;
  onClearAll: () => void;
}

export function Ficha360FilterPanel({
  draftDays,
  draftChannels,
  setDraftDays,
  setDraftChannels,
  clearDraftFilters,
  activeCount,
  filteredCount,
  totalCount,
  potentialChannelCounts,
  channelCountsReady,
  filtersDirty,
  applyDraftFilters,
  resetDraft,
  tipoTotals,
  tipoFiltered,
  channelCountsLoading,
  days,
  channels,
  tags,
  searchTerm,
  onRemoveDays,
  onRemoveChannel,
  onRemoveTag,
  onRemoveSearch,
  onClearAll
}: Ficha360FilterPanelProps) {
  return (
    <>
      <FiltrosInteracoesBar
        days={draftDays}
        channels={draftChannels}
        onDaysChange={setDraftDays}
        onChannelsChange={setDraftChannels}
        onClear={clearDraftFilters}
        activeCount={activeCount}
        shownCount={filteredCount}
        totalCount={totalCount}
        channelCounts={potentialChannelCounts}
        channelCountsReady={channelCountsReady}
        isDirty={filtersDirty}
        onApply={applyDraftFilters}
        onDiscard={resetDraft}
      />
      <ContagemPorTipoBar
        totals={tipoTotals}
        filtered={tipoFiltered}
        isLoading={channelCountsLoading}
      />
      <FiltrosAtivosChips
        days={days}
        channels={channels}
        tags={tags}
        shownCount={filteredCount}
        totalCount={totalCount}
        searchTerm={searchTerm}
        searchMatchCount={filteredCount}
        onRemoveDays={onRemoveDays}
        onRemoveChannel={onRemoveChannel}
        onRemoveTag={onRemoveTag}
        onRemoveSearch={onRemoveSearch}
        onClearAll={onClearAll}
      />
    </>
  );
}