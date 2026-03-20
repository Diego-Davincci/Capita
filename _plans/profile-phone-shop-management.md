# Plan: Profile Page — Phone Number & Shop Management

## Context

The `/profile` page needs two independent, editable sections: a **phone number** section (required before posting) and an **optional shop** section. The current codebase has a single unified form (`ShopInformationForm` + `useShopForm`) that mixes both concerns into one save action. The `PhoneNumber` component exists but is empty. The backend has a missing `return` bug in the `Shop()` handler. This plan splits the UI into two independently saveable sections, enforces phone number business rules on both ends, fixes responsiveness, and adds proper error handling.

---

## Architecture Decision

Split the current single form into **two independent form sections**, each with its own hook, save button, and toast. Both still call `POST /users/me/shop` (the existing upsert) — each section sends all four fields, reading the other section's values from the Zustand store to preserve them on upsert.

- `PhoneNumber` component → `usePhoneForm` hook
- `ShopInformation` component → `useShopForm` hook (modified, phone removed)
- Shop section is **locked/disabled** until `user.phoneNumber` is set in the store.

---

## Implementation Steps (in order)

### 1. Backend — Fix missing `return` in controller

**File:** `server/internal/users/controller.go`

In the `Shop()` handler, after the `utils.WriteResponse(w, http.StatusBadRequest, ...)` call (the description-without-name check), add a `return` statement. Without it, the handler continues to `c.service.CreateShop(...)` even after writing a 400 response.

### 2. Frontend — Split Zod schemas

**File:** `client/src/features/profile/types/profile.types.ts`

- **Remove** `phoneNumber` from the existing `shopDetailsSchema`. Keep `name` + `description` and the `superRefine` (description requires name). Keep `ShopDetails` type export.
- **Add** new `phoneSchema`: `z.object({ phoneNumber: z.string().min(1, ...).length(10, ...) })` — same error messages as current schema.
- **Add** `PhoneForm = z.infer<typeof phoneSchema>` type export.

---

### 3. Frontend — Create `use-phone-form.ts` (new hook)

**File:** `client/src/features/profile/hooks/use-phone-form.ts`

Manages only the phone number field.

Key behaviors:

- Local state: `{ phoneNumber: user.phoneNumber ?? "" }`
- `hasChanges`: `phoneDetails.phoneNumber !== (user.phoneNumber ?? "")`
- `onChangeWhatsapp`: strips non-digits via `.replace(/\D/g, "")`
- `onSubmit`: validates with `validateFields(phoneSchema, ...)`, calls `mutate` only when no errors
- **Mutation payload** must include existing shop data to preserve it on upsert: `{ phoneNumber: ..., name: user.shopName ?? "", description: user.shopDescription ?? "" }`
- `onSuccessFn`: `toast.success("Número guardado exitosamente 📱", { position: "top-center", duration: 7000 })` + `updateUser({ ...user, phoneNumber: phoneDetails.phoneNumber })`
- If server throws error, it should render the toast with message sent by the API.

Include JSDoc comment + test cases comment per CLAUDE.md requirements.

---

### 5. Frontend — Modify `use-shop-form.ts`

**File:** `client/src/features/profile/hooks/use-shop-form.ts`

- Remove `phoneNumber` from local state and `onChangeWhatsapp` handler.
- Update `hasChanges` to compare only `name` and `description`.
- **Mutation payload** preserves phone from store: `{ phoneNumber: user.phoneNumber ?? "", name: shopDetails.name ?? "", description: shopDetails.description ?? "" }`
- Fix toast logic (fix typo "existosamente" → "exitosamente"):
  - `user.shopName` truthy + `shopDetails.name` non-empty → `"Tienda actualizada exitosamente! 🛍️"`
  - `user.shopName` null/empty + `shopDetails.name` non-empty → `"Tienda guardada exitosamente! 🛍️"`
  - `shopDetails.name` empty (shop deletion) → no toast
- Fix store normalization: `shopName: shopDetails.name || null`, `shopDescription: shopDetails.description || null` (prevents empty string making `user.shopName` truthy on next render, which would break the new/update toast logic)
- Add `onErrorFn`: `toast.error("Ocurrió un error, intenta de nuevo", ...)`
- Update JSDoc/test comments.

---

### 6. Frontend — Export `usePhoneForm`

**File:** `client/src/features/profile/hooks/index.ts`

Add `export { usePhoneForm } from "./use-phone-form";`

---

