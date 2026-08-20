# WineTime integration rollout

## V1 active
- Gmail: Google OAuth, encrypted refresh-token storage, secure connection view, real test email.
- Google Calendar: Google OAuth with Calendar and Calendar Events scopes. The next implementation step is server-side calendar token refresh and real calendar read/write actions.

## Coming next
- Stripe: OAuth/Connect or API-key onboarding plus webhook verification and payment/invoice event ingestion.
- WhatsApp: Meta WhatsApp Business Cloud API onboarding and signed webhook verification.
- CRM: choose first CRM provider (HubSpot recommended for V1) and implement OAuth + object sync.
- Shopify: Shopify OAuth + signed webhook verification + order/customer event ingestion.

## Rule
Never mark an integration as connected unless WineTime has completed the provider authorization and can validate the resulting connection.