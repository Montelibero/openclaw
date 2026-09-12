declare module "cloudcmd" {
  type CloudCmdParams = {
    socket?: unknown;
    config?: Record<string, unknown>;
  };

  type CloudCmdMiddleware = (
    request: import("node:http").IncomingMessage,
    response: import("node:http").ServerResponse,
  ) => void;

  function cloudcmd(params?: CloudCmdParams): CloudCmdMiddleware;
  export default cloudcmd;
}
