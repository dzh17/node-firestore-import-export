import * as admin from 'firebase-admin';
import { IFirebaseCredentials } from '../interfaces/IFirebaseCredentials';
declare const getCredentialsFromFile: (credentialsFilename: string) => Promise<IFirebaseCredentials>;
declare const getFirestoreDBReference: (credentials: IFirebaseCredentials) => admin.firestore.Firestore;
declare const getDBReferenceFromPath: (db: admin.firestore.Firestore, dataPath?: string | undefined) => admin.firestore.Firestore | FirebaseFirestore.DocumentReference | FirebaseFirestore.CollectionReference;
declare const isLikeDocument: (ref: admin.firestore.Firestore | FirebaseFirestore.DocumentReference | FirebaseFirestore.CollectionReference) => ref is FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>;
declare const isRootOfDatabase: (ref: admin.firestore.Firestore | FirebaseFirestore.DocumentReference | FirebaseFirestore.CollectionReference) => ref is FirebaseFirestore.Firestore;
declare const sleep: (timeInMS: number) => Promise<void>;
declare const batchExecutor: <T>(promises: Promise<T>[], batchSize?: number) => Promise<T[]>;
declare const safelyGetCollectionsSnapshot: (startingRef: admin.firestore.Firestore | FirebaseFirestore.DocumentReference, logs?: boolean) => Promise<FirebaseFirestore.CollectionReference[]>;
declare const safelyGetDocumentReferences: (collectionRef: FirebaseFirestore.CollectionReference, logs?: boolean) => Promise<FirebaseFirestore.DocumentReference[]>;
declare type anyFirebaseRef = admin.firestore.Firestore | FirebaseFirestore.DocumentReference | FirebaseFirestore.CollectionReference;
export { getCredentialsFromFile, getFirestoreDBReference, getDBReferenceFromPath, isLikeDocument, isRootOfDatabase, sleep, batchExecutor, anyFirebaseRef, safelyGetCollectionsSnapshot, safelyGetDocumentReferences, };