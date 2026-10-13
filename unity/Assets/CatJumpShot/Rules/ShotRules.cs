using System;
using System.Collections.Generic;

namespace CatJumpShot.Rules
{
    public sealed class ShotRules
    {
        public int FakeMin;
        public int FakeMax;
        public string[] FakePool;
        public int WaitMin;
        public int WaitMax;
        public int GapMin;
        public int GapMax;
        public int LateMs;
        public bool Birds;
        public bool Laundry;
        public bool Flicker;
        public bool Hint;
        public int CatCount;
    }

    public sealed class StageDef
    {
        public StageDef(
            string id,
            int chapter,
            int index,
            string scene,
            string placeKo,
            string placeEn,
            int fakeMin,
            int fakeMax,
            string[] fakePool,
            int waitMin,
            int waitMax,
            int gapMin,
            int gapMax,
            int lateMs,
            bool birds,
            bool laundry,
            bool flicker,
            int catCount,
            bool hint)
        {
            Id = id;
            Chapter = chapter;
            Index = index;
            Scene = scene;
            PlaceKo = placeKo;
            PlaceEn = placeEn;
            Rules = new ShotRules
            {
                FakeMin = fakeMin,
                FakeMax = fakeMax,
                FakePool = fakePool,
                WaitMin = waitMin,
                WaitMax = waitMax,
                GapMin = gapMin,
                GapMax = gapMax,
                LateMs = lateMs,
                Birds = birds,
                Laundry = laundry,
                Flicker = flicker,
                CatCount = catCount,
                Hint = hint,
            };
        }

        public string Id { get; }
        public int Chapter { get; }
        public int Index { get; }
        public string Scene { get; }
        public string PlaceKo { get; }
        public string PlaceEn { get; }
        public ShotRules Rules { get; }
    }

    public sealed class ShotEvent
    {
        public string Type;
        public string Kind;
        public int Cat;
        public double Ms;
    }

    public sealed class ShotResult
    {
        public string Tier;
        public bool Success;
        public bool HasMs;
        public int Ms;
        public int ScoreMs;
        public bool Suspicious;
        public string Scene;
        public string CatId;
    }

    public static class ShotMath
    {
        public static List<ShotEvent> Plan(ShotRules rules, RngSource rng)
        {
            var events = new List<ShotEvent>();
            events.Add(Wait(Between(rng, rules.WaitMin, rules.WaitMax)));
            int span = rules.FakeMax - rules.FakeMin + 1;
            int fakeCount = rules.FakeMin + (int)Math.Floor(rng.Next() * span);
            for (int i = 0; i < fakeCount; i++)
            {
                string kind = rules.FakePool[(int)Math.Floor(rng.Next() * rules.FakePool.Length)];
                int cat = (int)Math.Floor(rng.Next() * Math.Max(1, rules.CatCount));
                events.Add(new ShotEvent
                {
                    Type = "fake",
                    Kind = kind,
                    Cat = cat,
                    Ms = ShotBands.FakeMs(kind),
                });
                events.Add(Wait(Between(rng, rules.GapMin, rules.GapMax)));
            }
            events.Add(new ShotEvent { Type = "crouch", Ms = ShotBands.CrouchMs });
            events.Add(new ShotEvent { Type = "jump", Ms = rules.LateMs });
            return events;
        }

        public static ShotRules Infinite(int successes)
        {
            int level = successes / 4;
            return new ShotRules
            {
                FakeMin = Math.Min(3, 1 + level / 2),
                FakeMax = Math.Min(3, 1 + Math.Min(2, level)),
                FakePool = level >= 1
                    ? new[] { "wiggle", "tail", "crouch", "hop" }
                    : new[] { "wiggle", "tail" },
                WaitMin = Math.Max(280, 900 - level * 70),
                WaitMax = Math.Max(760, 1700 - level * 90),
                GapMin = Math.Max(180, 400 - level * 30),
                GapMax = Math.Max(420, 800 - level * 40),
                LateMs = Math.Max(400, 520 - level * 10),
                Birds = level >= 2,
                Laundry = level >= 3,
                Flicker = level >= 4,
                CatCount = level >= 6 ? 3 : level >= 4 ? 2 : 1,
                Hint = false,
            };
        }

        public static double JumpProgress(double elapsed, int lateMs)
        {
            double split = Math.Min(ShotBands.LegendMs, lateMs * 0.45);
            if (elapsed <= 0) return 0;
            if (elapsed >= lateMs) return 1;
            if (elapsed <= split) return (elapsed / split) * 0.5;
            return 0.5 + ((elapsed - split) / (lateMs - split)) * 0.5;
        }

        public static ShotResult Judge(int ms, int lateMs)
        {
            if (ms < 0)
            {
                return new ShotResult
                {
                    Tier = "early",
                    Success = false,
                    ScoreMs = ShotBands.EarlyScore,
                };
            }
            if (ms > lateMs)
            {
                return new ShotResult
                {
                    Tier = "late",
                    Success = false,
                    HasMs = true,
                    Ms = ms,
                    ScoreMs = ShotBands.LateScore,
                };
            }
            string tier = ms <= ShotBands.LegendMs
                ? "legendary"
                : ms <= ShotBands.NormalMs ? "normal" : "shame";
            return new ShotResult
            {
                Tier = tier,
                Success = true,
                HasMs = true,
                Ms = ms,
                ScoreMs = ms,
                Suspicious = ms < ShotBands.MinHumanMs,
            };
        }

        public static StageSummary SummarizeStage(IReadOnlyList<ShotResult> shots)
        {
            int success = 0;
            int sum = 0;
            foreach (var shot in shots)
            {
                if (shot.Success) success += 1;
                sum += shot.ScoreMs;
            }
            int avg = Round(sum / (double)shots.Count);
            bool cleared = success >= ShotBands.ClearSuccesses;
            int stars = 0;
            if (cleared)
            {
                if (avg <= ShotBands.Star3Ms) stars = 3;
                else if (avg <= ShotBands.Star2Ms) stars = 2;
                else stars = 1;
            }
            return new StageSummary { Success = success, Avg = avg, Cleared = cleared, Stars = stars };
        }

        public static InfiniteSummary SummarizeInfinite(IReadOnlyList<ShotResult> shots)
        {
            int success = 0;
            int msSum = 0;
            bool eligible = true;
            foreach (var shot in shots)
            {
                if (shot.Suspicious) eligible = false;
                if (!shot.Success) continue;
                success += 1;
                msSum += shot.Ms;
            }
            int? avg = success == 0 ? (int?)null : Round(msSum / (double)success);
            if (success == 0) eligible = false;
            return new InfiniteSummary
            {
                Success = success,
                Fails = shots.Count - success,
                Avg = avg,
                Eligible = eligible,
            };
        }

        public static int Round(double value)
        {
            return (int)Math.Floor(value + 0.5);
        }

        static ShotEvent Wait(double ms)
        {
            return new ShotEvent { Type = "wait", Ms = ms };
        }

        static double Between(RngSource rng, int min, int max)
        {
            return min + rng.Next() * (max - min);
        }
    }

    public sealed class StageSummary
    {
        public int Success;
        public int Avg;
        public bool Cleared;
        public int Stars;
    }

    public sealed class InfiniteSummary
    {
        public int Success;
        public int Fails;
        public int? Avg;
        public bool Eligible;
    }
}
