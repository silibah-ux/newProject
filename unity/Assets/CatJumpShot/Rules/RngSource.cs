namespace CatJumpShot.Rules
{
    /// <summary>Same generator as js/logic.js createRng.</summary>
    public sealed class RngSource
    {
        int state;

        public RngSource(uint seed)
        {
            state = unchecked((int)seed);
        }

        public double Next()
        {
            state |= 0;
            state = unchecked(state + 0x6d2b79f5);
            int mixed = Imul(state ^ (int)((uint)state >> 15), 1 | state);
            mixed = unchecked(mixed + Imul(mixed ^ (int)((uint)mixed >> 7), 61 | mixed)) ^ mixed;
            uint bits = (uint)(mixed ^ (int)((uint)mixed >> 14));
            return bits / 4294967296.0;
        }

        public int Index(int length)
        {
            return (int)System.Math.Floor(Next() * length);
        }

        static int Imul(int a, int b)
        {
            return unchecked(a * b);
        }
    }
}
