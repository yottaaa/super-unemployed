import * as React from "react";
import { Controller, FormProvider, useFormContext, type ControllerProps, type FieldPath, type FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";

const Form = FormProvider;

function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  props: ControllerProps<TFieldValues, TName>,
) {
  return <Controller {...props} />;
}

function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

function FormControl({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />;
}

function FormDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-slate-400", className)} {...props} />;
}

function FormMessage() {
  const {
    formState: { errors },
  } = useFormContext();
  const firstError = Object.values(errors)[0];
  const message = firstError?.message;
  if (!message || typeof message !== "string") {
    return null;
  }
  return <p className="text-xs text-red-400">{message}</p>;
}

export { Form, FormField, FormItem, FormControl, FormDescription, FormMessage };
