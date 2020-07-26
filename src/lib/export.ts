import {
  batchExecutor,
  isLikeDocument,
  isRootOfDatabase,
  safelyGetCollectionsSnapshot,
  safelyGetDocumentReferences,
  sleep,
} from './firestore-helpers';
import * as admin from 'firebase-admin';
import {serializeSpecialTypes} from './helpers';
import * as _ from 'lodash';

const exportData = async (startingRef: admin.firestore.Firestore |
  FirebaseFirestore.DocumentReference |
  FirebaseFirestore.CollectionReference, logs = false) => {
  if (isLikeDocument(startingRef)) {
    const collectionsPromise = getCollections(startingRef, logs);
    let dataPromise: Promise<any>;
    if (isRootOfDatabase(startingRef)) {
      dataPromise = Promise.resolve({});
    } else {
      dataPromise = (<FirebaseFirestore.DocumentReference>startingRef).get()
        .then(snapshot => snapshot.data())
        .then(data => serializeSpecialTypes(data));
    }
    return await batchExecutor([collectionsPromise, dataPromise]).then(res => {
      return {'__collections__': res[0], ...res[1]};
    });
  } else {
    return await getDocuments(<FirebaseFirestore.CollectionReference>startingRef, logs);
  }
};

const getCollections = async (startingRef: admin.firestore.Firestore | FirebaseFirestore.DocumentReference, logs = false) => {
  const collectionIds: Array<string> = [];
  const collectionRefs: Array<FirebaseFirestore.CollectionReference> = [];
   
  const collectionsSnapshot = await safelyGetCollectionsSnapshot(startingRef, logs);
  collectionsSnapshot.map((collectionRef: FirebaseFirestore.CollectionReference) => {
    collectionIds.push(collectionRef.id);
    collectionRefs.push(collectionRef);
  });
  
  const zipped: any = {};
  const chunksOfCollectionRefs = _.chunk(collectionRefs, 10);
  console.log('Entered to collection chunk of length', collectionRefs.length);
  for (let j = 0; j < chunksOfCollectionRefs.length; j++) {
    const chunk = chunksOfCollectionRefs[j];
    let results: any;
    results = await executeBatchOnChunk(chunk);
    results.map((res: any, idx: number) => { zipped[collectionIds[idx]] = res; });
  }
  return zipped;
};

async function executeBatchOnChunk(chunk: any) {
  try {
    console.log('Chunk request');
    const results = await batchExecutor(chunk.map((ref: any) => getDocuments(ref, true)));
    return results;
  } catch {
    console.log('Chunk error');
    await sleep(2000);
    executeBatchOnChunk(chunk);
  }
}

function getPromiseForDoc(doc: any) {
  return new Promise(async (resolve) => {
    const docSnapshot = await doc.get();
    const docDetails: any = {};
    if (docSnapshot.exists) {
      docDetails[docSnapshot.id] = serializeSpecialTypes(docSnapshot.data());
    } else {
      docDetails[docSnapshot.id] = {};
    }
    docDetails[docSnapshot.id]['__collections__'] = await getCollections(docSnapshot.ref, true);
    resolve(docDetails);
  })
}

const getDocuments = async (collectionRef: FirebaseFirestore.CollectionReference, logs = false) => {
  logs && console.log(`Retrieving documents from ${collectionRef.path}`);
  const results: any = {};
  const allDocuments = await safelyGetDocumentReferences(collectionRef, logs);
  const documentChunks = _.chunk(allDocuments, 10);
  for(let i = 0; i < documentChunks.length; i++) {
    const documentChunk = documentChunks[i];
    const batchResults = await batchExecutor(documentChunk.map(doc =>getPromiseForDoc(doc)));
    batchResults.forEach((res: any) => {
      Object.keys(res).map(key => (<any>results)[key] = res[key]);
    });
  }
  return results;
};


export default exportData;