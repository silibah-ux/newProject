namespace CatJumpShot.Rules
{
    public enum AutoAction
    {
        None,
        TapStart,
        SelectChapter,
        SelectNextStage,
        Back,
        Tick,
        Pointer,
        CloseAd,
        CloseStill,
        DeclineRevive,
        Share,
        Infinite,
    }

    public static class AutoPlay
    {
        public static AutoAction Decide(GameFlow flow, long now, int infiniteHits, bool infiniteStarted, int hits)
        {
            if (flow.AdVisible) return AutoAction.CloseAd;
            if (flow.StillChapter != null) return AutoAction.CloseStill;
            if (flow.Screen == ScreenId.Share) return AutoAction.None;
            if (flow.Screen == ScreenId.Title)
            {
                if (!Progression.InfiniteUnlocked(flow.Save)) return AutoAction.TapStart;
                if (!infiniteStarted) return AutoAction.Infinite;
                return AutoAction.None;
            }
            if (flow.Screen == ScreenId.Chapter) return AutoAction.SelectChapter;
            if (flow.Screen == ScreenId.Stages)
            {
                if (!Progression.ChapterCleared(flow.Save, 1)) return AutoAction.SelectNextStage;
                return AutoAction.Back;
            }
            if (flow.Screen == ScreenId.StageResult) return AutoAction.Back;
            if (flow.Screen == ScreenId.InfiniteResult)
            {
                if (flow.ReviveOffer) return AutoAction.DeclineRevive;
                return AutoAction.Share;
            }
            if (flow.Screen != ScreenId.Play || flow.Clock == null) return AutoAction.None;

            var clock = flow.Clock;
            if (clock.Photo != null && now >= clock.PhotoAt + 280) return AutoAction.Pointer;
            if (clock.Photo != null) return AutoAction.None;
            bool missing = infiniteStarted && hits >= infiniteHits && clock.Phase == "wait" && now >= clock.PhaseStart + 10;
            if (missing) return AutoAction.Pointer;
            if (clock.Phase == "air" && now >= clock.JumpAt + DemoRun.TapMs) return AutoAction.Pointer;
            if (now >= clock.PhaseEnd) return AutoAction.Tick;
            return AutoAction.None;
        }

        public static string NextStageId(SaveFile save)
        {
            foreach (var stage in StageTable.InChapter(1))
            {
                StageRecord record;
                if (!save.Stages.TryGetValue(stage.Id, out record) || !record.Cleared) return stage.Id;
            }
            return null;
        }
    }
}
