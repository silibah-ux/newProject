using UnityEditor;
using UnityEngine;

namespace CatJumpShot.EditorTools
{
    public sealed class PixelImportSettings : AssetPostprocessor
    {
        const float PixelsPerUnit = 16f;

        void OnPreprocessTexture()
        {
            if (assetPath.IndexOf("/Art/", System.StringComparison.Ordinal) < 0) return;
            var importer = (TextureImporter)assetImporter;
            importer.textureType = TextureImporterType.Sprite;
            importer.spritePixelsPerUnit = PixelsPerUnit;
            importer.filterMode = FilterMode.Point;
            importer.textureCompression = TextureImporterCompression.Uncompressed;
            importer.mipmapEnabled = false;
            importer.npotScale = TextureImporterNPOTScale.None;
        }
    }
}
