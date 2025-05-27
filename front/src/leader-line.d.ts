declare module 'leader-line' {
    export default class LeaderLine {
      constructor(start: HTMLElement | SVGElement, end: HTMLElement | SVGElement, options?: any);
      position(): void;
      remove(): void;
    }
  }