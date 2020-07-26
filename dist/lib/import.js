"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDocuments = void 0;
const firestore_helpers_1 = require("./firestore-helpers");
const helpers_1 = require("./helpers");
const importData = (data, startingRef, mergeWithExisting = true, logs = false) => {
    const dataToImport = Object.assign({}, data);
    if (firestore_helpers_1.isLikeDocument(startingRef)) {
        if (!dataToImport.hasOwnProperty('__collections__')) {
            throw new Error('Root or document reference doesn\'t contain a __collections__ property.');
        }
        const collections = dataToImport['__collections__'];
        const collectionPromises = [];
        for (const collection in collections) {
            if (collections.hasOwnProperty(collection)) {
                collectionPromises.push(setDocuments(collections[collection], startingRef.collection(collection), mergeWithExisting, logs));
            }
        }
        if (firestore_helpers_1.isRootOfDatabase(startingRef)) {
            return firestore_helpers_1.batchExecutor(collectionPromises);
        }
        else {
            const documentID = startingRef.id;
            const documentData = {};
            documentData[documentID] = dataToImport;
            const documentPromise = setDocuments(documentData, startingRef.parent, mergeWithExisting, logs);
            return documentPromise.then(() => firestore_helpers_1.batchExecutor(collectionPromises));
        }
    }
    else {
        return setDocuments(dataToImport, startingRef, mergeWithExisting, logs);
    }
};
const setDocuments = (data, startingRef, mergeWithExisting = true, logs = false) => {
    logs && console.log(`Writing documents for ${startingRef.path}`);
    if ('__collections__' in data) {
        throw new Error('Found unexpected "__collection__" in collection data. Does the starting node match' +
            ' the root of the incoming data?');
    }
    const collections = [];
    const chunks = helpers_1.array_chunks(Object.keys(data), 500);
    const chunkPromises = chunks.map((documentKeys) => {
        const batch = startingRef.firestore.batch();
        documentKeys.map((documentKey) => {
            if (data[documentKey]['__collections__']) {
                Object.keys(data[documentKey]['__collections__']).map(collection => {
                    collections.push({
                        path: startingRef.doc(documentKey).collection(collection),
                        collection: data[documentKey]['__collections__'][collection],
                    });
                });
            }
            const _a = data[documentKey], { __collections__ } = _a, documents = __rest(_a, ["__collections__"]);
            const documentData = helpers_1.unserializeSpecialTypes(documents);
            batch.set(startingRef.doc(documentKey), documentData, { merge: mergeWithExisting });
        });
        return batch.commit();
    });
    return firestore_helpers_1.batchExecutor(chunkPromises)
        .then(() => {
        return collections.map((col) => {
            return setDocuments(col.collection, col.path, mergeWithExisting, logs);
        });
    })
        .then(subCollectionPromises => firestore_helpers_1.batchExecutor(subCollectionPromises))
        .catch(err => {
        logs && console.error(err);
    });
};
exports.setDocuments = setDocuments;
exports.default = importData;
