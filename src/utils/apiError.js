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

    //super(message): This calls the constructor of the Error class and passes the message argument to it. 
    //This ensures that the error message is properly set up and available through the standard Error mechanisms, such as err.message.

    //this.statusCode, this.errors, this.success, this.data: These lines set additional properties specific to the 
    //custom ApiError class. They are not part of the standard Error class but are needed to carry additional information about the error 
    //(like an HTTP status code, an array of specific errors, a success flag, and any other data).
}

export { ApiError };

//This class is designed to handle errors in an API, 
//providing a standardized way to represent error responses.