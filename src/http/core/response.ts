import { ServerResponse } from "node:http";
import { IRequest } from "./request";
import { codeHttp } from "../codeHttp";
import { EventEmitter } from "node:stream";

export interface IResponse{
    header(name: string, value: string | number | readonly string[]): IResponse,
    headers(headers: { [key: string]: string | number | readonly string[] }): IResponse,
    code(statusCode: number): IResponse,
    status(statusMessage: string): IResponse,
    type(contentType: string): IResponse,
    callNotFound(): Promise<void>,
    send(data?: unknown): void,
    statusMessage: string,
    statusCode: number,
    raw: ServerResponse
}

export interface IContextResponse{
    notFoundRoute?: (request: IRequest, response: IResponse) => Promise<void>;
    _request: IRequest,
    eventEmitter?: EventEmitter
}

export function parseResponse(response: ServerResponse, { notFoundRoute, _request, eventEmitter }: IContextResponse): IResponse{
    const _response: IResponse = {
        header: function (name: string, value: string | number | readonly string[]): IResponse{
            response.setHeader(name, value);
            return this;
        },
        headers: function (headers: { [key: string]: string | number | readonly string[] }): IResponse{
            for(const name in headers){
                response.setHeader(name, headers[name]);
            }
            return this;
        },
        code: function(statusCode: number): IResponse{
            response.statusCode = statusCode;
            
            if(statusCode in codeHttp){
                response.statusMessage = codeHttp[statusCode];
            }
            return this;
        },
        status: function(statusMessage: string): IResponse{
            response.statusMessage = statusMessage;
            return this;
        },
        type: function(contentType: string): IResponse{
            response.setHeader("Content-Type", contentType);
            return this;
        },
        callNotFound: async function(): Promise<void>{
            if(!notFoundRoute)
                throw new Error("no 'notFoundHandler' defined");
            notFoundRoute(_request, this);
        },
        send: function(data?: unknown): void{
            if(!response.hasHeader('Content-Type'))
                response.setHeader("Content-Type", "application/json");
            response.end(
                typeof data === "object" 
                ? JSON.stringify(data, undefined, 2) 
                : data
            );
            eventEmitter?.emit("send");
        },
        statusMessage: response.statusMessage,
        statusCode: response.statusCode,
        raw: response
    } satisfies IResponse;

    return _response;
}