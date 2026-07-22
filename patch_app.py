import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_history_render = """        {currentView === 'history' && (
          <HistoryView 
            history={history}
            animeHistory={animeHistory}
            onSelectChapter={handleSelectChapter}
            onSelectEpisode={async (animeId, episodeNumber) => {
              setSelectedManhuaId(animeId);
              setAppMode('anime');
              setSelectedChapterId(episodeNumber.toString());
              setCurrentView('anime-player');
              
              // Prefetch anime details in the background so player can load
              // the actual video source
            }}
            onRemoveItem={handleRemoveHistoryItem}
            onRemoveAnimeItem={handleRemoveAnimeHistoryItem}
            onClearAll={handleClearHistory}
            onClearAllAnime={handleClearAnimeHistory}
          />
        )}"""

new_history_render = """        {currentView === 'history' && (
          <HistoryView 
            history={history}
            animeHistory={animeHistory}
            onSelectChapter={handleSelectChapter}
            onSelectEpisode={async (animeId, episodeNumber) => {
              setSelectedManhuaId(animeId);
              setAppMode('anime');
              setSelectedChapterId(episodeNumber.toString());
              setCurrentView('anime-player');
            }}
            onRemoveItem={handleRemoveHistoryItem}
            onRemoveAnimeItem={handleRemoveAnimeHistoryItem}
            onClearAll={handleClearHistory}
            onClearAllAnime={handleClearAnimeHistory}
            onNavigateToManhua={(manhuaId) => {
              setSelectedManhuaId(manhuaId);
              setAppMode('manga');
              setCurrentView('manhua');
            }}
            onNavigateToAnime={(animeId) => {
              setSelectedManhuaId(animeId);
              setAppMode('anime');
              setCurrentView('anime-details');
            }}
          />
        )}"""

if "onNavigateToManhua={" not in content:
    content = content.replace(old_history_render, new_history_render)
    with open("src/App.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched App.tsx")
else:
    print("Already patched")
