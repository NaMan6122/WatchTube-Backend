class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something Went Wrong",
        errors = [],
        stack = "", 
    ){
        super(message),
        this.statusCode = statusCode,
        this.errors = errors,
        this.success = false,
        this.data = null
    }
}

export { ApiError };

//This class is designed to handle errors in an API, 
//providing a standardized way to represent error responses.