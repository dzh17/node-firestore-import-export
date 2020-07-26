import * as admin from 'firebase-admin';
declare const exportData: (startingRef: admin.firestore.Firestore | FirebaseFirestore.DocumentReference | FirebaseFirestore.CollectionReference, logs?: boolean) => Promise<any>;
export default exportData;
