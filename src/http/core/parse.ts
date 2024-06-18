import { IncomingMessage, ServerResponse } from "http";
import { IContextRequest, IRequest, parseRequest } from "./request";
import { IContextResponse, IResponse, parseResponse } from "./response";
import { EventEmitter } from "stream";

export interface IServer{
    _request: IRequest, 
    _response: IResponse 
};

interface IContext{
    cxtRequest: IContextRequest,
    notFoundRoute: IContextResponse["notFoundRoute"],
    eventEmitter?: EventEmitter
};

export async function parse({ request, response }: { request: IncomingMessage, response: ServerResponse }, { cxtRequest, notFoundRoute, eventEmitter }: IContext): Promise<IServer>{
    const _request = await parseRequest(request, cxtRequest);
    const _response = parseResponse(response, { notFoundRoute, _request, eventEmitter });
    return { _request, _response };
}