### 7. Frontend — Modify `shop-information-form.tsx`

**File:** `client/src/features/profile/components/shop-information-form.tsx`

- Remove the phone number field block + `<Separator />` entirely.
- Remove `onChangeWhatsapp` from `Props` type.
- Add `isLocked: boolean` to `Props`.
- When `isLocked`: disable all inputs and button; show inline notice: `"Primero guarda tu número de WhatsApp para activar tu tienda."` (styled `text-sm text-muted-foreground`).
- Description `<Textarea>` gets `disabled={isPending || isLocked || !shopDetails.name}` — disabled when name is empty.
- Update JSDoc test cases comment.

---

### 8. Frontend — Modify `shop-information.tsx`

**File:** `client/src/features/profile/components/shop-information.tsx`

Derive `isLocked = !user.phoneNumber` from the Zustand store and pass it to `ShopInformationForm`:

```tsx
const user = useStore((store) => store.user);
const isLocked = !user.phoneNumber;
return <ShopInformationForm {...form} isLocked={isLocked} />;
```

---

### 9. Frontend — Complete `phone-number.tsx`

**File:** `client/src/features/profile/components/phone-number.tsx`

Implement a container+form in one component (small enough scope):

- Call `usePhoneForm()` for all state/handlers.
- Render a `<form>` with the phone number input, helper text span, error span, and a save button.
- Match exact styling patterns from `shop-information-form.tsx`: `MessageCircle` icon (green-400), same `<Input>` props (`inputMode="numeric"`, `maxLength={10}`), same gradient/shadow `<Button>` with `<Loader2>` spinner.
- Include JSDoc + test cases comment per CLAUDE.md.

---

### 10. Frontend — Update `profile-page.tsx` (layout + responsiveness)

**File:** `client/src/features/profile/components/profile-page.tsx`

- Import `PhoneNumber`.
- **Responsiveness**: replace `w-3/5 max-w-7xl` with `w-full sm:w-[90%] lg:w-3/5 max-w-4xl px-4 sm:px-0`.
- Add `relative` to the advice card outer `<div>` (fixes the `absolute inset-0` gradient escaping its container).
- **Restructure into three cards**:
  1. Personal Information (existing, unchanged)
  2. Phone Number — new card wrapping `<PhoneNumber />` with a heading
  3. Shop Information — existing card wrapping `<ShopInformation />` (heading already inside the form)
- Remove the `TODO: finish responsiveness` comment.
- Each card reuses the existing `rounded-2xl border border-violet-400/20 bg-white/5 backdrop-blur-xl` class pattern.

---

## Critical Files

| File                                                               | Change type                        |
| ------------------------------------------------------------------ | ---------------------------------- |
| `server/internal/users/controller.go`                              | Bug fix — missing `return`         |
| `client/src/hooks/use-mutation.ts`                                 | Additive — `onErrorFn` param       |
| `client/src/features/profile/types/profile.types.ts`               | Split schemas                      |
| `client/src/features/profile/hooks/use-phone-form.ts`              | New file                           |
| `client/src/features/profile/hooks/use-shop-form.ts`               | Modify — remove phone, fix toasts  |
| `client/src/features/profile/hooks/index.ts`                       | Add export                         |
| `client/src/features/profile/components/phone-number.tsx`          | Implement (currently empty)        |
| `client/src/features/profile/components/shop-information-form.tsx` | Remove phone field, add `isLocked` |
| `client/src/features/profile/components/shop-information.tsx`      | Pass `isLocked`                    |
| `client/src/features/profile/components/profile-page.tsx`          | Three-card layout, responsiveness  |

---

## Verification

1. **Backend bug fix**: call `POST /users/me/shop` with `description` set and `name` empty → should return 400 only (not also 201).
2. **Phone flow**: new user → enter 10-digit number → save → toast "Número guardado exitosamente 📱". Shop section unlocks. Clear phone field → save button stays disabled, inline error appears.
3. **Shop new**: enter shop name → save → toast "Tienda guardada exitosamente! 🛍️".
4. **Shop update**: change name or description → save → toast "Tienda actualizada exitosamente! 🛍️".
5. **Shop delete**: clear shop name → save → shop empty, no toast, phone preserved.
6. **Description locked**: no shop name entered → description textarea is disabled.
7. **Error handling**: simulate network failure → toast "Ocurrió un error, intenta de nuevo".
8. **Responsiveness**: resize to mobile (375px), tablet (768px), desktop — layout adapts with no overflow.
