const morgan = require("morgan");

// Custom token: logged-in user
morgan.token("user", (req) => {
  return req.user ? `[${req.user.role}:${req.user.id}]` : "[guest]";
});

const httpLogger = morgan(
  ":method :url :status :res[content-length]B :response-time ms :user",
);

module.exports = { httpLogger };
