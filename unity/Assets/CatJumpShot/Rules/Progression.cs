using System.Collections.Generic;

namespace CatJumpShot.Rules
{
    public sealed class CatDef
    {
        public string Id;
        public string NameKo;
        public string NameEn;
        public int UnlockChapter;
    }

    public static class Cats
    {
        public static readonly CatDef[] All =
        {
            new CatDef { Id = "cheez", NameKo = "치즈", NameEn = "Cheez", UnlockChapter = 0 },
            new CatDef { Id = "kong", NameKo = "콩", NameEn = "Kong", UnlockChapter = 2 },
            new CatDef { Id = "gurum", NameKo = "구름", NameEn = "Gurum", UnlockChapter = 3 },
            new CatDef { Id = "bamtol", NameKo = "밤톨", NameEn = "Bamtol", UnlockChapter = 4 },
        };

        public static CatDef ById(string id)
        {
            foreach (var cat in All)
            {
                if (cat.Id == id) return cat;
            }
            return All[0];
        }
    }

    public sealed class StageRecord
    {
        public int Stars;
        public int? BestAvg;
        public bool Cleared;
    }

    public sealed class BoardEntry
    {
        public string Id;
        public int Cuts;
        public int Avg;
        public long At;
    }

    public sealed class SaveFile
    {
        public bool AdsRemoved;
        public readonly List<string> PurchasedCats = new List<string>();
        public readonly List<string> AdUnlockedCats = new List<string>();
        public string SelectedCat = "cheez";
        public readonly Dictionary<string, StageRecord> Stages = new Dictionary<string, StageRecord>();
        public readonly Dictionary<string, List<string>> Codex = new Dictionary<string, List<string>>();
        public readonly HashSet<int> SeenStill = new HashSet<int>();
        public int StagePlays;
        public BoardEntry InfiniteBest;
        public readonly List<BoardEntry> Board = new List<BoardEntry>();
    }

    public static class Progression
    {
        public static int ChapterStars(SaveFile save, int chapter)
        {
            int sum = 0;
            foreach (var stage in StageTable.InChapter(chapter))
            {
                StageRecord record;
                if (save.Stages.TryGetValue(stage.Id, out record)) sum += record.Stars;
            }
            return sum;
        }

        public static bool ChapterCleared(SaveFile save, int chapter)
        {
            foreach (var stage in StageTable.InChapter(chapter))
            {
                StageRecord record;
                if (!save.Stages.TryGetValue(stage.Id, out record) || !record.Cleared) return false;
            }
            return true;
        }

        public static bool ChapterUnlocked(SaveFile save, int chapter)
        {
            if (chapter <= 1) return true;
            return ChapterStars(save, chapter - 1) >= ShotBands.ChapterStarGate;
        }

        public static bool InfiniteUnlocked(SaveFile save)
        {
            return ChapterCleared(save, 1);
        }

        public static bool CatUnlocked(SaveFile save, string catId)
        {
            if (catId == "cheez") return true;
            if (save.PurchasedCats.Contains(catId) || save.AdUnlockedCats.Contains(catId)) return true;
            int chapter = Cats.ById(catId).UnlockChapter;
            return chapter > 0 && ChapterCleared(save, chapter);
        }

        public static void ApplyStage(SaveFile save, string stageId, StageSummary summary)
        {
            StageRecord prev;
            if (!save.Stages.TryGetValue(stageId, out prev))
            {
                prev = new StageRecord();
            }
            var next = new StageRecord
            {
                Cleared = prev.Cleared || summary.Cleared,
                Stars = prev.Stars > summary.Stars ? prev.Stars : summary.Stars,
                BestAvg = prev.BestAvg,
            };
            if (summary.Cleared)
            {
                next.BestAvg = prev.BestAvg == null ? summary.Avg : System.Math.Min(prev.BestAvg.Value, summary.Avg);
            }
            save.Stages[stageId] = next;
        }

        public static void AddCodex(SaveFile save, string catId, string tier)
        {
            List<string> owned;
            if (!save.Codex.TryGetValue(catId, out owned))
            {
                owned = new List<string>();
                save.Codex[catId] = owned;
            }
            if (!owned.Contains(tier)) owned.Add(tier);
        }

        public static bool ShowInterstitial(int plays, bool adsRemoved)
        {
            if (adsRemoved) return false;
            return plays > 0 && plays % 3 == 0;
        }

        public static void InsertBoard(List<BoardEntry> board, BoardEntry entry)
        {
            board.Add(entry);
            board.Sort((a, b) =>
            {
                int cuts = b.Cuts.CompareTo(a.Cuts);
                if (cuts != 0) return cuts;
                int avg = a.Avg.CompareTo(b.Avg);
                if (avg != 0) return avg;
                return a.At.CompareTo(b.At);
            });
            if (board.Count > 20) board.RemoveRange(20, board.Count - 20);
        }

        public static int RankOf(IReadOnlyList<BoardEntry> board, string id)
        {
            for (int i = 0; i < board.Count; i++)
            {
                if (board[i].Id == id) return i + 1;
            }
            return 0;
        }
    }
}
