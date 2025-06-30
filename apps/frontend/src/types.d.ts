declare module '*.json' {
  const value: { version: string; name: string; [key: string]: unknown };
  export default value;
}