"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function VerifyCertificateForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length < 6) {
      setError("Enter the verification code printed on the certificate.");
      return;
    }
    setError(null);
    router.push(`/verify-certificate/${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="verification-code">Verification code</Label>
        <Input
          id="verification-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="e.g. CB-XXXX-XXXX"
          autoComplete="off"
        />
        {error ? (
          <p className="text-xs font-medium text-brand-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <Button type="submit">
        <SearchIcon />
        Verify certificate
      </Button>
    </form>
  );
}
