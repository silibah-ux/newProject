namespace CatJumpShot.Rules
{
    public static class ShotBands
    {
        public const int EarlyScore = 900;
        public const int LateScore = 720;
        public const int LegendMs = 200;
        public const int NormalMs = 300;
        public const int Star3Ms = 260;
        public const int Star2Ms = 400;
        public const int MinHumanMs = 70;
        public const int ChapterStarGate = 8;
        public const int ClearSuccesses = 3;
        public const int ShotsPerStage = 5;
        public const int InfiniteFails = 3;
        public const int CrouchMs = 170;
        public const int ArmMs = 240;

        public static int FakeMs(string kind)
        {
            switch (kind)
            {
                case "wiggle": return 460;
                case "tail": return 400;
                case "crouch": return 300;
                case "hop": return 340;
                default: return 400;
            }
        }
    }
}
