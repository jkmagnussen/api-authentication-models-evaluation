declare module '@prisma/client' {
  const PrismaClient: any;
  export { PrismaClient };
  export namespace Prisma {
    export type InputJsonValue = unknown;
    export type JsonValue = unknown;
  }
}
