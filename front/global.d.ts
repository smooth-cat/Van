declare const acquireVsCodeApi: () => any;
declare const ENV: 'prod'|'dev';

// src/images.d.ts
declare module '*.png' {
  const path: string;
  export default path;
}

declare module '*.jpg' {
  const path: string;
  export default path;
}

// 其他图片格式...