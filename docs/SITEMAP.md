# Project Sitemap (4/18/2025)

```
/src # Start from src relative to root
├── README.md
├── Setup.js
  │   └── ✨ Classes: Setup
├── animation/
  ├── AnimationLoop.js
    │   └── 🔧 Functions: 
├── api/
  ├── generate-labels.js
├── data/
  ├── HistoryManager.js
  ├── labelRegistry.js
    │   └── 🔧 Functions: 
  ├── mockup-Room_entity_data.js
    │   └── 🔧 Functions: 
  ├── roomRegistry.js
    │   └── 🔧 Functions: 
  ├── sensors-hardcoded.json
  ├── sensors.html
  ├── sensors.json
  ├── tree-before.txt
├── debug/
  ├── DebugState.js
    │   └── 🔧 Functions: 
  ├── Debugger.js
    │   └── ✨ Classes: Debugger
  ├── README.md
├── gltf-EXT/
  ├── LICENSE
  ├── README.md
  ├── examples/
    ├── EXT_mesh_gpu_instancing.html
    ├── EXT_text.html
    ├── EXT_texture_video.html
    ├── GLB_range_requests.html
    ├── KHR_materials_variants.html
    ├── MSFT_lod.html
    ├── MSFT_texture_dds.html
    ├── assets/
      ├── fonts/
        ├── helvetiker_regular.typeface.json
      ├── gltf/
        ├── BoomBox/
          ├── glTF-dds/
            ├── BoomBox.bin
            ├── BoomBox.gltf
            ├── BoomBox_baseColor.dds
            ├── BoomBox_baseColor.png
            ├── BoomBox_emissive.dds
            ├── BoomBox_emissive.png
            ├── BoomBox_normal.dds
            ├── BoomBox_normal.png
            ├── BoomBox_occlusionRoughnessMetallic.dds
            ├── BoomBox_occlusionRoughnessMetallic.png
          ├── glTF-text/
            ├── BoomBox.bin
            ├── BoomBox.gltf
            ├── BoomBox_baseColor.png
            ├── BoomBox_emissive.png
            ├── BoomBox_normal.png
            ├── BoomBox_occlusionRoughnessMetallic.png
          ├── glb/
            ├── BoomBox.glb
          ├── glb-lod/
            ├── BoomBox.glb
        ├── Box/
          ├── glTF-texture-video/
            ├── BoxTextured.gltf
            ├── BoxTextured0.bin
            ├── CesiumLogoFlat.png
            ├── kinect.mp4
        ├── MaterialsVariantsShoe/
          ├── README.md
          ├── glTF/
            ├── MaterialsVariantsShoe.bin
            ├── MaterialsVariantsShoe.gltf
            ├── diffuseBeach.jpg
            ├── diffuseMidnight.jpg
            ├── diffuseStreet.jpg
            ├── normal.jpg
            ├── occlusionRougnessMetalness.jpg
          ├── screenshot/
            ├── screenshot.jpg
        ├── Teapots/
          ├── glTF-instancing/
            ├── mesh.bin
            ├── mesh_2.bin
            ├── teapots_galore.gltf
            ├── transforms.bin
      ├── textures/
        ├── equirectangular/
          ├── royal_esplanade_1k.hdr
    ├── ic_menu_black_24dp.svg
    ├── index.css
    ├── index.html
    ├── libs/
      ├── dat.gui.module.js
    ├── main.css
    ├── utils/
  ├── exporters/
    ├── EXT_mesh_gpu_instancing/
      ├── EXT_mesh_gpu_instancing_exporter.js
        │   └── ✨ Classes: GLTFExporterMeshGPUInstancingExtension
      ├── README.md
    ├── KHR_materials_variants/
      ├── KHR_materials_variants_exporter.js
        │   └── ✨ Classes: GLTFExporterMaterialsVariantsExtension
      ├── README.md
    ├── README.md
  ├── loaders/
    ├── EXT_mesh_gpu_instancing/
      ├── EXT_mesh_gpu_instancing.js
        │   └── ✨ Classes: GLTFMeshGpuInstancingExtension
      ├── README.md
    ├── EXT_text/
      ├── EXT_text.js
        │   └── ✨ Classes: GLTFTextExtension
      ├── README.md
    ├── EXT_texture_video/
      ├── EXT_texture_video.js
        │   └── ✨ Classes: GLTFTextExtension
      ├── README.md
    ├── GLB_range_requests/
      ├── GLB_range_requests.js
        │   └── ✨ Classes: GLBRangeRequests
      ├── README.md
    ├── KHR_materials_variants/
      ├── KHR_materials_variants.js
        │   └── ✨ Classes: GLTFMaterialsVariantsExtension
      ├── README.md
    ├── MSFT_lod/
      ├── MSFT_lod.js
        │   └── ✨ Classes: GLTFLodExtension
      ├── README.md
    ├── MSFT_texture_dds/
      ├── MSFT_texture_dds.js
        │   └── ✨ Classes: GLTFTextureDDSExtension
      ├── README.md
    ├── README.md
  ├── package-lock.json
  ├── package.json
├── gltf-khronos+EXT/
  ├── GLTFExporter.js
    │   └── 🔧 Functions: 
  ├── test/
    ├── EXT_mesh_gpu_instancing.js
    ├── EXT_text.js
    ├── EXT_texture_video.js
    ├── KHR_materials_variants.js
    ├── MSFT_lod.js
    ├── MSFT_texture_dds.js
    ├── build/
      ├── unit.js
    ├── index.html
    ├── index.js
    ├── package-lock.json
    ├── package.json
    ├── rollup.unit.config.js
├── ha.js
  │   └── 🔧 Functions: , , , , , , , , , , , , 
├── home_assistant/
  ├── haState.js
    │   └── 🔧 Functions: , , , , , 
├── lib/
  ├── BloomComposer.ts
    │   └── 🔧 Functions: , 
  ├── GenColor.ts
    │   └── ✨ Classes: GenColor
  ├── LabelManager.js
    │   └── ✨ Classes: LabelManager
  ├── PanelBuilder.js
    │   └── 🔧 Functions: 
  ├── ParticleSystem.ts
    │   └── ✨ Classes: ParticleSystem
  ├── Response.js
    │   └── ✨ Classes: Response
  ├── RoomSensorDisplay.js
    │   └── ✨ Classes: RoomSensorDisplay
  ├── SensorDashboard.js
    │   └── ✨ Classes: SensorDashboard
  ├── Uniforms.ts
    │   └── 🔧 Functions: , , 
  ├── geometries.ts
    │   └── 🔧 Functions: , , , , , , , , , , , 
  ├── shaderHelper.ts
    │   └── 🔧 Functions: , 
  ├── tweaks.ts
    │   └── 🔧 Functions: , , , , , 
├── main.js
├── network/
  ├── WebSocketStatus.js
    │   └── ✨ Classes: WebSocketStatus
├── scene.js
├── shaders/
  ├── edge/
    ├── edgeShader.glsl.ts
      │   └── 🔧 Functions: , , , 
  ├── noise.glsl
  ├── particle/
    ├── fragment.glsl
    ├── vertex.glsl
  ├── quark-shaders-master.zip
├── style.css
├── three/
  ├── FloorGeometry.js
    │   └── ✨ Classes: Floor
  ├── RaycasterHandler.js
  ├── RoundedBlockGenerator.js
    │   └── 🔧 Functions: 
├── tools/
  ├── generateLabelRegistry.js
    │   └── 🔧 Functions: , , 
  ├── generateRoomRegistry.js
    │   └── 🔧 Functions: , 
  ├── generateSiteMap.js
    │   └── 🔧 Functions: 
├── tsconfig.json
├── ui/
  ├── LabelInjector.js
    │   └── 🔧 Functions: , 
  ├── Themer.js
    │   └── ✨ Classes: Themer
  ├── components/
    ├── Loader.js
      │   └── ✨ Classes: LoaderUI
    ├── ThemeButton.js
      │   └── 🔧 Functions: , 
    ├── atoms/
      ├── Button.js
        │   └── 🔧 Functions: 
      ├── Icon.js
        │   └── 🔧 Functions: 
      ├── Label.js
        │   └── ✨ Classes: Label
      ├── Toggle.js
        │   └── ✨ Classes: Toggle
      ├── main.js
    ├── molecules/
      ├── LabelDockUI.js
        │   └── ✨ Classes: LabelDockUI
      ├── LabelModal.js
        │   └── ✨ Classes: LabelModal
        │   └── 🔧 Functions: 
      ├── ScrollBoxModal.js
        │   └── ✨ Classes: ScrollBoxModal
      ├── ToggleDockUI.js
        │   └── ✨ Classes: ToggleDockUI
      ├── WSBar.js
        │   └── ✨ Classes: WSBar
    ├── organisms/
      ├── FloatingToolbar.js
        │   └── ✨ Classes: FloatingToolbar
      ├── Toolbar.js
        │   └── ✨ Classes: Toolbar
  ├── createLabel.js
    │   └── 🔧 Functions: 
  ├── makeTextTexture.js
    │   └── 🔧 Functions: 
  ├── theme.js
    │   └── 🔧 Functions: 
  ├── uiUpdater.js
├── utils/
  ├── EntityUtils.js
    │   └── 🔧 Functions: 
  ├── GenColor.js
    │   └── ✨ Classes: GenColor
  ├── LabelLayoutManager.js
    │   └── ✨ Classes: LabelLayoutManager
  ├── RoomMaterialManager.js
    │   └── ✨ Classes: RoomMaterialManager
  ├── RoomShaderGenerator.js
    │   └── ✨ Classes: RoomShaderGenerator
  ├── SettingsManager.js
    │   └── ✨ Classes: SettingsManager, SettingsApplier
    │   └── 🔧 Functions: 
  ├── export-stl.js
  ├── initCoordinator.js
    │   └── 🔧 Functions: , , 
  ├── save.js
  ├── toggleLabelsButton.js
    │   └── 🔧 Functions: 
├── vite-env.d.ts

```
