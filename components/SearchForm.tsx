"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Loader2 } from "lucide-react";
import type { VehicleQuery } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR + 1 - 1980 + 1 }, (_, i) => String(CURRENT_YEAR + 1 - i));
const MAKES = [
  "Ford", "Chevrolet", "GMC", "Dodge", "RAM", "Toyota", "Honda", "Nissan", "Jeep",
  "BMW", "Mercedes-Benz", "Subaru", "Mazda", "Hyundai", "Kia", "Volkswagen", "Audi",
  "Lexus", "Acura", "Cadillac", "Buick", "Pontiac", "Saturn", "Chrysler", "Mitsubishi",
  "Isuzu", "Suzuki", "Scion", "Infiniti", "Volvo", "Land Rover", "Jaguar", "Porsche",
  "Tesla", "Rivian", "Lucid",
];

/** Form-side issue minimum (stricter than the API's 10 for better UX, per Edge Case #5). */
const MIN_ISSUE = 15;

type Field = keyof VehicleQuery;
type Errors = Partial<Record<Field, string>>;

function validateField(field: Field, value: string): string | undefined {
  const v = value.trim();
  switch (field) {
    case "year":
      if (!/^\d{4}$/.test(v)) return "Enter a 4-digit year.";
      if (Number(v) < 1900 || Number(v) > 2030) return "Year must be 1900–2030.";
      return;
    case "make":
      return v ? undefined : "Make is required.";
    case "model":
      return v ? undefined : "Model is required.";
    case "issue":
      return v.length < MIN_ISSUE
        ? "Please describe the issue in more detail so we can search precisely."
        : undefined;
  }
}

export function SearchForm() {
  const router = useRouter();
  const [values, setValues] = useState<VehicleQuery>({ year: "", make: "", model: "", issue: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const setField = (field: Field, value: string) => {
    setValues((p) => ({ ...p, [field]: value }));
    if (touched[field]) {
      setErrors((p) => ({ ...p, [field]: validateField(field, value) }));
    }
  };

  const onBlur = (field: Field) => {
    setTouched((p) => ({ ...p, [field]: true }));
    setErrors((p) => ({ ...p, [field]: validateField(field, values[field]) }));
  };

  const autoResize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allErrors: Errors = {};
    (Object.keys(values) as Field[]).forEach((f) => {
      const err = validateField(f, values[f]);
      if (err) allErrors[f] = err;
    });
    setErrors(allErrors);
    setTouched({ year: true, make: true, model: true, issue: true });
    if (Object.keys(allErrors).length > 0) return;

    setSubmitting(true);
    const params = new URLSearchParams({
      year: values.year.trim(),
      make: values.make.trim(),
      model: values.model.trim(),
      issue: values.issue.trim(),
    });
    router.push(`/results?${params.toString()}`);
  };

  const fieldError = (f: Field) => (touched[f] ? errors[f] : undefined);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="panel w-full p-5 shadow-2xl sm:p-7"
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr_1.4fr]">
          <div className="space-y-1.5">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              list="years"
              inputMode="numeric"
              placeholder="2006"
              autoComplete="off"
              value={values.year}
              aria-invalid={!!fieldError("year")}
              onChange={(e) => setField("year", e.target.value)}
              onBlur={() => onBlur("year")}
            />
            <datalist id="years">
              {YEARS.map((y) => (
                <option key={y} value={y} />
              ))}
            </datalist>
            <FieldError msg={fieldError("year")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="make">Make</Label>
            <Input
              id="make"
              list="makes"
              placeholder="GMC"
              autoComplete="off"
              value={values.make}
              aria-invalid={!!fieldError("make")}
              onChange={(e) => setField("make", e.target.value)}
              onBlur={() => onBlur("make")}
            />
            <datalist id="makes">
              {MAKES.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <FieldError msg={fieldError("make")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              placeholder="Sierra 1500"
              autoComplete="off"
              value={values.model}
              aria-invalid={!!fieldError("model")}
              onChange={(e) => setField("model", e.target.value)}
              onBlur={() => onBlur("model")}
            />
            <FieldError msg={fieldError("model")} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="issue">Describe the issue</Label>
          <Textarea
            id="issue"
            ref={taRef}
            placeholder="Describe the problem in plain language, e.g. 'rough idle when cold, MAF sensor code P0101'"
            value={values.issue}
            aria-invalid={!!fieldError("issue")}
            onChange={(e) => {
              setField("issue", e.target.value);
              autoResize();
            }}
            onBlur={() => onBlur("issue")}
          />
          <div className="flex items-center justify-between gap-3">
            <FieldError msg={fieldError("issue")} />
            <span
              className={cn(
                "ml-auto shrink-0 font-mono text-[11px] tabular-nums",
                values.issue.trim().length >= MIN_ISSUE ? "text-secondary/60" : "text-secondary/40",
              )}
            >
              {values.issue.trim().length}/{MIN_ISSUE}+
            </span>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Searching…
            </>
          ) : (
            <>
              <Search className="h-5 w-5" />
              Search the forums
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="alert" className="text-xs leading-snug text-accent-red">
      {msg}
    </p>
  );
}
