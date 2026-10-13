using System;
using UnityEngine;

namespace CatJumpShot
{
    [CreateAssetMenu(menuName = "Cat Jump Shot/Stage")]
    public sealed class StageDefinition : ScriptableObject
    {
        public string id;
        public int chapter;
        public int index;
        public string scene;
        public string placeKo;
        public string placeEn;
        public int fakeMin;
        public int fakeMax;
        public string[] fakePool;
        public int waitMin;
        public int waitMax;
        public int gapMin;
        public int gapMax;
        public int lateMs;
        public bool birds;
        public bool laundry;
        public bool flicker;
        public int catCount;
        public bool hint;

        public Rules.ShotRules ToRules()
        {
            return new Rules.ShotRules
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

        public void Apply(Rules.StageDef stage)
        {
            id = stage.Id;
            chapter = stage.Chapter;
            index = stage.Index;
            scene = stage.Scene;
            placeKo = stage.PlaceKo;
            placeEn = stage.PlaceEn;
            var rules = stage.Rules;
            fakeMin = rules.FakeMin;
            fakeMax = rules.FakeMax;
            fakePool = rules.FakePool;
            waitMin = rules.WaitMin;
            waitMax = rules.WaitMax;
            gapMin = rules.GapMin;
            gapMax = rules.GapMax;
            lateMs = rules.LateMs;
            birds = rules.Birds;
            laundry = rules.Laundry;
            flicker = rules.Flicker;
            catCount = rules.CatCount;
            hint = rules.Hint;
        }
    }

    public sealed class SquareMatch : MonoBehaviour
    {
        GameFlowView view;
        SpriteRenderer cat;
        Camera cam;
        bool auto;
        int hits;
        bool infiniteStarted;
        bool reported;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Bootstrap()
        {
            if (FindAnyObjectByType<SquareMatch>() != null) return;
            var root = new GameObject("CatJumpShotRoot");
            DontDestroyOnLoad(root);
            root.AddComponent<SquareMatch>();
        }

        void Awake()
        {
            view = new GameFlowView(1);
#if DEVELOPMENT_BUILD || UNITY_EDITOR
            auto = WantsAutoplay();
#endif
            cam = Camera.main;
            if (cam == null)
            {
                var cameraObject = new GameObject("Main Camera");
                cameraObject.tag = "MainCamera";
                cam = cameraObject.AddComponent<Camera>();
                cam.orthographic = true;
                cam.orthographicSize = 5f;
                cam.transform.position = new Vector3(0f, 0f, -10f);
                cameraObject.AddComponent<AudioListener>();
            }
            cam.backgroundColor = new Color(0.18f, 0.13f, 0.1f);
            cat = CreateSquare();
        }

        void Update()
        {
            long now = Now();
            PaintRoom();
            if (auto && !reported) Drive(now);
            else PlayByHand(now);
            PlaceCat(now);
            if (auto && view.Flow.Screen == Rules.ScreenId.Share && !reported) WriteReport();
        }

        void Drive(long now)
        {
            if (view.Flow.Screen == Rules.ScreenId.Play) view.Flow.Tick(now);
            var action = Rules.AutoPlay.Decide(view.Flow, now, Rules.DemoRun.InfiniteHits, infiniteStarted, hits);
            if (action == Rules.AutoAction.None || action == Rules.AutoAction.Tick) return;
            int before = view.Flow.Clock == null ? 0 : view.Flow.Clock.Shots.Count;
            Rules.DemoRun.Apply(view.Flow, action, ref now, ref infiniteStarted);
            if (view.Flow.Clock != null && view.Flow.Clock.Shots.Count > before && view.Flow.Clock.Shots[view.Flow.Clock.Shots.Count - 1].Success)
            {
                hits += 1;
            }
            if (action == Rules.AutoAction.SelectNextStage || action == Rules.AutoAction.Infinite) hits = 0;
        }

        void PlayByHand(long now)
        {
            view.Flow.Tick(now);
            if (Input.GetMouseButtonDown(0) || Input.GetKeyDown(KeyCode.Space)) view.Flow.Pointer(now);
            if (Input.GetKeyDown(KeyCode.Escape) && view.Flow.Screen == Rules.ScreenId.Play) view.Flow.Pause(now);
        }

