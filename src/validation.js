function handleValidation(schema, body) {
  const errors = [];

  // Validate the already parsed body (which is passed in, not parsed here)
  Object.keys(schema).forEach((key) => {
    if (schema[key].required && !body[key]) {
      errors.push(`${key} is required`);
    }
  });

  return errors.length > 0 ? errors : [];
}

module.exports = { handleValidation };
