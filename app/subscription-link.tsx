import Link from "next/link";

export default function SubscriptionLink() {
  return (
    <Link
      href="/abonnement"
      aria-label="Ouvrir les abonnements WineTime"
      style={{
        position: "fixed",
        left: 16,
        bottom: 92,
        zIndex: 40,
        width: 218,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(0,0,0,.07)",
        background: "rgba(255,255,255,.96)",
        color: "#3f3f3d",
        textDecoration: "none",
        fontSize: 12,
        fontWeight: 600,
        boxShadow: "0 6px 18px rgba(0,0,0,.06)",
        backdropFilter: "blur(14px)",
      }}
    >
      <span aria-hidden="true" style={{ width: 18, textAlign: "center", fontSize: 15, lineHeight: 1 }}>€</span>
      Abonnement
    </Link>
  );
}
