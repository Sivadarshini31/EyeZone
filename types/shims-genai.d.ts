declare module "@google/genai" {
  export const GoogleGenAI: any;
  export const Modality: any;
  const _default: any;
  export default _default;
}

declare module "@google/genai/*" {
  const whatever: any;
  export default whatever;
}
