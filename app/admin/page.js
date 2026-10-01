import AdminApp from "./AdminApp";

export const metadata = {
  title: "Admin · English–Hakka Dictionary",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <AdminApp />;
}
