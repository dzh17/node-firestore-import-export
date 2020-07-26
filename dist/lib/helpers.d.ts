declare const array_chunks: (array: Array<any>, chunk_size: number) => Array<Array<any>>;
declare const serializeSpecialTypes: (data: any) => any;
declare const unserializeSpecialTypes: (data: any) => any;
export { array_chunks, serializeSpecialTypes, unserializeSpecialTypes };
