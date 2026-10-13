using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace CatJumpShot.EditorTools
{
    public static class IosBatch
    {
        public static void Build()
        {
            StageAssetGenerator.Generate();
            string scene = SceneBootstrap.Ensure();
            PlayerSettings.companyName = "silibah";
            PlayerSettings.productName = "고양이 점프샷";
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.iOS, "com.silibah.catjumpshot");
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.Portrait;
            PlayerSettings.allowedAutorotateToPortrait = true;
            PlayerSettings.allowedAutorotateToPortraitUpsideDown = false;
            PlayerSettings.allowedAutorotateToLandscapeLeft = false;
            PlayerSettings.allowedAutorotateToLandscapeRight = false;
            Directory.CreateDirectory("Builds");
            var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
            {
                scenes = new[] { scene },
                locationPathName = "Builds/iOS",
                target = BuildTarget.iOS,
                options = BuildOptions.Development,
            });
            bool ok = report.summary.result == BuildResult.Succeeded;
            Debug.Log(ok ? "iOS build succeeded" : "iOS build failed: " + report.summary.result);
            EditorApplication.Exit(ok ? 0 : 1);
        }
    }
}
