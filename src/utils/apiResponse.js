class ApiResponse{
    constructor(
        statusCode,
        data,
        message = "Success!"
    ){
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
    }
}

export { ApiResponse };

// This is a JavaScript class named ApiResponse. It's designed to represent a response from an API, to standardize the format of response
// encapsulating the status code, data, and an optional message.

// Constructor
// The class has a constructor that takes three parameters:

// statusCode: The HTTP status code of the response (e.g., 200, 404, 500).
// data: The data returned by the API, which can be any type (e.g., object, array, string).
// message: An optional message that defaults to "Success!" if not provided.