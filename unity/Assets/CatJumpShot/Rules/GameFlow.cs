namespace CatJumpShot.Rules
{
    public enum ScreenId
    {
        Title,
        Chapter,
        Stages,
        Play,
        Pause,
        StageResult,
        InfiniteResult,
        Codex,
        Shop,
        Settings,
        Ranking,
        Share,
    }

    public sealed class GameFlow
    {
        public ScreenId Screen = ScreenId.Title;
        public readonly SaveFile Save = new SaveFile();
        public ShotClock Clock;
        public StageSummary LastStage;
        public InfiniteSummary LastInfinite;
        public bool AdVisible;
        public bool ReviveOffer;
        public int? StillChapter;
        public string ShareText = "";
        public int SelectedChapter = 1;
        public string StageId;

        readonly uint seed;
        int shotSerial;

        public GameFlow(uint seed)
        {
            this.seed = seed;
        }

        public void Boot()
        {
            Screen = ScreenId.Title;
        }

        public void Tick(long now)
        {
            if (Screen != ScreenId.Play || Clock == null || Clock.Paused) return;
            Clock.Update(now);
        }

        public void Pointer(long now)
        {
            if (AdVisible || Screen != ScreenId.Play || Clock == null) return;
            string signal = Clock.Tap(now);
            if (signal == "shot") Progression.AddCodex(Save, Clock.HeroId, Clock.Shots[Clock.Shots.Count - 1].Tier);
            if (signal == "done") FinishStage();
            if (signal == "revive") OfferRevive();
        }

        public void TapStart()
        {
            Screen = ScreenId.Chapter;
        }

        public void TapInfinite(long now)
        {
            if (!Progression.InfiniteUnlocked(Save)) return;
            ReviveOffer = false;
            AdVisible = false;
            var rules = ShotMath.Infinite(0);
            Clock = new ShotClock("infinite", rules, StageTable.InfiniteScenes[0], Save.SelectedCat, seed + 5000);
            Clock.Start(now);
            Screen = ScreenId.Play;
        }

        public void Open(ScreenId screen)
        {
            Screen = screen;
        }

        public void Back()
        {
            if (Screen == ScreenId.Stages || Screen == ScreenId.Ranking || Screen == ScreenId.Codex
                || Screen == ScreenId.Shop || Screen == ScreenId.Settings)
            {
                Screen = ScreenId.Title;
                return;
            }
            if (Screen == ScreenId.Chapter) Screen = ScreenId.Title;
        }

        public bool SelectChapter(int chapter)
        {
            if (!Progression.ChapterUnlocked(Save, chapter)) return false;
            SelectedChapter = chapter;
            Screen = ScreenId.Stages;
            return true;
        }

        public bool SelectStage(string id, long now)
        {
            var stage = StageTable.ById(id);
            if (stage == null || !Progression.ChapterUnlocked(Save, stage.Chapter)) return false;
            StageId = id;
            SelectedChapter = stage.Chapter;
            ReviveOffer = false;
            Clock = new ShotClock("stage", stage.Rules, stage.Scene, Save.SelectedCat, seed + (uint)shotSerial);
            shotSerial += 1;
            Clock.Start(now);
            Screen = ScreenId.Play;
            return true;
        }

        public void Pause(long now)
        {
            if (Screen != ScreenId.Play || Clock == null) return;
            Clock.Pause(now);
            Screen = ScreenId.Pause;
        }

        public void Resume(long now)
        {
            if (Clock == null) return;
            Clock.Resume(now);
            if (Clock.Voided) Clock.BeginShot(now);
            Screen = ScreenId.Play;
        }

        public void Restart(long now)
        {
            if (StageId == null) return;
            SelectStage(StageId, now);
        }

        public void Quit()
        {
            if (Clock != null && !Clock.Over) Clock.Hide();
            Clock = null;
            Screen = ScreenId.Stages;
        }

        public void Background(long now)
        {
            if (Screen != ScreenId.Play || Clock == null) return;
            if (!Clock.Over && Clock.Photo == null) Clock.Hide();
            Clock.Pause(now);
            Screen = ScreenId.Pause;
        }

        public void CloseAd()
        {
            AdVisible = false;
        }

        public void CloseStill()
        {
            StillChapter = null;
        }

        public void DeclineRevive()
        {
            ReviveOffer = false;
            if (Clock != null) Clock.End();
            FinishInfinite();
        }

        public void AcceptRevive(long now, bool adLoaded)
        {
            if (!ReviveOffer || Clock == null) return;
            ReviveOffer = false;
            if (!adLoaded)
            {
                Clock.End();
                FinishInfinite();
                return;
            }
            Clock.Revive(now);
            Screen = ScreenId.Play;
        }

        public void Share()
        {
            if (Screen != ScreenId.StageResult && Screen != ScreenId.InfiniteResult) return;
            if (Screen == ScreenId.InfiniteResult && LastInfinite != null)
            {
                ShareText = "고양이 점프샷 " + LastInfinite.Success + "컷";
            }
            else if (LastStage != null)
            {
                ShareText = "고양이 점프샷 평균 " + LastStage.Avg + "ms";
            }
            Screen = ScreenId.Share;
        }

        public void CloseShare()
        {
            Screen = LastInfinite != null && LastStage == null ? ScreenId.InfiniteResult : ScreenId.StageResult;
            if (LastInfinite != null && StageId == null) Screen = ScreenId.InfiniteResult;
        }

        public void ContinueAfterResult()
        {
            AdVisible = false;
            StillChapter = null;
            Screen = ScreenId.Stages;
        }

        void FinishStage()
        {
            LastStage = ShotMath.SummarizeStage(Clock.Shots);
            LastInfinite = null;
            Progression.ApplyStage(Save, StageId, LastStage);
            Save.StagePlays += 1;
            var stage = StageTable.ById(StageId);
            if (stage != null && stage.Index == 5 && LastStage.Cleared && Save.SeenStill.Add(stage.Chapter))
            {
                StillChapter = stage.Chapter;
            }
            AdVisible = Progression.ShowInterstitial(Save.StagePlays, Save.AdsRemoved);
            Screen = ScreenId.StageResult;
        }

        void OfferRevive()
        {
            ReviveOffer = true;
            Screen = ScreenId.InfiniteResult;
        }

        void FinishInfinite()
        {
            LastInfinite = ShotMath.SummarizeInfinite(Clock.Shots);
            LastStage = null;
            StageId = null;
            if (LastInfinite.Eligible)
            {
                var entry = new BoardEntry
                {
                    Id = "local",
                    Cuts = LastInfinite.Success,
                    Avg = LastInfinite.Avg ?? 9999,
                    At = Save.Board.Count + 1,
                };
                if (Save.InfiniteBest == null || entry.Cuts > Save.InfiniteBest.Cuts
                    || (entry.Cuts == Save.InfiniteBest.Cuts && entry.Avg < Save.InfiniteBest.Avg))
                {
                    Save.InfiniteBest = entry;
                }
                Progression.InsertBoard(Save.Board, entry);
            }
            Screen = ScreenId.InfiniteResult;
        }
    }
}
