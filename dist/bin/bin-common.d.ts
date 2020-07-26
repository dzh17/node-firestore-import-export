declare const packageInfo: any;
declare const accountCredentialsEnvironmentKey = "GOOGLE_APPLICATION_CREDENTIALS";
declare const commandLineParams: {
    [param: string]: Params;
};
declare const buildOption: ({ shortKey, key, args, description }: Params) => [string, string];
declare class ActionAbortedError extends Error {
    constructor(m?: string);
}
export { packageInfo, accountCredentialsEnvironmentKey, commandLineParams, buildOption, ActionAbortedError };
interface Params {
    shortKey: string;
    key: string;
    args?: string;
    description: string;
}
