import { anyFirebaseRef } from './firestore-helpers';
import { ICollection } from '../interfaces/ICollection';
declare const importData: (data: any, startingRef: anyFirebaseRef, mergeWithExisting?: boolean, logs?: boolean) => Promise<any>;
declare const setDocuments: (data: ICollection, startingRef: FirebaseFirestore.CollectionReference, mergeWithExisting?: boolean, logs?: boolean) => Promise<any>;
export default importData;
export { setDocuments };
