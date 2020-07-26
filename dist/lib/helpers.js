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
Object.defineProperty(exports, "__esModule", { value: true });
exports.unserializeSpecialTypes = exports.serializeSpecialTypes = exports.array_chunks = void 0;
const admin = __importStar(require("firebase-admin"));
var DocumentReference = admin.firestore.DocumentReference;
var GeoPoint = admin.firestore.GeoPoint;
// From https://stackoverflow.com/questions/8495687/split-array-into-chunks
const array_chunks = (array, chunk_size) => {
    return Array(Math.ceil(array.length / chunk_size))
        .fill(null)
        .map((_, index) => index * chunk_size)
        .map((begin) => array.slice(begin, begin + chunk_size));
};
exports.array_chunks = array_chunks;
const serializeSpecialTypes = (data) => {
    const cleaned = {};
    Object.keys(data).map(key => {
        let rawValue = data[key];
        if (rawValue instanceof admin.firestore.Timestamp) {
            rawValue = {
                __datatype__: 'timestamp',
                value: {
                    _seconds: rawValue.seconds,
                    _nanoseconds: rawValue.nanoseconds,
                },
            };
        }
        else if (rawValue instanceof GeoPoint) {
            rawValue = {
                __datatype__: 'geopoint',
                value: {
                    _latitude: rawValue.latitude,
                    _longitude: rawValue.longitude,
                },
            };
        }
        else if (rawValue instanceof DocumentReference) {
            rawValue = {
                __datatype__: 'documentReference',
                value: rawValue.path,
            };
        }
        else if (rawValue === Object(rawValue)) {
            let isArray = Array.isArray(rawValue);
            rawValue = serializeSpecialTypes(rawValue);
            if (isArray) {
                rawValue = Object.keys(rawValue).map(key => rawValue[key]);
            }
        }
        cleaned[key] = rawValue;
    });
    return cleaned;
};
exports.serializeSpecialTypes = serializeSpecialTypes;
const unserializeSpecialTypes = (data) => {
    if (isScalar(data)) {
        return data;
    }
    else if (Array.isArray(data)) {
        return data.map((val) => unserializeSpecialTypes(val));
    }
    else if (data instanceof Object) {
        let rawValue = Object.assign({}, data); // Object.assign({}, data);
        if ('__datatype__' in rawValue && 'value' in rawValue) {
            switch (rawValue.__datatype__) {
                case 'timestamp':
                    rawValue = rawValue;
                    if (rawValue.value instanceof String) {
                        const millis = Date.parse(rawValue.value);
                        rawValue = new admin.firestore.Timestamp(millis / 1000, 0);
                    }
                    else {
                        rawValue = new admin.firestore.Timestamp(rawValue.value._seconds, rawValue.value._nanoseconds);
                    }
                    break;
                case 'geopoint':
                    rawValue = rawValue;
                    rawValue = new admin.firestore.GeoPoint(rawValue.value._latitude, rawValue.value._longitude);
                    break;
                case 'documentReference':
                    rawValue = rawValue;
                    rawValue = admin.firestore().doc(rawValue.value);
                    break;
            }
        }
        else {
            let cleaned = {};
            Object.keys(rawValue).map((key) => cleaned[key] = unserializeSpecialTypes(data[key]));
            rawValue = cleaned;
        }
        return rawValue;
    }
};
exports.unserializeSpecialTypes = unserializeSpecialTypes;
const isScalar = (val) => (typeof val === 'string' || val instanceof String)
    || (typeof val === 'number' && isFinite(val))
    || (val === null)
    || (typeof val === 'boolean');
