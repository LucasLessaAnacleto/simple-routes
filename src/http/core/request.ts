import { IncomingMessage } from "node:http";
import { TInformationRequest } from "../../utils/informationRequest";

export interface IRequest extends IncomingMessage{
    body: {[key: string]: unknown},
    pathParams: {[key: string]: string},
    queryParams: {[key: string]: string}
};

export interface IContextRequest{
    pathParams: {[key: string]: string},
    infoRequest: TInformationRequest
}

export async function parseRequest(request: IncomingMessage, { pathParams = {}, infoRequest }: IContextRequest): Promise<IRequest>{

    let body: {[key: string]: unknown} = {};
    if(["POST", "PUT"].includes(infoRequest.method)){
        for await(const data of request){
            body = JSON.parse((data as Buffer).toString("utf-8"))
        }
    }
    let _request: any = request;
    _request.body = body;
    _request.pathParams = pathParams;
    _request.queryParams = infoRequest.queryParams || {}
    
    return _request satisfies IRequest;
}