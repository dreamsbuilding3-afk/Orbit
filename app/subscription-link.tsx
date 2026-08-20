import Link from "next/link";

export default function SubscriptionLink() {
  return (
    <Link
      href="/abonnement"
      aria-label="Ouvrir les abonnements WineTime"
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 40,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,.09)",
        background: "rgba(255,255,255,.94)",
        color: "#171717",
        textDecoration: "none",
        fontSize: 11,
        fontWeight: 700,
        boxShadow: "0 12px 30px rgba(0,0,0,.10)",
        backdropFilter: "blur(14px)",
      }}
    >
      <span aria-hidden="true">€</span>
      Abonnement
    </Link>
  );
}
