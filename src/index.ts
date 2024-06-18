import { IncomingMessage, ServerResponse } from "node:http";
import { AddressInfo } from "node:net";
import { HttpServer, THttpServer } from "./http/server";
import { TRoute, handlerRoute } from "./route/handlerRoute";
import { IContextRequest, IRequest } from "./http/core/request";
import { IResponse } from "./http/core/response";
import { informationRequest } from "./utils/informationRequest";
import { parse } from "./http/core/parse";
import { IAppRoute } from "./route/appRoute";
import { CustomValidateError } from "./validation/errors";

export interface IAppInstance{
    listen({port, hostname}: {port: number, hostname?: string}, onListening?: (address: AddressInfo) => void): IAppInstance;
    on(eventName: "listening", listener: (address: AddressInfo) => void): IAppInstance,
    on(eventName: "close", listener: () => void): IAppInstance,
    on(eventName: "error", listener: (error: Error) => void): IAppInstance,
    close(onClosing?: (err?: Error) => void): void | Promise<void>,
    route(route: TRoute): void,
    setNotFound(handler: (request: IRequest, response: IResponse) => Promise<void>): void,
    setErrorHandler(handler: (error: unknown, request: IRequest, response: IResponse) => Promise<void>): void,
    addBeforeRoute(handler: (request: IRequest, response: IResponse) => Promise<void>): void,
    get(path: string, handler: (request: IRequest, response: IResponse) => Promise<void>): void,
    delete(path: string, handler: (request: IRequest, response: IResponse) => Promise<void>): void,
    put(path: string, handler: (request: IRequest, response: IResponse) => Promise<void>): void,
    post(path: string, handler: (request: IRequest, response: IResponse) => Promise<void>): void,
    server: THttpServer
}

export default function simpleRoutes(): IAppInstance{
    
    const listRoutes: TRoute[] = [];
    let notFoundRoute: ((request: IRequest, response: IResponse) => Promise<void>)|undefined;
    let errorHandler: ((error: unknown, request: IRequest, response: IResponse) => Promise<void>)|undefined;  
    let beforeRoutes: ((request: IRequest, response: IResponse) => Promise<void>)[] = [];
    const defaultErrorHandler: (error: unknown, request: IRequest, response: IResponse) => Promise<void> = 
    async function(err, _, response){
        if(err instanceof CustomValidateError){
            response.code(400).send(err.message);
            return;
        }
        console.log("error")
        throw err;
    }

    const handler = async function(request: IncomingMessage, response: ServerResponse){

        const infoRequest = informationRequest(`${request.method?.toUpperCase()}:${request.url ?? ''}`);

        if(!infoRequest) throw new Error("Invalid request! The format was not identified.");
        
        const acceptRoute = await handlerRoute({ request, response }, { listRoutes, notFoundRoute, infoRequest, errorHandler, beforeRoutes, defaultErrorHandler })
              
        if(!acceptRoute && notFoundRoute){
            const cxtRequest: IContextRequest = {
                infoRequest,
                pathParams: {}
            };

            const { _request, _response } = await parse({ request, response }, { cxtRequest, notFoundRoute })
            await notFoundRoute(_request, _response);
        }
    }

    const httpServer = HttpServer(handler);
    const appInstance: IAppInstance = {
        listen({port, hostname}: {port: number, hostname?: string}, onListening?: (address: AddressInfo) => void): IAppInstance{
            httpServer.listen({port, hostname}, onListening);
            return appInstance;
        },
        on(eventName: "listening" | "error" | "close", listener: (...args: any[]) => void): IAppInstance{
            httpServer.on(eventName as "listening", listener);
            return appInstance;
        },
        close(onClosing?: (err?: Error) => void): void | Promise<void>{
            if (onClosing) {
                httpServer.raw.close(onClosing);
                return;
            } else {
                return new Promise((resolve, reject) => {
                    httpServer.raw.close((err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }
        },
        route(route: TRoute){
            listRoutes.push(route);
        },
        setNotFound(handler: (request: IRequest, response: IResponse) => Promise<void>){
            notFoundRoute = handler;
        },
        setErrorHandler(handler: (error: unknown, request: IRequest, response: IResponse) => Promise<void>){
            errorHandler = handler;
        },
        addBeforeRoute(handler: (request: IRequest, response: IResponse) => Promise<void>) {
            beforeRoutes.push(handler);
        },
        get(path: string, handler: (request: IRequest, response: IResponse) => Promise<void>){
            this.route(async(app: IAppRoute) => {
                app.get(path, handler);
            })
        },
        delete(path: string, handler: (request: IRequest, response: IResponse) => Promise<void>){
            this.route(async(app: IAppRoute) => {
                app.delete(path, handler);
            })
        },
        put(path: string, handler: (request: IRequest, response: IResponse) => Promise<void>){
            this.route(async(app: IAppRoute) => {
                app.put(path, handler);
            })
        },
        post(path: string, handler: (request: IRequest, response: IResponse) => Promise<void>){
            this.route(async(app: IAppRoute) => {
                app.post(path, handler);
            })
        },
        server: httpServer
    };
    return appInstance;
};