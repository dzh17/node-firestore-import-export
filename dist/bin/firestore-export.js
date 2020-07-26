#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("commander"));
const colors_1 = __importDefault(require("colors"));
const process_1 = __importDefault(require("process"));
const fs_1 = __importDefault(require("fs"));
const lib_1 = require("../lib");
const firestore_helpers_1 = require("../lib/firestore-helpers");
const bin_common_1 = require("./bin-common");
commander_1.default.version(bin_common_1.packageInfo.version)
    .option(...bin_common_1.buildOption(bin_common_1.commandLineParams.accountCredentialsPath))
    .option(...bin_common_1.buildOption(bin_common_1.commandLineParams.backupFileExport))
    .option(...bin_common_1.buildOption(bin_common_1.commandLineParams.nodePath))
    .option(...bin_common_1.buildOption(bin_common_1.commandLineParams.prettyPrint))
    .parse(process_1.default.argv);
const accountCredentialsPath = commander_1.default[bin_common_1.commandLineParams.accountCredentialsPath.key] || process_1.default.env[bin_common_1.accountCredentialsEnvironmentKey];
if (!accountCredentialsPath) {
    console.log(colors_1.default.bold(colors_1.default.red('Missing: ')) + colors_1.default.bold(bin_common_1.commandLineParams.accountCredentialsPath.key) + ' - ' + bin_common_1.commandLineParams.accountCredentialsPath.description);
    commander_1.default.help();
    process_1.default.exit(1);
}
if (!fs_1.default.existsSync(accountCredentialsPath)) {
    console.log(colors_1.default.bold(colors_1.default.red('Account credentials file does not exist: ')) + colors_1.default.bold(accountCredentialsPath));
    commander_1.default.help();
    process_1.default.exit(1);
}
const backupFile = commander_1.default[bin_common_1.commandLineParams.backupFileExport.key];
if (!backupFile) {
    console.log(colors_1.default.bold(colors_1.default.red('Missing: ')) + colors_1.default.bold(bin_common_1.commandLineParams.backupFileExport.key) + ' - ' + bin_common_1.commandLineParams.backupFileExport.description);
    commander_1.default.help();
    process_1.default.exit(1);
}
const writeResults = (results, filename) => {
    return new Promise((resolve, reject) => {
        fs_1.default.writeFile(filename, results, 'utf8', err => {
            if (err) {
                reject(err);
            }
            else {
                resolve(filename);
            }
        });
    });
};
const prettyPrint = Boolean(commander_1.default[bin_common_1.commandLineParams.prettyPrint.key]);
const nodePath = commander_1.default[bin_common_1.commandLineParams.nodePath.key];
(() => __awaiter(void 0, void 0, void 0, function* () {
    const credentials = yield firestore_helpers_1.getCredentialsFromFile(accountCredentialsPath);
    const db = firestore_helpers_1.getFirestoreDBReference(credentials);
    const pathReference = firestore_helpers_1.getDBReferenceFromPath(db, nodePath);
    console.log(colors_1.default.bold(colors_1.default.green('Starting Export 🏋️')));
    const results = yield lib_1.firestoreExport(pathReference, true);
    const stringResults = JSON.stringify(results, undefined, prettyPrint ? 2 : undefined);
    yield writeResults(stringResults, backupFile);
    console.log(colors_1.default.yellow(`Results were saved to ${backupFile}`));
    console.log(colors_1.default.bold(colors_1.default.green('All done 🎉')));
}))().catch((error) => {
    if (error instanceof Error) {
        console.log(colors_1.default.red(error.message));
        process_1.default.exit(1);
    }
    else {
        console.log(colors_1.default.red(error));
    }
});
