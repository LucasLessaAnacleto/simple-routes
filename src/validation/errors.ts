interface IValidateError{
    target: string,
    details: {[key: string]: string}
}   

export class CustomValidateError extends Error{
    constructor({ target, details }: IValidateError){
        super(JSON.stringify({
            code: 400,
            status: "Bad Request!",
            error: `${target} invalid`,
            details
        }));
    }
};

// Request Body
export class RequestBodyInvalid extends CustomValidateError{
    constructor(details: {[key: string]: string}){
        super({ 
            target: "Request Body",
            details
        })
    }
};

// Path Param
export class PathParamInvalid extends CustomValidateError{
    constructor(details: {[key: string]: string}){
        super({ 
            target: "Path Param",
            details
        })
    }
};

// Query Param
export class QueryParamInvalid extends CustomValidateError{
    constructor(details: {[key: string]: string}){
        super({ 
            target: "Query Param",
            details
        })
    }
};

// Response
export class ResponseInvalid extends CustomValidateError{
    constructor(details: {[key: string]: string}){
        super({ 
            target: "Response",
            details
        })
    }
};

