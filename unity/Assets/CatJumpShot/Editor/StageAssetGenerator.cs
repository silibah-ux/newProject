using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace CatJumpShot.EditorTools
{
    public static class StageAssetGenerator
    {
        const string DirectoryPath = "Assets/Resources/Stages";

        [MenuItem("Cat Jump Shot/Generate Stage Assets")]
        public static void Generate()
        {
            Directory.CreateDirectory(DirectoryPath);
            foreach (var stage in Rules.StageTable.All)
            {
                string path = DirectoryPath + "/" + stage.Id + ".asset";
                var asset = AssetDatabase.LoadAssetAtPath<StageDefinition>(path);
                if (asset == null)
                {
                    asset = ScriptableObject.CreateInstance<StageDefinition>();
                    asset.Apply(stage);
                    AssetDatabase.CreateAsset(asset, path);
                }
                else
                {
                    asset.Apply(stage);
                    EditorUtility.SetDirty(asset);
                }
            }
            AssetDatabase.SaveAssets();
        }
    }

    public static class SceneBootstrap
    {
        public const string ScenePath = "Assets/Scenes/Bootstrap.unity";

        public static string Ensure()
        {
            Directory.CreateDirectory("Assets/Scenes");
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var cameraObject = new GameObject("Main Camera");
            cameraObject.tag = "MainCamera";
            var camera = cameraObject.AddComponent<Camera>();
            camera.orthographic = true;
            camera.orthographicSize = 5f;
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.18f, 0.13f, 0.1f);
            camera.transform.position = new Vector3(0f, 0f, -10f);
            cameraObject.AddComponent<AudioListener>();
            EditorSceneManager.SaveScene(scene, ScenePath);
            return ScenePath;
        }
    }
}
