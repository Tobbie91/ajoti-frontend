import { useState } from "react";
import {
  Button,
  Card,
  Group,
  PasswordInput,
  Text,
  TextInput,
  Select,
  Alert,
} from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import { IconAlertCircle, IconCheck, IconX } from "@tabler/icons-react";
import { register } from "@/utils/api";
import { ApiError } from "@/utils/api";
import { PhoneInputField } from "@/components";
import {
  formatCalendarDate,
  earliestReasonableDob,
  isAdultDob,
  parseCalendarDate,
  validatePersonName,
  validatePassword,
  validatePhone,
} from "@ajoti/shared";

const MINIMUM_REGISTRATION_AGE = 18;
const MAXIMUM_REGISTRATION_AGE = 120;
const CURRENT_YEAR = new Date().getFullYear();
const DOB_YEARS = Array.from(
  { length: MAXIMUM_REGISTRATION_AGE - MINIMUM_REGISTRATION_AGE + 1 },
  (_, index) => String(CURRENT_YEAR - MINIMUM_REGISTRATION_AGE - index),
);
const DOB_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
].map((label, index) => ({ value: String(index + 1), label }));

function passwordChecks(pwd: string) {
  return {
    length: pwd.length >= 8 && pwd.length <= 128,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /\d/.test(pwd),
    special: /[^A-Za-z0-9\s]/.test(pwd),
  };
}

