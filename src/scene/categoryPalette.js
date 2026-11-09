/**
 * Smart Campus room-category tints (house-local, application layer).
 *
 * Core-X Canon v0.1 has no canonical data-visualisation or identity palette, so
 * these are NOT Core-X tokens and must not be promoted into shared tokens. They
 * are the category colours already authored in campus.glb (materials
 * "meetings", "learning-units", "team-spaces", ...) pulled toward the warm Core-X
 * neutrals so they read as sober architectural tints on the --bg canvas.
 *
 * Single source: the 3D scene and the legend/list swatches both read this file.
 */

export const CATEGORY_PALETTE = Object.freeze({
  meetings:         { label: 'Meetings',        tint: '#b26f76', glbMaterial: 'meetings' },
  'learning-units': { label: 'Learning units',  tint: '#62819c', glbMaterial: 'learning-units' },
  'team-spaces':    { label: 'Team spaces',     tint: '#b39d55', glbMaterial: 'team-spaces' },
  workspaces:       { label: 'Workspaces',      tint: '#857c73', glbMaterial: 'workspace' },
  makerspace:       { label: 'Makers space',    tint: '#8577a3', glbMaterial: 'studio-makerspace' },
  project:          { label: 'Project',         tint: '#b27352', glbMaterial: 'project' },
  meditation:       { label: 'Meditation',      tint: '#73906a', glbMaterial: 'meditation' },
  terrace:          { label: 'Terrace',         tint: '#c9c3b6', glbMaterial: 'terrace-balcony' },
  service:          { label: 'Service',         tint: '#b9b5ae', glbMaterial: null },
  other:            { label: 'Other',           tint: '#c4bfb7', glbMaterial: null },
});

/** Scene neutrals, taken from the Core-X token values (kbllr adapter). */
export const SCENE_NEUTRALS = Object.freeze({
  canvas: '#d1d1d0', // --bg
  floor: '#dddbd5',
  edge: '#2d2824', // --fg1
  edgeMuted: '#6b6560', // --fg2
});

/** GLB category-legend button mesh name -> category slug ("bttn-prject" is spelled that way in the model). */
export const GLB_BUTTON_CATEGORY = Object.freeze({
  'bttn-prject': 'project',
  'bttn-meetings': 'meetings',
  'bttn-makerspace': 'makerspace',
  'bttn-learning-units': 'learning-units',
  'bttn-team-spaces': 'team-spaces',
  'bttn-workspaces': 'workspaces',
  'bttn-terrace-balcony': 'terrace',
  'bttn-meditation': 'meditation',
});

export function tintFor(category) {
  return (CATEGORY_PALETTE[category] || CATEGORY_PALETTE.other).tint;
}
