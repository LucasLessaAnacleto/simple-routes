export interface TInformationRequest{
    input: string,
    method: string,
    path: string,
    queryParams?: {[key: string]: string} 
}

export function informationRequest(input: string): TInformationRequest | undefined{
    const regex = new RegExp(
        "(?<method>^[\\w]+)[:]" +
        "(?<path>(?:[\\/][\\w\\d-]*)+)" +
        "[\\/]?" +
        "(?:[?](?<queryStr>[\\w\\d_]+[=][\\w\\d\\s_-]+(?:[&][\\w\\d_]+[=][\\w\\d\\s_-]+)*))?"
    , "uim");
    
    const { method, path, queryStr } = regex.exec(input)?.groups || {};

    if(!method || !path) 
        return undefined;

    const result: TInformationRequest = { input, method, path }

    if(queryStr?.length > 0) {
        let queryParams: { [key: string]: string } = {};
        queryStr.split("&").forEach((query) => {
            const [key, value] = query.split("=");
            queryParams[key] = value;
        });
        result.queryParams = queryParams;
    }

    return result;
}