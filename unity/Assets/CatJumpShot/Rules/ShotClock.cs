using System.Collections.Generic;

namespace CatJumpShot.Rules
{
    public sealed class ShotClock
    {
        public readonly string Mode;
        public readonly string HeroId;
        public readonly RngSource Rng;
        public readonly List<ShotResult> Shots = new List<ShotResult>();
        public ShotRules Rules;
        public string Scene;
        public bool Paused;
        public bool Voided;
        public bool Over;
        public bool Revived;
        public ShotResult Photo;
        public long PhotoAt;
        public string Phase = "arm";
        public long PhaseStart;
        public long PhaseEnd;
        public long JumpAt;
        public ShotEvent Current;

        readonly List<ShotEvent> events = new List<ShotEvent>();
        int eventIndex;
        long pauseAt;

        public ShotClock(string mode, ShotRules rules, string scene, string heroId, uint seed)
        {
            Mode = mode;
            Rules = rules;
            Scene = scene;
            HeroId = heroId;
            Rng = new RngSource(seed);
        }

        public void Start(long now)
        {
            BeginShot(now);
        }

        public void BeginShot(long now)
        {
            if (Mode == "infinite")
            {
                int successes = 0;
                foreach (var shot in Shots)
                {
                    if (shot.Success) successes += 1;
                }
                Rules = ShotMath.Infinite(successes);
                Scene = StageTable.InfiniteScenes[Rng.Index(StageTable.InfiniteScenes.Length)];
            }
            events.Clear();
            events.AddRange(ShotMath.Plan(Rules, Rng));
            eventIndex = 0;
            Current = null;
            Photo = null;
            Voided = false;
            Phase = "arm";
            PhaseStart = now;
            PhaseEnd = now + ShotBands.ArmMs;
        }

        public void Update(long now)
        {
            if (Paused || Photo != null || Over || Voided) return;
            int guard = 0;
            while (now >= PhaseEnd && guard < 12)
            {
                guard += 1;
                if (Phase == "air")
                {
                    Finish(ShotMath.Judge(Rules.LateMs + 1, Rules.LateMs), now);
                    return;
                }
                if (Phase == "arm")
                {
                    EnterEvent(PhaseEnd);
                    continue;
                }
                eventIndex += 1;
                if (eventIndex >= events.Count) return;
                EnterEvent(PhaseEnd);
            }
        }

        public string Tap(long now)
        {
            if (Over) return "ignore";
            if (Voided)
            {
                BeginShot(now);
                return "next";
            }
            if (Photo != null)
            {
                Photo = null;
                return AfterPhoto(now);
            }
            if (Paused || Phase == "arm") return "ignore";
            if (Phase != "air")
            {
                Finish(ShotMath.Judge(-1, Rules.LateMs), now);
                return "shot";
            }
            Finish(ShotMath.Judge((int)(now - JumpAt), Rules.LateMs), now);
            return "shot";
        }

        public void Hide()
        {
            if (Over || Voided || Photo != null) return;
            Voided = true;
        }

        public void Pause(long now)
        {
            if (Paused || Over) return;
            Paused = true;
            pauseAt = now;
        }

        public void Resume(long now)
        {
            if (!Paused) return;
            long delta = now - pauseAt;
            PhaseStart += delta;
            PhaseEnd += delta;
            JumpAt += delta;
            if (Photo != null) PhotoAt += delta;
            Paused = false;
        }

        public void Revive(long now)
        {
            if (Shots.Count > 0 && !Shots[Shots.Count - 1].Success) Shots.RemoveAt(Shots.Count - 1);
            Revived = true;
            Photo = null;
            Over = false;
            BeginShot(now);
        }

        public void End()
        {
            Over = true;
            Photo = null;
        }

        void EnterEvent(long at)
        {
            Current = events[eventIndex];
            if (Current.Type == "jump")
            {
                Phase = "air";
                JumpAt = at;
                PhaseStart = at;
                PhaseEnd = at + Rules.LateMs;
                return;
            }
            Phase = Current.Type == "fake" ? "fake" : Current.Type;
            PhaseStart = at;
            PhaseEnd = at + (long)Current.Ms;
        }

        void Finish(ShotResult result, long now)
        {
            result.Scene = Scene;
            result.CatId = HeroId;
            Shots.Add(result);
            Photo = result;
            PhotoAt = now;
            Phase = "photo";
        }

        string AfterPhoto(long now)
        {
            int fails = 0;
            foreach (var shot in Shots)
            {
                if (!shot.Success) fails += 1;
            }
            if (Mode == "stage" && Shots.Count >= ShotBands.ShotsPerStage)
            {
                Over = true;
                return "done";
            }
            if (Mode == "infinite" && fails >= ShotBands.InfiniteFails) return "revive";
            BeginShot(now);
            return "next";
        }
    }

    public static class SquareCat
    {
        public static float FrameX(ShotClock clock, long now)
        {
            if (clock == null) return 0.18f;
            if (clock.Photo != null)
            {
                if (clock.Photo.Tier == "late") return 0.82f;
                if (!clock.Photo.Success || !clock.Photo.HasMs) return 0.18f;
                double held = ShotMath.JumpProgress(clock.Photo.Ms, clock.Rules.LateMs);
                return (float)(0.18 + 0.64 * held);
            }
            if (clock.Phase != "air") return 0.18f;
            double progress = ShotMath.JumpProgress(now - clock.JumpAt, clock.Rules.LateMs);
            return (float)(0.18 + 0.64 * progress);
        }
    }
}
