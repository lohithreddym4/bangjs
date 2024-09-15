function handleValidation(schema, body) {
  const errors = [];

  // Loop through each field defined in the schema
  for (const [key, constraints] of Object.entries(schema)) {
      const value = body[key];

      // Check if the field is required and is missing
      if (constraints.required && !(key in body)) {
          errors.push({ field: key, error: 'Field is required' });
          continue;
      }

      // If the field is present, perform additional validation
      if (key in body) {
          // Type check
          if (constraints.type && typeof value !== constraints.type) {
              errors.push({ field: key, error: `Expected type ${constraints.type}, but got ${typeof value}` });
          }

          // Length check for strings and arrays
          if (constraints.minLength && typeof value === 'string' && value.length < constraints.minLength) {
              errors.push({ field: key, error: `Minimum length is ${constraints.minLength}, but got ${value.length}` });
          }
          if (constraints.maxLength && typeof value === 'string' && value.length > constraints.maxLength) {
              errors.push({ field: key, error: `Maximum length is ${constraints.maxLength}, but got ${value.length}` });
          }
          if (constraints.minItems && Array.isArray(value) && value.length < constraints.minItems) {
              errors.push({ field: key, error: `Minimum items is ${constraints.minItems}, but got ${value.length}` });
          }
          if (constraints.maxItems && Array.isArray(value) && value.length > constraints.maxItems) {
              errors.push({ field: key, error: `Maximum items is ${constraints.maxItems}, but got ${value.length}` });
          }

          // Pattern matching for strings
          if (constraints.pattern && typeof value === 'string' && !constraints.pattern.test(value)) {
              errors.push({ field: key, error: `Value does not match pattern ${constraints.pattern}` });
          }

          // Custom validation function
          if (constraints.validate && typeof constraints.validate === 'function') {
              const customError = constraints.validate(value);
              if (customError) {
                  errors.push({ field: key, error: customError });
              }
          }
      }
  }

  return errors;
}

module.exports = { handleValidation };
