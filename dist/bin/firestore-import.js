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
const enquirer_1 = require("enquirer");
const colors_1 = __importDefault(require("colors"));
const process_1 = __importDefault(require("process"));
const fs_1 = __importDefault(require("fs"));
const lib_1 = require("../lib");
const firestore_helpers_1 = require("../lib/firestore-helpers");
const load_json_file_1 = __importDefault(require("load-json-file"));
const bin_common_1 = require("./bin-common");
commander_1.default.version(bin_common_1.packageInfo.version)
    .option(...bin_common_1.buildOption(bin_common_1.commandLineParams.accountCredentialsPath))
    .option(...bin_common_1.buildOption(bin_common_1.commandLineParams.backupFileImport))
    .option(...bin_common_1.buildOption(bin_common_1.commandLineParams.nodePath))
    .option(...bin_common_1.buildOption(bin_common_1.commandLineParams.yesToImport))
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
const backupFile = commander_1.default[bin_common_1.commandLineParams.backupFileImport.key];
if (!backupFile) {
    console.log(colors_1.default.bold(colors_1.default.red('Missing: ')) + colors_1.default.bold(bin_common_1.commandLineParams.backupFileImport.key) + ' - ' + bin_common_1.commandLineParams.backupFileImport.description);
    commander_1.default.help();
    process_1.default.exit(1);
}
if (!fs_1.default.existsSync(backupFile)) {
    console.log(colors_1.default.bold(colors_1.default.red('Backup file does not exist: ')) + colors_1.default.bold(backupFile));
    commander_1.default.help();
    process_1.default.exit(1);
}
const nodePath = commander_1.default[bin_common_1.commandLineParams.nodePath.key];
const unattendedConfirmation = commander_1.default[bin_common_1.commandLineParams.yesToImport.key];
(() => __awaiter(void 0, void 0, void 0, function* () {
    const credentials = yield firestore_helpers_1.getCredentialsFromFile(accountCredentialsPath);
    const db = firestore_helpers_1.getFirestoreDBReference(credentials);
    const pathReference = yield firestore_helpers_1.getDBReferenceFromPath(db, nodePath);
    const data = yield load_json_file_1.default(backupFile);
    if (!unattendedConfirmation) {
        const nodeLocation = pathReference
            .path || '[database root]';
        const projectID = process_1.default.env.FIRESTORE_EMULATOR_HOST || credentials.project_id;
        const importText = `About to import data '${backupFile}' to the '${projectID}' firestore at '${nodeLocation}'.`;
        console.log(`\n\n${colors_1.default.bold(colors_1.default.blue(importText))}`);
        console.log(colors_1.default.bgYellow(colors_1.default.blue(' === Warning: This will overwrite existing data. Do you want to proceed? === ')));
        const response = yield enquirer_1.prompt({
            type: 'confirm',
            name: 'continue',
            message: 'Proceed with import?',
        });
        if (!response.continue) {
            throw new bin_common_1.ActionAbortedError('Import Aborted');
        }
    }
    console.log(colors_1.default.bold(colors_1.default.green('Starting Import 🏋️')));
    yield lib_1.firestoreImport(data, pathReference, true, true);
    console.log(colors_1.default.bold(colors_1.default.green('All done 🎉')));
}))().catch((error) => {
    if (error instanceof bin_common_1.ActionAbortedError) {
        console.log(error.message);
    }
    else if (error instanceof Error) {
        console.log(colors_1.default.red(`${error.name}: ${error.message}`));
        console.log(colors_1.default.red(error.stack));
        process_1.default.exit(1);
    }
    else {
        console.log(colors_1.default.red(error));
    }
});
