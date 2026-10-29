"use client";

import { useState } from "react";

export default function Account() {
  const [register, setRegister] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    alert(
      "Demo UI only: connect an authentication backend for real accounts.",
    );
  }

  return (
    <div className="container">
      <h1 className="page-heading">My Account</h1>
      <form className="form-panel" onSubmit={handleSubmit}>
        <h2 className="font-serif text-2xl">
          {register ? "Register" : "Sign In"}
        </h2>

        {register && (
          <>
            <label htmlFor="account-name">Name</label>
            <input id="account-name" name="name" required />
          </>
        )}

        <label htmlFor="account-email">Email Address</label>
        <input id="account-email" name="email" type="email" required />

        <label htmlFor="account-password">Password</label>
        <input
          id="account-password"
          name="password"
          type="password"
          minLength={6}
          required
        />

        <button className="btn">
          {register ? "CREATE ACCOUNT" : "SUBSCRIBE"}
        </button>
        <button
          type="button"
          className="block mt-5 underline text-sm"
          onClick={() => setRegister(!register)}
        >
          {register
            ? "Already have an account? Sign In"
            : "New here? Register"}
        </button>
      </form>
    </div>
  );
}