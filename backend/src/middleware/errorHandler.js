export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Firebase errors
  if (err.code) {
    switch (err.code) {
      case 'auth/user-not-found':
        error = { message: 'User not found', status: 404 };
        break;
      case 'auth/wrong-password':
        error = { message: 'Invalid password', status: 401 };
        break;
      case 'auth/email-already-exists':
        error = { message: 'Email already exists', status: 409 };
        break;
      case 'auth/invalid-email':
        error = { message: 'Invalid email format', status: 400 };
        break;
      default:
        error = { message: 'Database error', status: 500 };
    }
  }

  res.status(error.status).json({
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

