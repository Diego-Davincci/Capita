// Useful specific functions to use everywhere
import { z } from "zod";

export interface FormFieldValidation {
  field: string;
  message: string;
}

// Validate form schema with zod
export const validateFields = (
  schema: z.ZodObject,
  data: Object
): FormFieldValidation[] => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorsList: FormFieldValidation[] = [];
    for (const issue of result.error.issues) {
      const field = issue.path[0].toString();
      const message = issue.message;
      errorsList.push({ field, message });
    }
    return errorsList;
  }
  return [];
};

export const findFieldError = (
  field: string,
  fieldErrors: FormFieldValidation[]
) => {
  const findError = fieldErrors.find((e) => e.field === field);
  if (findError) {
    return findError;
  }
  return undefined;
};