        void OnApplicationPause(bool paused)
        {
            if (paused) view.Flow.Background(Now());
        }

        void PlaceCat(long now)
        {
            float across = Rules.SquareCat.FrameX(view.Flow.Clock, now);
            var color = CatColor(view.Flow.Save.SelectedCat);
            cat.color = color;
            cat.transform.position = new Vector3(-2.4f + across * 4.8f, Airborne() ? 0.8f : -0.4f, 0f);
            cat.transform.localScale = view.Flow.Clock != null && view.Flow.Clock.Phase == "crouch"
                ? new Vector3(0.7f, 0.45f, 1f)
                : new Vector3(0.7f, 0.7f, 1f);
            cat.enabled = view.Flow.Screen == Rules.ScreenId.Play;
        }

        bool Airborne()
        {
            var clock = view.Flow.Clock;
            if (clock == null) return false;
            if (clock.Photo != null) return clock.Photo.Success;
            return clock.Phase == "air";
        }

        void PaintRoom()
        {
            switch (view.Flow.SelectedChapter)
            {
                case 2: cam.backgroundColor = new Color(0.72f, 0.62f, 0.45f); break;
                case 3: cam.backgroundColor = new Color(0.55f, 0.7f, 0.78f); break;
                case 4: cam.backgroundColor = new Color(0.12f, 0.14f, 0.22f); break;
                default: cam.backgroundColor = new Color(0.78f, 0.66f, 0.48f); break;
            }
        }

        void OnGUI()
        {
            var flow = view.Flow;
            GUI.skin.button.fontSize = 22;
            GUI.skin.label.fontSize = 22;
            GUI.skin.label.alignment = TextAnchor.MiddleCenter;
            float width = Mathf.Min(Screen.width - 40f, 420f);
            var area = new Rect((Screen.width - width) * 0.5f, 40f, width, Screen.height - 80f);
            GUILayout.BeginArea(area);
            GUILayout.Label("고양이 점프샷");
            switch (flow.Screen)
            {
                case Rules.ScreenId.Title:
                    if (GUILayout.Button("시작")) flow.TapStart();
                    if (GUILayout.Button("무한 모드")) flow.TapInfinite(Now());
                    if (GUILayout.Button("랭킹")) flow.Open(Rules.ScreenId.Ranking);
                    if (GUILayout.Button("도감")) flow.Open(Rules.ScreenId.Codex);
                    if (GUILayout.Button("상점")) flow.Open(Rules.ScreenId.Shop);
                    if (GUILayout.Button("설정")) flow.Open(Rules.ScreenId.Settings);
                    break;
                case Rules.ScreenId.Chapter:
                    for (int chapter = 1; chapter <= 4; chapter++)
                    {
                        bool open = Rules.Progression.ChapterUnlocked(flow.Save, chapter);
                        string stars = Rules.Progression.ChapterStars(flow.Save, chapter) + "별";
                        if (GUILayout.Button(chapter + "장  " + stars + (open ? "" : "  잠김")))
                        {
                            if (!flow.SelectChapter(chapter)) Debug.Log("이전 챕터 별이 더 필요합니다.");
                        }
                    }
                    if (GUILayout.Button("뒤로")) flow.Back();
                    break;
                case Rules.ScreenId.Stages:
                    foreach (var stage in Rules.StageTable.InChapter(flow.SelectedChapter))
                    {
                        Rules.StageRecord record;
                        flow.Save.Stages.TryGetValue(stage.Id, out record);
                        int stars = record == null ? 0 : record.Stars;
                        if (GUILayout.Button(stage.Id + "  " + stage.PlaceKo + "  별 " + stars)) flow.SelectStage(stage.Id, Now());
                    }
                    if (GUILayout.Button("뒤로")) flow.Back();
                    break;
                case Rules.ScreenId.Play:
                    var clock = flow.Clock;
                    GUILayout.Label(clock != null && clock.Photo != null
                        ? Readout(clock.Photo)
                        : "남은 컷 " + (clock == null ? 0 : clock.Shots.Count) + " / 5");
                    if (GUILayout.Button("일시정지")) flow.Pause(Now());
                    break;
                case Rules.ScreenId.Pause:
                    if (GUILayout.Button("계속")) flow.Resume(Now());
                    if (GUILayout.Button("재시작")) flow.Restart(Now());
                    if (GUILayout.Button("나가기")) flow.Quit();
                    break;
                case Rules.ScreenId.StageResult:
                    GUILayout.Label(flow.LastStage.Cleared ? "클리어" : "실패");
                    GUILayout.Label("평균 " + flow.LastStage.Avg + "ms  별 " + flow.LastStage.Stars);
                    if (flow.AdVisible) GUILayout.Label("전면 광고");
                    if (GUILayout.Button("공유")) flow.Share();
                    if (GUILayout.Button("스테이지로")) flow.ContinueAfterResult();
                    break;
                case Rules.ScreenId.InfiniteResult:
                    GUILayout.Label(flow.LastInfinite == null ? "되살리기" : flow.LastInfinite.Success + "컷");
                    if (flow.ReviveOffer && GUILayout.Button("광고 보고 되살리기")) flow.AcceptRevive(Now(), adLoaded: true);
                    if (flow.ReviveOffer && GUILayout.Button("결과 보기")) flow.DeclineRevive();
                    if (!flow.ReviveOffer && GUILayout.Button("공유")) flow.Share();
                    break;
                case Rules.ScreenId.Share:
                    GUILayout.Label(flow.ShareText);
                    if (GUILayout.Button("닫기")) flow.CloseShare();
                    break;
                default:
                    GUILayout.Label(flow.Screen.ToString());
                    if (GUILayout.Button("뒤로")) flow.Back();
                    break;
            }
            if (auto) GUILayout.Label("자동 플레이");
            GUILayout.EndArea();
        }

