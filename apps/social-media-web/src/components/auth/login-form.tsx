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
import { Eye, EyeClosed, SearchIcon } from "lucide-react";
import useLogin from "@/lib/queries/auth/use-login";
import { Spinner } from "../ui/spinner";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { register, handleSubmit } = useForm();
  const [show, setShow] = React.useState(false);
  const { mutateAsync, isPending } = useLogin();

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
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>
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
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <InputGroup>
            <InputGroupInput
              type={show ? "text" : "password"}
              placeholder="Search..."
              {...register("password", { required: "Password is required" })}
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
            Login
          </Button>
        </Field>
        <Field>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="underline underline-offset-4 hover:text-primary">
              Sign up
            </a>
          </p>
        </Field>
      </FieldGroup>
    </form>
  );
}
