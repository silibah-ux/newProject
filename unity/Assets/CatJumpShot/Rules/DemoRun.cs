using System.Collections.Generic;

namespace CatJumpShot.Rules
{
    public sealed class DemoReport
    {
        public bool ChapterCleared;
        public int ChapterStars;
        public int InfiniteCuts;
        public int InfiniteAvg;
        public bool Eligible;
        public string ShareText;
        public readonly List<string> Screens = new List<string>();
    }

    public static class DemoRun
    {
        public const int TapMs = 180;
        public const int InfiniteHits = 8;

        public static DemoReport Play(uint seed)
        {
            var flow = new GameFlow(seed);
            var report = new DemoReport();
            long now = 0;
            bool infiniteStarted = false;
            int hits = 0;
            int guard = 0;
            string previous = "";
            while (guard < 40000)
            {
                guard += 1;
                if (flow.Screen.ToString() != previous)
                {
                    report.Screens.Add(flow.Screen.ToString());
                    previous = flow.Screen.ToString();
                }
                if (flow.Screen == ScreenId.Share)
                {
                    report.ShareText = flow.ShareText;
                    break;
                }
                var action = AutoPlay.Decide(flow, now, InfiniteHits, infiniteStarted, hits);
                if (action == AutoAction.None && flow.Screen == ScreenId.Play && flow.Clock != null)
                {
                    var clock = flow.Clock;
                    if (clock.Photo != null)
                    {
                        now = clock.PhotoAt + 280;
                        action = AutoAction.Pointer;
                    }
                    else if (infiniteStarted && hits >= InfiniteHits && clock.Phase == "wait")
                    {
                        now = clock.PhaseStart + 10;
                        action = AutoAction.Pointer;
                    }
                    else if (clock.Phase == "air")
                    {
                        now = clock.JumpAt + TapMs;
                        action = AutoAction.Pointer;
                    }
                    else
                    {
                        now = clock.PhaseEnd;
                        action = AutoAction.Tick;
                    }
                }
                if (action == AutoAction.None) break;
                int before = flow.Clock == null ? 0 : flow.Clock.Shots.Count;
                Apply(flow, action, ref now, ref infiniteStarted);
                if (flow.Clock != null && flow.Clock.Shots.Count > before && flow.Clock.Shots[flow.Clock.Shots.Count - 1].Success)
                {
                    hits += 1;
                }
                if (action == AutoAction.SelectNextStage || action == AutoAction.Infinite) hits = 0;
            }
            report.ChapterCleared = Progression.ChapterCleared(flow.Save, 1);
            report.ChapterStars = Progression.ChapterStars(flow.Save, 1);
            if (flow.LastInfinite != null)
            {
                report.InfiniteCuts = flow.LastInfinite.Success;
                report.InfiniteAvg = flow.LastInfinite.Avg ?? -1;
                report.Eligible = flow.LastInfinite.Eligible;
            }
            return report;
        }

        public static void Apply(GameFlow flow, AutoAction action, ref long now, ref bool infiniteStarted)
        {
            switch (action)
            {
                case AutoAction.TapStart:
                    flow.TapStart();
                    break;
                case AutoAction.SelectChapter:
                    flow.SelectChapter(1);
                    break;
                case AutoAction.SelectNextStage:
                    now = 0;
                    flow.SelectStage(AutoPlay.NextStageId(flow.Save), now);
                    break;
                case AutoAction.Back:
                    if (flow.Screen == ScreenId.StageResult) flow.ContinueAfterResult();
                    else flow.Back();
                    break;
                case AutoAction.Tick:
                    flow.Tick(now);
                    break;
                case AutoAction.Pointer:
                    if (flow.Clock != null && flow.Clock.Phase == "air") now = flow.Clock.JumpAt + TapMs;
                    flow.Pointer(now);
                    break;
                case AutoAction.CloseAd:
                    flow.CloseAd();
                    break;
                case AutoAction.CloseStill:
                    flow.CloseStill();
                    break;
                case AutoAction.DeclineRevive:
                    flow.DeclineRevive();
                    break;
                case AutoAction.Share:
                    flow.Share();
                    break;
                case AutoAction.Infinite:
                    now = 0;
                    infiniteStarted = true;
                    flow.TapInfinite(now);
                    break;
            }
        }
    }
}