        void WriteReport()
        {
            reported = true;
            string path = System.IO.Path.Combine(Application.persistentDataPath, "autoplay-report.txt");
            var infinite = view.Flow.LastInfinite;
            string body = "cuts=" + (infinite == null ? 0 : infinite.Success) + "\nshare=" + view.Flow.ShareText + "\n";
            System.IO.File.WriteAllText(path, body);
            ScreenCapture.CaptureScreenshot("autoplay-share.png");
            Debug.Log("CatJumpShot autoplay " + body.Replace("\n", " ") + path);
        }

        static bool WantsAutoplay()
        {
            if (Application.isEditor && System.Environment.GetEnvironmentVariable("CATJUMP_AUTOPLAY") == "1") return true;
            var args = System.Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length; i++)
            {
                if (args[i] == "-catjump-autoplay") return true;
            }
            return false;
        }

        static long Now()
        {
            return (long)(Time.realtimeSinceStartup * 1000f);
        }

        static SpriteRenderer CreateSquare()
        {
            var texture = new Texture2D(8, 8, TextureFormat.RGBA32, false);
            var pixels = new Color32[64];
            for (int i = 0; i < pixels.Length; i++) pixels[i] = new Color32(255, 255, 255, 255);
            texture.SetPixels32(pixels);
            texture.filterMode = FilterMode.Point;
            texture.Apply();
            var sprite = Sprite.Create(texture, new Rect(0f, 0f, 8f, 8f), new Vector2(0.5f, 0.5f), 8f);
            var go = new GameObject("SquareCat");
            var renderer = go.AddComponent<SpriteRenderer>();
            renderer.sprite = sprite;
            return renderer;
        }

        static Color CatColor(string id)
        {
            switch (id)
            {
                case "kong": return new Color(0.96f, 0.89f, 0.77f);
                case "gurum": return new Color(0.72f, 0.77f, 0.81f);
                case "bamtol": return new Color(0.18f, 0.17f, 0.21f);
                default: return new Color(0.94f, 0.63f, 0.29f);
            }
        }

        static string Readout(Rules.ShotResult shot)
        {
            if (shot.Tier == "early") return "허공 컷";
            if (shot.Tier == "late") return "꼬리만";
            return shot.Ms + "ms";
        }
    }

    /// <summary>Holds the pure flow beside Unity objects.</summary>
    public sealed class GameFlowView
    {
        public readonly Rules.GameFlow Flow;

        public GameFlowView(uint seed)
        {
            Flow = new Rules.GameFlow(seed);
            Flow.Boot();
        }
    }
}
