export const MODEL_CONFIG = {
  player: {
    path: "/models/player.glb",
    scale: 1.0,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    fallback: 'primitive'
  },
  doll: {
    path: '',
    scale: 1.0,
    position: [0, 0, 25],
    rotation: [0, 0, 0],
    fallback: 'primitive'
  },
  // Add more models as needed
  environment: {
    trees: '',
    buildings: '',
    props: ''
  }
} as const;

export type ModelType = keyof typeof MODEL_CONFIG;
export type ModelConfig = typeof MODEL_CONFIG[ModelType];