function PasswordChecklist({ password }: { password: string }) {
  const checks = passwordChecks(password);
  const items: Array<{ key: keyof ReturnType<typeof passwordChecks>; label: string }> = [
    { key: "length", label: "8–128 characters" },
    { key: "upper", label: "Uppercase letter" },
    { key: "lower", label: "Lowercase letter" },
    { key: "number", label: "Number" },
    { key: "special", label: "Special character" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
      {items.map(({ key, label }) => {
        const met = checks[key];
        return (
          <div
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: met ? "#02A36E" : "#9CA3AF",
            }}
          >
            {met ? <IconCheck size={14} stroke={2.5} /> : <IconX size={14} stroke={2.5} />}
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

type SignupField =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "dob"
  | "gender"
  | "password"
  | "confirmPassword";
type SignupErrors = Partial<Record<SignupField, string>>;

export function Signup() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [birthDay, setBirthDay] = useState<string | null>(null);
  const [birthMonth, setBirthMonth] = useState<string | null>(null);
  const [birthYear, setBirthYear] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Partial<Record<SignupField, boolean>>>(
    {},
  );
  const [submitted, setSubmitted] = useState(false);
  const [serverFieldErrors, setServerFieldErrors] = useState<SignupErrors>({});
  const dobStarted = Boolean(birthDay || birthMonth || birthYear);

  const fieldErrors: SignupErrors = {
    firstName: validatePersonName(firstName, "First name"),
    lastName: validatePersonName(lastName, "Last name"),
    email: !email.trim()
      ? "Email is required."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ? "Enter a valid email address."
        : undefined,
    phone: validatePhone(phone),
    dob: !dob
      ? dobStarted
        ? "Select a valid day, month, and year."
        : "Date of birth is required."
      : dob < earliestReasonableDob(MAXIMUM_REGISTRATION_AGE)
        ? "Enter a valid date of birth."
        : !isAdultDob(dob, MINIMUM_REGISTRATION_AGE)
          ? `You must be at least ${MINIMUM_REGISTRATION_AGE} years old.`
          : undefined,
    gender: !gender ? "Gender is required." : undefined,
    password: validatePassword(password),
    confirmPassword: !confirmPassword
      ? "Confirm password is required."
      : confirmPassword !== password
        ? "Passwords do not match."
        : undefined,
    ...serverFieldErrors,
  };

  function visibleError(field: SignupField) {
    return touched[field] || submitted ? fieldErrors[field] : undefined;
  }

  function markTouched(field: SignupField) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function clearServerError(field: SignupField) {
    setServerFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function updateDobParts(
    day: string | null,
    month: string | null,
    year: string | null,
  ) {
    let validDay = day;
    if (month && year && day) {
      const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
      if (Number(day) > daysInMonth) validDay = null;
    }

    setBirthDay(validDay);
    setBirthMonth(month);
    setBirthYear(year);
    setDob(
      validDay && month && year
        ? parseCalendarDate(
            `${year}-${month.padStart(2, "0")}-${validDay.padStart(2, "0")}`,
          )
        : null,
    );
    clearServerError("dob");
  }

  const daysInSelectedMonth =
    birthMonth && birthYear
      ? new Date(Number(birthYear), Number(birthMonth), 0).getDate()
      : 31;
  const dobDays = Array.from({ length: daysInSelectedMonth }, (_, index) =>
    String(index + 1),
  );

  async function handleSignup() {
    setSubmitted(true);
    setServerFieldErrors({});
    const currentErrors = Object.values(fieldErrors).filter(Boolean);
    if (currentErrors.length > 0) {
      setError(currentErrors.join(" "));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const dobString = formatCalendarDate(dob!);
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone,
        dob: dobString,
        gender: gender!.toUpperCase() as "MALE" | "FEMALE",
        password,
      });
      localStorage.setItem("verify_email", email.trim());
      localStorage.setItem(
        "user",
        JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone,
          dob: dobString,
        }),
      );
      navigate("/verify-otp");
    } catch (err) {
      if (err instanceof ApiError) {
        const mapped = Object.fromEntries(
          Object.entries(err.fieldErrors)
            .filter(([field]) =>
              [
                "firstName",
                "lastName",
                "email",
                "phone",
                "dob",
                "gender",
                "password",
              ].includes(field),
            )
            .map(([field, messages]) => [field, messages.join(" ")]),
        ) as SignupErrors;
        setServerFieldErrors(mapped);
        setError(err.messages.join(" "));
      } else {
        setError(err instanceof Error ? err.message : "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FBF9]">
      <div className="mx-auto grid min-h-screen max-w-[1200px] grid-cols-1 gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-2 lg:gap-10 lg:px-6 lg:py-12">
        <div className="order-2 flex flex-col justify-between rounded-3xl bg-[#0B6B55] px-6 py-8 text-white shadow-lg sm:px-8 sm:py-10 lg:order-1 lg:px-10 lg:py-12">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <Text fw={700} size="xl" className="tracking-wide">
                AJOTI
              </Text>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs">
                One App
              </span>
            </div>

            <div className="space-y-4">
              <Text fw={700} size="xl">
                Start your Ajoti journey
              </Text>
              <Text size="sm" className="text-white/90">
                Create one account to save, join ajos, and work toward your
                goals with your community.
              </Text>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <Text fw={600} size="sm">
                  Save with confidence
                </Text>
                <Text size="xs" className="mt-1 text-white/80">
                  Build your savings habit and join trusted groups from one
                  place.
                </Text>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <Text fw={600} size="sm">
                  Grow with your community
                </Text>
                <Text size="xs" className="mt-1 text-white/80">
                  Join trusted ajo groups and build toward shared goals.
                </Text>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm">
            <span>Already have an account?</span>
            <Link to="/login" className="font-semibold text-white">
              Log in
            </Link>
          </div>
        </div>

        <div className="order-1 flex items-center lg:order-2">
          <Card
            withBorder
            radius="xl"
            className="w-full border-[#E6F4EF] bg-white p-6 shadow-lg sm:p-8"
          >
            <div className="space-y-6">
              <div>
                <Text fw={700} size="lg" className="text-[#0F172A]">
                  Create your account
                </Text>
                <Text size="sm" className="text-[#6B7280]">
                  Save, join, and manage your money with Ajoti.
                </Text>
              </div>

              {error && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color="red"
                  radius="md"
                  variant="light"
                >
                  {error}
                </Alert>
              )}

              <Group grow gap="sm">
                <TextInput
                  label="First name"
                  placeholder="First name"
                  radius="md"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.currentTarget.value);
                    clearServerError("firstName");
                  }}
                  onBlur={() => markTouched("firstName")}
                  error={visibleError("firstName")}
                  required
                  styles={{
                    input: {
                      borderColor: "#BFEBD1",
                      backgroundColor: "#FFFFFF",
                    },
                  }}
                />
                <TextInput
                  label="Last name"
                  placeholder="Last name"
                  radius="md"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.currentTarget.value);
                    clearServerError("lastName");
                  }}
                  onBlur={() => markTouched("lastName")}
                  error={visibleError("lastName")}
                  required
                  styles={{
                    input: {
                      borderColor: "#BFEBD1",
                      backgroundColor: "#FFFFFF",
                    },
                  }}
                />
              </Group>
              <TextInput
                label="Email"
                placeholder="you@example.com"
                radius="md"
                value={email}
                onChange={(e) => {
                  setEmail(e.currentTarget.value);
                  clearServerError("email");
                }}
                onBlur={() => markTouched("email")}
                error={visibleError("email")}
                required
                styles={{
                  input: {
                    borderColor: "#BFEBD1",
                    backgroundColor: "#FFFFFF",
                  },
                }}
              />
              <PhoneInputField
                value={phone}
                onChange={(value) => {
                  setPhone(value);
                  clearServerError("phone");
                }}
                label="Phone number"
                required
                onBlur={() => markTouched("phone")}
                error={visibleError("phone")}
                styles={{
                  input: {
                    borderColor: "#BFEBD1",
                    backgroundColor: "#FFFFFF",
                  },
                }}
              />
              <div>
                <Text component="label" size="sm" fw={500}>
                  Date of birth <span className="text-red-500">*</span>
                </Text>
                <div className="mt-1 grid grid-cols-[0.8fr_1.3fr_1fr] gap-2">
                  <Select
                    aria-label="Birth day"
                    placeholder="Day"
                    data={dobDays}
                    value={birthDay}
                    onChange={(value) =>
                      updateDobParts(value, birthMonth, birthYear)
                    }
                    onBlur={() => markTouched("dob")}
                    radius="md"
                    searchable
                    allowDeselect={false}
                  />
                  <Select
                    aria-label="Birth month"
                    placeholder="Month"
                    data={DOB_MONTHS}
                    value={birthMonth}
                    onChange={(value) =>
                      updateDobParts(birthDay, value, birthYear)
                    }
                    onBlur={() => markTouched("dob")}
                    radius="md"
                    searchable
                    allowDeselect={false}
                  />
                  <Select
                    aria-label="Birth year"
                    placeholder="Year"
                    data={DOB_YEARS}
                    value={birthYear}
                    onChange={(value) =>
                      updateDobParts(birthDay, birthMonth, value)
                    }
                    onBlur={() => markTouched("dob")}
                    radius="md"
                    searchable
                    allowDeselect={false}
                  />
                </div>
                {visibleError("dob") && (
                  <Text size="xs" c="red" className="mt-1">
                    {visibleError("dob")}
                  </Text>
                )}
              </div>

              <Group grow gap="sm">
                <Select
                  label="Gender"
                  placeholder="Select"
                  data={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                  ]}
                  radius="md"
                  value={gender}
                  onChange={(value) => {
                    setGender(value);
                    clearServerError("gender");
                    markTouched("gender");
                  }}
                  error={visibleError("gender")}
                  required
                  styles={{
                    input: {
                      borderColor: "#BFEBD1",
                      backgroundColor: "#FFFFFF",
                    },
                  }}
                  allowDeselect={false}
                />
              </Group>

              <div>
                <PasswordInput
                  label="Password"
                  radius="md"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.currentTarget.value);
                    clearServerError("password");
                  }}
                  onBlur={() => markTouched("password")}
                  error={visibleError("password")}
                  required
                  styles={{
                    input: {
                      borderColor: "#BFEBD1",
                      backgroundColor: "#FFFFFF",
                    },
                  }}
                />
                <PasswordChecklist password={password} />
              </div>

              <PasswordInput
                label="Confirm password"
                radius="md"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                onBlur={() => markTouched("confirmPassword")}
                error={visibleError("confirmPassword")}
                required
                styles={{
                  input: {
                    borderColor: "#BFEBD1",
                    backgroundColor: "#FFFFFF",
                  },
                }}
              />

              <Group justify="space-between" className="text-xs text-[#6B7280]">
                <Text component="span">Already have an account?</Text>
                <Link to="/login" className="text-[#0B6B55]">
                  Log in
                </Link>
              </Group>

              <Button
                fullWidth
                radius="md"
                className="bg-[#0B6B55] text-white hover:bg-[#095C49]"
                onClick={handleSignup}
                loading={loading}
              >
                Create account
              </Button>

              <Text size="xs" className="text-center text-[#6B7280]">
                By creating an account, you agree to our Terms and Privacy
                Policy.
              </Text>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
