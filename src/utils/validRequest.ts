import EventEmitter from "events";
import { TInformationRequest } from "./informationRequest";

interface IContextValidRequest{
    infoRequest: TInformationRequest
}

export function validRequest(method: string,path: string, { infoRequest }: IContextValidRequest): { valid: boolean, pathParams?: {[key: string]: string}}{
    const _pathParams: {[key: string]: string} = {};
    if(method !== infoRequest.method) return { valid: false, pathParams: undefined };

    if(path === "/" && infoRequest.path === "/") return { valid: true, pathParams: {} };

    const validPath = (path: string): boolean => {
        return /^(?:[\/][:]?[\w\d-_]+)+[\/]?$/.test(path) || path === "/";
    }

    if(!validPath(path)) throw new Error("O Path: \""+path+"\" não é uma rota válida");

    const [,...expected] = path.replace(/[\/]$/, "").split("/");
    const [,...actual] = infoRequest.path.split("/");

    if(expected.length !== actual.length) return { valid: false, pathParams: undefined };

    const isRecurse = expected.every((chuckExpected: string, i: number) => {
        if(/^[:]/.test(chuckExpected)){
            _pathParams[chuckExpected.replace(":", "")] = actual[i];
            return true;
        }
        return chuckExpected === actual[i];
    });

    return { 
        valid: isRecurse, 
        pathParams: isRecurse ? _pathParams || {} : undefined 
    };
} 
