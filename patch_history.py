import re

with open("src/views/HistoryView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add to HistoryViewProps
if "onNavigateToManhua?: " not in content:
    content = content.replace("onClearAllAnime: () => void;\n}", "onClearAllAnime: () => void;\n  onNavigateToManhua?: (manhuaId: string) => void;\n  onNavigateToAnime?: (animeId: string) => void;\n}")
    content = content.replace("onClearAllAnime\n}: HistoryViewProps)", "onClearAllAnime,\n  onNavigateToManhua,\n  onNavigateToAnime\n}: HistoryViewProps)")

# Add button for manhua
old_manhua_btn = """                        <button
                          onClick={() => onSelectChapter(item.manhuaId, item.chapterId, item.pageIndex, item)}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer text-[10px]"
                          id={`resume-history-${item.id}`}
                        >
                          <Play className="w-3 h-3 fill-white text-white" />
                          <span>استكمال القراءة</span>
                        </button>"""
new_manhua_btn = """                        <div className="flex gap-2">
                          <button
                            onClick={() => onNavigateToManhua && onNavigateToManhua(item.manhuaId)}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer text-[10px]"
                            id={`details-manhua-${item.id}`}
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>صفحة العمل</span>
                          </button>
                          <button
                            onClick={() => onSelectChapter(item.manhuaId, item.chapterId, item.pageIndex, item)}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer text-[10px]"
                            id={`resume-history-${item.id}`}
                          >
                            <Play className="w-3 h-3 fill-white text-white" />
                            <span>استكمال القراءة</span>
                          </button>
                        </div>"""
content = content.replace(old_manhua_btn, new_manhua_btn)

# Add button for anime
old_anime_btn = """                        <button
                          onClick={() => onSelectEpisode(item.animeId, item.episodeNumber)}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer text-[10px]"
                          id={`resume-anime-${item.id}`}
                        >
                          <Play className="w-3 h-3 fill-white text-white" />
                          <span>استكمال المشاهدة</span>
                        </button>"""
new_anime_btn = """                        <div className="flex gap-2">
                          <button
                            onClick={() => onNavigateToAnime && onNavigateToAnime(item.animeId)}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer text-[10px]"
                            id={`details-anime-${item.id}`}
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>صفحة العمل</span>
                          </button>
                          <button
                            onClick={() => onSelectEpisode(item.animeId, item.episodeNumber)}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer text-[10px]"
                            id={`resume-anime-${item.id}`}
                          >
                            <Play className="w-3 h-3 fill-white text-white" />
                            <span>استكمال المشاهدة</span>
                          </button>
                        </div>"""
content = content.replace(old_anime_btn, new_anime_btn)

with open("src/views/HistoryView.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Patched history view")
