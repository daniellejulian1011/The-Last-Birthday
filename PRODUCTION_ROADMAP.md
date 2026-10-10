# VISUAL & GAMEPLAY PRODUCTION ROADMAP

The existing release is a standalone, interactive GitHub Pages prototype. The supplied concept images depict a level of photorealistic environment and character detail that cannot be derived automatically into finished optimized production assets. The next stages are concrete:

## Character production

- Sculpt age-specific, reference-accurate June 1973 / June 1983 models, Edwin in his period suit, and pre-fire / post-fire Mr. Morrow (approx. seven feet tall including ears).
- Retopologize for realtime, sculpt Morrow's cracked mask, chipped paint, patchy fabric, corroded internal harness, hinged mouth, damaged ears and scuffed shoes.
- UV unwrap and texture with 4K/2K PBR maps (base color, roughness, metallic, normals, AO, opacity, subsurface where useful).
- Upgrade the included `.glb` skeletal **prototype rigs** to polished facial/body rigs; authored deformations, constrained joints, ear cloth physics, lip/jaw hinge and hand posing; include diegetic, silent mechanical motion.
- Capture/animate idle, look, patrol, investigate, reach, sprint, grasp, stagger, camera-flash stun, disabled, fall, search, chase and bespoke jumpscare poses. No 1983 voice/lip-sync clips for Mr. Morrow.

## Level art

- Source 1970s signage, birthday furniture, tile, wallpaper and arcade cabinets with accurate, readable decals; produce destroyed variants of each.
- Modular 3D kit: walls, doorframes, windows, vents, fire sprinklers, backstage equipment and office fixtures. Replace the simple procedural geometry.
- Baked lighting + dynamic shadow-casting flashlight, light shafts, volumetric dust and fog, reflections on wet floors, exterior rainfall, localized flicker and fire-char decals.
- Add collision proxies/navigation mesh, lightmap LODs, instanced clutter and an occlusion-culling scheme.

## Systems

- Replace simple room-waypoint enemy movement with navmesh/pathfinding, hearing/noise influence and investigation/inertia states.
- Implement interactive camera viewfinder, developed 35mm photo negatives, visually verifiable clues and narrative state-dependent archival scenes.
- Add authenticated local save migrations, accessibility settings, graphics presets, remappable controls and gamepad support.
- Implement configurable cinematic jumpscares and objective hints; no unfair unavoidable deaths.
- Build and test the GLB importer / skin renderer for the supplied prototype assets (currently the game animates Mr. Morrow procedurally in native WebGL2).

## Cross-device QA / release

- Real GPU tests on Chrome/Firefox/Edge, Android Chrome and iOS Safari with WebGL2.
- Playtest every puzzle branch, encounter, audio resume behavior and all six endings; benchmark memory and frametime on representative devices.
- Review narrative chronology, pronunciation of character names, signage typos, subtitle legibility, color contrast and reduced-motion behavior.
