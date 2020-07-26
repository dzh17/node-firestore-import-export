import * as admin from 'firebase-admin';
import DocumentReference = FirebaseFirestore.DocumentReference;
declare const clearData: (startingRef: admin.firestore.Firestore | FirebaseFirestore.DocumentReference | FirebaseFirestore.CollectionReference, logs?: boolean) => Promise<any[]>;
export default clearData;
