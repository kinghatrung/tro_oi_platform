/**
 * Bản giả @nestjs/throttler cho Jest (jest.config.ts → moduleNameMapper).
 * shortcut: gói thật là CommonJS require @nestjs/common (ESM ở Nest 12) → Jest báo "require(esm) in a cycle";
 * runtime Node chạy bình thường. Bỏ file này khi throttler phát hành bản ESM.
 */
export const Throttle = (): ClassDecorator & MethodDecorator => () => undefined;
export const SkipThrottle = Throttle;

export class ThrottlerGuard {
  constructor(..._args: unknown[]) {}
  protected shouldSkip(_context: unknown): Promise<boolean> {
    return Promise.resolve(false);
  }
}

export class ThrottlerModule {
  static forRoot() {
    return { module: ThrottlerModule };
  }

  static forRootAsync() {
    return { module: ThrottlerModule };
  }
}
