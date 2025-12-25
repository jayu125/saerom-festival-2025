"use client";

import * as React from "react";
import styled from "styled-components";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const StyledInput = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 14px;

  border-radius: 12px;
  border: 2px solid #e5e7eb;
  background: #ffffff;

  font-size: 15px;
  font-weight: 600;
  color: #111827;

  transition: border-color 150ms ease, box-shadow 150ms ease;

  &::placeholder {
    color: #9ca3af;
    font-weight: 500;
  }

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <StyledInput ref={ref} {...props} />
));

Input.displayName = "Input";

export { Input };
