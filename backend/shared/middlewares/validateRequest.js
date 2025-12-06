import Joi from 'joi';

// Generic validation middleware factory
// usage: validateRequest({ body: schema, params: schema, query: schema })
export default function validateRequest(schemas = {}) {
  const compiled = Object.entries(schemas).reduce((acc, [key, schema]) => {
    if (!schema) return acc;
    acc[key] = Joi.isSchema(schema)
      ? schema
      : Joi.object(schema); // allow passing raw shape
    return acc;
  }, {});

  const options = { abortEarly: false, allowUnknown: true, stripUnknown: true };

  return (req, res, next) => {
    try {
      // validate each target if schema provided
      for (const [target, schema] of Object.entries(compiled)) {
        const { error, value } = schema.validate(req[target], options);
        if (error) {
          return res.status(400).json({
            status: 'error',
            message: 'Validation error',
            details: error.details.map(d => ({
              message: d.message,
              path: d.path,
              type: d.type
            }))
          });
        }
        // Only assign sanitized values for body (query and params are read-only in Express 5)
        if (target === 'body') {
          req[target] = value;
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
