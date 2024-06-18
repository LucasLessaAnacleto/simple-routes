import { IncomingMessage, ServerResponse } from "http";
import { IResponse } from "../http/core/response";
import { IRequest } from "../http/core/request";
import { TInformationRequest } from "../utils/informationRequest";
import { IAppRoute, getAppRoute } from "./appRoute";
import { EventEmitter } from "stream";
import { parse } from "../http/core/parse";

export type TRoute = (app: IAppRoute) => Promise<void>;

interface IContextHandlerRoute{
    notFoundRoute?: (request: IRequest, response: IResponse) => Promise<void>,
    errorHandler?: (error: unknown, request: IRequest, response: IResponse) => Promise<void>,
    defaultErrorHandler: (error: unknown, request: IRequest, response: IResponse) => Promise<void>,
    listRoutes: TRoute[],
    infoRequest: TInformationRequest,
    beforeRoutes: ((request: IRequest, response: IResponse) => Promise<void>)[]
}

export async function handlerRoute({ request, response }: { request: IncomingMessage, response: ServerResponse } , { listRoutes, infoRequest, notFoundRoute, errorHandler, beforeRoutes, defaultErrorHandler }: IContextHandlerRoute): Promise<boolean>{
    let accept = false;
    let sent = false;
    const eventEmitter = new EventEmitter();
    eventEmitter.on("accept", () => {
        accept = true;
    });
    eventEmitter.on("send", () => {
        sent = true;
    });

    for await(const beforeRoute of beforeRoutes){
        if(!sent){
            const cxtRequest = {
                infoRequest,
                pathParams: {}
            };
    
            const { _request, _response } = await parse({ request, response }, { cxtRequest, notFoundRoute, eventEmitter });
            await beforeRoute(_request, _response)
            .catch(err => {
                sent = true;
                if(errorHandler){
                    errorHandler(err, _request, _response);
                }else{      
                    defaultErrorHandler(err, _request, _response);
                }
            });
        }
    }
   
    const appRoute = getAppRoute({ request, response, notFoundRoute, infoRequest, eventEmitter, errorHandler, defaultErrorHandler });

    for await(const route of listRoutes){
        if(!sent){
            await route(appRoute);
        }
    };
    
    return accept || sent;
}

