using System;
using System.Collections.Generic;
using CatJumpShot.Rules;

internal static class Program
{
    static int failures;

    static void Main()
    {
        var rng = new RngSource(7);
        Near(rng.Next(), 0.011704753153, "rng");
        var planned = ShotMath.Plan(StageTable.ById("2-5").Rules, new RngSource(7));
        Eq(planned.Count, 7, "plan length");
        Eq(planned[0].Type, "wait", "plan wait");
        Near(planned[0].Ms, 491.9388482160866, "plan wait ms");
        Eq(planned[1].Kind, "hop", "fake hop");
        Eq(planned[planned.Count - 2].Type, "crouch", "crouch");
        Eq(planned[planned.Count - 1].Type, "jump", "jump");
        Eq(planned[planned.Count - 1].Ms, 460, "jump ms");

        var tutorial = ShotMath.Plan(StageTable.All[0].Rules, new RngSource(1));
        Eq(tutorial.Count, 3, "tutorial events");
        Eq(StageTable.All.Length, 20, "stages");
        Eq(StageTable.ById("1-1").Rules.Hint, true, "hint");
        Eq(StageTable.ById("1-1").Rules.FakeMin, 0, "no fake");
        Eq(StageTable.ById("1-1").Rules.LateMs, 580, "late");
        Eq(StageTable.ById("4-5").Rules.CatCount, 3, "three cats");

        Eq(ShotMath.Judge(200, 480).Tier, "legendary", "200");
        Eq(ShotMath.Judge(201, 480).Tier, "normal", "201");
        Eq(ShotMath.Judge(300, 480).Tier, "normal", "300");
        Eq(ShotMath.Judge(301, 480).Success, true, "shame succeeds");
        Eq(ShotMath.Judge(301, 480).Tier, "shame", "301");
        Eq(ShotMath.Judge(481, 480).ScoreMs, ShotBands.LateScore, "late score");
        Eq(ShotMath.Judge(-1, 480).ScoreMs, ShotBands.EarlyScore, "early score");
        Eq(ShotMath.Judge(69, 480).Suspicious, true, "suspicious");
        Eq(ShotMath.Judge(70, 480).Suspicious, false, "human");
        Near(ShotMath.JumpProgress(200, 580), 0.5, "center");

        var recorded = new List<ShotResult>
        {
            ShotMath.Judge(-1, 480),
            ShotMath.Judge(175, 480),
            ShotMath.Judge(481, 480),
            ShotMath.Judge(190, 480),
            ShotMath.Judge(210, 480),
        };
        var summary = ShotMath.SummarizeStage(recorded);
        Eq(summary.Avg, 439, "avg");
        Eq(summary.Cleared, true, "cleared");
        Eq(summary.Stars, 1, "one star");

        var fresh = new GameFlow(1);
        Eq(fresh.SelectChapter(2), false, "chapter locked");
        Eq(Progression.CatUnlocked(fresh.Save, "kong"), false, "cat locked");
        Eq(Progression.ShowInterstitial(1, false), false, "no ad on first play");
        Eq(Progression.ShowInterstitial(3, false), true, "ad on third play");
        Eq(Progression.ShowInterstitial(3, true), false, "ads removed");

        var rules = new ShotRules
        {
            FakeMin = 0,
            FakeMax = 0,
            FakePool = new[] { "wiggle" },
            WaitMin = 500,
            WaitMax = 500,
            GapMin = 100,
            GapMax = 100,
            LateMs = 580,
            CatCount = 1,
        };
        var clock = new ShotClock("stage", rules, "sofa", "cheez", 1);
        clock.Start(0);
        clock.Update(910);
        Eq(clock.Phase, "air", "air");
        Eq(clock.JumpAt, 910L, "jump at");
        clock.Tap(1090);
        Eq(clock.Photo.Tier, "legendary", "180ms");
        Eq(clock.Photo.Ms, 180, "ms");
        Eq(clock.Phase, "photo", "held photo");
        clock.Tap(1400);
        Eq(clock.Phase, "arm", "next shot");
        Eq(clock.PhaseStart, 1400L, "no rewind");

        var live = new GameFlow(3);
        live.TapStart();
        live.SelectChapter(1);
        live.SelectStage("1-1", 0);
        long cursor = 0;
        int liveHits = 0;
        bool started = false;
        int guard = 0;
        while (live.Clock != null && live.Clock.Shots.Count < 2 && guard < 4000)
        {
            guard += 1;
            cursor += 16;
            live.Tick(cursor);
            var action = AutoPlay.Decide(live, cursor, DemoRun.InfiniteHits, false, liveHits);
            if (action != AutoAction.Pointer) continue;
            int before = live.Clock.Shots.Count;
            long stamp = cursor;
            DemoRun.Apply(live, action, ref cursor, ref started);
            if (live.Clock.Shots.Count == before && live.Clock.Phase == "arm" && live.Clock.PhaseStart < stamp)
            {
                Eq(live.Clock.PhaseStart, stamp, "live clock moved backward");
            }
            if (live.Clock.Shots.Count > before && live.Clock.Shots[live.Clock.Shots.Count - 1].Success) liveHits += 1;
        }
        Eq(live.Clock.Shots.Count >= 2, true, "two live shots");
        Eq(live.Clock.Shots[0].Tier, "legendary", "live first");
        Eq(live.Clock.Shots[1].Tier, "legendary", "live second");

        var report = DemoRun.Play(1);
        Eq(report.ChapterCleared, true, "chapter 1");
        Eq(report.ChapterStars, 15, "stars");
        Eq(report.InfiniteCuts, 8, "cuts");
        Eq(report.InfiniteAvg, 180, "infinite avg");
        Eq(report.Eligible, true, "eligible");
        Eq(report.ShareText.Contains("8컷"), true, "share");
        Eq(report.Screens.Contains("Title"), true, "title");
        Eq(report.Screens.Contains("StageResult"), true, "stage result");
        Eq(report.Screens.Contains("InfiniteResult"), true, "infinite result");
        Eq(report.Screens.Contains("Share"), true, "share screen");
        Console.WriteLine(string.Join(" → ", report.Screens));

        if (failures > 0)
        {
            Console.Error.WriteLine(failures + " failed");
            Environment.Exit(1);
        }
        Console.WriteLine("rules ok");
    }

    static void Eq<T>(T actual, T expected, string name)
    {
        if (!EqualityComparer<T>.Default.Equals(actual, expected))
        {
            Console.Error.WriteLine(name + " expected " + expected + " but was " + actual);
            failures += 1;
        }
    }

    static void Near(double actual, double expected, string name)
    {
        if (Math.Abs(actual - expected) > 0.0000001)
        {
            Console.Error.WriteLine(name + " expected " + expected + " but was " + actual);
            failures += 1;
        }
    }
}
