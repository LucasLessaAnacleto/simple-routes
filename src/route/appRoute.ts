import { IncomingMessage, ServerResponse } from "http";
import { parse } from "../http/core/parse";
import { IContextRequest, IRequest } from "../http/core/request";
import { IResponse } from "../http/core/response";
import { TInformationRequest } from "../utils/informationRequest";
import { validRequest } from "../utils/validRequest";
import EventEmitter from "events";

export interface IAppRoute{
    get(path: string, handler: (request: IRequest, response: IResponse) => Promise<void>): Promise<void>,
    post(path: string, handler: (request: IRequest, response: IResponse) => Promise<void>): Promise<void>,
    put(path: string, handler: (request: IRequest, response: IResponse) => Promise<void>): Promise<void>,
    delete(path: string, handler: (request: IRequest, response: IResponse) => Promise<void>): Promise<void>,
    callNotFound(): void
}

interface IContextAppRoute{
    request: IncomingMessage,
    response: ServerResponse,
    notFoundRoute?: (request: IRequest, response: IResponse) => Promise<void>,
    errorHandler?: (error: unknown, request: IRequest, response: IResponse) => Promise<void>,
    defaultErrorHandler: (error: unknown, request: IRequest, response: IResponse) => Promise<void>
    infoRequest: TInformationRequest,
    eventEmitter: EventEmitter
}

export function getAppRoute({ request, response, notFoundRoute, infoRequest, eventEmitter, errorHandler, defaultErrorHandler }: IContextAppRoute): IAppRoute{
    return {    
        async get(path: string, handler: (request: IRequest, response: IResponse) => Promise<void>): Promise<void> {
            const { valid, pathParams } = validRequest("GET", path, { infoRequest });
            if(!valid) return;

            eventEmitter.emit("accept");

            const cxtRequest: IContextRequest = {
                infoRequest,
                pathParams: pathParams ?? {}
            };

            const { _request, _response } = await parse({ request, response }, { cxtRequest, notFoundRoute, eventEmitter });
            handler(_request, _response)
                .catch(err => {
                    if(errorHandler){
                        errorHandler(err as Error, _request, _response);
                    }else{
                        defaultErrorHandler(err as Error, _request, _response);
                    }
                })
        },
        async delete(path: string, handler: (request: IRequest, response: IResponse) => Promise<void>): Promise<void> {
            const { valid, pathParams } = validRequest("DELETE", path, { infoRequest });
            if(!valid) return;

            eventEmitter.emit("accept");

            const cxtRequest: IContextRequest = {
                infoRequest,
                pathParams: pathParams ?? {}
            };

            const { _request, _response } = await parse({ request, response }, { cxtRequest, notFoundRoute, eventEmitter });
            handler(_request, _response)
                .catch(err => {
                    if(errorHandler){
                        errorHandler(err, _request, _response)
                    }else{
                        defaultErrorHandler(err as Error, _request, _response)
                    }
                });
        },
        async put(path: string, handler: (request: IRequest, response: IResponse) => Promise<void>): Promise<void> {
            const { valid, pathParams } = validRequest("PUT", path, { infoRequest });
            if(!valid) return;

            eventEmitter.emit("accept");

            const cxtRequest: IContextRequest = {
                infoRequest,
                pathParams: pathParams ?? {}
            };

            const { _request, _response } = await parse({ request, response }, { cxtRequest, notFoundRoute, eventEmitter });
            handler(_request, _response)
                .catch(err => {
                    if(errorHandler){
                        errorHandler(err, _request, _response)
                    }else{
                        defaultErrorHandler(err as Error, _request, _response)
                    }
                });
        },
        async post(path: string, handler: (request: IRequest, response: IResponse) => Promise<void>): Promise<void> {
            const { valid, pathParams } = validRequest("POST", path, { infoRequest });
            if(!valid) return;

            eventEmitter.emit("accept");

            const cxtRequest: IContextRequest = {
                infoRequest,
                pathParams: pathParams ?? {}
            };

            const { _request, _response } = await parse({ request, response }, { cxtRequest, notFoundRoute, eventEmitter });
            handler(_request, _response)
                .catch(err => {
                    if(errorHandler){
                        errorHandler(err, _request, _response)
                    }else{
                        defaultErrorHandler(err as Error, _request, _response)
                    }
                })
        },
        async callNotFound(): Promise<void> {
            if(!notFoundRoute) throw new Error("No set notFoundRoute!");

            const cxtRequest: IContextRequest = {
                infoRequest,
                pathParams: {}
            };

            const { _request, _response } = await parse({ request, response }, { cxtRequest, notFoundRoute, eventEmitter });
            notFoundRoute(_request, _response);
        }
    } satisfies IAppRoute;
}