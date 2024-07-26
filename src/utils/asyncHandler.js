const asyncHandlerMW = (func) => {
    (req, res, next) => {
        return Promise.resolve(func(req, res, next)).catch((error) => next(error));
    }
}

const asyncHandler = (func) => async (req, res, next) => {
    try {
        await func(req, res, next);
    } catch (error) {
        res.status(error.code || 500).json({
            message: error.message,
            success: false,
        })
    }
}

export { asyncHandler };
export { asyncHandlerMW };
// Comparison

//     Error Handling:
//         Implementation 1: Errors are caught and passed to the next middleware using next(error). This allows centralized error handling middleware in Express to manage all errors.
//         Implementation 2: Errors are caught and handled within the same function. A response is sent back with a status code and a JSON message.

//     Flexibility:
//         Implementation 1: More flexible since it delegates error handling to the next middleware. This is useful if you have a centralized error handling mechanism in place.
//         Implementation 2: Handles errors immediately by sending a response. This can be useful for scenarios where you want specific handling or formatting for errors from your asynchronous functions.