declare module "minimatch" {
  export interface IOptions {
    debug?: boolean;
    nobrace?: boolean;
    noglobstar?: boolean;
    noext?: boolean;
    nocase?: boolean;
    nocomment?: boolean;
    nonegate?: boolean;
    nonull?: boolean;
    matchBase?: boolean | any;
    dot?: boolean;
    flipNegate?: boolean;
    unixify?: boolean;
    windowsPathsNoEscape?: boolean;
    noglobstar?: boolean;
    nonegate?: boolean;
    nocomment?: boolean;
    noext?: boolean;
    noglobstar?: boolean;
    dot?: boolean;
    debug?: boolean;
    stat?: boolean;
    silent?: boolean;
    nounique?: boolean;
    nobrace?: boolean;
    allowWindowsEscape?: boolean;
  }

  export interface IMinimatch {
    pattern: string;
    options: IOptions;
    set: string[][];
    negate: boolean;
    comment: boolean;
    empty: boolean;
    make(): void;
    parse(pattern: string): string[];
    match(target: string, partial?: boolean): boolean;
  }

  function minimatch(path: string, pattern: string, options?: IOptions): boolean;

  namespace minimatch {
    const Minimatch: {
      new (pattern: string, options?: IOptions): IMinimatch;
    };
  }

  export = minimatch;
}
