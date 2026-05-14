'use client'

import React, { forwardRef, useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className = "", ...props }, ref) => {
        const id = useId();

        return (
            <div className="flex flex-col w-full">
                {/* Label con tu diseño: font-medium text-xs mb-2 */}
                {label && (
                    <label
                        htmlFor={id}
                        className="font-medium text-xs mb-2 text-zinc-700 select-none"
                    >
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}

                <input
                    id={id}
                    ref={ref}
                    className={`
            w-full px-3 py-2 text-sm rounded-md border outline-none transition-all
            bg-white text-zinc-900 
            placeholder:text-zinc-400
            /* Diseño solicitado: border-red-600 (primary) */
            border-zinc-200 focus:border-red-700 
            disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed
            ${error ? "border-red-500 ring-2 ring-red-500/20" : ""}
            ${className}
          `}
                    {...props}
                />

                {/* Mensajes de error/helper con tu estilo */}
                {error ? (
                    <p className="font-medium text-xs mt-2 text-red-500 italic">
                        {error}
                    </p>
                ) : helperText ? (
                    <p className="font-medium text-xs mt-2 text-zinc-500">
                        {helperText}
                    </p>
                ) : null}
            </div>
        );
    }
);

Input.displayName = "Input";

