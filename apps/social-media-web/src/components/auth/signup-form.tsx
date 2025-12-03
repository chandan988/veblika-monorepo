"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import React from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Eye, EyeClosed } from "lucide-react";
import useSignup from "@/lib/queries/auth/use-signup";
import { Spinner } from "../ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { register, handleSubmit, setValue, watch } = useForm();
  const [show, setShow] = React.useState(false);
  const { mutateAsync, isPending } = useSignup();
  const gender = watch("gender");

  const onSubmit = async (data: any) => {
    console.log("data of form", data);
    await mutateAsync({ data });
  };
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your information below to create your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
          <Input
            id="full_name"
            type="text"
            placeholder="John Doe"
            required
            {...register("full_name", {
              required: "Full name is required",
              minLength: {
                value: 2,
                message: "Full name must be at least 2 characters",
              },
            })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: "Invalid email address",
              },
            })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="gender">Gender</FieldLabel>
          <Select
            value={gender}
            onValueChange={(value) => setValue("gender", value)}
            required
          >
            <SelectTrigger id="gender" className="w-full">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <InputGroup>
            <InputGroupInput
              type={show ? "text" : "password"}
              placeholder="Enter your password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
            />
            <InputGroupAddon align={"inline-end"}>
              {show ? (
                <Eye onClick={() => setShow(false)} />
              ) : (
                <EyeClosed onClick={() => setShow(true)} />
              )}
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Field>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending && <Spinner />}
            Sign Up
          </Button>
        </Field>
        <Field>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="underline underline-offset-4 hover:text-primary">
              Login
            </a>
          </p>
        </Field>
      </FieldGroup>
    </form>
  );
}

