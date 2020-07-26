"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_helpers_1 = require("./firestore-helpers");
const helpers_1 = require("./helpers");
const _ = __importStar(require("lodash"));
const exportData = (startingRef, logs = false) => __awaiter(void 0, void 0, void 0, function* () {
    if (firestore_helpers_1.isLikeDocument(startingRef)) {
        const collectionsPromise = getCollections(startingRef, logs);
        let dataPromise;
        if (firestore_helpers_1.isRootOfDatabase(startingRef)) {
            dataPromise = Promise.resolve({});
        }
        else {
            dataPromise = startingRef.get()
                .then(snapshot => snapshot.data())
                .then(data => helpers_1.serializeSpecialTypes(data));
        }
        return yield firestore_helpers_1.batchExecutor([collectionsPromise, dataPromise]).then(res => {
            return Object.assign({ '__collections__': res[0] }, res[1]);
        });
    }
    else {
        return yield getDocuments(startingRef, logs);
    }
});
const getCollections = (startingRef, logs = false) => __awaiter(void 0, void 0, void 0, function* () {
    const collectionIds = [];
    const collectionRefs = [];
    const collectionsSnapshot = yield firestore_helpers_1.safelyGetCollectionsSnapshot(startingRef, logs);
    collectionsSnapshot.map((collectionRef) => {
        collectionIds.push(collectionRef.id);
        collectionRefs.push(collectionRef);
    });
    const zipped = {};
    const chunksOfCollectionRefs = _.chunk(collectionRefs, 10);
    console.log('Entered to collection chunk of length', collectionRefs.length);
    for (let j = 0; j < chunksOfCollectionRefs.length; j++) {
        const chunk = chunksOfCollectionRefs[j];
        const results = yield firestore_helpers_1.batchExecutor(chunk.map(ref => getDocuments(ref, logs)));
        results.map((res, idx) => { zipped[collectionIds[idx]] = res; });
    }
    return zipped;
});
function getPromiseForDoc(doc) {
    return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
        const docSnapshot = yield doc.get();
        const docDetails = {};
        if (docSnapshot.exists) {
            docDetails[docSnapshot.id] = helpers_1.serializeSpecialTypes(docSnapshot.data());
        }
        else {
            docDetails[docSnapshot.id] = {};
        }
        docDetails[docSnapshot.id]['__collections__'] = yield getCollections(docSnapshot.ref, true);
        resolve(docDetails);
    }));
}
const getDocuments = (collectionRef, logs = false) => __awaiter(void 0, void 0, void 0, function* () {
    logs && console.log(`Retrieving documents from ${collectionRef.path}`);
    const results = {};
    const allDocuments = yield firestore_helpers_1.safelyGetDocumentReferences(collectionRef, logs);
    const documentChunks = _.chunk(allDocuments, 10);
    for (let i = 0; i < documentChunks.length; i++) {
        const documentChunk = documentChunks[i];
        const batchResults = yield firestore_helpers_1.batchExecutor(documentChunk.map(doc => getPromiseForDoc(doc)));
        batchResults.forEach((res) => {
            Object.keys(res).map(key => results[key] = res[key]);
        });
    }
    return results;
});
exports.default = exportData;
