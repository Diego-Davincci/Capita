# Spec for Profile Page - Phone Number & Shop Management

## Summary

The `/profile` page lets authenticated users manage two things: their WhatsApp contact number and their optional shop/business. Phone number is required before creating posts and cannot be removed once saved. Shop (name + optional description) is fully optional — users can create, update, or delete it at any time, but must always keep a phone number.

Much of the backend plumbing and frontend form skeleton already exists. This spec focuses on the remaining business-rule enforcement, UX polish, and missing pieces.

---

## What Already Exists

- `GET /users/me` and `POST /users/me/shop` backend endpoints (upsert pattern)
- Database: `shop` table with `phone_number` (NOT NULL), nullable `name`, nullable `description`
- `ShopInformationForm` component with phone, shop name, and shop description fields
- `useShopForm` hook with Zod validation, Zustand integration, and `useApiMutation`
- Basic toast notifications (partial — not all cases handled)
- Validation: description requires name (frontend Zod + backend)
- `PhoneNumber` component file exists but is **empty**

---

## Functional Requirements

### Phone Number

- Users must enter a valid 10-digit WhatsApp number before they can save.
- On first successful save, show a Spanish toast: `"Número guardado exitosamente"`.
- Once a phone number is saved to the server, the user **cannot** submit the form with an empty phone number field — the save button must remain disabled and an inline error must appear if they clear it.
- Users **can** update their phone number to a different valid 10-digit number at any time.
- The `PhoneNumber` component must be completed and rendered inside the profile page.

### Shop (Name + Description)

- Shop name is optional, but if the user enters a shop description, they must also provide a shop name. The description field should be disabled (or visually locked) when shop name is empty.
- If a user has no shop yet and saves a shop name (with or without description), show: `"Tienda guardada exitosamente!"`.
- If a user already has a shop and updates name or description, show: `"Tienda actualizada exitosamente!"`.
- A user can **delete their shop** by clearing the shop name (and description). Saving with an empty shop name removes the shop record (sets name + description to null on the backend). The phone number is unaffected.
- Deleting a shop requires no additional confirmation dialog — clearing the name and saving is sufficient.

### Form Behavior & Validation

- The save/submit button is disabled when:
  - No changes have been made relative to the saved state.
  - A mutation is in flight (show a spinner).
  - The phone number field is empty and the user already has a saved phone number.
- Inline validation errors appear below each field on blur or on submit attempt.
- All inputs are disabled while a mutation is in progress.

### Error Handling

- If the API call fails, show a generic error toast in Spanish (e.g., `"Ocurrió un error, intenta de nuevo"`).

### Responsiveness

- The profile page layout must be fully responsive: mobile, tablet, and desktop.
- The existing `TODO: finish responsiveness` in `profile-page.tsx` must be resolved.

---

## Possible Edge Cases

- User clears phone number field after having a saved number → form must not allow submission; show inline error.
- User enters a shop description but removes the shop name before submitting → description field must clear or the save must be blocked.
- User has an existing shop and clears only the description (keeps name) → valid update; treat as "update" toast.
- User has no saved phone number and tries to save with only shop fields filled → phone number is still required; validation blocks submission.
- Network error mid-submit → show error toast, re-enable form, do not update Zustand store.
- Concurrent saves (double-click) → the submit button disables on first click, preventing duplicate requests.

---

## Acceptance Criteria

- [ ] `PhoneNumber` component is implemented and rendered in `ProfilePage`.
- [ ] Saving a phone number for the first time shows `"Número guardado exitosamente"` toast.
- [ ] If a phone number is already saved, the form cannot be submitted without one; an inline error appears.
- [ ] Saving a new shop for the first time shows `"Tienda guardada exitosamente!"` toast.
- [ ] Updating an existing shop shows `"Tienda actualizada exitosamente!"` toast.
- [ ] Clearing the shop name and saving removes the shop (name + description become null); phone number is preserved.
- [ ] Shop description field is disabled when shop name is empty.
- [ ] Failed API calls show an error toast in Spanish.
- [ ] Submit button is disabled when no changes are detected, during submission, or when phone is empty after a prior save.
- [ ] Profile page is fully responsive on mobile, tablet, and desktop.
- [ ] Backend enforces: phone number cannot be set to empty if a record already exists for that user.

---

## Open Questions

- Should the backend enforce the "cannot remove phone number" rule (return 400 if phone_number is empty for an existing record), or rely solely on frontend validation? Recommended: enforce on both layers. Yes let's reforce on both ends
- Is a DELETE endpoint needed for shop removal, or is it sufficient to POST with null name/description (current upsert handles this already since name is nullable)? Upsert functionality it's okay
- Should the profile page show the current phone number in the `PersonalInformation` read-only section, or only inside the editable form? Only in the editable form
