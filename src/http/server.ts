import { createServer, IncomingMessage, Server, ServerResponse } from "node:http";
import { AddressInfo, isIP, isIPv4 } from "node:net";

/* TYPES */
export type THttpServer = {
    listen({port, hostname}: {port: number, hostname?: string}, onListening?: (address: AddressInfo) => void): THttpServer;
    on(eventName: "listening", listener: (address: AddressInfo) => void): THttpServer;
    on(eventName: "close", listener: () => void): THttpServer;
    on(eventName: "error", listener: (error: Error) => void): THttpServer;
    raw: Server;
}

/* MAIN */
export function HttpServer(handler: (request: IncomingMessage, response: ServerResponse) => Promise<void>): THttpServer{
    
    const server: Server = createServer(handler);

    let _address: AddressInfo;
    let _hostname: string;

    let _onListening = false;

    const httpServer: THttpServer = {
        listen({port, hostname}: {port: number, hostname?: string}, onListening?: (address: AddressInfo) => void): THttpServer{
            port = Number(port);
            if(isNaN(port) || port % 1 !== 0) throw new Error("Cannot listen! The port must be a integer number");
            _hostname = (!hostname || hostname === "localhost" ? "127.0.0.1" : hostname);
            if(isIP(_hostname) === 0) throw new Error("Cannot listen! Hostname "+_hostname+" inválid");

            server.listen(port, _hostname)
            .on("listening", () => {
                const _addr = server.address();
                _address = _addr && typeof _addr === "object" ? _addr : { 
                    address: _hostname, 
                    family: isIPv4(_hostname) ? "IPv4" : "IPv6",
                    port
                }
                if(onListening){
                    _onListening = true;
                    onListening(_address);
                } 
            });
            return httpServer;
        },
        on(eventName: "listening" | "error" | "close", listener: (...args: any[]) => void): THttpServer {
            if(!["listening", "error", "close"].includes(eventName)){
                throw new Error("Not exists event "+eventName+"! Use \"listening\", \"error\" ou \"close\"");
            }
            if(eventName === "listening") {
                setImmediate(() => {  
                    !_onListening && listener(_address)
                    _onListening = true;
                });
            }else{
                server.on(eventName, listener)
            };
            return httpServer;
        },
        raw: server,

    }
    return httpServer;
}



