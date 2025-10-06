/**
 * Zod Validation Middleware
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      // ✅ For GET requests, prioritize query params
      let dataToValidate;

      if (req.method === "GET") {
        dataToValidate = { ...req.query, ...req.params };
      } else {
        dataToValidate = { ...req.body, ...req.query, ...req.params };
      }

      console.log("🔍 Validating data:", dataToValidate); // ✅ Debug log

      const validated = schema.parse(dataToValidate);

      req.validatedData = validated;

      next();
    } catch (error) {
      console.error("❌ Validation error:", error); // ✅ Debug log

      if (error.name === "ZodError") {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors,
        });
      }

      next(error);
    }
  };
};
